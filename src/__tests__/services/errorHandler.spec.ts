/**
 * errorHandler 测试套件
 * 测试统一错误处理服务的所有功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  errorHandler,
  withErrorHandling,
  safeAsync,
  createSafeAPI,
  useErrorHandler,
  type ErrorLog,
  type ErrorContext,
} from '../../app/services/errorHandler';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler.clearLogs();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;
    
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础错误处理', () => {
    it('应该处理字符串错误', () => {
      const log = errorHandler.handle('测试错误');

      expect(log.message).toBe('测试错误');
      expect(log.severity).toBe('error');
      expect(log.id).toBeDefined();
      expect(log.timestamp).toBeDefined();
    });

    it('应该处理 Error 对象', () => {
      const error = new Error('测试错误对象');
      const log = errorHandler.handle(error);

      expect(log.message).toBe('测试错误对象');
      expect(log.stack).toBeDefined();
    });

    it('应该添加错误到日志', () => {
      errorHandler.handle('错误1');
      errorHandler.handle('错误2');

      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('错误2'); // 最新的在前
      expect(logs[1].message).toBe('错误1');
    });

    it('应该限制日志数量', () => {
      // 添加超过最大数量的日志
      for (let i = 0; i < 150; i++) {
        errorHandler.handle(`错误${i}`);
      }

      const logs = errorHandler.getLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('应该支持自定义严重级别', () => {
      const log = errorHandler.handle('警告', { severity: 'warning' });
      expect(log.severity).toBe('warning');
    });

    it('应该支持上下文信息', () => {
      const context: ErrorContext = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123',
        extra: { key: 'value' },
      };

      const log = errorHandler.handle('错误', { context });
      expect(log.context).toEqual(context);
    });
  });

  describe('Toast 提示', () => {
    it('应该默认显示 Toast', async () => {
      const { toast } = await import('sonner');
      
      errorHandler.handle('错误消息');

      expect(toast.error).toHaveBeenCalledWith('错误消息');
    });

    it('应该支持禁用 Toast', async () => {
      const { toast } = await import('sonner');
      
      errorHandler.handle('错误消息', { showToast: false });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('应该根据严重级别显示不同的 Toast', async () => {
      const { toast } = await import('sonner');
      
      errorHandler.handle('信息', { severity: 'info' });
      errorHandler.handle('警告', { severity: 'warning' });
      errorHandler.handle('错误', { severity: 'error' });
      errorHandler.handle('严重', { severity: 'critical' });

      expect(toast.info).toHaveBeenCalledWith('信息');
      expect(toast.warning).toHaveBeenCalledWith('警告');
      expect(toast.error).toHaveBeenCalledTimes(2); // error 和 critical
    });

    it('应该转换为友好的错误消息', async () => {
      const { toast } = await import('sonner');
      
      errorHandler.handle('Failed to fetch');

      expect(toast.error).toHaveBeenCalledWith('网络连接失败，请检查网络设置');
    });

    it('应该截断过长的消息', async () => {
      const { toast } = await import('sonner');
      const longMessage = 'a'.repeat(150);
      
      errorHandler.handle(longMessage);

      const call = (toast.error as any).mock.calls[0][0];
      expect(call.length).toBeLessThanOrEqual(103); // 100 + '...'
    });
  });

  describe('控制台日志', () => {
    it('应该默认输出到控制台', () => {
      errorHandler.handle('错误');

      expect(console.error).toHaveBeenCalled();
    });

    it('应该支持禁用控制台输出', () => {
      errorHandler.handle('错误', { logToConsole: false });

      expect(console.error).not.toHaveBeenCalled();
    });

    it('应该根据严重级别使用不同的控制台方法', () => {
      errorHandler.handle('信息', { severity: 'info' });
      errorHandler.handle('警告', { severity: 'warning' });
      errorHandler.handle('错误', { severity: 'error' });
      errorHandler.handle('严重', { severity: 'critical' });

      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledTimes(2);
    });

    it('应该在日志中包含上下文信息', () => {
      errorHandler.handle('错误', {
        context: {
          component: 'TestComponent',
          action: 'testAction',
        },
      });

      const call = (console.error as any).mock.calls[0];
      expect(call[0]).toContain('TestComponent');
      expect(call[0]).toContain('testAction');
    });
  });

  describe('便捷方法', () => {
    it('handleAPI 应该添加 API 上下文', () => {
      const log = errorHandler.handleAPI('API 错误', 'testAPI');

      expect(log.context?.component).toBe('API');
      expect(log.context?.action).toBe('testAPI');
    });

    it('handleComponent 应该添加组件上下文', () => {
      const log = errorHandler.handleComponent('组件错误', 'TestComponent');

      expect(log.context?.component).toBe('TestComponent');
    });

    it('silent 应该不显示 Toast', async () => {
      const { toast } = await import('sonner');
      
      errorHandler.silent('静默错误');

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('warn 应该使用 warning 级别', () => {
      const log = errorHandler.warn('警告消息');

      expect(log.severity).toBe('warning');
    });

    it('info 应该使用 info 级别', () => {
      const log = errorHandler.info('信息消息');

      expect(log.severity).toBe('info');
    });

    it('critical 应该使用 critical 级别', () => {
      const log = errorHandler.critical('严重错误');

      expect(log.severity).toBe('critical');
    });
  });

  describe('日志管理', () => {
    it('getLogs 应该返回所有日志', () => {
      errorHandler.handle('错误1');
      errorHandler.handle('错误2');

      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(2);
    });

    it('clearLogs 应该清除所有日志', () => {
      errorHandler.handle('错误1');
      errorHandler.handle('错误2');
      
      errorHandler.clearLogs();

      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(0);
    });

    it('getRecentErrors 应该返回最近的错误', () => {
      for (let i = 0; i < 10; i++) {
        errorHandler.handle(`错误${i}`);
      }

      const recent = errorHandler.getRecentErrors(3);
      expect(recent).toHaveLength(3);
      expect(recent[0].message).toBe('错误9');
    });

    it('exportLogs 应该导出 JSON 格式', () => {
      errorHandler.handle('错误1');
      errorHandler.handle('错误2');

      const exported = errorHandler.exportLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('应该持久化日志到 localStorage', () => {
      errorHandler.handle('错误');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'error-logs',
        expect.any(String)
      );
    });

    it('应该在清除时删除 localStorage', () => {
      errorHandler.clearLogs();

      expect(localStorage.removeItem).toHaveBeenCalledWith('error-logs');
    });
  });

  describe('错误消息映射', () => {
    it('应该映射网络错误', async () => {
      const { toast } = await import('sonner');
      
      errorHandler.handle('Failed to fetch');
      expect(toast.error).toHaveBeenCalledWith('网络连接失败，请检查网络设置');
    });

    it('应该映射 HTTP 状态码', async () => {
      const { toast } = await import('sonner');
      
      errorHandler.handle('HTTP 401 Error');
      expect(toast.error).toHaveBeenCalledWith('认证失败，请检查 API 密钥');
    });

    it('应该映射业务错误', async () => {
      const { toast } = await import('sonner');
      
      errorHandler.handle('Missing API Key');
      expect(toast.error).toHaveBeenCalledWith('API 密钥未配置，请在设置页面配置');
    });

    it('应该返回原始消息如果没有映射', async () => {
      const { toast } = await import('sonner');
      
      errorHandler.handle('未知错误');
      expect(toast.error).toHaveBeenCalledWith('未知错误');
    });
  });

  describe('withErrorHandling', () => {
    it('应该包装异步函数', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = withErrorHandling(fn);

      const result = await wrapped('arg1', 'arg2');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('应该捕获并处理错误', async () => {
      const error = new Error('测试错误');
      const fn = vi.fn().mockRejectedValue(error);
      const wrapped = withErrorHandling(fn);

      await expect(wrapped()).rejects.toThrow('测试错误');
      
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('测试错误');
    });

    it('应该添加上下文信息', async () => {
      const error = new Error('错误');
      const fn = vi.fn().mockRejectedValue(error);
      const context: ErrorContext = { component: 'Test' };
      const wrapped = withErrorHandling(fn, context);

      await expect(wrapped()).rejects.toThrow();
      
      const logs = errorHandler.getLogs();
      expect(logs[0].context).toEqual(context);
    });
  });

  describe('safeAsync', () => {
    it('应该执行成功的异步操作', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await safeAsync(fn);

      expect(result).toBe('success');
    });

    it('应该捕获错误并返回 undefined', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('错误'));
      
      const result = await safeAsync(fn);

      expect(result).toBeUndefined();
    });

    it('应该返回 fallback 值', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('错误'));
      
      const result = await safeAsync(fn, { fallback: 'default' });

      expect(result).toBe('default');
    });

    it('应该支持禁用 Toast', async () => {
      const { toast } = await import('sonner');
      const fn = vi.fn().mockRejectedValue(new Error('错误'));
      
      await safeAsync(fn, { showToast: false });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('应该添加上下文信息', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('错误'));
      const context: ErrorContext = { component: 'Test' };
      
      await safeAsync(fn, { context });

      const logs = errorHandler.getLogs();
      expect(logs[0].context).toEqual(context);
    });
  });

  describe('createSafeAPI', () => {
    it('应该创建安全的 API 调用', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const safeAPI = createSafeAPI('testAPI', fn);

      const result = await safeAPI('arg1');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledWith('arg1');
    });

    it('应该捕获并处理 API 错误', async () => {
      const error = new Error('API 错误');
      const fn = vi.fn().mockRejectedValue(error);
      const safeAPI = createSafeAPI('testAPI', fn);

      await expect(safeAPI()).rejects.toThrow('API 错误');
      
      const logs = errorHandler.getLogs();
      expect(logs[0].context?.component).toBe('API');
      expect(logs[0].context?.action).toBe('testAPI');
    });
  });

  describe('useErrorHandler Hook', () => {
    it('应该返回错误处理函数', () => {
      const { result } = renderHook(() => useErrorHandler('TestComponent'));

      expect(result.current.handleError).toBeDefined();
      expect(result.current.handleWarning).toBeDefined();
      expect(result.current.safeExecute).toBeDefined();
      expect(result.current.getLogs).toBeDefined();
      expect(result.current.clearLogs).toBeDefined();
    });

    it('handleError 应该处理错误', () => {
      const { result } = renderHook(() => useErrorHandler('TestComponent'));

      act(() => {
        result.current.handleError('测试错误', 'testAction');
      });

      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context?.component).toBe('TestComponent');
      expect(logs[0].context?.action).toBe('testAction');
    });

    it('handleWarning 应该处理警告', () => {
      const { result } = renderHook(() => useErrorHandler('TestComponent'));

      act(() => {
        result.current.handleWarning('警告消息', 'testAction');
      });

      const logs = errorHandler.getLogs();
      expect(logs[0].severity).toBe('warning');
    });

    it('safeExecute 应该安全执行异步操作', async () => {
      const { result } = renderHook(() => useErrorHandler('TestComponent'));
      const fn = vi.fn().mockResolvedValue('success');

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.safeExecute(fn, 'testAction');
      });

      expect(returnValue).toBe('success');
    });

    it('safeExecute 应该捕获错误', async () => {
      const { result } = renderHook(() => useErrorHandler('TestComponent'));
      const fn = vi.fn().mockRejectedValue(new Error('错误'));

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.safeExecute(fn, 'testAction');
      });

      expect(returnValue).toBeUndefined();
      const logs = errorHandler.getLogs();
      expect(logs).toHaveLength(1);
    });

    it('getLogs 应该返回日志', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('错误');
      });

      const logs = result.current.getLogs();
      expect(logs).toHaveLength(1);
    });

    it('clearLogs 应该清除日志', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('错误');
        result.current.clearLogs();
      });

      const logs = result.current.getLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理 localStorage 错误', () => {
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // 不应该抛出错误
      expect(() => errorHandler.handle('错误')).not.toThrow();
    });

    it('应该处理空错误消息', () => {
      const log = errorHandler.handle('');

      expect(log.message).toBe('');
    });

    it('应该处理 undefined 上下文', () => {
      const log = errorHandler.handle('错误', { context: undefined });

      expect(log.context).toBeUndefined();
    });

    it('应该处理没有 stack 的 Error', () => {
      const error = new Error('错误');
      delete error.stack;

      const log = errorHandler.handle(error);

      expect(log.stack).toBeUndefined();
    });
  });
});
