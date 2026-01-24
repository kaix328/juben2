/**
 * 分镜编辑器 Context
 * 提供全局状态和操作方法
 */

import { createContext, useContext, ReactNode } from 'react';
import type { 
  Storyboard, 
  StoryboardPanel, 
  Script, 
  Project, 
  AssetLibrary 
} from '../../../types';
import type { ViewMode, PanelDensityMode, PanelStatus } from '../types';

// ============ Context 类型定义 ============

export interface StoryboardContextValue {
  // 数据
  storyboard: Storyboard | null;
  script: Script | null;
  project: Project | null;
  assets: AssetLibrary | null;
  
  // UI 状态
  viewMode: ViewMode;
  selectedEpisode: number | null;
  panelDensityMode: PanelDensityMode;
  selectedPanels: Set<string>;
  panelStatuses: Record<string, PanelStatus>;
  filteredPanels: StoryboardPanel[];
  
  // 对话框状态
  showResourceSidebar: boolean;
  showPreviewDialog: boolean;
  showHistoryDialog: boolean;
  showContinuityDialog: boolean;
  
  // 操作方法
  setViewMode: (mode: ViewMode) => void;
  setSelectedEpisode: (episode: number | null) => void;
  setPanelDensityMode: (mode: PanelDensityMode) => void;
  setShowResourceSidebar: (show: boolean) => void;
  setShowPreviewDialog: (show: boolean) => void;
  setShowHistoryDialog: (show: boolean) => void;
  
  // 分镜操作
  handleUpdatePanel: (id: string, updates: Partial<StoryboardPanel>) => void;
  handleDeletePanel: (id: string) => void;
  handleAddPanel: () => void;
  handleCopyPanel: (panel: StoryboardPanel) => void;
  handleSplitPanel: (id: string, count: number) => void;
  
  // 选择操作
  handleToggleSelect: (id: string) => void;
  handleSelectAll: () => void;
  handleClearSelection: () => void;
  
  // 批量操作
  handleBatchDelete: (ids: Set<string>) => void;
  handleBatchApplyParams: (ids: Set<string>, params: Partial<StoryboardPanel>) => void;
  
  // 生成操作
  handleGenerateImage: (panel: StoryboardPanel) => Promise<void>;
  handleGeneratePrompts: (panel: StoryboardPanel) => void;
  handleGenerateAllImages: () => void;
  
  // 导出操作
  handleExportStoryboard: (format: string) => void;
  handleExportPrompts: () => void;
  handleExportPDF: () => void;
  
  // 其他操作
  handleSave: () => Promise<void>;
  handleUndo: () => void;
  handleRedo: () => void;
  handleContinuityCheck: () => void;
  handleQualityCheck?: () => void;  // 🆕 质量检查
  handleOpenPromptPreview?: (panel: StoryboardPanel) => void;  // 🆕 提示词预览
  handleMovePanel?: (fromId: string, toId: string) => void;  // 🆕 拖拽排序
  
  // 状态查询
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  totalDuration: number;
  estimatedPanelCount: number;
}

// ============ Context 创建 ============

const StoryboardContext = createContext<StoryboardContextValue | null>(null);

// ============ Hook ============

export function useStoryboardContext() {
  const context = useContext(StoryboardContext);
  if (!context) {
    throw new Error('useStoryboardContext must be used within StoryboardProvider');
  }
  return context;
}

// ============ Provider Props ============

export interface StoryboardProviderProps {
  children: ReactNode;
  value: StoryboardContextValue;
}

// ============ Provider 组件 ============

export function StoryboardProvider({ children, value }: StoryboardProviderProps) {
  return (
    <StoryboardContext.Provider value={value}>
      {children}
    </StoryboardContext.Provider>
  );
}

export default StoryboardContext;
