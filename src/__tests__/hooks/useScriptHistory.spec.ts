/**
 * useScriptHistory Hook 单元测试
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScriptHistory } from '../../app/pages/ScriptEditor/hooks/useScriptHistory';
import type { Script } from '../../app/pages/ScriptEditor/types';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useScriptHistory', () => {
  const mockScript: Script = {
    id: 'script-1',
    chapterId: 'chapter-1',
    content: '',
    scenes: [],
    updatedAt: new Date().toISOString(),
    mode: 'tv_drama',
    metadata: {
      title: '测试剧本',
      draftDate: '2026-01-25',
      draft: '初稿',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该初始化历史记录', () => {
    const { result } = renderHook(() => useScriptHistory({ initialScript: mockScript }));

    expect(result.current.history.length).toBeGreaterThan(0);
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('应该推入新的历史记录', () => {
    const { result } = renderHook(() => useScriptHistory({ initialScript: mockScript }));

    const updatedScript = { ...mockScript, content: '更新后的内容' };

    act(() => {
      result.current.pushHistory(updatedScript, '更新内容');
    });

    expect(result.current.history.length).toBe(2);
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('应该执行撤销操作', () => {
    const { result } = renderHook(() => useScriptHistory({ initialScript: mockScript }));

    const updatedScript = { ...mockScript, content: '更新后的内容' };

    act(() => {
      result.current.pushHistory(updatedScript, '更新内容');
    });

    let undoneScript: Script | null = null;
    act(() => {
      undoneScript = result.current.undo();
    });

    expect(undoneScript).toBeTruthy();
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('应该执行重做操作', () => {
    const { result } = renderHook(() => useScriptHistory({ initialScript: mockScript }));

    const updatedScript = { ...mockScript, content: '更新后的内容' };

    act(() => {
      result.current.pushHistory(updatedScript, '更新内容');
    });

    act(() => {
      result.current.undo();
    });

    let redoneScript: Script | null = null;
    act(() => {
      redoneScript = result.current.redo();
    });

    expect(redoneScript).toBeTruthy();
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('应该限制历史记录数量', () => {
    const { result } = renderHook(() => useScriptHistory({ initialScript: mockScript }));

    // 推入超过最大数量的历史记录
    act(() => {
      for (let i = 0; i < 60; i++) {
        const updatedScript = { ...mockScript, content: `更新 ${i}` };
        result.current.pushHistory(updatedScript, `更新 ${i}`);
      }
    });

    // 历史记录应该被限制在最大数量
    expect(result.current.history.length).toBeLessThanOrEqual(50);
  });

  it('应该在推入新记录时截断后续历史', () => {
    const { result } = renderHook(() => useScriptHistory({ initialScript: mockScript }));

    act(() => {
      result.current.pushHistory({ ...mockScript, content: '更新1' }, '更新1');
      result.current.pushHistory({ ...mockScript, content: '更新2' }, '更新2');
      result.current.pushHistory({ ...mockScript, content: '更新3' }, '更新3');
    });

    expect(result.current.history.length).toBe(4);

    // 撤销两次
    act(() => {
      result.current.undo();
      result.current.undo();
    });

    // 推入新记录，应该截断后续历史
    act(() => {
      result.current.pushHistory({ ...mockScript, content: '新分支' }, '新分支');
    });

    expect(result.current.history.length).toBe(3);
    expect(result.current.canRedo).toBe(false);
  });

  it('应该清空历史记录', () => {
    const { result } = renderHook(() => useScriptHistory({ initialScript: mockScript }));

    act(() => {
      result.current.pushHistory({ ...mockScript, content: '更新1' }, '更新1');
    });

    expect(result.current.history.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history.length).toBe(0);
    expect(result.current.historyIndex).toBe(-1);
  });
});
