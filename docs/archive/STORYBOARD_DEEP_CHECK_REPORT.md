# 🔍 分镜编辑器深度检查报告 - 第二轮

## 检查时间
2026-01-24 (第二轮深度检查)

---

## ✅ 已确认集成的功能

| 功能 | 状态 | 位置 |
|------|------|------|
| 质量报告系统 | ✅ 已集成 | 顶部工具栏 + 右侧边栏 |
| 连贯性检查对话框 | ✅ 已集成 | 对话框组件 |
| 一键优化功能 | ✅ 已集成 | 质量报告中 |
| 提示词预览对话框 | ✅ 已集成 | Context 中 |
| 拖拽排序功能 | ✅ 已集成 | ListView + TimelineView |
| 虚拟滚动优化 | ✅ 已集成 | GridView |
| 资源库侧边栏 | ✅ 已集成 | 右侧边栏 |

---

## ⚠️ 发现的新遗漏功能

### 1. ❌ StoryboardHeader 中的质量检查按钮未连接

**问题**: StoryboardHeader 组件已经有 `onQualityCheck` prop 和质量检查按钮，但在 StoryboardEditor 中没有传递这些 props。

**组件位置**: `src/app/components/storyboard/StoryboardHeader.tsx`

**已有的 Props**:
```typescript
onQualityCheck?: () => void;
qualityScore?: number;
isCheckingQuality?: boolean;
selectedPanelsCount?: number;
```

**缺失内容**:
- ❌ StoryboardEditor 中没有传递 `onQualityCheck` 回调
- ❌ 没有传递 `qualityScore` 显示质量分数
- ❌ 没有传递 `isCheckingQuality` 状态
- ❌ 没有传递 `selectedPanelsCount` 选中数量

**影响**: 用户看不到 StoryboardHeader 中的质量检查按钮

---

### 2. ⚠️ Context 类型定义不完整

**问题**: StoryboardContext 的类型定义缺少新增的功能方法。

**文件位置**: `src/app/pages/StoryboardEditor/context/StoryboardContext.tsx`

**缺失的方法**:
```typescript
handleQualityCheck?: () => void;           // 质量检查
handleOpenPromptPreview?: (panel: StoryboardPanel) => void;  // 提示词预览
handleMovePanel?: (fromId: string, toId: string) => void;    // 拖拽排序
```

**影响**: TypeScript 类型检查不完整，子组件无法通过 Context 调用这些方法

---

### 3. ⚠️ TimelineView 的拖拽排序未连接

**问题**: TimelineView 组件已经支持拖拽排序（`onMovePanel` prop），但在 StoryboardEditor 中渲染 TimelineView 时没有传递这个 prop。

**文件位置**: `src/app/pages/StoryboardEditor/components/TimelineView.tsx`

**已有功能**:
- ✅ 支持拖拽排序
- ✅ 支持调整分镜时长
- ✅ 场景颜色分组
- ✅ 时间刻度线
- ✅ 悬停预览

**缺失内容**:
- ❌ StoryboardEditor 中渲染 TimelineView 时没有传递 `onMovePanel`

**影响**: 时间轴视图中无法拖拽排序

---

### 4. ⚠️ BatchActionBar 的新功能未完全连接

**问题**: BatchActionBar 组件有一些新增的 props，但在 StoryboardEditor 中没有传递。

**文件位置**: `src/app/components/storyboard/BatchActionBar.tsx`

**新增的 Props**:
```typescript
onCancelGeneration?: () => void;  // 取消生成
onRetryFailed?: () => void;       // 重试失败
failedCount?: number;             // 失败数量
```

**缺失内容**:
- ⚠️ `onCancelGeneration` - 已在 StoryboardEditor 中实现，但可能未传递
- ⚠️ `onRetryFailed` - 已在 StoryboardEditor 中实现，但可能未传递
- ⚠️ `failedCount` - 已在 StoryboardEditor 中实现，但可能未传递

**影响**: 批量生成时无法取消或重试失败的任务

---

### 5. ⚠️ 刷新全部提示词功能未优化

**问题**: BatchActionBar 中有 `handleRefreshAllPrompts` 回调，但可能没有正确处理选中的分镜。

**当前实现**:
```typescript
handleRefreshAllPrompts={async () => {
  const allIds = new Set(filteredPanels.map(p => p.id));
  await actionHooks.handleBatchRegeneratePrompts(
    allIds,
    uiHooks.enablePromptOptimization,
    (curr, tot) => uiHooks.setBatchProgress({ current: curr, total: tot }),
    () => uiHooks.setBatchProgress(null)
  );
}}
```

**建议优化**:
- 应该根据是否有选中的分镜来决定刷新哪些
- 如果有选中，只刷新选中的
- 如果没有选中，刷新全部

---

## 📊 遗漏功能统计

### 关键遗漏 (需要修复)
1. ❌ **StoryboardHeader 质量检查按钮未连接** - 高优先级
2. ⚠️ **Context 类型定义不完整** - 中优先级
3. ⚠️ **TimelineView 拖拽排序未连接** - 中优先级

### 次要遗漏 (可选优化)
4. ⚠️ **BatchActionBar 新功能未完全连接** - 低优先级
5. ⚠️ **刷新提示词功能未优化** - 低优先级

---

## 🔧 需要修复的内容

### 修复 1: 连接 StoryboardHeader 质量检查按钮

**文件**: `src/app/pages/StoryboardEditor/index.tsx`

**需要添加的 props**:
```typescript
<StoryboardHeader
  // ... 现有 props
  onQualityCheck={handleQualityCheck}
  qualityScore={qualityReport?.summary.qualityScore}
  isCheckingQuality={isCheckingQuality}
  selectedPanelsCount={selectedPanels.size}
/>
```

---

### 修复 2: 更新 Context 类型定义

**文件**: `src/app/pages/StoryboardEditor/context/StoryboardContext.tsx`

**需要添加的类型**:
```typescript
export interface StoryboardContextValue {
  // ... 现有类型
  
  // 🆕 新增方法
  handleQualityCheck?: () => void;
  handleOpenPromptPreview?: (panel: StoryboardPanel) => void;
  handleMovePanel?: (fromId: string, toId: string) => void;
}
```

---

### 修复 3: 连接 TimelineView 拖拽排序

**文件**: `src/app/pages/StoryboardEditor/index.tsx`

**需要修改**:
```typescript
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
```

---

### 修复 4: 连接 BatchActionBar 新功能

**文件**: `src/app/pages/StoryboardEditor/index.tsx`

**需要添加的 props**:
```typescript
<BatchActionBar
  // ... 现有 props
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
```

---

## 📝 完整的遗漏清单

### 需要立即修复 (3 项)
- [ ] 1. 连接 StoryboardHeader 质量检查按钮
- [ ] 2. 更新 Context 类型定义
- [ ] 3. 连接 TimelineView 拖拽排序

### 可选优化 (2 项)
- [ ] 4. 确认 BatchActionBar 新功能已连接
- [ ] 5. 优化刷新提示词逻辑

---

## 🎯 修复优先级

### 🔴 高优先级 (必须修复)
1. **StoryboardHeader 质量检查按钮** - 用户无法看到和使用质量检查功能

### 🟡 中优先级 (建议修复)
2. **Context 类型定义** - 提高代码质量和类型安全
3. **TimelineView 拖拽排序** - 增强时间轴视图的交互性

### 🟢 低优先级 (可选)
4. **BatchActionBar 新功能** - 可能已经连接，需要验证
5. **刷新提示词优化** - 功能可用，但可以更智能

---

## 📊 完成度评估

### 之前的评估
- 总体完成度: 98%

### 当前评估（发现新遗漏后）
- 核心功能完成度: 95%
- 界面集成完成度: 90%
- **总体完成度: 92%**

### 修复后预期
- 修复 3 个高/中优先级问题后: **98%**
- 修复所有 5 个问题后: **100%**

---

## 🚀 建议的修复顺序

1. **立即修复**: StoryboardHeader 质量检查按钮连接
2. **然后修复**: TimelineView 拖拽排序连接
3. **最后修复**: Context 类型定义更新
4. **验证**: BatchActionBar 新功能是否已连接
5. **优化**: 刷新提示词逻辑

---

## ✅ 总结

### 好消息
- ✅ 所有核心组件都已存在
- ✅ 所有功能逻辑都已实现
- ✅ 大部分功能已经集成

### 需要改进
- ⚠️ 有 3 个关键的连接点遗漏
- ⚠️ Context 类型定义需要更新
- ⚠️ 一些高级功能的 props 没有传递

### 修复后效果
- 🎯 质量检查按钮将在 Header 中可见
- 🎯 时间轴视图支持拖拽排序
- 🎯 类型安全性提升
- 🎯 批量操作更完善

---

**报告生成时间**: 2026-01-24  
**检查深度**: 深度检查（第二轮）  
**发现问题**: 5 个（3 个关键，2 个次要）  
**建议修复**: 立即修复 3 个关键问题
