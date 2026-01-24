/**
 * StoryboardContext 测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { 
  StoryboardProvider, 
  useStoryboardContext 
} from '../../app/pages/StoryboardEditor/context/StoryboardContext';
import type { StoryboardContextValue } from '../../app/pages/StoryboardEditor/context/StoryboardContext';

// 创建 Mock Context 值
const createMockContextValue = (overrides?: Partial<StoryboardContextValue>): StoryboardContextValue => ({
  storyboard: null,
  script: null,
  project: null,
  assets: null,
  viewMode: 'grid',
  selectedEpisode: null,
  panelDensityMode: 'normal',
  selectedPanels: new Set(),
  panelStatuses: {},
  filteredPanels: [],
  showResourceSidebar: false,
  showPreviewDialog: false,
  showHistoryDialog: false,
  showContinuityDialog: false,
  setViewMode: vi.fn(),
  setSelectedEpisode: vi.fn(),
  setPanelDensityMode: vi.fn(),
  setShowResourceSidebar: vi.fn(),
  setShowPreviewDialog: vi.fn(),
  setShowHistoryDialog: vi.fn(),
  handleUpdatePanel: vi.fn(),
  handleDeletePanel: vi.fn(),
  handleAddPanel: vi.fn(),
  handleCopyPanel: vi.fn(),
  handleSplitPanel: vi.fn(),
  handleToggleSelect: vi.fn(),
  handleSelectAll: vi.fn(),
  handleClearSelection: vi.fn(),
  handleBatchDelete: vi.fn(),
  handleBatchApplyParams: vi.fn(),
  handleGenerateImage: vi.fn(),
  handleGeneratePrompts: vi.fn(),
  handleGenerateAllImages: vi.fn(),
  handleExportStoryboard: vi.fn(),
  handleExportPrompts: vi.fn(),
  handleExportPDF: vi.fn(),
  handleSave: vi.fn(),
  handleUndo: vi.fn(),
  handleRedo: vi.fn(),
  handleContinuityCheck: vi.fn(),
  canUndo: false,
  canRedo: false,
  isDirty: false,
  totalDuration: 0,
  estimatedPanelCount: 0,
  ...overrides
});

describe('StoryboardContext', () => {
  describe('Provider', () => {
    it('应该渲染子组件', () => {
      const value = createMockContextValue();

      render(
        <StoryboardProvider value={value}>
          <div data-testid="child">Child Component</div>
        </StoryboardProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Component')).toBeInTheDocument();
    });

    it('应该提供 Context 值', () => {
      const value = createMockContextValue({ viewMode: 'list' });
      let contextValue: StoryboardContextValue | null = null;

      function TestComponent() {
        contextValue = useStoryboardContext();
        return <div>Test</div>;
      }

      render(
        <StoryboardProvider value={value}>
          <TestComponent />
        </StoryboardProvider>
      );

      expect(contextValue).not.toBeNull();
      expect(contextValue?.viewMode).toBe('list');
    });

    it('应该传递所有 Context 属性', () => {
      const value = createMockContextValue({
        viewMode: 'grid',
        panelDensityMode: 'compact',
        selectedPanels: new Set(['1', '2']),
        canUndo: true,
        canRedo: true,
        isDirty: true
      });

      let contextValue: StoryboardContextValue | null = null;

      function TestComponent() {
        contextValue = useStoryboardContext();
        return <div>Test</div>;
      }

      render(
        <StoryboardProvider value={value}>
          <TestComponent />
        </StoryboardProvider>
      );

      expect(contextValue?.viewMode).toBe('grid');
      expect(contextValue?.panelDensityMode).toBe('compact');
      expect(contextValue?.selectedPanels.size).toBe(2);
      expect(contextValue?.canUndo).toBe(true);
      expect(contextValue?.canRedo).toBe(true);
      expect(contextValue?.isDirty).toBe(true);
    });
  });

  describe('useStoryboardContext Hook', () => {
    it('应该返回 Context 值', () => {
      const value = createMockContextValue();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.viewMode).toBe('grid');
    });

    it('应该在没有 Provider 时抛出错误', () => {
      // 捕获 console.error 以避免测试输出中的错误信息
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useStoryboardContext());
      }).toThrow('useStoryboardContext must be used within StoryboardProvider');

      consoleError.mockRestore();
    });

    it('应该访问所有 Context 方法', () => {
      const value = createMockContextValue();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(typeof result.current.setViewMode).toBe('function');
      expect(typeof result.current.handleUpdatePanel).toBe('function');
      expect(typeof result.current.handleDeletePanel).toBe('function');
      expect(typeof result.current.handleAddPanel).toBe('function');
      expect(typeof result.current.handleSave).toBe('function');
    });
  });

  describe('数据状态', () => {
    it('应该提供 storyboard 数据', () => {
      const mockStoryboard = { id: '1', title: '测试分镜' };
      const value = createMockContextValue({ storyboard: mockStoryboard as any });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.storyboard).toEqual(mockStoryboard);
    });

    it('应该提供 script 数据', () => {
      const mockScript = { id: '1', title: '测试剧本' };
      const value = createMockContextValue({ script: mockScript as any });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.script).toEqual(mockScript);
    });

    it('应该提供 project 数据', () => {
      const mockProject = { id: '1', name: '测试项目' };
      const value = createMockContextValue({ project: mockProject as any });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.project).toEqual(mockProject);
    });
  });

  describe('UI 状态', () => {
    it('应该提供 viewMode 状态', () => {
      const value = createMockContextValue({ viewMode: 'list' });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.viewMode).toBe('list');
    });

    it('应该提供 selectedPanels 状态', () => {
      const selectedPanels = new Set(['1', '2', '3']);
      const value = createMockContextValue({ selectedPanels });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.selectedPanels).toEqual(selectedPanels);
      expect(result.current.selectedPanels.size).toBe(3);
    });

    it('应该提供 panelStatuses 状态', () => {
      const panelStatuses = { '1': 'generating', '2': 'completed' };
      const value = createMockContextValue({ panelStatuses: panelStatuses as any });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.panelStatuses).toEqual(panelStatuses);
    });

    it('应该提供对话框状态', () => {
      const value = createMockContextValue({
        showResourceSidebar: true,
        showPreviewDialog: true,
        showHistoryDialog: false
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.showResourceSidebar).toBe(true);
      expect(result.current.showPreviewDialog).toBe(true);
      expect(result.current.showHistoryDialog).toBe(false);
    });
  });

  describe('操作方法', () => {
    it('应该提供所有操作方法', () => {
      const value = createMockContextValue();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      // UI 操作
      expect(result.current.setViewMode).toBeDefined();
      expect(result.current.setSelectedEpisode).toBeDefined();
      expect(result.current.setPanelDensityMode).toBeDefined();

      // 分镜操作
      expect(result.current.handleUpdatePanel).toBeDefined();
      expect(result.current.handleDeletePanel).toBeDefined();
      expect(result.current.handleAddPanel).toBeDefined();
      expect(result.current.handleCopyPanel).toBeDefined();
      expect(result.current.handleSplitPanel).toBeDefined();

      // 选择操作
      expect(result.current.handleToggleSelect).toBeDefined();
      expect(result.current.handleSelectAll).toBeDefined();
      expect(result.current.handleClearSelection).toBeDefined();

      // 批量操作
      expect(result.current.handleBatchDelete).toBeDefined();
      expect(result.current.handleBatchApplyParams).toBeDefined();

      // 生成操作
      expect(result.current.handleGenerateImage).toBeDefined();
      expect(result.current.handleGeneratePrompts).toBeDefined();
      expect(result.current.handleGenerateAllImages).toBeDefined();

      // 导出操作
      expect(result.current.handleExportStoryboard).toBeDefined();
      expect(result.current.handleExportPrompts).toBeDefined();
      expect(result.current.handleExportPDF).toBeDefined();

      // 其他操作
      expect(result.current.handleSave).toBeDefined();
      expect(result.current.handleUndo).toBeDefined();
      expect(result.current.handleRedo).toBeDefined();
    });
  });

  describe('状态查询', () => {
    it('应该提供 canUndo 状态', () => {
      const value = createMockContextValue({ canUndo: true });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.canUndo).toBe(true);
    });

    it('应该提供 canRedo 状态', () => {
      const value = createMockContextValue({ canRedo: true });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.canRedo).toBe(true);
    });

    it('应该提供 isDirty 状态', () => {
      const value = createMockContextValue({ isDirty: true });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.isDirty).toBe(true);
    });

    it('应该提供 totalDuration 状态', () => {
      const value = createMockContextValue({ totalDuration: 120 });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.totalDuration).toBe(120);
    });

    it('应该提供 estimatedPanelCount 状态', () => {
      const value = createMockContextValue({ estimatedPanelCount: 50 });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryboardProvider value={value}>{children}</StoryboardProvider>
      );

      const { result } = renderHook(() => useStoryboardContext(), { wrapper });

      expect(result.current.estimatedPanelCount).toBe(50);
    });
  });
});
