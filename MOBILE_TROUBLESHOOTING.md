# 移动端集成问题排查指南

## 🔍 500 错误排查

如果遇到 500 Internal Server Error，请按以下步骤排查：

---

## 快速修复步骤

### 1. 检查开发服务器

```bash
# 停止当前服务器
Ctrl + C

# 清理缓存并重启
npm run dev
# 或
yarn dev
```

### 2. 检查浏览器控制台

打开浏览器开发者工具（F12），查看：
- Console 标签：查看具体错误信息
- Network 标签：查看哪个请求返回 500

### 3. 常见问题和解决方案

#### 问题 1：类型不匹配

**症状：** TypeScript 编译错误

**解决方案：**
```typescript
// 如果 Scene 类型不匹配，临时注释掉移动端代码
// src/app/pages/ScriptEditor/index.tsx

// 临时注释这部分
/*
{device.isMobile ? (
  <MobileScriptEditor ... />
) : (
  <ScriptEditorSceneList ... />
)}
*/

// 改回原来的代码
<ScriptEditorSceneList
  scenes={filteredScenes}
  viewMode={viewMode}
  batchMode={batchMode}
  selectedScenes={selectedScenes}
  onToggleSelection={toggleSceneSelection}
  onUpdateScene={handleUpdateScene}
  onDeleteScene={handleDeleteScene}
  onAddDialogue={handleAddDialogue}
  onUpdateDialogue={handleUpdateDialogue}
  onDeleteDialogue={handleDeleteDialogue}
  onMoveScene={handleMoveScene}
  formatSceneHeading={formatSceneHeading}
/>
```

#### 问题 2：导入路径错误

**检查导入：**
```typescript
// 确保这些导入存在
import { useDevice } from '../../hooks/useDevice';
import { MobileScriptEditor } from './MobileIntegration';
import { MobilePanelList } from './MobileIntegration';
import { MobileAlert } from '../../components/MobileAlert';
```

#### 问题 3：组件未导出

**检查导出：**
```typescript
// src/app/pages/ScriptEditor/MobileIntegration.tsx
export function MobileScriptEditor({ ... }) { ... }
export default MobileScriptEditor;

// src/app/pages/StoryboardEditor/MobileIntegration.tsx
export function MobilePanelList({ ... }) { ... }
export default MobilePanelList;
```

---

## 🛠️ 临时回退方案

如果移动端集成导致问题，可以临时回退：

### 回退剧本编辑器

```typescript
// src/app/pages/ScriptEditor/index.tsx

// 1. 注释掉导入
// import { useDevice } from '../../hooks/useDevice';
// import { MobileScriptEditor } from './MobileIntegration';

// 2. 注释掉状态
// const device = useDevice();
// const [showMobileAlert, setShowMobileAlert] = useState(true);

// 3. 移除条件渲染，恢复原代码
<ScriptEditorSceneList
  scenes={filteredScenes}
  viewMode={viewMode}
  batchMode={batchMode}
  selectedScenes={selectedScenes}
  onToggleSelection={toggleSceneSelection}
  onUpdateScene={handleUpdateScene}
  onDeleteScene={handleDeleteScene}
  onAddDialogue={handleAddDialogue}
  onUpdateDialogue={handleUpdateDialogue}
  onDeleteDialogue={handleDeleteDialogue}
  onMoveScene={handleMoveScene}
  formatSceneHeading={formatSceneHeading}
/>
```

### 回退分镜编辑器

```typescript
// src/app/pages/StoryboardEditor/index.refactored.tsx

// 1. 注释掉导入
// import { useDevice } from '../../hooks/useDevice';
// import { MobilePanelList } from './MobileIntegration';

// 2. 注释掉状态
// const device = useDevice();
// const [showMobileAlert, setShowMobileAlert] = React.useState(true);

// 3. 移除条件渲染，恢复原代码
<main className="flex-1 px-6 py-8 min-w-0 overflow-y-auto">
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
</main>
```

### 回退资源库

```typescript
// src/app/pages/AssetLibrary/index.tsx

// 1. 注释掉导入
// import { useDevice } from '../../hooks/useDevice';
// import { MobileAlert } from '../../components/MobileAlert';

// 2. 注释掉状态
// const device = useDevice();
// const [showMobileAlert, setShowMobileAlert] = useState(true);

// 3. 移除移动端提示
return (
  <div className="space-y-6 pb-20">
    {/* 注释掉这部分
    {device.isMobile && showMobileAlert && (
      <div className="px-4">
        <MobileAlert 
          page="assets"
          onDismiss={() => setShowMobileAlert(false)}
        />
      </div>
    )}
    */}
    <AssetLibraryHeader ... />
    ...
  </div>
);
```

---

## 🔧 完整回退脚本

如果需要完全回退所有移动端集成，可以使用 Git：

```bash
# 查看修改的文件
git status

# 回退特定文件
git checkout src/app/pages/ScriptEditor/index.tsx
git checkout src/app/pages/StoryboardEditor/index.refactored.tsx
git checkout src/app/pages/AssetLibrary/index.tsx

# 或者回退所有修改
git reset --hard HEAD
```

---

## 📋 检查清单

在排查问题时，请检查：

- [ ] 开发服务器是否正常运行
- [ ] 浏览器控制台是否有错误信息
- [ ] Network 标签中哪个请求返回 500
- [ ] TypeScript 是否有编译错误
- [ ] 所有导入路径是否正确
- [ ] 所有组件文件是否存在
- [ ] 类型定义是否匹配

---

## 🆘 获取帮助

如果问题仍然存在，请提供：

1. **完整的错误信息**（从浏览器控制台复制）
2. **Network 标签截图**（显示 500 错误的请求）
3. **终端输出**（开发服务器的错误信息）

这样可以更快地定位和解决问题。

---

## ✅ 验证修复

修复后，请验证：

1. **桌面端**：在正常浏览器窗口中测试
   - [ ] 剧本编辑器正常工作
   - [ ] 分镜编辑器正常工作
   - [ ] 资源库正常工作

2. **移动端**：在开发者工具的设备模式中测试
   - [ ] 切换到 iPhone 12 Pro
   - [ ] 剧本编辑器显示移动端界面
   - [ ] 分镜编辑器显示移动端界面
   - [ ] 资源库显示移动端提示

---

**注意：** 移动端组件是可选的增强功能。如果遇到问题，可以先回退到桌面端版本，确保基本功能正常，然后再逐步调试移动端功能。
