/**
 * 性能监控工具
 * 用于监控组件渲染性能和应用性能指标
 */

import { captureMessage } from '../../lib/sentry';
import { CONFIG } from '../config/constants';
import * as React from 'react';

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  /**
   * 测量组件渲染时间
   * 
   * @param componentName - 组件名称
   * @returns 清理函数，在组件卸载时调用
   * 
   * @example
   * ```tsx
   * useEffect(() => {
   *   const cleanup = PerformanceMonitor.measureRender('MyComponent');
   *   return cleanup;
   * });
   * ```
   */
  static measureRender(componentName: string): () => void {
    if (!CONFIG.DEV.ENABLE_PERFORMANCE_MONITOR) {
      return () => {};
    }

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 超过一帧（16ms）时发出警告
      if (duration > CONFIG.PERFORMANCE.MAX_RENDER_TIME) {
        console.warn(
          `[Performance] ${componentName} 渲染耗时: ${duration.toFixed(2)}ms`,
          {
            component: componentName,
            duration,
            threshold: CONFIG.PERFORMANCE.MAX_RENDER_TIME,
          }
        );
        
        // 生产环境上报到 Sentry
        if (import.meta.env.PROD) {
          captureMessage(
            `Slow render: ${componentName} (${duration.toFixed(2)}ms)`,
            'warning'
          );
        }
      }
    };
  }

  /**
   * 测量函数执行时间
   * 
   * @param fnName - 函数名称
   * @param fn - 要测量的函数
   * @returns 包装后的函数
   * 
   * @example
   * ```ts
   * const optimizedFn = PerformanceMonitor.measureFunction('processData', processData);
   * ```
   */
  static measureFunction<T extends (...args: any[]) => any>(
    fnName: string,
    fn: T
  ): T {
    if (!CONFIG.DEV.ENABLE_PERFORMANCE_MONITOR) {
      return fn;
    }

    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      const result = fn(...args);
      const duration = performance.now() - startTime;
      
      if (duration > 100) { // 超过100ms
        console.warn(
          `[Performance] ${fnName} 执行耗时: ${duration.toFixed(2)}ms`
        );
      }
      
      return result;
    }) as T;
  }

  /**
   * 测量异步函数执行时间
   * 
   * @param fnName - 函数名称
   * @param fn - 要测量的异步函数
   * @returns 包装后的异步函数
   */
  static measureAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fnName: string,
    fn: T
  ): T {
    if (!CONFIG.DEV.ENABLE_PERFORMANCE_MONITOR) {
      return fn;
    }

    return (async (...args: Parameters<T>) => {
      const startTime = performance.now();
      try {
        const result = await fn(...args);
        const duration = performance.now() - startTime;
        
        if (duration > 1000) { // 超过1秒
          console.warn(
            `[Performance] ${fnName} 异步执行耗时: ${duration.toFixed(2)}ms`
          );
        }
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        console.error(
          `[Performance] ${fnName} 执行失败，耗时: ${duration.toFixed(2)}ms`,
          error
        );
        throw error;
      }
    }) as T;
  }

  /**
   * 标记性能时间点
   * 
   * @param markName - 标记名称
   */
  static mark(markName: string): void {
    if (!CONFIG.DEV.ENABLE_PERFORMANCE_MONITOR) return;
    
    try {
      performance.mark(markName);
    } catch (error) {
      console.error('[Performance] Failed to mark:', error);
    }
  }

  /**
   * 测量两个标记之间的时间
   * 
   * @param measureName - 测量名称
   * @param startMark - 开始标记
   * @param endMark - 结束标记
   * @returns 持续时间（毫秒）
   */
  static measure(
    measureName: string,
    startMark: string,
    endMark: string
  ): number | null {
    if (!CONFIG.DEV.ENABLE_PERFORMANCE_MONITOR) return null;
    
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      
      if (measure) {
        console.log(
          `[Performance] ${measureName}: ${measure.duration.toFixed(2)}ms`
        );
        return measure.duration;
      }
    } catch (error) {
      console.error('[Performance] Failed to measure:', error);
    }
    
    return null;
  }

  /**
   * 获取页面性能指标
   * 
   * @returns 性能指标对象
   */
  static getPageMetrics(): {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
  } {
    const metrics: any = {};

    try {
      // FCP
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }

      // Navigation Timing
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navTiming) {
        metrics.ttfb = navTiming.responseStart - navTiming.requestStart;
      }

      // 使用 PerformanceObserver 获取 LCP, FID, CLS
      if ('PerformanceObserver' in window) {
        // 这些指标需要在页面加载时通过 PerformanceObserver 收集
        // 这里只是返回已收集的数据
      }
    } catch (error) {
      console.error('[Performance] Failed to get metrics:', error);
    }

    return metrics;
  }

  /**
   * 记录长任务
   * 
   * @param callback - 长任务检测回调
   */
  static observeLongTasks(callback: (duration: number) => void): () => void {
    if (!CONFIG.DEV.ENABLE_PERFORMANCE_MONITOR) {
      return () => {};
    }

    if (!('PerformanceObserver' in window)) {
      return () => {};
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // 超过50ms的任务
            console.warn(
              `[Performance] 检测到长任务: ${entry.duration.toFixed(2)}ms`,
              entry
            );
            callback(entry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      return () => observer.disconnect();
    } catch (error) {
      console.error('[Performance] Failed to observe long tasks:', error);
      return () => {};
    }
  }

  /**
   * 监控内存使用情况
   * 
   * @returns 内存使用信息
   */
  static getMemoryUsage(): {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  } | null {
    if (!CONFIG.DEV.ENABLE_PERFORMANCE_MONITOR) return null;

    // @ts-ignore - performance.memory 是非标准 API
    if (performance.memory) {
      // @ts-ignore
      const memory = performance.memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }

    return null;
  }

  /**
   * 记录性能日志
   * 
   * @param message - 日志消息
   * @param data - 附加数据
   */
  static log(message: string, data?: any): void {
    if (!CONFIG.DEV.VERBOSE_LOGGING) return;

    console.log(`[Performance] ${message}`, data);
  }
}

/**
 * React Hook: 测量组件渲染性能
 * 
 * @param componentName - 组件名称
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePerformanceMonitor('MyComponent');
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePerformanceMonitor(componentName: string): void {
  if (!CONFIG.DEV.ENABLE_PERFORMANCE_MONITOR) return;

  const startTime = performance.now();

  // 使用 useEffect 在组件挂载和更新后测量
  React.useEffect(() => {
    const duration = performance.now() - startTime;
    
    if (duration > CONFIG.PERFORMANCE.MAX_RENDER_TIME) {
      console.warn(
        `[Performance] ${componentName} 渲染耗时: ${duration.toFixed(2)}ms`
      );
    }
  });
}

/**
 * 初始化性能监控
 * 在应用启动时调用，设置全局性能监控
 */
export function initPerformanceMonitoring(): void {
  if (!CONFIG.DEV.ENABLE_PERFORMANCE_MONITOR) {
    console.log('[Performance] 性能监控已禁用');
    return;
  }

  console.log('[Performance] 正在初始化性能监控...');

  // 监控长任务
  PerformanceMonitor.observeLongTasks((duration) => {
    console.warn(`[Performance] 检测到长任务: ${duration.toFixed(2)}ms`);
  });

  // 记录页面加载性能
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const metrics = PerformanceMonitor.getPageMetrics();
        console.log('[Performance] 页面性能指标:', metrics);
        
        // 记录内存使用
        const memory = PerformanceMonitor.getMemoryUsage();
        if (memory) {
          console.log('[Performance] 内存使用:', {
            used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
          });
        }
      }, 0);
    });
  }

  console.log('[Performance] 性能监控已初始化 ✅');
}

export default PerformanceMonitor;
