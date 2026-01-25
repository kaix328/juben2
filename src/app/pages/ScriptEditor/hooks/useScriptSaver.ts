/**
 * 剧本保存 Hook
 * 负责剧本的自动保存和手动保存
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { scriptStorage } from '../../../utils/storage';
import { saveBackup } from '../../../utils/scriptBackup';
import { toast } from 'sonner';
import { CONFIG } from '../../../config/constants';
import type { Script } from '../types';

interface UseScriptSaverOptions {
  script: Script | null;
  chapterId: string | undefined;
}

interface UseScriptSaverReturn {
  lastSaved: string;
  isSaving: boolean;
  handleSave: () => Promise<void>;
}

/**
 * 剧本保存 Hook
 * 
 * 功能：
 * 1. 自动保存（2秒延迟）
 * 2. 自动备份（每分钟）
 * 3. 手动保存
 * 
 * @param script - 剧本数据
 * @param chapterId - 章节ID
 * @returns 最后保存时间、保存状态、手动保存方法
 */
export function useScriptSaver({ script, chapterId }: UseScriptSaverOptions): UseScriptSaverReturn {
  const isMountedRef = useRef(true);
  const [lastSaved, setLastSaved] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 自动保存
  useEffect(() => {
    if (!script) return;

    const timer = setTimeout(async () => {
      try {
        await scriptStorage.save(script);
        if (isMountedRef.current) {
          const now = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          setLastSaved(now);
        }
      } catch (error) {
        console.error('[useScriptSaver] Auto-save failed:', error);
      }
    }, CONFIG.BACKUP.AUTO_SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [script]);

  // 自动备份（每分钟一次）
  useEffect(() => {
    if (!script || !chapterId) return;

    const backupTimer = setInterval(() => {
      saveBackup(chapterId, script, 'auto');
    }, CONFIG.BACKUP.AUTO_INTERVAL);

    return () => clearInterval(backupTimer);
  }, [script, chapterId]);

  // 手动保存
  const handleSave = useCallback(async () => {
    if (!script || !isMountedRef.current) return;

    setIsSaving(true);
    try {
      await scriptStorage.save(script);
      
      if (isMountedRef.current) {
        const now = new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setLastSaved(now);
        toast.success('剧本已保存');
      }
    } catch (error) {
      console.error('[useScriptSaver] Save failed:', error);
      if (isMountedRef.current) {
        toast.error('保存失败');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [script]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    lastSaved,
    isSaving,
    handleSave,
  };
}
