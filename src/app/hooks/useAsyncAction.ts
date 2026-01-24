/**
 * useAsyncAction - 统一异步操作错误处理 Hook
 * 封装 try-catch，自动处理加载状态和错误提示
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AsyncActionOptions {
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

interface AsyncActionResult<T> {
    execute: () => Promise<T | null>;
    loading: boolean;
    error: Error | null;
    reset: () => void;
}

/**
 * 执行异步操作并统一处理错误
 * @param action 要执行的异步函数
 * @param options 配置选项
 */
export function useAsyncAction<T>(
    action: () => Promise<T>,
    options: AsyncActionOptions = {}
): AsyncActionResult<T> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const {
        successMessage = '操作成功',
        errorMessage = '操作失败，请重试',
        showSuccessToast = true,
        showErrorToast = true,
        onSuccess,
        onError,
    } = options;

    const execute = useCallback(async (): Promise<T | null> => {
        setLoading(true);
        setError(null);

        try {
            const result = await action();

            if (showSuccessToast) {
                toast.success(successMessage);
            }

            onSuccess?.();
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);

            console.error(`[AsyncAction] ${errorMessage}:`, error);

            if (showErrorToast) {
                toast.error(`${errorMessage}: ${error.message}`);
            }

            onError?.(error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [action, successMessage, errorMessage, showSuccessToast, showErrorToast, onSuccess, onError]);

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    return { execute, loading, error, reset };
}

/**
 * 简化版本：直接执行并处理错误
 */
export async function safeExecute<T>(
    action: () => Promise<T>,
    errorMessage = '操作失败'
): Promise<T | null> {
    try {
        return await action();
    } catch (error) {
        console.error(`[SafeExecute] ${errorMessage}:`, error);
        toast.error(errorMessage);
        return null;
    }
}

/**
 * 批量操作执行器
 * 用于处理多个并行或顺序操作
 */
export async function batchExecute<T>(
    items: T[],
    action: (item: T, index: number) => Promise<void>,
    options: {
        parallel?: boolean;
        progressCallback?: (completed: number, total: number) => void;
        errorBehavior?: 'stop' | 'continue';
    } = {}
): Promise<{ success: number; failed: number; errors: Error[] }> {
    const { parallel = false, progressCallback, errorBehavior = 'continue' } = options;

    let success = 0;
    let failed = 0;
    const errors: Error[] = [];

    if (parallel) {
        const results = await Promise.allSettled(
            items.map((item, index) => action(item, index))
        );

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                success++;
            } else {
                failed++;
                errors.push(result.reason);
            }
            progressCallback?.(index + 1, items.length);
        });
    } else {
        for (let i = 0; i < items.length; i++) {
            try {
                await action(items[i], i);
                success++;
            } catch (err) {
                failed++;
                const error = err instanceof Error ? err : new Error(String(err));
                errors.push(error);

                if (errorBehavior === 'stop') {
                    break;
                }
            }
            progressCallback?.(i + 1, items.length);
        }
    }

    return { success, failed, errors };
}

export default {
    useAsyncAction,
    safeExecute,
    batchExecute,
};
