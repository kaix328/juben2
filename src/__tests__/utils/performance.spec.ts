/**
 * 性能监控工具单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from '../../app/utils/performance';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('measureRender', () => {
    it('应该测量渲染时间', () => {
      const cleanup = PerformanceMonitor.measureRender('TestComponent');
      
      // 模拟一些耗时操作
      const start = Date.now();
      while (Date.now() - start < 20) {
        // 等待超过16ms
      }
      
      cleanup();
      
      // 在开发模式下应该有警告
      if (import.meta.env.DEV) {
        expect(console.warn).toHaveBeenCalled();
      }
    });

    it('应该返回清理函数', () => {
      const cleanup = PerformanceMonitor.measureRender('TestComponent');
      expect(typeof cleanup).toBe('function');
    });
  });

  describe('measureFunction', () => {
    it('应该测量函数执行时间', () => {
      const slowFunction = () => {
        const start = Date.now();
        while (Date.now() - start < 150) {
          // 模拟慢函数
        }
        return 'result';
      };

      const measured = PerformanceMonitor.measureFunction('slowFunction', slowFunction);
      const result = measured();

      expect(result).toBe('result');
      if (import.meta.env.DEV) {
        expect(console.warn).toHaveBeenCalled();
      }
    });
  });

  describe('mark and measure', () => {
    it('应该创建性能标记', () => {
      PerformanceMonitor.mark('test-start');
      PerformanceMonitor.mark('test-end');

      const duration = PerformanceMonitor.measure('test', 'test-start', 'test-end');

      if (import.meta.env.DEV) {
        expect(duration).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getMemoryUsage', () => {
    it('应该返回内存使用信息或null', () => {
      const memory = PerformanceMonitor.getMemoryUsage();

      if (memory) {
        expect(memory).toHaveProperty('usedJSHeapSize');
        expect(memory).toHaveProperty('totalJSHeapSize');
        expect(memory).toHaveProperty('jsHeapSizeLimit');
      } else {
        expect(memory).toBeNull();
      }
    });
  });
});
