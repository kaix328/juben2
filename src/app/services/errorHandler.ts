/**
 * 统一错误处理服务
 * 提供全局错误捕获、日志记录和用户提示
 */
import { toast } from 'sonner';

// ============ 类型定义 ============

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  severity: ErrorSeverity;
  stack?: string;
  context?: ErrorContext;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  severity?: ErrorSeverity;
  context?: ErrorContext;
}

// ============ 错误日志存储 ============

const MAX_ERROR_LOGS = 100;
let errorLogs: ErrorLog[] = [];

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function addErrorLog(log: ErrorLog) {
  errorLogs.unshift(log);
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs = errorLogs.slice(0, MAX_ERROR_LOGS);
  }
  
  // 持久化到 localStorage（可选）
  try {
    localStorage.setItem('error-logs', JSON.stringify(errorLogs.slice(0, 20)));
  } catch {
    // 忽略存储错误
  }
}

// ============ 错误消息映射 ============

const ERROR_MESSAGES: Record<string, string> = {
  // 网络错误
  'Failed to fetch': '网络连接失败，请检查网络设置',
  'Network Error': '网络错误，请稍后重试',
  'timeout': '请求超时，请稍后重试',
  'AbortError': '请求已取消',
  
  // API 错误
  '401': '认证失败，请检查 API 密钥',
  '403': '权限不足，请检查 API 配置',
  '404': '请求的资源不存在',
  '429': 'API 调用频率过高，请稍后重试',
  '500': '服务器内部错误，请稍后重试',
  '502': '网关错误，请稍后重试',
  '503': '服务暂时不可用，请稍后重试',
  
  // 业务错误
  'Missing API Key': 'API 密钥未配置，请在设置页面配置',
  'Invalid JSON': '数据格式错误，请检查输入',
  'Storage quota exceeded': '存储空间不足，请清理数据',
};

function getReadableMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;
  
  // 查找匹配的友好消息
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // 返回原始消息（截断过长的消息）
  return message.length > 100 ? message.substring(0, 100) + '...' : message;
}

// ============ 错误处理器 ============

class ErrorHandler {
  private defaultOptions: ErrorHandlerOptions = {
    showToast: true,
    logToConsole: true,
    severity: 'error',
  };

  /**
   * 处理错误
   */
  handle(
    error: Error | string,
    options: ErrorHandlerOptions = {}
  ): ErrorLog {
    const opts = { ...this.defaultOptions, ...options };
    const message = typeof error === 'string' ? error : error.message;
    const stack = error instanceof Error ? error.stack : undefined;
    
    // 创建错误日志
    const log: ErrorLog = {
      id: generateErrorId(),
      timestamp: new Date().toISOString(),
      message,
      severity: opts.severity || 'error',
      stack,
      context: opts.context,
    };
    
    // 添加到日志
    addErrorLog(log);
    
    // 控制台输出
    if (opts.logToConsole) {
      const contextStr = opts.context 
        ? ` [${opts.context.component || ''}${opts.context.action ? ':' + opts.context.action : ''}]`
        : '';
      
      switch (opts.severity) {
        case 'info':
          console.info(`[INFO]${contextStr}`, message);
          break;
        case 'warning':
          console.warn(`[WARN]${contextStr}`, message);
          break;
        case 'critical':
          console.error(`[CRITICAL]${contextStr}`, message, stack);
          break;
        default:
          console.error(`[ERROR]${contextStr}`, message);
      }
    }
    
    // Toast 提示
    if (opts.showToast) {
      const readableMessage = getReadableMessage(error);
      
      switch (opts.severity) {
        case 'info':
          toast.info(readableMessage);
          break;
        case 'warning':
          toast.warning(readableMessage);
          break;
        case 'critical':
          toast.error(readableMessage, {
            duration: 10000,
            description: '请联系技术支持',
          });
          break;
        default:
          toast.error(readableMessage);
      }
    }
    
    return log;
  }

  /**
   * 处理 API 错误
   */
  handleAPI(
    error: Error | string,
    apiName: string,
    options: Omit<ErrorHandlerOptions, 'context'> = {}
  ): ErrorLog {
    return this.handle(error, {
      ...options,
      context: {
        component: 'API',
        action: apiName,
      },
    });
  }

  /**
   * 处理组件错误
   */
  handleComponent(
    error: Error | string,
    componentName: string,
    options: Omit<ErrorHandlerOptions, 'context'> = {}
  ): ErrorLog {
    return this.handle(error, {
      ...options,
      context: {
        component: componentName,
      },
    });
  }

  /**
   * 静默处理（只记录日志，不显示 Toast）
   */
  silent(error: Error | string, context?: ErrorContext): ErrorLog {
    return this.handle(error, {
      showToast: false,
      context,
    });
  }

  /**
   * 警告（黄色提示）
   */
  warn(message: string, context?: ErrorContext): ErrorLog {
    return this.handle(message, {
      severity: 'warning',
      context,
    });
  }

  /**
   * 信息提示
   */
  info(message: string, context?: ErrorContext): ErrorLog {
    return this.handle(message, {
      severity: 'info',
      context,
    });
  }

  /**
   * 严重错误
   */
  critical(error: Error | string, context?: ErrorContext): ErrorLog {
    return this.handle(error, {
      severity: 'critical',
      context,
    });
  }

  /**
   * 获取错误日志
   */
  getLogs(): ErrorLog[] {
    return [...errorLogs];
  }

  /**
   * 清除错误日志
   */
  clearLogs(): void {
    errorLogs = [];
    try {
      localStorage.removeItem('error-logs');
    } catch {
      // 忽略
    }
  }

  /**
   * 获取最近的错误
   */
  getRecentErrors(count: number = 5): ErrorLog[] {
    return errorLogs.slice(0, count);
  }

  /**
   * 导出错误日志
   */
  exportLogs(): string {
    return JSON.stringify(errorLogs, null, 2);
  }
}

// ============ 导出单例 ============

export const errorHandler = new ErrorHandler();

// ============ 便捷函数 ============

/**
 * 包装异步函数，自动捕获错误
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handle(error as Error, { context });
      throw error;
    }
  }) as T;
}

/**
 * 安全执行异步操作
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options?: {
    fallback?: T;
    context?: ErrorContext;
    showToast?: boolean;
  }
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    errorHandler.handle(error as Error, {
      showToast: options?.showToast ?? true,
      context: options?.context,
    });
    return options?.fallback;
  }
}

/**
 * 创建带错误处理的 API 调用
 */
export function createSafeAPI<T extends (...args: any[]) => Promise<any>>(
  apiName: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handleAPI(error as Error, apiName);
      throw error;
    }
  }) as T;
}

// ============ React Hook ============

import { useCallback } from 'react';

/**
 * 错误处理 Hook
 */
export function useErrorHandler(componentName?: string) {
  const handleError = useCallback(
    (error: Error | string, action?: string) => {
      errorHandler.handle(error, {
        context: {
          component: componentName,
          action,
        },
      });
    },
    [componentName]
  );

  const handleWarning = useCallback(
    (message: string, action?: string) => {
      errorHandler.warn(message, {
        component: componentName,
        action,
      });
    },
    [componentName]
  );

  const safeExecute = useCallback(
    async <T>(fn: () => Promise<T>, action?: string): Promise<T | undefined> => {
      return safeAsync(fn, {
        context: {
          component: componentName,
          action,
        },
      });
    },
    [componentName]
  );

  return {
    handleError,
    handleWarning,
    safeExecute,
    getLogs: () => errorHandler.getLogs(),
    clearLogs: () => errorHandler.clearLogs(),
  };
}

export default errorHandler;
