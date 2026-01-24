/**
 * ErrorBoundary组件测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils';
import { ErrorBoundary } from '../../app/components/ErrorBoundary';

// 创建一个会抛出错误的组件
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('测试错误');
  }
  return <div>正常内容</div>;
}

describe('ErrorBoundary组件', () => {
  beforeEach(() => {
    // 清除localStorage
    localStorage.clear();
    // 抑制console.error以避免测试输出混乱
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('正常情况下应该渲染子组件', () => {
    render(
      <ErrorBoundary>
        <div>测试内容</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('测试内容')).toBeInTheDocument();
  });

  it('捕获错误后应该显示错误UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('哎呀，出错了！')).toBeInTheDocument();
    expect(screen.getByText(/页面在加载时遇到了问题/)).toBeInTheDocument();
  });

  it('应该显示错误详情', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // 点击查看详情
    const detailsButton = screen.getByText('查看错误详情');
    expect(detailsButton).toBeInTheDocument();
  });

  it('应该提供刷新和返回首页按钮', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByRole('button', { name: /刷新页面/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /返回首页/ })).toBeInTheDocument();
  });

  it('应该支持自定义fallback', () => {
    const customFallback = <div>自定义错误页面</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('自定义错误页面')).toBeInTheDocument();
  });

  it('应该调用onError回调', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('应该将错误保存到localStorage', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const logs = JSON.parse(localStorage.getItem('error-logs') || '[]');
    expect(logs).toHaveLength(1);
    expect(logs[0]).toHaveProperty('message', '测试错误');
    expect(logs[0]).toHaveProperty('timestamp');
  });

  it('应该只保留最近10条错误日志', () => {
    // 模拟已有10条错误
    const existingLogs = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date().toISOString(),
      message: `错误 ${i}`,
    }));
    localStorage.setItem('error-logs', JSON.stringify(existingLogs));
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const logs = JSON.parse(localStorage.getItem('error-logs') || '[]');
    expect(logs).toHaveLength(10);
    expect(logs[0].message).toBe('测试错误'); // 最新的错误在前面
  });
});
