/**
 * 统一错误处理工具
 * 集成Sentry错误上报
 */

import { captureError, captureMessage, addBreadcrumb } from '../../lib/sentry';
import { toast } from 'sonner';

/**
 * 错误类型
 */
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  AUTH = 'auth',
  STORAGE = 'storage',
  UNKNOWN = 'unknown',
}

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  userMessage?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.userMessage = userMessage;
  }
}

/**
 * 处理错误
 * @param error 错误对象
 * @param showToast 是否显示Toast提示
 * @param reportToSentry 是否上报到Sentry
 */
export function handleError(
  error: unknown,
  showToast = true,
  reportToSentry = true
): void {
  if (typeof error === 'object' && error !== null && !(error instanceof Error)) {
    console.error('[ErrorHandler] Non-Error Object:', JSON.stringify(error, null, 2));
  } else {
    console.error('[ErrorHandler]', error);
  }

  let errorMessage = '发生了未知错误';
  let errorType = ErrorType.UNKNOWN;
  let severity = ErrorSeverity.MEDIUM;
  let context: Record<string, any> = {};

  // 忽略 Monaco Editor 的手动取消错误
  if (typeof error === 'object' && (error as any)?.type === 'cancelation') {
    return;
  }

  // 解析错误
  if (error instanceof AppError) {
    errorMessage = error.userMessage || error.message;
    errorType = error.type;
    severity = error.severity;
    context = error.context || {};
  } else if (error instanceof Error) {
    errorMessage = error.message;

    // 根据错误消息判断类型
    if (error.message.includes('fetch') || error.message.includes('network')) {
      errorType = ErrorType.NETWORK;
      errorMessage = '网络连接失败，请检查网络设置';
    } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
      errorType = ErrorType.AUTH;
      errorMessage = '身份验证失败，请重新登录';
    } else if (error.message.includes('403') || error.message.includes('forbidden')) {
      errorType = ErrorType.AUTH;
      errorMessage = '没有权限执行此操作';
    } else if (error.message.includes('404')) {
      errorType = ErrorType.API;
      errorMessage = '请求的资源不存在';
    } else if (error.message.includes('500')) {
      errorType = ErrorType.API;
      errorMessage = '服务器错误，请稍后重试';
      severity = ErrorSeverity.HIGH;
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // 添加面包屑
  addBreadcrumb({
    category: 'error',
    message: errorMessage,
    level: 'error',
    data: {
      type: errorType,
      severity,
      ...context,
    },
  });

  // 显示Toast提示
  if (showToast) {
    const toastOptions = {
      duration: severity === ErrorSeverity.CRITICAL ? 10000 : 5000,
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        toast.error(errorMessage, toastOptions);
        break;
      case ErrorSeverity.MEDIUM:
        toast.error(errorMessage, toastOptions);
        break;
      case ErrorSeverity.LOW:
        toast.warning(errorMessage, toastOptions);
        break;
    }
  }

  // 上报到Sentry
  if (reportToSentry && severity !== ErrorSeverity.LOW) {
    if (error instanceof Error) {
      captureError(error, {
        type: errorType,
        severity,
        ...context,
      });
    } else {
      captureMessage(`${errorType}: ${errorMessage}`, 'error');
    }
  }
}

/**
 * 处理API错误
 */
export function handleApiError(error: unknown, endpoint?: string): void {
  const context = endpoint ? { endpoint } : {};

  if (error instanceof Error) {
    handleError(
      new AppError(
        error.message,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        context,
        'API请求失败，请稍后重试'
      )
    );
  } else {
    handleError(error);
  }
}

/**
 * 处理网络错误
 */
export function handleNetworkError(error: unknown): void {
  handleError(
    new AppError(
      error instanceof Error ? error.message : String(error),
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      {},
      '网络连接失败，请检查网络设置'
    )
  );
}

/**
 * 处理验证错误
 */
export function handleValidationError(
  message: string,
  field?: string
): void {
  handleError(
    new AppError(
      message,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      field ? { field } : {},
      message
    ),
    true,
    false // 验证错误不上报到Sentry
  );
}

/**
 * 处理存储错误
 */
export function handleStorageError(error: unknown, operation?: string): void {
  handleError(
    new AppError(
      error instanceof Error ? error.message : String(error),
      ErrorType.STORAGE,
      ErrorSeverity.MEDIUM,
      operation ? { operation } : {},
      '数据存储失败，请检查浏览器设置'
    )
  );
}

/**
 * 创建错误处理装饰器
 */
export function withErrorHandler<T extends (...args: any[]) => any>(
  fn: T,
  errorType: ErrorType = ErrorType.UNKNOWN,
  showToast = true
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(
        new AppError(
          error instanceof Error ? error.message : String(error),
          errorType,
          ErrorSeverity.MEDIUM
        ),
        showToast
      );
      throw error;
    }
  }) as T;
}

/**
 * Promise错误处理包装器
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  errorMessage?: string,
  showToast = true
): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    handleError(
      new AppError(
        error instanceof Error ? error.message : String(error),
        ErrorType.UNKNOWN,
        ErrorSeverity.MEDIUM,
        {},
        errorMessage
      ),
      showToast
    );
    return null;
  }
}

/**
 * 全局未捕获错误处理
 */
export function setupGlobalErrorHandlers(): void {
  // 捕获未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);

    const reason = event.reason;
    let message = '未知错误';

    if (reason instanceof Error) {
      message = reason.message;
    } else if (typeof reason === 'string') {
      message = reason;
    } else if (typeof reason === 'object') {
      try {
        message = JSON.stringify(reason);
      } catch (e) {
        message = String(reason);
      }
    } else {
      message = String(reason);
    }

    // 忽略 Monaco Editor 的手动取消错误
    if (typeof reason === 'object' && reason?.type === 'cancelation') {
      return;
    }

    handleError(
      new AppError(
        message,
        ErrorType.UNKNOWN,
        ErrorSeverity.HIGH,
        { type: 'unhandledrejection', raw: reason },
        '应用程序遇到了意外错误: ' + message
      )
    );

    event.preventDefault();
  });

  // 捕获全局错误
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error);

    // 忽略资源加载错误
    if (event.target !== window) {
      return;
    }

    handleError(
      new AppError(
        event.error?.message || event.message,
        ErrorType.UNKNOWN,
        ErrorSeverity.HIGH,
        {
          type: 'error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        '应用程序遇到了意外错误'
      )
    );
  });
}
