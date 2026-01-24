/**
 * 分镜编辑器 - 重构版
 * 使用 Context 和组件拆分，降低复杂度
 */

import React, { useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PanelRightOpen, PanelRightClose, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { StoryboardHeader } from '../../components/storyboard/StoryboardHeader';
import { BatchActionBar } from '../../components/storyboard/BatchActionBar';
import { TimelineView } from './components/TimelineView';
import { GridView } from './components/GridView';
import { ListView } from './components/ListView';
import { VersionHistoryDialog } from './components/VersionHistoryDialog';
import { PreviewDialog } from './components/PreviewDialog';
import { StoryboardPrintTemplate } from './components/StoryboardPrintTemplate';
import { ResourceSidebar } from './components/ResourceSidebar';
import { StoryboardProvider } from './context/StoryboardContext';
import { continuityChecker } from '../../utils/continuityChecker';
import { useStoryboardData } from './hooks/useStoryboardData';
import { useStoryboardUI } from './hooks/useStoryboardUI';
import { useStoryboardActions } from './hooks/useStoryboardActions';
import { useStoryboardHistory } from './hooks/useStoryboardHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDialogManager } from './hooks/useDialogManager';
import '../../styles/print.css';

// 🆕 移动端组件
import { useDevice } from '../../hooks/useDevice';
import { MobilePanelList } from './MobileIntegration';

export function StoryboardEditor() {
  const { chapterId } = useParams<{ chapterId: string }>();
  
  // 🆕 移动端状态
  const device = useDevice();
  const [showMobileAlert, setShowMobileAlert] = React.useState(true);

  // 1. 数据层
  const dataHooks = useStoryboardData({ chapterId });
  const { script, storyboard, setStoryboard, project, assets, handleSave } = dataHooks;

  // 2. UI 状态层
  const uiHooks = useStoryboardUI({ script, storyboard });
  const { 
    viewMode, 
    selectedPanels, 
    panelDensityMode,
    getFilteredPanels,
    handleSelectAll,
    handleClearSelection,
  } = uiHooks;

  // 3. 操作层
  const actionHooks = useStoryboardActions({
    storyboard,
    script,
    project,
    assets,
    onUpdateStoryboard: handleSave,
    onUpdateAssets: dataHooks.handleUpdateAssets,
    updatePanelStatus: uiHooks.updatePanelStatus,
  });

  // 4. 历史管理
  const historyHooks = useStoryboardHistory({
    storyboard,
    onSave: handleSave,
    autoSaveInterval: 30000,
  });

  // 5. 对话框管理
  const dialogHooks = useDialogManager();

  // 计算衍生数据
  const filteredPanels = useMemo(() => getFilteredPanels(), [getFilteredPanels]);
  const totalDuration = useMemo(
    () => filteredPanels.reduce((acc, p) => acc + (p.duration || 0), 0),
    [filteredPanels]
  );

  // 撤销/重做处理
  const handleUndo = useCallback(() => {
    const prev = historyHooks.undo();
    if (prev) {
      setStoryboard(prev);
      toast.success('已撤销');
    }
  }, [historyHooks, setStoryboard]);

  const handleRedo = useCallback(() => {
    const next = historyHooks.redo();
    if (next) {
      setStoryboard(next);
      toast.success('已重做');
    }
  }, [historyHooks, setStoryboard]);

  const handleManualSave = useCallback(async () => {
    if (storyboard) {
      const success = await historyHooks.saveAndMark(storyboard);
      if (success) toast.success('已保存');
    }
  }, [storyboard, historyHooks]);

  // 连续性检查
  const handleContinuityCheck = useCallback(() => {
    if (!storyboard?.panels?.length) {
      toast.warning('没有分镜可以检查');
      return;
    }
    
    const report = continuityChecker.checkAllPanels(storyboard.panels);
    
    if (report.issues.length === 0) {
      toast.success('✅ 未发现连贯性问题，分镜质量良好！');
    } else {
      toast.info(
        `发现 ${report.issues.length} 个问题（错误:${report.summary.errors} 警告:${report.summary.warnings}）`
      );
    }
    
    dialogHooks.openContinuity();
  }, [storyboard, dialogHooks]);

  // 键盘快捷键
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: () => {
      if (selectedPanels.size > 0) {
        actionHooks.handleBatchDelete(selectedPanels);
      }
    },
    onSelectAll: handleSelectAll,
    onEscape: handleClearSelection,
    onSave: handleManualSave,
    enabled: true,
  });

  // 构建 Context 值
  const contextValue = useMemo(() => ({
    // 数据
    storyboard,
    script,
    project,
    assets,
    
    // UI 状态
    viewMode: uiHooks.viewMode,
    selectedEpisode: uiHooks.selectedEpisode,
    panelDensityMode: uiHooks.panelDensityMode,
    selectedPanels: uiHooks.selectedPanels,
    panelStatuses: uiHooks.panelStatuses,
    filteredPanels,
    
    // 对话框状态
    showResourceSidebar: dialogHooks.showResourceSidebar,
    showPreviewDialog: dialogHooks.showPreviewDialog,
    showHistoryDialog: dialogHooks.showHistoryDialog,
    showContinuityDialog: dialogHooks.showContinuityDialog,
    
    // 操作方法
    setViewMode: uiHooks.setViewMode,
    setSelectedEpisode: uiHooks.setSelectedEpisode,
    setPanelDensityMode: uiHooks.setPanelDensityMode,
    setShowResourceSidebar: dialogHooks.setShowResourceSidebar,
    setShowPreviewDialog: (show: boolean) => show ? dialogHooks.openPreview() : dialogHooks.closeDialog(),
    setShowHistoryDialog: (show: boolean) => show ? dialogHooks.openHistory() : dialogHooks.closeDialog(),
    
    // 分镜操作
    handleUpdatePanel: dataHooks.handleUpdatePanel,
    handleDeletePanel: dataHooks.handleDeletePanel,
    handleAddPanel: dataHooks.handleAddPanel,
    handleCopyPanel: actionHooks.handleCopyPanel,
    handleSplitPanel: actionHooks.handleSplitPanel,
    
    // 选择操作
    handleToggleSelect: uiHooks.handleToggleSelect,
    handleSelectAll,
    handleClearSelection,
    
    // 批量操作
    handleBatchDelete: actionHooks.handleBatchDelete,
    handleBatchApplyParams: actionHooks.handleBatchApplyParams,
    
    // 生成操作
    handleGenerateImage: actionHooks.handleGenerateImage,
    handleGeneratePrompts: actionHooks.handleGeneratePrompts,
    handleGenerateAllImages: actionHooks.handleGenerateAllImages,
    
    // 导出操作
    handleExportStoryboard: actionHooks.handleExportStoryboard,
    handleExportPrompts: actionHooks.handleExportPrompts,
    handleExportPDF: actionHooks.handleExportPDF,
    
    // 其他操作
    handleSave: handleManualSave,
    handleUndo,
    handleRedo,
    handleContinuityCheck,
    
    // 状态查询
    canUndo: historyHooks.canUndo,
    canRedo: historyHooks.canRedo,
    isDirty: historyHooks.isDirty,
    totalDuration,
    estimatedPanelCount: uiHooks.getEstimatedPanelCount(),
  }), [
    storyboard, script, project, assets,
    uiHooks, dialogHooks, dataHooks, actionHooks, historyHooks,
    filteredPanels, totalDuration,
    handleUndo, handleRedo, handleManualSave, handleContinuityCheck,
    handleSelectAll, handleClearSelection, selectedPanels,
  ]);

  // 加载状态
  if (!script) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        正在加载剧本数据...
      </div>
    );
  }

  return (
    <StoryboardProvider value={contextValue}>
      <div className="min-h-screen bg-gray-50/50 pb-32 flex flex-col">
        {/* 顶栏 */}
        <div className="sticky top-[64px] z-40 bg-white border-b shadow-sm">
          <StoryboardHeader
            viewMode={viewMode as any}
            setViewMode={uiHooks.setViewMode as any}
            selectedEpisode={uiHooks.selectedEpisode}
            setSelectedEpisode={uiHooks.setSelectedEpisode}
            allEpisodes={uiHooks.allEpisodes}
            panelDensityMode={panelDensityMode}
            setPanelDensityMode={uiHooks.setPanelDensityMode}
            estimatedPanelCount={uiHooks.getEstimatedPanelCount()}
            isExtracting={uiHooks.isExtracting}
            script={script}
            storyboard={storyboard}
            filteredPanelsCount={filteredPanels.length}
            handleAIExtractByEpisode={(ep) => dataHooks.handleAIExtractByEpisode(
              ep,
              panelDensityMode,
              () => uiHooks.setIsExtracting(true),
              () => uiHooks.setIsExtracting(false)
            )}
            handleBatchRegeneratePrompts={async () => {
              await actionHooks.handleBatchRegeneratePrompts(
                selectedPanels,
                uiHooks.enablePromptOptimization,
                (curr: number, tot: number) => uiHooks.setBatchProgress({ current: curr, total: tot }),
                () => uiHooks.setBatchProgress(null)
              );
            }}
            handleExportStoryboard={actionHooks.handleExportStoryboard}
            handleExportPDF={actionHooks.handleExportPDF}
            handleExportPrompts={actionHooks.handleExportPrompts}
            handleSave={handleManualSave}
            loadVersions={dataHooks.loadVersions}
            setShowHistoryDialog={dialogHooks.openHistory}
            onSyncToAssetLibrary={actionHooks.handleSyncToAssetLibrary}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={dialogHooks.toggleResourceSidebar}
              title={dialogHooks.showResourceSidebar ? "收起资源库" : "展开资源库"}
            >
              {dialogHooks.showResourceSidebar ? 
                <PanelRightClose className="w-4 h-4" /> : 
                <PanelRightOpen className="w-4 h-4" />
              }
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleContinuityCheck}
              title="检查分镜连贯性"
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              连贯性检查
            </Button>
          </StoryboardHeader>
        </div>

        {/* 主内容区 */}
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 px-6 py-8 min-w-0 overflow-y-auto">
            {/* 🆕 移动端适配 */}
            {device.isMobile ? (
              <MobilePanelList
                panels={filteredPanels}
                selectedPanels={selectedPanels}
                panelStatuses={uiHooks.panelStatuses}
                onToggleSelect={uiHooks.handleToggleSelect}
                onUpdatePanel={(id, params) => actionHooks.handleUpdatePanel(id, params)}
                onDeletePanel={(id) => actionHooks.handleDeletePanel(id)}
                onGenerateImage={(panel) => actionHooks.handleGenerateImage(panel)}
                onCopyPanel={(panel) => actionHooks.handleCopyPanel(panel)}
                onGeneratePrompts={(panel) => actionHooks.handleGeneratePrompts(panel)}
                showAlert={showMobileAlert}
                onDismissAlert={() => setShowMobileAlert(false)}
              />
            ) : (
              <>
                {viewMode === 'grid' && <GridView panels={filteredPanels} useVirtualScroll />}
                {viewMode === 'list' && <ListView panels={filteredPanels} />}
                {viewMode === 'timeline' && (
                  <TimelineView
                    panels={filteredPanels}
                    selectedPanels={selectedPanels}
                    onToggleSelect={uiHooks.handleToggleSelect}
                    renderListView={() => <ListView panels={filteredPanels} />}
                  />
                )}
              </>
            )}
          </main>

          {/* 右侧资源库 */}
          {dialogHooks.showResourceSidebar && <ResourceSidebar assets={assets} />}
        </div>

        {/* 底部操作条 */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
          <div className="w-full px-6 pointer-events-auto">
            <BatchActionBar
              filteredPanelsCount={filteredPanels.length}
              totalDuration={totalDuration}
              selectedPanelsSize={selectedPanels.size}
              selectedEpisode={uiHooks.selectedEpisode}
              handleSelectAll={handleSelectAll}
              handleBatchDelete={() => actionHooks.handleBatchDelete(selectedPanels)}
              handleBatchApplyParams={(params) => actionHooks.handleBatchApplyParams(selectedPanels, params)}
              handleGenerateAllImages={actionHooks.handleGenerateAllImages}
              handleAddPanel={dataHooks.handleAddPanel}
              handleApplyTemplate={dataHooks.handleApplyTemplate}
              handleRefreshAllPrompts={async () => {
                const allIds = new Set(filteredPanels.map(p => p.id));
                await actionHooks.handleBatchRegeneratePrompts(
                  allIds,
                  uiHooks.enablePromptOptimization,
                  (curr, tot) => uiHooks.setBatchProgress({ current: curr, total: tot }),
                  () => uiHooks.setBatchProgress(null)
                );
              }}
              onPreview={dialogHooks.openPreview}
              isGeneratingAll={uiHooks.isGeneratingAll}
              batchProgress={uiHooks.batchProgress}
              filteredPanelIds={filteredPanels.map(p => p.id)}
              onCancelGeneration={() => {
                actionHooks.cancelAllTasks();
                uiHooks.setIsGeneratingAll(false);
                uiHooks.setBatchProgress(null);
              }}
              onRetryFailed={() => {
                uiHooks.setIsGeneratingAll(true);
                actionHooks.retryFailedTasks();
              }}
              failedCount={actionHooks.getQueueStats().failed}
            />
          </div>
        </div>

        {/* 对话框 */}
        <VersionHistoryDialog
          open={dialogHooks.showHistoryDialog}
          onOpenChange={(open) => open ? dialogHooks.openHistory() : dialogHooks.closeDialog()}
          versions={dataHooks.versions}
          onRestore={dataHooks.handleRestoreVersion}
          onDelete={dataHooks.handleDeleteVersion}
          onSave={dataHooks.handleSaveVersion}
          onLoadVersions={dataHooks.loadVersions}
        />

        <PreviewDialog
          open={dialogHooks.showPreviewDialog}
          onOpenChange={(open) => open ? dialogHooks.openPreview() : dialogHooks.closeDialog()}
          panels={filteredPanels}
        />

        {/* 打印模板 */}
        <StoryboardPrintTemplate
          panels={filteredPanels}
          project={project || undefined}
          title={project?.title}
        />
      </div>
    </StoryboardProvider>
  );
}
