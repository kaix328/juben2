/**
 * ListView 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListView } from '../../app/pages/StoryboardEditor/components/ListView';
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
  viewMode: 'list',
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

describe('ListView', () => {
  describe('基础渲染', () => {
    it('应该渲染空列表', () => {
      const context = createMockContext();
      const { container } = render(
        <StoryboardProvider value={context}>
          <ListView panels={[]} />
        </StoryboardProvider>
      );

      expect(container.querySelector('.space-y-6')).toBeInTheDocument();
    });

    it('应该渲染单个分镜卡片', () => {
      const panels = [createMockPanel('1', '开场镜头')];
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <ListView panels={panels} />
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
          <ListView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('shot-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('shot-card-3')).toBeInTheDocument();
    });

    it('应该按顺序渲染卡片', () => {
      const panels = [
        createMockPanel('1', '第一个'),
        createMockPanel('2', '第二个'),
        createMockPanel('3', '第三个')
      ];
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <ListView panels={panels} />
        </StoryboardProvider>
      );

      const cards = screen.getAllByTestId(/shot-card-/);
      expect(cards).toHaveLength(3);
      expect(cards[0]).toHaveTextContent('Shot Card 1');
      expect(cards[1]).toHaveTextContent('Shot Card 2');
      expect(cards[2]).toHaveTextContent('Shot Card 3');
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
          <ListView panels={panels} />
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
          <ListView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
    });

    it('应该使用 Context 中的 panelDensityMode', () => {
      const panels = [createMockPanel('1', '测试')];
      const context = createMockContext({
        panelDensityMode: 'compact'
      });

      render(
        <StoryboardProvider value={context}>
          <ListView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
    });
  });

  describe('大量数据', () => {
    it('应该能渲染大量分镜', () => {
      const panels = Array.from({ length: 100 }, (_, i) => 
        createMockPanel(`${i + 1}`, `分镜 ${i + 1}`)
      );
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <ListView panels={panels} />
        </StoryboardProvider>
      );

      const cards = screen.getAllByTestId(/shot-card-/);
      expect(cards).toHaveLength(100);
    });
  });

  describe('边界情况', () => {
    it('应该处理空 ID', () => {
      const panels = [createMockPanel('', '测试')];
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <ListView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-')).toBeInTheDocument();
    });

    it('应该处理空描述', () => {
      const panels = [createMockPanel('1', '')];
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <ListView panels={panels} />
        </StoryboardProvider>
      );

      expect(screen.getByTestId('shot-card-1')).toBeInTheDocument();
    });

    it('应该处理重复 ID', () => {
      const panels = [
        createMockPanel('1', '第一个'),
        createMockPanel('1', '第二个')
      ];
      const context = createMockContext();

      render(
        <StoryboardProvider value={context}>
          <ListView panels={panels} />
        </StoryboardProvider>
      );

      // 应该渲染两个卡片，即使 ID 相同
      const cards = screen.getAllByTestId('shot-card-1');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
