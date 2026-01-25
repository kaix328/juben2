/**
 * useScriptLoader Hook 单元测试
 */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScriptLoader } from '../useScriptLoader';
import * as storage from '../../../../utils/storage';

// Mock storage
vi.mock('../../../../utils/storage', () => ({
  chapterStorage: {
    getById: vi.fn(),
  },
  scriptStorage: {
    getByChapterId: vi.fn(),
  },
  projectStorage: {
    getById: vi.fn(),
  },
}));

describe('useScriptLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该在没有 chapterId 时返回 null', () => {
    const { result } = renderHook(() => useScriptLoader({ chapterId: undefined }));

    expect(result.current.chapter).toBeNull();
    expect(result.current.script).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('应该成功加载章节和剧本数据', async () => {
    const mockChapter = {
      id: 'chapter-1',
      title: '测试章节',
      projectId: 'project-1',
      originalText: '测试内容',
    };

    const mockScript = {
      id: 'script-1',
      chapterId: 'chapter-1',
      scenes: [
        {
          id: 'scene-1',
          sceneNumber: 1,
          location: '测试场景',
          dialogues: [],
        },
      ],
    };

    const mockProject = {
      id: 'project-1',
      directorStyle: {
        artStyle: '写实',
        mood: '紧张',
      },
    };

    vi.mocked(storage.chapterStorage.getById).mockResolvedValue(mockChapter as any);
    vi.mocked(storage.scriptStorage.getByChapterId).mockResolvedValue(mockScript as any);
    vi.mocked(storage.projectStorage.getById).mockResolvedValue(mockProject as any);

    const { result } = renderHook(() => useScriptLoader({ chapterId: 'chapter-1' }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.chapter).toEqual(mockChapter);
    expect(result.current.script).toBeTruthy();
    expect(result.current.directorStyle).toEqual(mockProject.directorStyle);
  });

  it('应该处理加载错误', async () => {
    const mockError = new Error('加载失败');
    vi.mocked(storage.chapterStorage.getById).mockRejectedValue(mockError);

    const { result } = renderHook(() => useScriptLoader({ chapterId: 'chapter-1' }));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('加载失败');
  });

  it('应该进行数据迁移', async () => {
    const mockScript = {
      id: 'script-1',
      chapterId: 'chapter-1',
      scenes: [
        {
          id: 'scene-1',
          sceneNumber: 1,
          location: '测试场景',
          // 缺少 sceneType 和 dialogues
        },
      ],
    };

    vi.mocked(storage.chapterStorage.getById).mockResolvedValue({ id: 'chapter-1' } as any);
    vi.mocked(storage.scriptStorage.getByChapterId).mockResolvedValue(mockScript as any);

    const { result } = renderHook(() => useScriptLoader({ chapterId: 'chapter-1' }));

    await waitFor(() => {
      expect(result.current.script).toBeTruthy();
    });

    // 验证数据迁移
    expect(result.current.script?.scenes[0].sceneType).toBe('INT');
    expect(result.current.script?.scenes[0].dialogues).toEqual([]);
  });
});
