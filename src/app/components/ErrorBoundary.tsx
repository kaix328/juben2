import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { captureError } from '../../lib/sentry';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    showDetails?: boolean;
    resetKeys?: any[];
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
    copied: boolean;
}

/**
 * Error Boundary组件
 * 用于捕获子组件树中的JavaScript错误,防止整个应用崩溃白屏
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, copied: false };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // 更新state,下次渲染时显示fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // 记录错误信息
        console.error('ErrorBoundary caught an error:', error);
        console.error('Component stack:', errorInfo.componentStack);
        this.setState({ errorInfo });

        // 🆕 上报错误到Sentry
        captureError(error, {
            componentStack: errorInfo.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
        });

        // 调用外部错误处理回调
        this.props.onError?.(error, errorInfo);

        // 保存错误到 localStorage 用于调试
        try {
            const errorLog = {
                timestamp: new Date().toISOString(),
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                url: window.location.href,
                userAgent: navigator.userAgent,
            };
            const logs = JSON.parse(localStorage.getItem('error-logs') || '[]');
            logs.unshift(errorLog);
            // 只保留最近 10 条错误
            localStorage.setItem('error-logs', JSON.stringify(logs.slice(0, 10)));
        } catch (e) {
            // 忽略存储错误
        }
    }

    componentDidUpdate(prevProps: Props) {
        // 如果 resetKeys 变化，重置错误状态
        if (this.state.hasError && this.props.resetKeys) {
            const hasChanged = this.props.resetKeys.some(
                (key, index) => key !== prevProps.resetKeys?.[index]
            );
            if (hasChanged) {
                this.setState({ hasError: false, error: undefined, errorInfo: undefined });
            }
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        // 使用 hash 路径返回首页，兼容 HashRouter
        window.location.href = window.location.pathname + '#/';
    };

    handleCopyError = async () => {
        const errorText = this.getErrorReport();
        try {
            await navigator.clipboard.writeText(errorText);
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    getErrorReport = () => {
        const { error, errorInfo } = this.state;
        return `
=== 错误报告 ===
时间: ${new Date().toISOString()}
URL: ${window.location.href}
浏览器: ${navigator.userAgent}

错误信息:
${error?.message || '未知错误'}

错误堆栈:
${error?.stack || '无堆栈信息'}

组件堆栈:
${errorInfo?.componentStack || '无组件堆栈'}
`.trim();
    };

    render() {
        if (this.state.hasError) {
            // 如果提供了自定义fallback,使用它
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const { error, errorInfo, copied } = this.state;
            const showDetails = this.props.showDetails ?? true;

            // 默认的错误UI
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-8 max-w-lg shadow-lg">
                        {/* 图标 */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-xl scale-150" />
                            <div className="relative bg-gradient-to-br from-orange-400 to-red-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                                <Bug className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        {/* 标题 */}
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            哎呀，出错了！
                        </h2>
                        <p className="text-gray-600 mb-6">
                            页面在加载时遇到了问题。您可以尝试刷新页面或返回首页。
                        </p>

                        {/* 错误详情 */}
                        {showDetails && error && (
                            <details className="text-left mb-6 bg-white/80 backdrop-blur rounded-xl border border-gray-200 overflow-hidden">
                                <summary className="cursor-pointer px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    查看错误详情
                                </summary>
                                <div className="px-4 py-3 border-t border-gray-100">
                                    <div className="mb-2">
                                        <span className="text-xs font-medium text-gray-500">错误信息:</span>
                                        <pre className="mt-1 text-sm text-red-600 whitespace-pre-wrap break-all">
                                            {error.message}
                                        </pre>
                                    </div>
                                    {errorInfo?.componentStack && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-500">组件堆栈:</span>
                                            <pre className="mt-1 text-xs text-gray-600 overflow-auto max-h-32 whitespace-pre-wrap">
                                                {errorInfo.componentStack.slice(0, 500)}
                                                {errorInfo.componentStack.length > 500 && '...'}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={this.handleReload}
                                className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            >
                                <RefreshCw className="w-4 h-4" />
                                刷新页面
                            </Button>
                            <Button
                                variant="outline"
                                onClick={this.handleGoHome}
                                className="gap-2"
                            >
                                <Home className="w-4 h-4" />
                                返回首页
                            </Button>
                            {showDetails && (
                                <Button
                                    variant="ghost"
                                    onClick={this.handleCopyError}
                                    className="gap-2"
                                    title="复制错误信息"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            已复制
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            复制错误
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* 尝试恢复按钮 */}
                        <button
                            onClick={this.handleReset}
                            className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            尝试恢复（不刷新）
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * 函数式错误边界包装器
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ReactNode
) {
    return function WrappedComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

/**
 * 获取错误日志
 */
export function getErrorLogs(): any[] {
    try {
        return JSON.parse(localStorage.getItem('error-logs') || '[]');
    } catch {
        return [];
    }
}

/**
 * 清除错误日志
 */
export function clearErrorLogs(): void {
    localStorage.removeItem('error-logs');
}

export default ErrorBoundary;
