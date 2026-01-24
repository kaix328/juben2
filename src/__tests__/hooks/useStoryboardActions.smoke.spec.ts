/**
 * useStoryboardActions Hook 冒烟测试
 * 验证 Hook 的基本功能和 API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStoryboardActions } from '../../app/pages/StoryboardEditor/hooks/useStoryboardActions';
import type { Storyboard, Project, AssetLibrary, Script } from '../../app/types';

// Mock dependencies
vi.mock('../../app/utils/volcApi', () => ({
  optimizePrompt: vi.fn().mockResolvedValue('optimized prompt'),
}));

vi.mock('../../app/utils/aiService', () => ({
  generateStoryboardImage: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
}));

vi.mock('../../app/utils/prompts', () => ({
  exportAllPanelPrompts: vi.fn().mockReturnValue('exported prompts'),
}));

vi.mock('../../app/utils/exportUtils', () => ({
  exportVideoPromptsByPlatform: vi.fn().mockReturnValue('video prompts'),
  exportStoryboardToCSV: vi.fn().mockReturnValue('csv content'),
  downloadCSV: vi.fn(),
  generateFriendlyFilename: vi.fn().mockReturnValue('filename.txt'),
  downloadText: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('useStoryboardActions - Smoke Tests', () => {
  const mockStoryboard: Storyboard = {
    id: 'sb-1',
    chapterId: 'chapter-1',
    panels: [],
    updatedAt: new Date().toISOString(),
  };

  const mockScript: Script = {
    id: 'script-1',
    title: 'Test Script',
    chapterId: 'chapter-1',
    scenes: [],
    updatedAt: new Date().toISOString(),
  };

  const mockProject: Project = {
    id: 'project-1',
    title: 'Test Project',
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockAssets: AssetLibrary = {
    id: 'assets-1',
    projectId: 'project-1',
    characters: [],
    scenes: [],
    props: [],
  };

  const mockProps = {
    storyboard: mockStoryboard,
    script: mockScript,
    project: mockProject,
    assets: mockAssets,
    onUpdateStoryboard: vi.fn().mockResolvedValue(true),
    onUpdateAssets: vi.fn().mockResolvedValue(true),
    updatePanelStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该能够初始化', () => {
    const { result } = renderHook(() => useStoryboardActions(mockProps));

    expect(result.current).toBeDefined();
  });

  it('应该返回批量操作方法', () => {
    const { result } = renderHook(() => useStoryboardActions(mockProps));

    expect(result.current.handleBatchRegeneratePrompts).toBeDefined();
    expect(result.current.handleGenerateAllImages).toBeDefined();
    expect(result.current.handleBatchDelete).toBeDefined();
    expect(result.current.handleBatchApplyParams).toBeDefined();
  });

  it('应该返回单个操作方法', () => {
    const { result } = renderHook(() => useStoryboardActions(mockProps));

    expect(result.current.handleGenerateImage).toBeDefined();
    expect(result.current.handleCopyPanel).toBeDefined();
    expect(result.current.handleSplitPanel).toBeDefined();
    expect(result.current.handleApplyPreset).toBeDefined();
    expect(result.current.handleGeneratePrompts).toBeDefined();
  });

  it('应该返回导出方法', () => {
    const { result } = renderHook(() => useStoryboardActions(mockProps));

    expect(result.current.handleExportStoryboard).toBeDefined();
    expect(result.current.handleExportPrompts).toBeDefined();
    expect(result.current.handleExportPDF).toBeDefined();
    expect(result.current.handleExportCSV).toBeDefined();
    expect(result.current.handleExportVideoPrompts).toBeDefined();
  });

  it('应该返回队列控制方法', () => {
    const { result } = renderHook(() => useStoryboardActions(mockProps));

    expect(result.current.cancelAllTasks).toBeDefined();
    expect(result.current.retryFailedTasks).toBeDefined();
    expect(result.current.getQueueStats).toBeDefined();
  });

  it('应该返回资产同步方法', () => {
    const { result } = renderHook(() => useStoryboardActions(mockProps));

    expect(result.current.handleSyncToAssetLibrary).toBeDefined();
  });

  it('应该返回提示词复制方法', () => {
    const { result } = renderHook(() => useStoryboardActions(mockProps));

    expect(result.current.handleCopyPrompt).toBeDefined();
  });

  it('应该能够处理 null storyboard', () => {
    const propsWithNull = { ...mockProps, storyboard: null };
    const { result } = renderHook(() => useStoryboardActions(propsWithNull));

    expect(result.current).toBeDefined();
    expect(result.current.handleGenerateImage).toBeDefined();
  });
});
