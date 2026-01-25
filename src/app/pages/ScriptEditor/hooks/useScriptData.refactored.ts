/**
 * 剧本数据管理 Hook（重构版）
 * 整合所有子 Hooks，提供统一的接口
 */
import { useCallback } from 'react';
import { useScriptLoader } from './useScriptLoader';
import { useScriptSaver } from './useScriptSaver';
import { useScriptExtractor } from './useScriptExtractor';
import { useScriptHistory } from './useScriptHistory';
import { useScriptEditor } from './useScriptEditor';
import type { ScriptMode } from '../../../utils/ai';
import type { Script, ScriptScene, Dialogue, Chapter, ExtractProgress, HistoryEntry } from '../types';

interface UseScriptDataOptions {
  chapterId: string | undefined;
  scriptMode?: ScriptMode;
}

interface UseScriptDataReturn {
  // 数据
  chapter: Chapter | null;
  script: Script | null;
  isLoading: boolean;
  error: Error | null;
  
  // 保存状态
  lastSaved: string;
  isSaving: boolean;
  
  // 提取状态
  isExtracting: boolean;
  extractProgress: ExtractProgress;
  isPaused: boolean;
  curExtractChunk: number;
  totalExtractChunks: number;
  
  // 历史记录
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  
  // 提取控制
  handleAIExtract: () => Promise<void>;
  handlePauseExtract: () => void;
  handleResumeExtract: () => void;
  handleStopExtract: () => void;
  
  // 保存操作
  handleSave: () => Promise<void>;
  
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
  
  // 撤销/重做
  undo: () => void;
  redo: () => void;
}

/**
 * 剧本数据管理 Hook（重构版）
 * 
 * 重构说明：
 * - 原 useScriptData (500+ 行) 已拆分为 5 个专注的小 Hooks
 * - useScriptLoader: 数据加载
 * - useScriptSaver: 数据保存
 * - useScriptExtractor: AI 提取
 * - useScriptHistory: 历史记录
 * - useScriptEditor: 编辑操作
 * 
 * 优势：
 * 1. 单一职责：每个 Hook 只负责一个功能
 * 2. 易于测试：可以单独测试每个 Hook
 * 3. 易于维护：修改某个功能不影响其他功能
 * 4. 代码复用：小 Hooks 可以在其他地方复用
 * 
 * @param chapterId - 章节ID
 * @param scriptMode - 剧本模式
 * @returns 完整的剧本管理接口
 */
export function useScriptData({ 
  chapterId, 
  scriptMode: externalScriptMode 
}: UseScriptDataOptions): UseScriptDataReturn {
  const scriptMode = externalScriptMode || 'tv_drama';

  // 1. 数据加载
  const { 
    chapter, 
    script, 
    directorStyle, 
    isLoading, 
    error,
    setScript 
  } = useScriptLoader({ chapterId });

  // 2. 历史记录
  const {
    history,
    historyIndex,
    canUndo,
    canRedo,
    pushHistory,
    undo: undoHistory,
    redo: redoHistory,
  } = useScriptHistory({ initialScript: script });

  // 3. 数据保存
  const { 
    lastSaved, 
    isSaving, 
    handleSave 
  } = useScriptSaver({ script, chapterId });

  // 4. AI 提取
  const {
    isExtracting,
    extractProgress,
    isPaused,
    curExtractChunk,
    totalExtractChunks,
    handleAIExtract,
    handlePauseExtract,
    handleResumeExtract,
    handleStopExtract,
  } = useScriptExtractor({
    chapter,
    scriptMode,
    directorStyle,
    onScriptUpdate: setScript,
  });

  // 5. 编辑操作
  const {
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
  } = useScriptEditor({
    script,
    setScript,
    pushHistory,
  });

  // 撤销操作（整合历史记录）
  const undo = useCallback(() => {
    const previousScript = undoHistory();
    if (previousScript) {
      setScript(previousScript);
    }
  }, [undoHistory, setScript]);

  // 重做操作（整合历史记录）
  const redo = useCallback(() => {
    const nextScript = redoHistory();
    if (nextScript) {
      setScript(nextScript);
    }
  }, [redoHistory, setScript]);

  return {
    // 数据
    chapter,
    script,
    isLoading,
    error,
    
    // 保存状态
    lastSaved,
    isSaving,
    
    // 提取状态
    isExtracting,
    extractProgress,
    isPaused,
    curExtractChunk,
    totalExtractChunks,
    
    // 历史记录
    history,
    historyIndex,
    canUndo,
    canRedo,
    
    // 提取控制
    handleAIExtract,
    handlePauseExtract,
    handleResumeExtract,
    handleStopExtract,
    
    // 保存操作
    handleSave,
    
    // 场景操作
    handleUpdateScene,
    handleAddScene,
    handleDeleteScene,
    
    // 对白操作
    handleAddDialogue,
    handleUpdateDialogue,
    handleDeleteDialogue,
    
    // 批量操作
    handleBatchUpdate,
    handleBatchDelete,
    
    // 全量操作
    handleUpdateScript,
    handleUpdateScenes,
    
    // 撤销/重做
    undo,
    redo,
  };
}
