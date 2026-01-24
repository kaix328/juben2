/**
 * Sentry错误监控配置
 * 用于生产环境的错误追踪和性能监控
 */

import * as Sentry from "@sentry/react";

/**
 * 初始化Sentry
 * 在应用启动时调用一次
 */
export function initSentry() {
  // 只在配置了DSN且启用错误上报时初始化
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const enabled = import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true';
  
  if (!dsn || !enabled) {
    console.log('[Sentry] 未启用或未配置DSN');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',
      
      // 性能监控采样率（0.0 - 1.0）
      // 生产环境建议0.1，开发环境1.0
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

      // 错误采样率
      sampleRate: 1.0,

      // 发布版本
      release: import.meta.env.VITE_APP_VERSION || 'unknown',

      // 忽略的错误
      ignoreErrors: [
        // 浏览器扩展错误
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        // 网络错误
        'NetworkError',
        'Network request failed',
        // 取消的请求
        'AbortError',
        'Request aborted',
        // 常见的非关键错误
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],

      // 在发送前处理事件
      beforeSend(event, hint) {
        // 开发环境打印错误
        if (import.meta.env.MODE === 'development') {
          console.error('[Sentry] Event:', event);
          console.error('[Sentry] Original Error:', hint.originalException);
        }

        // 过滤敏感信息
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }

        // 过滤URL中的敏感参数
        if (event.request?.url) {
          event.request.url = event.request.url.replace(
            /apiKey=[^&]*/g,
            'apiKey=***'
          ).replace(
            /token=[^&]*/g,
            'token=***'
          );
        }

        return event;
      },
    });

    console.log('[Sentry] 已初始化');
  } catch (error) {
    console.error('[Sentry] 初始化失败:', error);
  }
}

/**
 * 手动捕获错误
 * @param error 错误对象
 * @param context 额外的上下文信息
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * 手动捕获消息
 * @param message 消息内容
 * @param level 严重级别
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * 设置用户信息
 * @param user 用户信息
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

/**
 * 清除用户信息
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * 添加面包屑
 * @param breadcrumb 面包屑信息
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * 设置标签
 * @param key 标签键
 * @param value 标签值
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * 设置上下文
 * @param name 上下文名称
 * @param context 上下文数据
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}

/**
 * 创建性能事务（使用新的API）
 * @param name 事务名称
 * @param op 操作类型
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({
    name,
    op,
  }, (span) => span);
}

// 导出Sentry对象供高级使用
export { Sentry };
