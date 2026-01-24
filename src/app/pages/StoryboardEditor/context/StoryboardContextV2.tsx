/**
 * 分镜编辑器 Context 拆分（性能优化版）
 * 将单一 Context 拆分为 3 个独立的 Context，减少不必要的重渲染
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { Storyboard, Script, Project, AssetLibrary, StoryboardPanel } from '../../../types';
import type { ViewMode, PanelDensityMode } from '../types';

// ============ 数据层 Context（不常变化）============

export interface StoryboardDataContextType {
    storyboard: Storyboard | null;
    script: Script | null;
    project: Project | null;
    assets: AssetLibrary | null;
    styleLastUpdated: number;
}

export const StoryboardDataContext = createContext<StoryboardDataContextType | null>(null);

export function useStoryboardData() {
    const context = useContext(StoryboardDataContext);
    if (!context) {
        throw new Error('useStoryboardData must be used within StoryboardProvider');
    }
    return context;
}

// ============ 操作层 Context（稳定的函数引用）============

export interface StoryboardActionsContextType {
    // 基础操作
    handleSave: (storyboard: Storyboard) => Promise<boolean>;
    handleUpdatePanel: (panelId: string, updates: Partial<StoryboardPanel>) => Promise<void>;
    handleDeletePanel: (panelId: string) => Promise<void>;
    handleAddPanel: (afterPanelId?: string) => Promise<void>;
    handleCopyPanel: (panel: StoryboardPanel) => Promise<void>;
    handleSplitPanel: (panelId: string, count: number) => Promise<void>;
    movePanel: (dragIndex: number, hoverIndex: number) => Promise<void>;
    
    // 批量操作
    handleBatchDelete: (selectedIds: Set<string>) => Promise<void>;
    handleBatchApplyParams: (selectedIds: Set<string>, params: Partial<StoryboardPanel>) => Promise<void>;
    handleBatchRegeneratePrompts: (
        selectedIds: Set<string>,
        optimize: boolean,
        onProgress?: (current: number, total: number) => void,
        onComplete?: () => void,
        useEnhanced?: boolean
    ) => Promise<void>;
    
    // AI 操作
    handleAIExtractByEpisode: (
        episodeNumber: number | 'all',
        densityMode: PanelDensityMode,
        onStart: () => void,
        onEnd: () => void,
        onProgress?: (progress: any) => void
    ) => Promise<void>;
    handleGenerateImage: (panel: StoryboardPanel) => Promise<string | undefined>;
    
    // 导出操作
    handleExportStoryboard: (format: string) => void;
    handleExportPrompts: (platform: string) => void;
    handleExportPDF: () => Promise<void>;
    
    // 版本管理
    handleSaveVersion: (versionName?: string) => Promise<void>;
    handleRestoreVersion: (versionId: string) => Promise<void>;
    handleDeleteVersion: (versionId: string) => Promise<void>;
    loadVersions: () => Promise<void>;
    
    // 其他
    handleApplyPreset: (panelId: string, params: Partial<StoryboardPanel>) => Promise<void>;
    handleUpdateAssets: (assets: AssetLibrary) => Promise<boolean>;
    refreshData: () => void;
}

export const StoryboardActionsContext = createContext<StoryboardActionsContextType | null>(null);

export function useStoryboardActions() {
    const context = useContext(StoryboardActionsContext);
    if (!context) {
        throw new Error('useStoryboardActions must be used within StoryboardProvider');
    }
    return context;
}

// ============ UI 状态层 Context（频繁变化）============

export interface StoryboardUIContextType {
    // 视图状态
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    densityMode: PanelDensityMode;
    setDensityMode: (mode: PanelDensityMode) => void;
    
    // 选择状态
    selectedPanels: Set<string>;
    setSelectedPanels: (panels: Set<string>) => void;
    togglePanelSelection: (panelId: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    
    // 生成状态
    isGenerating: boolean;
    setIsGenerating: (generating: boolean) => void;
    generatingPanelIds: Set<string>;
    setGeneratingPanelIds: (ids: Set<string>) => void;
    
    // 对话框状态
    isQualityDialogOpen: boolean;
    setIsQualityDialogOpen: (open: boolean) => void;
    isVersionDialogOpen: boolean;
    setIsVersionDialogOpen: (open: boolean) => void;
    isPreviewDialogOpen: boolean;
    setIsPreviewDialogOpen: (open: boolean) => void;
    previewPanel: StoryboardPanel | null;
    setPreviewPanel: (panel: StoryboardPanel | null) => void;
    
    // 过滤和搜索
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filterEpisode: number | 'all';
    setFilterEpisode: (episode: number | 'all') => void;
    
    // 其他 UI 状态
    showResourceSidebar: boolean;
    setShowResourceSidebar: (show: boolean) => void;
    versions: any[];
}

export const StoryboardUIContext = createContext<StoryboardUIContextType | null>(null);

export function useStoryboardUI() {
    const context = useContext(StoryboardUIContext);
    if (!context) {
        throw new Error('useStoryboardUI must be used within StoryboardProvider');
    }
    return context;
}

// ============ Provider 组件 ============

interface StoryboardProviderProps {
    children: React.ReactNode;
    dataValue: StoryboardDataContextType;
    actionsValue: StoryboardActionsContextType;
    uiValue: StoryboardUIContextType;
}

export function StoryboardProvider({
    children,
    dataValue,
    actionsValue,
    uiValue,
}: StoryboardProviderProps) {
    // 使用 useMemo 确保值只在依赖变化时更新
    const memoizedDataValue = useMemo(() => dataValue, [
        dataValue.storyboard,
        dataValue.script,
        dataValue.project,
        dataValue.assets,
        dataValue.styleLastUpdated,
    ]);
    
    const memoizedActionsValue = useMemo(() => actionsValue, [
        // 函数引用应该是稳定的，所以这里可以为空
        // 或者列出所有函数（如果它们可能变化）
    ]);
    
    const memoizedUIValue = useMemo(() => uiValue, [
        uiValue.viewMode,
        uiValue.densityMode,
        uiValue.selectedPanels,
        uiValue.isGenerating,
        uiValue.generatingPanelIds,
        uiValue.isQualityDialogOpen,
        uiValue.isVersionDialogOpen,
        uiValue.isPreviewDialogOpen,
        uiValue.previewPanel,
        uiValue.searchQuery,
        uiValue.filterEpisode,
        uiValue.showResourceSidebar,
        uiValue.versions,
    ]);
    
    return (
        <StoryboardDataContext.Provider value={memoizedDataValue}>
            <StoryboardActionsContext.Provider value={memoizedActionsValue}>
                <StoryboardUIContext.Provider value={memoizedUIValue}>
                    {children}
                </StoryboardUIContext.Provider>
            </StoryboardActionsContext.Provider>
        </StoryboardDataContext.Provider>
    );
}

// ============ 组合 Hook（向后兼容）============

/**
 * 组合 Hook - 一次性获取所有 Context
 * 用于需要访问多个 Context 的组件
 */
export function useStoryboardContext() {
    const data = useStoryboardData();
    const actions = useStoryboardActions();
    const ui = useStoryboardUI();
    
    return {
        ...data,
        ...actions,
        ...ui,
    };
}

// ============ 选择器 Hooks（性能优化）============

/**
 * 只订阅分镜数据
 */
export function useStoryboardPanels(): StoryboardPanel[] {
    const { storyboard } = useStoryboardData();
    return useMemo(() => storyboard?.panels || [], [storyboard?.panels]);
}

/**
 * 只订阅单个分镜
 */
export function useStoryboardPanel(panelId: string): StoryboardPanel | undefined {
    const panels = useStoryboardPanels();
    return useMemo(() => panels.find(p => p.id === panelId), [panels, panelId]);
}

/**
 * 只订阅选中的分镜
 */
export function useSelectedPanels(): StoryboardPanel[] {
    const panels = useStoryboardPanels();
    const { selectedPanels } = useStoryboardUI();
    return useMemo(
        () => panels.filter(p => selectedPanels.has(p.id)),
        [panels, selectedPanels]
    );
}

/**
 * 只订阅过滤后的分镜
 */
export function useFilteredPanels(): StoryboardPanel[] {
    const panels = useStoryboardPanels();
    const { searchQuery, filterEpisode } = useStoryboardUI();
    
    return useMemo(() => {
        let filtered = panels;
        
        // 按集数过滤
        if (filterEpisode !== 'all') {
            filtered = filtered.filter(p => p.episodeNumber === filterEpisode);
        }
        
        // 按搜索关键词过滤
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.description?.toLowerCase().includes(query) ||
                p.dialogue?.toLowerCase().includes(query) ||
                p.notes?.toLowerCase().includes(query) ||
                p.characters?.some(c => c.toLowerCase().includes(query))
            );
        }
        
        return filtered;
    }, [panels, searchQuery, filterEpisode]);
}

/**
 * 只订阅分镜统计信息
 */
export function useStoryboardStats() {
    const panels = useStoryboardPanels();
    
    return useMemo(() => {
        const totalDuration = panels.reduce((sum, p) => sum + (p.duration || 0), 0);
        const episodeCount = new Set(panels.map(p => p.episodeNumber)).size;
        const sceneCount = new Set(panels.map(p => p.sceneId)).size;
        
        return {
            totalPanels: panels.length,
            totalDuration,
            episodeCount,
            sceneCount,
            averageDuration: panels.length > 0 ? totalDuration / panels.length : 0,
        };
    }, [panels]);
}
