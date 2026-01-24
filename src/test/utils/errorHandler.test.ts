/**
 * 错误处理工具测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AppError,
  ErrorType,
  ErrorSeverity,
  handleError,
  handleApiError,
  handleNetworkError,
  handleValidationError,
  withErrorHandler,
} from '../../app/utils/errorHandler';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Sentry
vi.mock('../../lib/sentry', () => ({
  captureError: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('错误处理工具', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AppError类', () => {
    it('应该正确创建AppError实例', () => {
      const error = new AppError(
        '测试错误',
        ErrorType.API,
        ErrorSeverity.HIGH,
        { key: 'value' },
        '用户友好的错误消息'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppError');
      expect(error.message).toBe('测试错误');
      expect(error.type).toBe(ErrorType.API);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.context).toEqual({ key: 'value' });
      expect(error.userMessage).toBe('用户友好的错误消息');
    });

    it('应该使用默认值', () => {
      const error = new AppError('测试错误');

      expect(error.type).toBe(ErrorType.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context).toBeUndefined();
      expect(error.userMessage).toBeUndefined();
    });
  });

  describe('handleError', () => {
    it('应该处理AppError', () => {
      const error = new AppError(
        '测试错误',
        ErrorType.API,
        ErrorSeverity.HIGH,
        {},
        '用户错误消息'
      );

      handleError(error);

      expect(toast.error).toHaveBeenCalledWith(
        '用户错误消息',
        expect.any(Object)
      );
    });

    it('应该处理普通Error', () => {
      const error = new Error('普通错误');

      handleError(error);

      expect(toast.error).toHaveBeenCalledWith(
        '普通错误',
        expect.any(Object)
      );
    });

    it('应该处理字符串错误', () => {
      handleError('字符串错误');

      expect(toast.error).toHaveBeenCalledWith(
        '字符串错误',
        expect.any(Object)
      );
    });

    it('应该识别网络错误', () => {
      const error = new Error('fetch failed');

      handleError(error);

      expect(toast.error).toHaveBeenCalledWith(
        '网络连接失败，请检查网络设置',
        expect.any(Object)
      );
    });

    it('应该识别401错误', () => {
      const error = new Error('401 unauthorized');

      handleError(error);

      expect(toast.error).toHaveBeenCalledWith(
        '身份验证失败，请重新登录',
        expect.any(Object)
      );
    });

    it('应该识别500错误', () => {
      const error = new Error('500 server error');

      handleError(error);

      expect(toast.error).toHaveBeenCalledWith(
        '服务器错误，请稍后重试',
        expect.any(Object)
      );
    });

    it('showToast=false时不应显示toast', () => {
      const error = new Error('测试错误');

      handleError(error, false);

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('低级别错误不应上报到Sentry', () => {
      const { captureError } = require('../../lib/sentry');
      const error = new AppError('测试', ErrorType.UNKNOWN, ErrorSeverity.LOW);

      handleError(error);

      expect(captureError).not.toHaveBeenCalled();
    });
  });

  describe('handleApiError', () => {
    it('应该处理API错误', () => {
      const error = new Error('API错误');

      handleApiError(error, '/api/test');

      expect(toast.error).toHaveBeenCalledWith(
        'API请求失败，请稍后重试',
        expect.any(Object)
      );
    });
  });

  describe('handleNetworkError', () => {
    it('应该处理网络错误', () => {
      const error = new Error('网络错误');

      handleNetworkError(error);

      expect(toast.error).toHaveBeenCalledWith(
        '网络连接失败，请检查网络设置',
        expect.any(Object)
      );
    });
  });

  describe('handleValidationError', () => {
    it('应该处理验证错误', () => {
      handleValidationError('字段不能为空', 'username');

      expect(toast.error).toHaveBeenCalledWith(
        '字段不能为空',
        expect.any(Object)
      );
    });

    it('验证错误不应上报到Sentry', () => {
      const { captureError } = require('../../lib/sentry');

      handleValidationError('验证错误');

      expect(captureError).not.toHaveBeenCalled();
    });
  });

  describe('withErrorHandler', () => {
    it('应该包装函数并处理错误', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('测试错误'));
      const wrapped = withErrorHandler(fn, ErrorType.API);

      await expect(wrapped()).rejects.toThrow('测试错误');
      expect(toast.error).toHaveBeenCalled();
    });

    it('成功时应该返回结果', async () => {
      const fn = vi.fn().mockResolvedValue('成功');
      const wrapped = withErrorHandler(fn);

      const result = await wrapped();
      expect(result).toBe('成功');
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});
