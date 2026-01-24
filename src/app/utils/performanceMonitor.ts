/**
 * 性能监控工具 - 用于监控组件渲染性能
 * 在开发环境下启用，生产环境自动禁用
 */

// 性能阈值配置 (毫秒)
const THRESHOLDS = {
    RENDER: 16,      // 60fps = 16ms per frame
    MOUNT: 100,      // 首次挂载阈值
    UPDATE: 50,      // 更新阈值
    INTERACTION: 100 // 用户交互响应阈值
};

// 性能日志级别
type LogLevel = 'info' | 'warn' | 'error';

interface PerformanceMetric {
    component: string;
    phase: 'mount' | 'update' | 'interaction';
    duration: number;
    timestamp: number;
    details?: Record<string, unknown>;
}

// 存储性能指标
const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 100;

/**
 * 记录性能指标
 */
function recordMetric(metric: PerformanceMetric) {
    if (process.env.NODE_ENV !== 'development') return;

    metrics.push(metric);
    if (metrics.length > MAX_METRICS) {
        metrics.shift();
    }

    // 根据阈值输出警告
    const threshold = metric.phase === 'mount'
        ? THRESHOLDS.MOUNT
        : metric.phase === 'update'
            ? THRESHOLDS.UPDATE
            : THRESHOLDS.INTERACTION;

    const level: LogLevel = metric.duration > threshold * 2 ? 'error'
        : metric.duration > threshold ? 'warn'
            : 'info';

    if (level !== 'info') {
        console[level](
            `⚡ [Performance] ${metric.component} ${metric.phase}: ${metric.duration.toFixed(2)}ms`,
            metric.details || ''
        );
    }
}

/**
 * 测量函数执行时间
 */
export function measureTime<T>(
    label: string,
    fn: () => T,
    phase: 'mount' | 'update' | 'interaction' = 'interaction'
): T {
    if (process.env.NODE_ENV !== 'development') {
        return fn();
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    recordMetric({
        component: label,
        phase,
        duration,
        timestamp: Date.now()
    });

    return result;
}

/**
 * 测量异步函数执行时间
 */
export async function measureTimeAsync<T>(
    label: string,
    fn: () => Promise<T>,
    phase: 'mount' | 'update' | 'interaction' = 'interaction'
): Promise<T> {
    if (process.env.NODE_ENV !== 'development') {
        return fn();
    }

    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    recordMetric({
        component: label,
        phase,
        duration,
        timestamp: Date.now()
    });

    return result;
}

/**
 * React 组件性能分析 Hook
 */
export function usePerformanceMonitor(componentName: string) {
    if (process.env.NODE_ENV !== 'development') {
        return {
            measureRender: (fn: () => void) => fn(),
            measureInteraction: (label: string, fn: () => void) => fn(),
            getMetrics: () => [],
        };
    }

    return {
        /**
         * 测量渲染时间
         */
        measureRender: (fn: () => void) => {
            const start = performance.now();
            fn();
            const duration = performance.now() - start;

            if (duration > THRESHOLDS.RENDER) {
                console.warn(
                    `⚡ [Render] ${componentName}: ${duration.toFixed(2)}ms (> ${THRESHOLDS.RENDER}ms)`
                );
            }
        },

        /**
         * 测量用户交互响应时间
         */
        measureInteraction: (label: string, fn: () => void) => {
            measureTime(`${componentName}.${label}`, fn, 'interaction');
        },

        /**
         * 获取当前组件的性能指标
         */
        getMetrics: () => {
            return metrics.filter(m => m.component.startsWith(componentName));
        }
    };
}

/**
 * 性能报告工具
 */
export const PerformanceReport = {
    /**
     * 获取所有性能指标
     */
    getAll: () => [...metrics],

    /**
     * 获取慢组件列表
     */
    getSlowComponents: (threshold = THRESHOLDS.UPDATE) => {
        const componentTimes: Record<string, number[]> = {};

        metrics.forEach(m => {
            if (!componentTimes[m.component]) {
                componentTimes[m.component] = [];
            }
            componentTimes[m.component].push(m.duration);
        });

        const result: { component: string; avgTime: number; count: number }[] = [];

        Object.entries(componentTimes).forEach(([component, times]) => {
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            if (avgTime > threshold) {
                result.push({
                    component,
                    avgTime,
                    count: times.length
                });
            }
        });

        return result.sort((a, b) => b.avgTime - a.avgTime);
    },

    /**
     * 输出性能报告到控制台
     */
    printReport: () => {
        if (process.env.NODE_ENV !== 'development') return;

        console.group('📊 性能报告');
        console.log('总记录数:', metrics.length);

        const slow = PerformanceReport.getSlowComponents();
        if (slow.length > 0) {
            console.warn('⚠️ 慢组件:');
            slow.forEach(s => {
                console.warn(`  - ${s.component}: 平均 ${s.avgTime.toFixed(2)}ms (${s.count} 次)`);
            });
        } else {
            console.log('✅ 未发现慢组件');
        }

        console.groupEnd();
    },

    /**
     * 清空性能指标
     */
    clear: () => {
        metrics.length = 0;
    }
};

// 在开发环境下暴露到全局
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).__PERF__ = PerformanceReport;
    console.log('💡 性能监控已启用，使用 __PERF__.printReport() 查看报告');
}

export default {
    measureTime,
    measureTimeAsync,
    usePerformanceMonitor,
    PerformanceReport
};
