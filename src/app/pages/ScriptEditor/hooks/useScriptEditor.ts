/**
 * 剧本编辑操作 Hook
 * 负责场景和对白的增删改操作
 */
import { useCallback } from 'react';
import { generateId } from '../../../utils/storage';
import { toast } from 'sonner';
import type { Script, ScriptScene, Dialogue } from '../types';

interface UseScriptEditorOptions {
  script: Script | null;
  setScript: React.Dispatch<React.SetStateAction<Script | null>>;
  pushHistory: (script: Script, description: string) => void;
}

interface UseScriptEditorReturn {
  // 场景操作
  handleUpdateScene: (sceneId: string, updates: Partial<ScriptScene>) => void;
  handleAddScene: () => void;
  handleDeleteScene: (sceneId: string) => void;
  // 对白操作
  handleAddDialogue: (sceneId: string) => void;
  handleUpdateDialogue: (sceneId: string, dialogueId: string, updates: Partial<Dialogue>) => void;
  handleDeleteDialogue: (sceneId: string, dialogueId: string) => void;
  // 批量操作
  handleBatchUpdate: (sceneIds: Set<string>, updates: Partial<ScriptScene>) => void;
  handleBatchDelete: (sceneIds: Set<string>) => void;
  // 全量操作
  handleUpdateScript: (newScript: Script) => void;
  handleUpdateScenes: (newScenes: ScriptScene[]) => void;
}

/**
 * 剧本编辑操作 Hook
 * 
 * 功能：
 * 1. 场景的增删改
 * 2. 对白的增删改
 * 3. 批量操作
 * 4. 全量更新
 * 
 * @param script - 剧本数据
 * @param setScript - 设置剧本的方法
 * @param pushHistory - 推入历史记录的方法
 * @returns 各种编辑操作方法
 */
export function useScriptEditor({
  script,
  setScript,
  pushHistory,
}: UseScriptEditorOptions): UseScriptEditorReturn {
  
  /**
   * 更新场景
   */
  const handleUpdateScene = useCallback((sceneId: string, updates: Partial<ScriptScene>) => {
    setScript(prev => {
      if (!prev) return prev;
      const updatedScenes = prev.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      );
      return { ...prev, scenes: updatedScenes };
    });
  }, [setScript]);

  /**
   * 添加场景
   */
  const handleAddScene = useCallback(() => {
    setScript(prev => {
      if (!prev) return prev;

      const lastScene = prev.scenes[prev.scenes.length - 1];
      const episodeNumber = lastScene?.episodeNumber || 1;

      const newScene: ScriptScene = {
        id: generateId(),
        sceneNumber: prev.scenes.length + 1,
        episodeNumber,
        location: '新场景',
        timeOfDay: '白天',
        sceneType: 'INT',
        characters: [],
        action: '',
        dialogues: [],
        estimatedDuration: 0,
      };

      const newScript = { ...prev, scenes: [...prev.scenes, newScene] };
      pushHistory(newScript, '添加新场景');
      return newScript;
    });
  }, [setScript, pushHistory]);

  /**
   * 删除场景
   */
  const handleDeleteScene = useCallback((sceneId: string) => {
    setScript(prev => {
      if (!prev) return prev;
      const filtered = prev.scenes.filter(s => s.id !== sceneId);
      const newScript = { ...prev, scenes: filtered };
      pushHistory(newScript, '删除场景');
      return newScript;
    });
  }, [setScript, pushHistory]);

  /**
   * 添加对白
   */
  const handleAddDialogue = useCallback((sceneId: string) => {
    setScript(prev => {
      if (!prev) return prev;
      const updatedScenes = prev.scenes.map(scene => {
        if (scene.id === sceneId) {
          const newDialogue: Dialogue = {
            id: generateId(),
            character: '角色名',
            lines: '',
          };
          return { ...scene, dialogues: [...scene.dialogues, newDialogue] };
        }
        return scene;
      });
      return { ...prev, scenes: updatedScenes };
    });
  }, [setScript]);

  /**
   * 更新对白
   */
  const handleUpdateDialogue = useCallback((sceneId: string, dialogueId: string, updates: Partial<Dialogue>) => {
    setScript(prev => {
      if (!prev) return prev;
      const updatedScenes = prev.scenes.map(scene => {
        if (scene.id === sceneId) {
          const updatedDialogues = scene.dialogues.map(d =>
            d.id === dialogueId ? { ...d, ...updates } : d
          );
          return { ...scene, dialogues: updatedDialogues };
        }
        return scene;
      });
      return { ...prev, scenes: updatedScenes };
    });
  }, [setScript]);

  /**
   * 删除对白
   */
  const handleDeleteDialogue = useCallback((sceneId: string, dialogueId: string) => {
    setScript(prev => {
      if (!prev) return prev;
      const updatedScenes = prev.scenes.map(scene => {
        if (scene.id === sceneId) {
          return { ...scene, dialogues: scene.dialogues.filter(d => d.id !== dialogueId) };
        }
        return scene;
      });
      return { ...prev, scenes: updatedScenes };
    });
  }, [setScript]);

  /**
   * 批量更新场景
   */
  const handleBatchUpdate = useCallback((sceneIds: Set<string>, updates: Partial<ScriptScene>) => {
    setScript(prev => {
      if (!prev || sceneIds.size === 0) return prev;

      const updatedScenes = prev.scenes.map(scene =>
        sceneIds.has(scene.id) ? { ...scene, ...updates } : scene
      );
      const newScript = { ...prev, scenes: updatedScenes };
      pushHistory(newScript, `批量更新 ${sceneIds.size} 个场景`);
      toast.success(`已批量更新 ${sceneIds.size} 个场景`);
      return newScript;
    });
  }, [setScript, pushHistory]);

  /**
   * 批量删除场景
   */
  const handleBatchDelete = useCallback((sceneIds: Set<string>) => {
    setScript(prev => {
      if (!prev || sceneIds.size === 0) return prev;

      const filtered = prev.scenes.filter(s => !sceneIds.has(s.id));
      const newScript = { ...prev, scenes: filtered };
      pushHistory(newScript, `批量删除 ${sceneIds.size} 个场景`);
      toast.success(`已删除 ${sceneIds.size} 个场景`);
      return newScript;
    });
  }, [setScript, pushHistory]);

  /**
   * 全量更新剧本
   */
  const handleUpdateScript = useCallback((newScript: Script) => {
    setScript(newScript);
    pushHistory(newScript, '全量更新剧本');
  }, [setScript, pushHistory]);

  /**
   * 批量替换所有场景
   */
  const handleUpdateScenes = useCallback((newScenes: ScriptScene[]) => {
    setScript(prev => {
      if (!prev) return prev;
      const newScript = { ...prev, scenes: newScenes, updatedAt: new Date().toISOString() };
      pushHistory(newScript, '批量更改场景');
      return newScript;
    });
  }, [setScript, pushHistory]);

  return {
    handleUpdateScene,
    handleAddScene,
    handleDeleteScene,
    handleAddDialogue,
    handleUpdateDialogue,
    handleDeleteDialogue,
    handleBatchUpdate,
    handleBatchDelete,
    handleUpdateScript,
    handleUpdateScenes,
  };
}
