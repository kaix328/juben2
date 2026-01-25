/**
 * useDebounce Hook 单元测试
 */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce, useDebouncedCallback } from '../../app/hooks/useDebounce';

describe('useDebounce', () => {
  it('应该延迟更新值', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // 更新值
    rerender({ value: 'updated' });

    // 立即检查，值应该还是旧的
    expect(result.current).toBe('initial');

    // 等待防抖时间后，值应该更新
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 400 }
    );
  });

  it('应该在快速变化时只更新最后一个值', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // 快速更新多次
    rerender({ value: 'update1' });
    rerender({ value: 'update2' });
    rerender({ value: 'update3' });

    // 等待防抖时间
    await waitFor(
      () => {
        expect(result.current).toBe('update3');
      },
      { timeout: 400 }
    );
  });
});

describe('useDebouncedCallback', () => {
  it('应该延迟执行回调', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    // 调用防抖函数
    result.current('test');

    // 立即检查，回调不应该被调用
    expect(callback).not.toHaveBeenCalled();

    // 等待防抖时间后，回调应该被调用
    await waitFor(
      () => {
        expect(callback).toHaveBeenCalledWith('test');
      },
      { timeout: 400 }
    );
  });

  it('应该在快速调用时只执行最后一次', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    // 快速调用多次
    result.current('call1');
    result.current('call2');
    result.current('call3');

    // 等待防抖时间
    await waitFor(
      () => {
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('call3');
      },
      { timeout: 400 }
    );
  });
});
