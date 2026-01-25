/**
 * useScriptEditor Hook 单元测试
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScriptEditor } from '../../app/pages/ScriptEditor/hooks/useScriptEditor';
import type { Script } from '../../app/pages/ScriptEditor/types';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('useScriptEditor', () => {
  const mockScript: Script = {
    id: 'script-1',
    chapterId: 'chapter-1',
    content: '',
    scenes: [
      {
        id: 'scene-1',
        sceneNumber: 1,
        episodeNumber: 1,
        location: '测试场景',
        timeOfDay: '白天',
        sceneType: 'INT',
        characters: [],
        action: '',
        dialogues: [],
        estimatedDuration: 0,
      },
    ],
    updatedAt: new Date().toISOString(),
    mode: 'tv_drama',
    metadata: {
      title: '测试剧本',
      draftDate: '2026-01-25',
      draft: '初稿',
    },
  };

  let setScript: ReturnType<typeof vi.fn>;
  let pushHistory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setScript = vi.fn();
    pushHistory = vi.fn();
  });

  it('应该更新场景', () => {
    const { result } = renderHook(() =>
      useScriptEditor({
        script: mockScript,
        setScript,
        pushHistory,
      })
    );

    act(() => {
      result.current.handleUpdateScene('scene-1', { location: '新场景' });
    });

    expect(setScript).toHaveBeenCalled();
  });

  it('应该添加场景', () => {
    const { result } = renderHook(() =>
      useScriptEditor({
        script: mockScript,
        setScript,
        pushHistory,
      })
    );

    act(() => {
      result.current.handleAddScene();
    });

    expect(setScript).toHaveBeenCalled();
    expect(pushHistory).toHaveBeenCalledWith(expect.any(Object), '添加新场景');
  });

  it('应该删除场景', () => {
    const { result } = renderHook(() =>
      useScriptEditor({
        script: mockScript,
        setScript,
        pushHistory,
      })
    );

    act(() => {
      result.current.handleDeleteScene('scene-1');
    });

    expect(setScript).toHaveBeenCalled();
    expect(pushHistory).toHaveBeenCalledWith(expect.any(Object), '删除场景');
  });

  it('应该批量更新场景', () => {
    const { result } = renderHook(() =>
      useScriptEditor({
        script: mockScript,
        setScript,
        pushHistory,
      })
    );

    const sceneIds = new Set(['scene-1']);

    act(() => {
      result.current.handleBatchUpdate(sceneIds, { timeOfDay: '夜晚' });
    });

    expect(setScript).toHaveBeenCalled();
    expect(pushHistory).toHaveBeenCalledWith(
      expect.any(Object),
      '批量更新 1 个场景'
    );
  });

  it('应该批量删除场景', () => {
    const { result } = renderHook(() =>
      useScriptEditor({
        script: mockScript,
        setScript,
        pushHistory,
      })
    );

    const sceneIds = new Set(['scene-1']);

    act(() => {
      result.current.handleBatchDelete(sceneIds);
    });

    expect(setScript).toHaveBeenCalled();
    expect(pushHistory).toHaveBeenCalledWith(
      expect.any(Object),
      '批量删除 1 个场景'
    );
  });
});
