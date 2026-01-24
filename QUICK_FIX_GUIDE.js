/**
 * 临时禁用移动端功能的快速修复
 * 如果遇到 500 错误，使用这个文件替换对应的集成文件
 */

// ============================================
// 方案 1: 剧本编辑器快速修复
// ============================================
// 文件: src/app/pages/ScriptEditor/index.tsx
// 找到这段代码并注释掉：

/*
// 🆕 移动端组件
import { useDevice } from '../../hooks/useDevice';
import { MobileScriptEditor } from './MobileIntegration';
*/

// 找到这段代码并注释掉：

/*
// 🆕 移动端状态
const device = useDevice();
const [showMobileAlert, setShowMobileAlert] = useState(true);
*/

// 找到这段代码：
/*
{device.isMobile ? (
  <MobileScriptEditor
    scenes={filteredScenes}
    onUpdateScene={(index, scene) => {
      const targetScene = filteredScenes[index];
      if (targetScene) handleUpdateScene(targetScene.id, scene);
    }}
    onDeleteScene={(index) => {
      const targetScene = filteredScenes[index];
      if (targetScene) handleDeleteScene(targetScene.id);
    }}
    showAlert={showMobileAlert}
    onDismissAlert={() => setShowMobileAlert(false)}
  />
) : (
  <ScriptEditorSceneList ... />
)}
*/

// 替换为：
/*
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
*/

// ============================================
// 方案 2: 分镜编辑器快速修复
// ============================================
// 文件: src/app/pages/StoryboardEditor/index.refactored.tsx
// 找到并注释掉移动端导入和状态
// 然后恢复原来的视图渲染代码

// ============================================
// 方案 3: 资源库快速修复
// ============================================
// 文件: src/app/pages/AssetLibrary/index.tsx
// 只需注释掉移动端提示部分即可

console.log('请根据上面的说明修改对应文件');
