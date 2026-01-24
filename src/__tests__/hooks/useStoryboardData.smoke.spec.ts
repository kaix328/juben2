/**
 * useStoryboardData Hook 冒烟测试
 * 验证 Hook 的基本功能和 API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStoryboardData } from '../../app/pages/StoryboardEditor/hooks/useStoryboardData';

// 创建测试用的 QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// 包装器组件
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  );
};

// Mock storage modules
vi.mock('../../app/utils/storage', () => ({
  scriptStorage: {
    getByChapterId: vi.fn().mockResolvedValue(null),
  },
  storyboardStorage: {
    getByChapterId: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(true),
  },
  projectStorage: {
    getById: vi.fn().mockResolvedValue(null),
  },
  assetStorage: {
    getByProjectId: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(true),
  },
  chapterStorage: {
    getProjectIdByChapterId: vi.fn().mockResolvedValue(null),
  },
}));

// Mock aiService
vi.mock('../../app/utils/aiService', () => ({
  extractStoryboard: vi.fn().mockResolvedValue([]),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useStoryboardData - Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该能够初始化', () => {
    const { result } = renderHook(
      () => useStoryboardData({ chapterId: 'test-chapter-1' }),
      { wrapper }
    );

    expect(result.current).toBeDefined();
  });

  it('应该返回必要的数据状态', () => {
    const { result } = renderHook(
      () => useStoryboardData({ chapterId: 'test-chapter-1' }),
      { wrapper }
    );

    expect(result.current.script).toBeDefined();
    expect(result.current.storyboard).toBeDefined();
    expect(result.current.project).toBeDefined();
    expect(result.current.assets).toBeDefined();
  });

  it('应该返回必要的操作方法', () => {
    const { result } = renderHook(
      () => useStoryboardData({ chapterId: 'test-chapter-1' }),
      { wrapper }
    );

    expect(result.current.handleSave).toBeDefined();
    expect(result.current.handleAddPanel).toBeDefined();
    expect(result.current.handleDeletePanel).toBeDefined();
    expect(result.current.handleUpdatePanel).toBeDefined();
    expect(result.current.movePanel).toBeDefined();
  });

  it('应该返回版本管理方法', () => {
    const { result } = renderHook(
      () => useStoryboardData({ chapterId: 'test-chapter-1' }),
      { wrapper }
    );

    expect(result.current.versions).toBeDefined();
    expect(result.current.loadVersions).toBeDefined();
    expect(result.current.handleSaveVersion).toBeDefined();
    expect(result.current.handleRestoreVersion).toBeDefined();
    expect(result.current.handleDeleteVersion).toBeDefined();
  });

  it('应该返回 AI 提取方法', () => {
    const { result } = renderHook(
      () => useStoryboardData({ chapterId: 'test-chapter-1' }),
      { wrapper }
    );

    expect(result.current.handleAIExtractByEpisode).toBeDefined();
  });

  it('应该能够处理 undefined chapterId', () => {
    const { result } = renderHook(
      () => useStoryboardData({ chapterId: undefined }),
      { wrapper }
    );

    expect(result.current).toBeDefined();
    expect(result.current.script).toBeNull();
    expect(result.current.storyboard).toBeNull();
  });

  it('应该在初始化时加载数据', async () => {
    const { scriptStorage } = await import('../../app/utils/storage');
    
    renderHook(
      () => useStoryboardData({ chapterId: 'test-chapter-1' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(scriptStorage.getByChapterId).toHaveBeenCalledWith('test-chapter-1');
    }, { timeout: 3000 });
  });
});
