/**
 * 剧本编辑器移动端集成组件
 */
import React, { useState } from 'react';
import { MobileSceneCard } from '../../components/script/MobileSceneCard';
import { MobileSceneEditor } from '../../components/script/MobileSceneEditor';
import { MobileAlert } from '../../components/MobileAlert';
import { useDevice } from '../../hooks/useDevice';
import type { ScriptScene } from '../../types';

export interface MobileScriptEditorProps {
  scenes: ScriptScene[];
  onUpdateScene: (index: number, scene: ScriptScene) => void;
  onDeleteScene: (index: number) => void;
  showAlert?: boolean;
  onDismissAlert?: () => void;
}

/**
 * 移动端剧本场景列表
 */
export function MobileScriptEditor({
  scenes,
  onUpdateScene,
  onDeleteScene,
  showAlert = true,
  onDismissAlert,
}: MobileScriptEditorProps) {
  const device = useDevice();
  const [editingScene, setEditingScene] = useState<{ scene: ScriptScene; index: number } | null>(null);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);

  // 桌面端不渲染
  if (device.isDesktop) return null;

  const handleEdit = (scene: ScriptScene, index: number) => {
    setEditingScene({ scene, index });
    setMobileEditorOpen(true);
  };

  const handleUpdate = (scene: ScriptScene) => {
    if (editingScene) {
      onUpdateScene(editingScene.index, scene);
    }
  };

  return (
    <>
      {/* 移动端提示 */}
      {showAlert && (
        <MobileAlert 
          page="script"
          onDismiss={onDismissAlert}
        />
      )}

      {/* 场景列表 */}
      <div className="space-y-4">
        {scenes.map((scene, index) => (
          <MobileSceneCard
            key={index}
            scene={scene}
            sceneNumber={index + 1}
            onEdit={() => handleEdit(scene, index)}
            onDelete={() => onDeleteScene(index)}
          />
        ))}
      </div>

      {/* 全屏编辑器 */}
      {editingScene && (
        <MobileSceneEditor
          scene={editingScene.scene}
          sceneNumber={editingScene.index + 1}
          open={mobileEditorOpen}
          onClose={() => {
            setMobileEditorOpen(false);
            setEditingScene(null);
          }}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}

export default MobileScriptEditor;
