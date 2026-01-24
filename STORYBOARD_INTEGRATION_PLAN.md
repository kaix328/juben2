# 分镜编辑器功能集成详细计划

## 📋 总览

**检查完成时间**: 2026-01-24  
**发现缺失功能**: 6 个主要功能  
**推荐集成方案**: 方案 2 - 完整集成所有功能

---

## 🎯 集成优先级

### ✅ 已确认的组件状态

| 组件 | 文件存在 | 依赖完整 | 状态 |
|------|---------|---------|------|
| QualityReportSidebar | ✅ | ✅ | 可集成 |
| QualityReportPanel | ✅ | ✅ | 可集成 |
| QualityIssueList | ✅ | ✅ | 可集成 |
| AutoOptimizeButton | ✅ | ✅ | 可集成 |
| PromptPreviewDialog | ✅ | ✅ | 可集成 |
| DraggablePanelList | ✅ | ✅ | 可集成 |
| QualityAnalyticsPanel | ✅ | ✅ | 已在质量报告中 |
| ContinuityReportDialog | ❌ | ⚠️ | 需创建 |

---

## 📝 详细集成步骤

### 第 1 步: 质量报告系统集成 (核心功能)

#### 1.1 导入组件和工具
```typescript
// 在 StoryboardEditor/index.tsx 顶部添加
import { QualityReportSidebar } from '../../components/storyboard/QualityReportSidebar';
import { qualityChecker } from '../../utils/ai/qualityChecker';
import type { QualityReport } from '../../utils/ai/qualityChecker';
```

#### 1.2 添加状态管理
```typescript
// 在 StoryboardEditor 组件中添加
const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
const [showQualityReport, setShowQualityReport] = useState(false);
const [isCheckingQuality, setIsCheckingQuality] = useState(false);
```

#### 1.3 实现质量检查函数
```typescript
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
```

#### 1.4 添加质量检查按钮
```typescript
// 在 StoryboardHeader 的 children 中添加
<Button
  variant="outline"
  size="sm"
  onClick={handleQualityCheck}
  disabled={isCheckingQuality}
  title="AI 质量检查"
  className="gap-2"
>
  {isCheckingQuality ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <Sparkles className="w-4 h-4" />
  )}
  质量检查
</Button>
```

#### 1.5 渲染质量报告侧边栏
```typescript
// 在主内容区的右侧资源库之后添加
{showQualityReport && qualityReport && (
  <QualityReportSidebar
    report={qualityReport}
    onClose={() => setShowQualityReport(false)}
    onRefresh={handleQualityCheck}
    onIssueClick={(issue) => {
      // 跳转到对应分镜
      const panel = storyboard?.panels.find(p => p.id === issue.panelId);
      if (panel) {
        // 滚动到对应分镜
        const element = document.querySelector(`[data-panel-id="${panel.id}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }}
    onOptimize={async (selectedIssues) => {
      // 调用优化功能（第 3 步实现）
      return actionHooks.handleOptimizeIssues(selectedIssues);
    }}
    isRefreshing={isCheckingQuality}
    projectId={project?.id}
  />
)}
```

---

### 第 2 步: 连贯性检查对话框

#### 2.1 创建 ContinuityReportDialog 组件
```typescript
// 创建 src/app/pages/StoryboardEditor/components/ContinuityReportDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import type { ContinuityReport, ContinuityIssue } from '../../../utils/continuityChecker';

interface ContinuityReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ContinuityReport | null;
  onIssueClick?: (issue: ContinuityIssue) => void;
}

export function ContinuityReportDialog({
  open,
  onOpenChange,
  report,
  onIssueClick,
}: ContinuityReportDialogProps) {
  if (!report) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            连贯性检查报告
          </DialogTitle>
          <DialogDescription>
            检查了 {report.checkedPanels} 个分镜，发现 {report.issues.length} 个问题
          </DialogDescription>
        </DialogHeader>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-700">错误</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{report.summary.errors}</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-700">警告</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{report.summary.warnings}</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">提示</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{report.summary.infos}</div>
          </div>
        </div>

        {/* 问题列表 */}
        <ScrollArea className="h-[400px] pr-4">
          {report.issues.length > 0 ? (
            <div className="space-y-2">
              {report.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    onIssueClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                  onClick={() => onIssueClick?.(issue)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {issue.ruleName}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          分镜 #{issue.panelNumber}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {issue.message}
                      </p>
                      {issue.suggestion && (
                        <p className="text-xs text-gray-600">💡 {issue.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
              <p>未发现连贯性问题 🎉</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
```

#### 2.2 集成到 StoryboardEditor
```typescript
// 导入组件
import { ContinuityReportDialog } from './components/ContinuityReportDialog';

// 添加状态
const [continuityReport, setContinuityReport] = useState<ContinuityReport | null>(null);

// 更新 handleContinuityCheck
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

// 渲染对话框
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
```

---

### 第 3 步: 一键优化功能

#### 3.1 在 useStoryboardActions 中添加优化函数
```typescript
// 在 src/app/pages/StoryboardEditor/hooks/useStoryboardActions.ts 中添加

import { autoOptimizer } from '../../../utils/ai/autoOptimizer';
import type { QualityIssue } from '../../../utils/ai/qualityChecker';
import type { OptimizationResult } from '../../../utils/ai/autoOptimizer';

// 在返回对象中添加
const handleOptimizeIssues = useCallback(async (
  selectedIssues: QualityIssue[]
): Promise<OptimizationResult[]> => {
  if (!storyboard?.panels) {
    return [];
  }

  const results: OptimizationResult[] = [];
  
  for (const issue of selectedIssues) {
    try {
      const panel = storyboard.panels.find(p => p.id === issue.panelId);
      if (!panel) continue;

      const result = await autoOptimizer.optimizeIssue(issue, panel, {
        characters,
        scenes,
        directorStyle: project?.directorStyle,
      });

      results.push(result);

      // 如果优化成功，更新分镜
      if (result.success && result.optimizedPanel) {
        await onUpdateStoryboard({
          ...storyboard,
          panels: storyboard.panels.map(p =>
            p.id === panel.id ? { ...p, ...result.optimizedPanel } : p
          ),
        });
      }
    } catch (error) {
      console.error('优化失败:', error);
      results.push({
        success: false,
        issueId: issue.id,
        error: error instanceof Error ? error.message : '优化失败',
      });
    }
  }

  return results;
}, [storyboard, characters, scenes, project, onUpdateStoryboard]);

// 返回
return {
  // ... 其他函数
  handleOptimizeIssues,
};
```

#### 3.2 在 StoryboardEditor 中使用
```typescript
// 在质量报告侧边栏的 onOptimize 回调中使用
onOptimize={async (selectedIssues) => {
  return await actionHooks.handleOptimizeIssues(selectedIssues);
}}
```

---

### 第 4 步: 提示词预览对话框

#### 4.1 导入组件
```typescript
import { PromptPreviewDialog } from '../../components/storyboard/PromptPreviewDialog';
```

#### 4.2 添加状态
```typescript
const [showPromptPreview, setShowPromptPreview] = useState(false);
const [selectedPanelForPrompt, setSelectedPanelForPrompt] = useState<StoryboardPanel | null>(null);
```

#### 4.3 添加到 Context
```typescript
// 在 contextValue 中添加
handleOpenPromptPreview: (panel: StoryboardPanel) => {
  setSelectedPanelForPrompt(panel);
  setShowPromptPreview(true);
},
```

#### 4.4 渲染对话框
```typescript
{/* 提示词预览对话框 */}
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
```

#### 4.5 在 ShotCard 中添加触发按钮
```typescript
// 在 src/app/components/storyboard/ShotCard.tsx 的操作按钮区域添加
<Button
  variant="ghost"
  size="sm"
  onClick={() => onOpenPromptPreview?.(panel)}
  title="预览提示词"
>
  <Eye className="w-4 h-4" />
  提示词
</Button>
```

---

### 第 5 步: 拖拽排序功能

#### 5.1 在 ListView 中使用 DraggablePanelList
```typescript
// 在 src/app/pages/StoryboardEditor/components/ListView.tsx 中

import { DraggablePanelList } from './DraggablePanelList';
import { useStoryboardContext } from '../context/StoryboardContext';

export function ListView({ panels }: ListViewProps) {
  const { handleMovePanel } = useStoryboardContext();

  return (
    <DraggablePanelList
      panels={panels}
      onMove={(fromIndex, toIndex) => {
        const fromPanel = panels[fromIndex];
        const toPanel = panels[toIndex];
        if (fromPanel && toPanel) {
          handleMovePanel(fromPanel.id, toPanel.id);
        }
      }}
      renderPanel={(panel, index, isDragging, isDragOver) => (
        <div
          data-panel-id={panel.id}
          className={`transition-opacity ${isDragging ? 'opacity-50' : ''}`}
        >
          <ShotCard
            panel={panel}
            // ... 其他 props
          />
        </div>
      )}
      className="space-y-4"
    />
  );
}
```

#### 5.2 在 useStoryboardData 中确保 movePanel 函数存在
```typescript
// 应该已经存在，如果没有则添加
const movePanel = useCallback((fromId: string, toId: string) => {
  if (!storyboard?.panels) return;

  const fromIndex = storyboard.panels.findIndex(p => p.id === fromId);
  const toIndex = storyboard.panels.findIndex(p => p.id === toId);

  if (fromIndex === -1 || toIndex === -1) return;

  const newPanels = [...storyboard.panels];
  const [movedPanel] = newPanels.splice(fromIndex, 1);
  newPanels.splice(toIndex, 0, movedPanel);

  // 重新编号
  newPanels.forEach((panel, index) => {
    panel.panelNumber = index + 1;
  });

  handleSave({ ...storyboard, panels: newPanels });
}, [storyboard, handleSave]);
```

---

### 第 6 步: 虚拟滚动优化（可选）

#### 6.1 检查 GridView 是否已使用虚拟滚动
```typescript
// 在 src/app/pages/StoryboardEditor/components/GridView.tsx 中
// 应该已经有 useVirtualScroll prop

// 如果需要优化，可以使用 VirtualStoryboardGrid 组件
import { VirtualStoryboardGrid } from '../../../components/storyboard/VirtualStoryboardGrid';

export function GridView({ panels, useVirtualScroll = true }: GridViewProps) {
  if (useVirtualScroll && panels.length > 50) {
    return <VirtualStoryboardGrid panels={panels} />;
  }

  // 普通渲染
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {panels.map(panel => (
        <ShotCard key={panel.id} panel={panel} />
      ))}
    </div>
  );
}
```

---

## 🔧 需要修改的文件清单

### 新建文件
- [ ] `src/app/pages/StoryboardEditor/components/ContinuityReportDialog.tsx`

### 修改文件
- [ ] `src/app/pages/StoryboardEditor/index.tsx` (主要集成)
- [ ] `src/app/pages/StoryboardEditor/hooks/useStoryboardActions.ts` (添加优化函数)
- [ ] `src/app/pages/StoryboardEditor/components/ListView.tsx` (添加拖拽)
- [ ] `src/app/pages/StoryboardEditor/components/GridView.tsx` (优化虚拟滚动)
- [ ] `src/app/components/storyboard/ShotCard.tsx` (添加提示词预览按钮)
- [ ] `src/app/pages/StoryboardEditor/context/StoryboardContext.tsx` (添加新的 context 方法)

---

## ⏱️ 预计时间

- **第 1 步**: 质量报告系统 - 20 分钟
- **第 2 步**: 连贯性检查对话框 - 15 分钟
- **第 3 步**: 一键优化功能 - 15 分钟
- **第 4 步**: 提示词预览对话框 - 10 分钟
- **第 5 步**: 拖拽排序功能 - 10 分钟
- **第 6 步**: 虚拟滚动优化 - 10 分钟

**总计**: 约 80 分钟（1小时20分钟）

---

## ✅ 集成后的功能清单

完成后，分镜编辑器将拥有：

1. ✅ **AI 质量检查** - 自动检测 6 大类问题
2. ✅ **连贯性检查** - 专业电影制作规则检查
3. ✅ **一键优化** - AI 自动修复问题
4. ✅ **提示词预览** - 多平台提示词生成和优化
5. ✅ **拖拽排序** - 直观的分镜重排
6. ✅ **虚拟滚动** - 大量分镜性能优化
7. ✅ **数据分析** - 质量趋势和历史对比

---

## 🚀 开始集成

准备好了吗？我将按照以上步骤逐一集成所有功能！
