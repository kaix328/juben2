/**
 * 性能监控工具
 * 集成 Web Vitals 监控核心性能指标
 */

// ============ 类型定义 ============

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface PerformanceReport {
  // Core Web Vitals
  LCP?: PerformanceMetric; // Largest Contentful Paint
  FID?: PerformanceMetric; // First Input Delay
  CLS?: PerformanceMetric; // Cumulative Layout Shift
  
  // Other metrics
  FCP?: PerformanceMetric; // First Contentful Paint
  TTFB?: PerformanceMetric; // Time to First Byte
  INP?: PerformanceMetric; // Interaction to Next Paint
  
  // Custom metrics
  customMetrics: Record<string, number>;
  
  // Summary
  timestamp: string;
  url: string;
  userAgent: string;
}

// ============ 评分标准 ============

const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// ============ 性能监控类 ============

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private customMetrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  /**
   * 初始化性能监控
   */
  init() {
    if (this.isInitialized) return;
    if (typeof window === 'undefined') return;

    this.isInitialized = true;

    // 监控 LCP (Largest Contentful Paint)
    this.observeLCP();

    // 监控 FID (First Input Delay)
    this.observeFID();

    // 监控 CLS (Cumulative Layout Shift)
    this.observeCLS();

    // 监控 FCP (First Contentful Paint)
    this.observeFCP();

    // 监控 TTFB (Time to First Byte)
    this.observeTTFB();

    // 监控 INP (Interaction to Next Paint)
    this.observeINP();

    console.log('[Performance] 性能监控已启动');
  }

  /**
   * 监控 LCP
   */
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        if (lastEntry) {
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[Performance] LCP 监控不可用');
    }
  }

  /**
   * 监控 FID
   */
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[Performance] FID 监控不可用');
    }
  }

  /**
   * 监控 CLS
   */
  private observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('CLS', clsValue);
          }
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[Performance] CLS 监控不可用');
    }
  }

  /**
   * 监控 FCP
   */
  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        });
      });

      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[Performance] FCP 监控不可用');
    }
  }

  /**
   * 监控 TTFB
   */
  private observeTTFB() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.responseStart > 0) {
            this.recordMetric('TTFB', entry.responseStart);
          }
        });
      });

      observer.observe({ type: 'navigation', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[Performance] TTFB 监控不可用');
    }
  }

  /**
   * 监控 INP (Interaction to Next Paint)
   */
  private observeINP() {
    try {
      let maxDuration = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.duration > maxDuration) {
            maxDuration = entry.duration;
            this.recordMetric('INP', entry.duration);
          }
        });
      });

      observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[Performance] INP 监控不可用');
    }
  }

  /**
   * 记录指标
   */
  private recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value * 100) / 100,
      rating: getRating(name, value),
      timestamp: Date.now(),
    };

    this.metrics.set(name, metric);

    // 输出到控制台
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`[Performance] ${emoji} ${name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);

    // 触发自定义事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-metric', { detail: metric }));
    }
  }

  /**
   * 记录自定义指标
   */
  recordCustomMetric(name: string, value: number) {
    this.customMetrics.set(name, value);
    console.log(`[Performance] 📊 ${name}: ${value}`);
  }

  /**
   * 测量函数执行时间
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordCustomMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordCustomMetric(`${name} (error)`, duration);
      throw error;
    }
  }

  /**
   * 标记时间点
   */
  mark(name: string) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * 测量两个标记之间的时间
   */
  measureBetween(name: string, startMark: string, endMark: string) {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          this.recordCustomMetric(name, measure.duration);
        }
      } catch (e) {
        console.warn(`[Performance] 无法测量 ${name}`);
      }
    }
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceReport {
    const report: PerformanceReport = {
      customMetrics: Object.fromEntries(this.customMetrics),
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    // 添加 Core Web Vitals
    this.metrics.forEach((metric, name) => {
      report[name as keyof PerformanceReport] = metric as any;
    });

    return report;
  }

  /**
   * 获取性能评分 (0-100)
   */
  getScore(): number {
    const coreMetrics = ['LCP', 'FID', 'CLS'];
    const scores: number[] = [];

    coreMetrics.forEach((name) => {
      const metric = this.metrics.get(name);
      if (metric) {
        const score = metric.rating === 'good' ? 100 : metric.rating === 'needs-improvement' ? 50 : 0;
        scores.push(score);
      }
    });

    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  /**
   * 导出报告为 JSON
   */
  exportReport(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }

  /**
   * 清理监控
   */
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.customMetrics.clear();
    this.isInitialized = false;
  }
}

// ============ 导出单例 ============

export const performanceMonitor = new PerformanceMonitor();

// ============ React Hook ============

import { useEffect, useState } from 'react';

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceReport | null>(null);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    // 初始化监控
    performanceMonitor.init();

    // 监听指标更新
    const handleMetricUpdate = () => {
      setMetrics(performanceMonitor.getMetrics());
      setScore(performanceMonitor.getScore());
    };

    window.addEventListener('performance-metric', handleMetricUpdate);

    // 定期更新
    const interval = setInterval(handleMetricUpdate, 5000);

    return () => {
      window.removeEventListener('performance-metric', handleMetricUpdate);
      clearInterval(interval);
    };
  }, []);

  return {
    metrics,
    score,
    measure: performanceMonitor.measure.bind(performanceMonitor),
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measureBetween: performanceMonitor.measureBetween.bind(performanceMonitor),
    recordCustomMetric: performanceMonitor.recordCustomMetric.bind(performanceMonitor),
  };
}

// ============ 便捷函数 ============

/**
 * 初始化性能监控
 */
export function initPerformanceMonitoring() {
  performanceMonitor.init();
}

/**
 * 测量异步操作
 */
export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.measure(name, fn);
}

/**
 * 测量同步操作
 */
export function measureSync<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    performanceMonitor.recordCustomMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordCustomMetric(`${name} (error)`, duration);
    throw error;
  }
}

/**
 * 获取性能报告
 */
export function getPerformanceReport(): PerformanceReport {
  return performanceMonitor.getMetrics();
}

/**
 * 获取性能评分
 */
export function getPerformanceScore(): number {
  return performanceMonitor.getScore();
}

export default performanceMonitor;
