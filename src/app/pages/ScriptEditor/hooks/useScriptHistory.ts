/**
 * 剧本历史记录 Hook
 * 负责撤销/重做功能
 */
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { CONFIG } from '../../../config/constants';
import type { Script, HistoryEntry } from '../types';

interface UseScriptHistoryOptions {
  initialScript: Script | null;
}

interface UseScriptHistoryReturn {
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: (script: Script, description: string) => void;
  undo: () => Script | null;
  redo: () => Script | null;
  clearHistory: () => void;
}

/**
 * 剧本历史记录 Hook
 * 
 * 功能：
 * 1. 记录剧本修改历史
 * 2. 撤销操作
 * 3. 重做操作
 * 4. 限制历史记录数量
 * 
 * @param initialScript - 初始剧本数据
 * @returns 历史记录、撤销/重做方法
 */
export function useScriptHistory({ initialScript }: UseScriptHistoryOptions): UseScriptHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 初始化历史记录
  useEffect(() => {
    if (initialScript && history.length === 0) {
      setHistory([{
        script: JSON.parse(JSON.stringify(initialScript)),
        timestamp: Date.now(),
        description: '初始加载'
      }]);
      setHistoryIndex(0);
    }
  }, [initialScript, history.length]);

  /**
   * 推入新的历史记录
   */
  const pushHistory = useCallback((newScript: Script, description: string) => {
    setHistory(prev => {
      // 截断当前索引之后的历史
      const newHistory = prev.slice(0, historyIndex + 1);
      
      // 添加新记录
      newHistory.push({
        script: JSON.parse(JSON.stringify(newScript)), // 深拷贝
        timestamp: Date.now(),
        description
      });
      
      // 限制历史记录数量
      if (newHistory.length > CONFIG.BACKUP.MAX_HISTORY) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => {
      const newIndex = prev + 1;
      return Math.min(newIndex, CONFIG.BACKUP.MAX_HISTORY - 1);
    });
  }, [historyIndex]);

  /**
   * 撤销操作
   */
  const undo = useCallback((): Script | null => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const script = JSON.parse(JSON.stringify(history[newIndex].script));
      toast.success('已撤销');
      return script;
    }
    return null;
  }, [historyIndex, history]);

  /**
   * 重做操作
   */
  const redo = useCallback((): Script | null => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const script = JSON.parse(JSON.stringify(history[newIndex].script));
      toast.success('已重做');
      return script;
    }
    return null;
  }, [historyIndex, history]);

  /**
   * 清空历史记录
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    pushHistory,
    undo,
    redo,
    clearHistory,
  };
}
