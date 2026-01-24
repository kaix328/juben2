/**
 * GridView 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GridView } from '../../app/pages/StoryboardEditor/components/GridView';
import { StoryboardProvider } from '../../app/pages/StoryboardEditor/context/StoryboardContext';
import type { StoryboardPanel } from '../../app/types';
import type { StoryboardContextValue } from '../../app/pages/StoryboardEditor/context/StoryboardContext';

// Mock ShotCard 组件
vi.mock('../../app/components/storyboard/ShotCard', () => ({
  ShotCard: ({ panel, index }: any) => (
    <div data-testid={`shot-card-${panel.id}`}>
      Shot Card {index + 1}: {panel.shotDescription}
    </div>
  )
}));

// Mock VirtualGrid 组件
vi.mock('../../app/components/VirtualList', () => ({
  VirtualGrid: ({ items, renderItem }: any) => (
    <div data-testid="virtual-grid">
      {items.map((item: any, index: number) => renderItem(item, index))}
    </div>
  )
}));

// 创建测试数据
const createMockPanel = (id: string, description: string): StoryboardPanel => ({
  id,
  shotNumber: parseInt(id),
  shotSize: '中景',
  cameraAngle: '平视',
  cameraMovement: '固定',
  shotDescription: description,
  visualElements: [],
  lightingSetup: '自然光',
  colorPalette: [],
  duration: 3,
  transitionType: '切',
  audioNotes: '',
  dialogueText: '',
  characterActions: [],
  props: [],
  location: '',
  timeOfDay: '白天',
  weather: '晴',
  mood: '平静',
  referenceImages: [],
  aiPrompt: '',
  generatedImageUrl: '',
  notes: '',
  tags: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// 创建 Mock Context
const createMockContext = (overrides?: Partial<StoryboardContextValue>): StoryboardContextValue => ({
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

describe('GridView', () => {
  describe('基础渲染', () => {
    it('应该渲染空网格', () => {
      const context = createMockContext();
      const { container } = render(
        <StoryboardProvider value={context}>
          <GridView panels={[]} />
        </StoryboardProvider>
      );

      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('应该渲染单个分镜卡片', () => {
      const panels = [createMockPanel('1', '开场镜头')];
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
      expect(screen.getByText(/开场镜头/)).toBeInTheDocument();
    });

    it('应该渲染多个分镜卡片', () => {
      const panels = [
        createMockPanel('1', '开场镜头'),
        createMockPanel('2', '角色登场'),
        createMockPanel('3', '对话场景')
      ];
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('shot-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('shot-card-3')).toBeInTheDocument();
    });

    it('应该使用网格布局类名', () => {
      const panels = [createMockPanel('1', '测试')];
      const context = createMockContext();

      const { container } = render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
      expect(grid).toHaveClass('xl:grid-cols-4');
    });
  });

  describe('虚拟滚动', () => {
    it('应该在数据量大时使用虚拟滚动', () => {
      const panels = Array.from({ length: 60 }, (_, i) => 
        createMockPanel(`${i + 1}`, `分镜 ${i + 1}`)
      );
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} useVirtualScroll={true} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('virtual-grid')).toBeInTheDocument();
    });

    it('应该在数据量小时不使用虚拟滚动', () => {
      const panels = Array.from({ length: 30 }, (_, i) => 
        createMockPanel(`${i + 1}`, `分镜 ${i + 1}`)
      );
      const context = createMockContext();

      const { container } = render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} useVirtualScroll={true} />
        </StoryboardProvider>
      );

      expect(screen.queryByTestId('virtual-grid')).not.toBeInTheDocument();
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('应该在禁用虚拟滚动时使用普通网格', () => {
      const panels = Array.from({ length: 60 }, (_, i) => 
        createMockPanel(`${i + 1}`, `分镜 ${i + 1}`)
      );
      const context = createMockContext();

      const { container } = render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} useVirtualScroll={false} />
        </StoryboardProvider>
      );

      expect(screen.queryByTestId('virtual-grid')).not.toBeInTheDocument();
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });

  describe('密度模式', () => {
    it('应该支持 compact 密度模式', () => {
      const panels = [createMockPanel('1', '测试')];
      const context = createMockContext({
        panelDensityMode: 'compact'
      });

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
    });

    it('应该支持 normal 密度模式', () => {
      const panels = [createMockPanel('1', '测试')];
      const context = createMockContext({
        panelDensityMode: 'normal'
      });

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
    });

    it('应该支持 detailed 密度模式', () => {
      const panels = [createMockPanel('1', '测试')];
      const context = createMockContext({
        panelDensityMode: 'detailed'
      });

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
    });
  });

  describe('Context 集成', () => {
    it('应该使用 Context 中的 selectedPanels', () => {
      const panels = [createMockPanel('1', '测试')];
      const context = createMockContext({
        selectedPanels: new Set(['1'])
      });

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
    });

    it('应该使用 Context 中的 panelStatuses', () => {
      const panels = [createMockPanel('1', '测试')];
      const context = createMockContext({
        panelStatuses: { '1': 'generating' }
      });

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
    });
  });

  describe('大量数据', () => {
    it('应该能渲染大量分镜（普通模式）', () => {
      const panels = Array.from({ length: 100 }, (_, i) => 
        createMockPanel(`${i + 1}`, `分镜 ${i + 1}`)
      );
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} useVirtualScroll={false} />
        </StoryboardProvider>
      );

      const cards = screen.getAllByTestId(/shot-card-/);
      expect(cards).toHaveLength(100);
    });

    it('应该能渲染大量分镜（虚拟滚动）', () => {
      const panels = Array.from({ length: 100 }, (_, i) => 
        createMockPanel(`${i + 1}`, `分镜 ${i + 1}`)
      );
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} useVirtualScroll={true} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('virtual-grid')).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理空 ID', () => {
      const panels = [createMockPanel('', '测试')];
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-')).toBeInTheDocument();
    });

    it('应该处理空描述', () => {
      const panels = [createMockPanel('1', '')];
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
    });

    it('应该处理 undefined useVirtualScroll', () => {
      const panels = [createMockPanel('1', '测试')];
      const context = createMockContext();

      const { container } = render(
        <StoryboardProvider value={context}>
          <GridView panels={panels} />
        </StoryboardProvider>
      );

      // 默认应该使用普通网格
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });
});
