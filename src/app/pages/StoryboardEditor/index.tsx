/**
 * 分镜编辑器 - 重构版
 * 使用 Context 和组件拆分，降低复杂度
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PanelRightOpen, PanelRightClose, CheckCircle2, Sparkles, Loader2, Eye } from 'lucide-react';
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
import { ContinuityReportDialog } from './components/ContinuityReportDialog';
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

// 🆕 质量报告系统
import { QualityReportSidebar } from '../../components/storyboard/QualityReportSidebar';
import { qualityChecker } from '../../utils/ai/qualityChecker';
import type { QualityReport } from '../../utils/ai/qualityChecker';

// 🆕 提示词预览
import { PromptPreviewDialog } from '../../components/storyboard/PromptPreviewDialog';
import type { StoryboardPanel } from '../../types';

export function StoryboardEditor() {
  const { chapterId } = useParams<{ chapterId: string }>();
  
  // 🆕 移动端状态
  const device = useDevice();
  const [showMobileAlert, setShowMobileAlert] = useState(true);

  // 🆕 质量报告状态
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [showQualityReport, setShowQualityReport] = useState(false);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);

  // 🆕 连贯性报告状态
  const [continuityReport, setContinuityReport] = useState<any>(null);

  // 🆕 提示词预览状态
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [selectedPanelForPrompt, setSelectedPanelForPrompt] = useState<StoryboardPanel | null>(null);

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

  // 🆕 质量检查
  const handleQualityCheck = useCallback(async () => {
    if (!storyboard?.panels?.length) {
      toast.warning('没有分镜可以检查');
      return;
    }
    
    setIsCheckingQuality(true);
    try {
      const report = await qualityChecker.checkStoryboard(storyboard.panels, {
        checkContinuity: true,
        checkDuration: true,
        checkCharacter: true,
        checkShot: true,
        checkDialogue: true,
        checkLogic: true,
      });
      
      setQualityReport(report);
      setShowQualityReport(true);
      
      if (report.totalIssues === 0) {
        toast.success('✅ 未发现质量问题，分镜质量优秀！');
      } else {
        toast.info(
          `发现 ${report.totalIssues} 个问题（错误:${report.summary.errorCount} 警告:${report.summary.warningCount}）`
        );
      }
    } catch (error) {
      console.error('质量检查失败:', error);
      toast.error('质量检查失败');
    } finally {
      setIsCheckingQuality(false);
    }
  }, [storyboard]);

  // 连续性检查
  const handleContinuityCheck = useCallback(() => {
    if (!storyboard?.panels?.length) {
      toast.warning('没有分镜可以检查');
      return;
    }
    
    const report = continuityChecker.checkAllPanels(storyboard.panels);
    setContinuityReport(report);
    
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
    handleMovePanel: dataHooks.movePanel, // 🆕 拖拽排序
    
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
    handleQualityCheck, // 🆕
    handleOpenPromptPreview: (panel: StoryboardPanel) => { // 🆕
      setSelectedPanelForPrompt(panel);
      setShowPromptPreview(true);
    },
    
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
    handleQualityCheck, // 🆕
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
              // 🆕 优化：如果有选中的分镜，只刷新选中的；否则刷新全部
              const idsToRefresh = selectedPanels.size > 0 
                ? selectedPanels 
                : new Set(filteredPanels.map(p => p.id));
              
              await actionHooks.handleBatchRegeneratePrompts(
                idsToRefresh,
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
            onQualityCheck={handleQualityCheck}
            qualityScore={qualityReport?.summary.qualityScore}
            isCheckingQuality={isCheckingQuality}
            selectedPanelsCount={selectedPanels.size}
            enablePromptOptimization={uiHooks.enablePromptOptimization}
            onTogglePromptOptimization={uiHooks.setEnablePromptOptimization}
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
                    onMovePanel={(fromIndex, toIndex) => {
                      const fromPanel = filteredPanels[fromIndex];
                      const toPanel = filteredPanels[toIndex];
                      if (fromPanel && toPanel && dataHooks.movePanel) {
                        dataHooks.movePanel(fromPanel.id, toPanel.id);
                      }
                    }}
                    renderListView={() => <ListView panels={filteredPanels} />}
                  />
                )}
              </>
            )}
          </main>

          {/* 右侧资源库 */}
          <ResourceSidebar 
            assets={assets} 
            open={dialogHooks.showResourceSidebar}
            onOpenChange={dialogHooks.setShowResourceSidebar}
          />

          {/* 🆕 质量报告侧边栏 */}
          {showQualityReport && qualityReport && (
            <QualityReportSidebar
              report={qualityReport}
              onClose={() => setShowQualityReport(false)}
              onRefresh={handleQualityCheck}
              onIssueClick={(issue) => {
                // 跳转到对应分镜
                const panel = storyboard?.panels.find(p => p.id === issue.panelId);
                if (panel) {
                  const element = document.querySelector(`[data-panel-id="${panel.id}"]`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              onOptimize={async (selectedIssues) => {
                // 🆕 使用真实的优化功能
                return await actionHooks.handleOptimizeIssues(selectedIssues);
              }}
              isRefreshing={isCheckingQuality}
              projectId={project?.id}
            />
          )}
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
                // 🆕 优化：智能刷新逻辑
                const idsToRefresh = selectedPanels.size > 0
                  ? selectedPanels
                  : new Set(filteredPanels.map(p => p.id));
                
                await actionHooks.handleBatchRegeneratePrompts(
                  idsToRefresh,
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

        {/* 🆕 连贯性检查对话框 */}
        <ContinuityReportDialog
          open={dialogHooks.showContinuityDialog}
          onOpenChange={(open) => open ? dialogHooks.openContinuity() : dialogHooks.closeDialog()}
          report={continuityReport}
          onIssueClick={(issue) => {
            // 跳转到对应分镜
            const element = document.querySelector(`[data-panel-id="${issue.panelId}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />

        {/* 🆕 提示词预览对话框 */}
        {showPromptPreview && selectedPanelForPrompt && (
          <PromptPreviewDialog
            open={showPromptPreview}
            onOpenChange={setShowPromptPreview}
            panel={selectedPanelForPrompt}
            characters={assets?.characters || []}
            scenes={assets?.scenes || []}
            directorStyle={project?.directorStyle}
            onUpdate={(params) => {
              dataHooks.handleUpdatePanel(selectedPanelForPrompt.id, params);
              setShowPromptPreview(false);
            }}
          />
        )}

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
