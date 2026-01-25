// ScriptEditor 场景列表组件
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SceneCard } from './SceneCard';
import { DraggableSceneCard } from './DraggableSceneCard';
import type { ScriptScene } from '../types';

interface ScriptEditorSceneListProps {
    scenes: ScriptScene[];
    viewMode: 'edit' | 'preview';
    batchMode: boolean;
    selectedScenes: Set<string>;
    onToggleSelection: (sceneId: string) => void;
    onUpdateScene: (sceneId: string, updates: Partial<ScriptScene>) => void;
    onDeleteScene: (sceneId: string) => void;
    onAddDialogue: (sceneId: string) => void;
    onUpdateDialogue: (sceneId: string, dialogueId: string, updates: any) => void;
    onDeleteDialogue: (sceneId: string, dialogueId: string) => void;
    onMoveScene: (dragIndex: number, hoverIndex: number) => void;
    formatSceneHeading: (scene: ScriptScene) => string;
}

export function ScriptEditorSceneList({
    scenes,
    viewMode,
    batchMode,
    selectedScenes,
    onToggleSelection,
    onUpdateScene,
    onDeleteScene,
    onAddDialogue,
    onUpdateDialogue,
    onDeleteDialogue,
    onMoveScene,
    formatSceneHeading,
}: ScriptEditorSceneListProps) {
    if (scenes.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">暂无场景</p>
                <p className="text-sm">点击"AI 提取剧本"或"添加场景"开始创作</p>
            </div>
        );
    }

    // 编辑模式 - 支持拖拽排序
    if (viewMode === 'edit') {
        return (
            <DndProvider backend={HTML5Backend}>
                <div className="space-y-4">
                    {scenes.map((scene, index) => (
                        <DraggableSceneCard
                            key={scene.id}
                            scene={scene}
                            index={index}
                            batchMode={batchMode}
                            isSelected={selectedScenes.has(scene.id)}
                            onToggleSelect={onToggleSelection}
                            onUpdate={onUpdateScene}
                            onDelete={onDeleteScene}
                            onAddDialogue={onAddDialogue}
                            onUpdateDialogue={onUpdateDialogue}
                            onDeleteDialogue={onDeleteDialogue}
                            onMove={onMoveScene}
                        />
                    ))}
                </div>
            </DndProvider>
        );
    }

    // 预览模式 - 只读展示
    return (
        <div className="space-y-6">
            {scenes.map((scene) => (
                <div key={scene.id} data-scene-number={scene.sceneNumber} className="border-b pb-6">
                    <h3 className="font-bold text-lg mb-2">
                        {formatSceneHeading(scene)}
                    </h3>
                    {scene.action && (
                        <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                            {scene.action}
                        </p>
                    )}
                    {scene.dialogues.map((dialogue, idx) => (
                        <div key={idx} className="mb-3">
                            <p className="font-semibold text-center mb-1">
                                {dialogue.character}
                            </p>
                            {dialogue.parenthetical && (
                                <p className="text-gray-600 text-center text-sm mb-1">
                                    ({dialogue.parenthetical})
                                </p>
                            )}
                            <p className="text-gray-800 text-center max-w-2xl mx-auto">
                                {dialogue.lines}
                            </p>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
