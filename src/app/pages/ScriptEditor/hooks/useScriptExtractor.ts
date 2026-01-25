/**
 * 剧本AI提取 Hook
 * 负责AI提取剧本的核心逻辑
 */
import { useState, useRef, useCallback } from 'react';
import { extractScriptGenerator, ScriptMode } from '../../../utils/ai';
import { generateId } from '../../../utils/storage';
import { toast } from 'sonner';
import type { Script, ScriptScene, Chapter, ExtractProgress } from '../types';

interface UseScriptExtractorOptions {
  chapter: Chapter | null;
  scriptMode: ScriptMode;
  directorStyle: { artStyle?: string; mood?: string; customPrompt?: string } | undefined;
  onScriptUpdate: (updater: (prev: Script | null) => Script | null) => void;
}

interface UseScriptExtractorReturn {
  isExtracting: boolean;
  extractProgress: ExtractProgress;
  isPaused: boolean;
  curExtractChunk: number;
  totalExtractChunks: number;
  handleAIExtract: () => Promise<void>;
  handlePauseExtract: () => void;
  handleResumeExtract: () => void;
  handleStopExtract: () => void;
}

/**
 * 剧本AI提取 Hook
 * 
 * 功能：
 * 1. AI提取剧本
 * 2. 断点续传
 * 3. 暂停/继续/停止
 * 4. 进度追踪
 * 
 * @param chapter - 章节数据
 * @param scriptMode - 剧本模式
 * @param directorStyle - 导演风格
 * @param onScriptUpdate - 剧本更新回调
 * @returns 提取状态、控制方法
 */
export function useScriptExtractor({
  chapter,
  scriptMode,
  directorStyle,
  onScriptUpdate,
}: UseScriptExtractorOptions): UseScriptExtractorReturn {
  const isMountedRef = useRef(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState<ExtractProgress>({ step: 'idle', message: '' });
  const [isPaused, setIsPaused] = useState(false);
  const [curExtractChunk, setCurExtractChunk] = useState(0);
  const [totalExtractChunks, setTotalExtractChunks] = useState(0);
  
  // 控制信号
  const stopSignalRef = useRef(false);
  const pauseSignalRef = useRef(false);

  /**
   * AI提取核心逻辑
   */
  const handleAIExtract = useCallback(async () => {
    if (!chapter || !chapter.originalText) {
      toast.error('请先在"原文编辑"中添加内容');
      return;
    }

    if (!isMountedRef.current) return;

    // 如果不是暂停恢复，重置状态
    if (!isPaused) {
      setIsExtracting(true);
      setExtractProgress({ step: 'parsing', message: '正在解析原文...' });
      stopSignalRef.current = false;
      pauseSignalRef.current = false;
      setCurExtractChunk(0);
    } else {
      // 恢复时，更新UI状态
      setIsExtracting(true);
      setIsPaused(false);
      pauseSignalRef.current = false;
    }

    try {
      // 使用生成器模式进行提取
      const generator = extractScriptGenerator(
        chapter.originalText,
        scriptMode,
        directorStyle,
        curExtractChunk // 从当前断点开始
      );

      for await (const result of generator) {
        // 检查停止信号
        if (stopSignalRef.current) {
          break;
        }

        // 更新进度
        setCurExtractChunk(result.chunkIndex + 1);
        setTotalExtractChunks(result.totalChunks);
        setExtractProgress({
          step: 'extracting',
          message: `正在提取第 ${result.chunkIndex + 1}/${result.totalChunks} 段...`
        });

        if (result.scenes.length > 0) {
          // 增量更新剧本
          onScriptUpdate(prev => {
            const baseScript = prev || {
              id: generateId(),
              chapterId: chapter.id,
              content: '',
              scenes: [],
              updatedAt: new Date().toISOString(),
              mode: scriptMode,
              metadata: {
                title: chapter.title,
                draftDate: new Date().toISOString().split('T')[0],
                draft: '初稿',
              },
            };

            const newScenes = [...baseScript.scenes, ...result.scenes];
            // 重新编号
            const renumberedScenes = newScenes.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));

            return { ...baseScript, scenes: renumberedScenes };
          });
        }

        // 检查暂停信号
        if (pauseSignalRef.current) {
          setIsPaused(true);
          setIsExtracting(false);
          setExtractProgress({ step: 'idle', message: '已暂停' });
          return;
        }
      }

      if (!stopSignalRef.current) {
        // 完成
        setExtractProgress({ step: 'validating', message: '正在校验数据格式...' });
        
        // 完成后重置断点
        setCurExtractChunk(0);
        setExtractProgress({ step: 'done', message: '提取完成！' });
        toast.success('AI提取完成！');

        // 3秒后重置进度
        setTimeout(() => {
          if (isMountedRef.current && !isExtracting) {
            setExtractProgress({ step: 'idle', message: '' });
          }
        }, 3000);
      }

    } catch (error) {
      console.error('[useScriptExtractor] Extract failed:', error);
      setExtractProgress({ step: 'error', message: '提取失败，请重试' });
      toast.error('提取失败，请重试');
    } finally {
      if (isMountedRef.current) {
        // 只有完全结束或停止时才设为 false
        if (!pauseSignalRef.current) {
          setIsExtracting(false);
        }
      }
    }
  }, [chapter, scriptMode, directorStyle, curExtractChunk, isPaused, onScriptUpdate, isExtracting]);

  /**
   * 暂停提取
   */
  const handlePauseExtract = useCallback(() => {
    pauseSignalRef.current = true;
    setIsPaused(true);
    toast.success('已暂停提取，点击"继续提取"可恢复');
  }, []);

  /**
   * 继续提取
   */
  const handleResumeExtract = useCallback(() => {
    if (!isPaused) return;
    pauseSignalRef.current = false;
    setIsPaused(false);
    handleAIExtract();
  }, [isPaused, handleAIExtract]);

  /**
   * 停止提取
   */
  const handleStopExtract = useCallback(() => {
    stopSignalRef.current = true;
    setIsExtracting(false);
    setIsPaused(false);
    setExtractProgress({ step: 'idle', message: '' });
    toast.success('已终止提取');
  }, []);

  return {
    isExtracting,
    extractProgress,
    isPaused,
    curExtractChunk,
    totalExtractChunks,
    handleAIExtract,
    handlePauseExtract,
    handleResumeExtract,
    handleStopExtract,
  };
}
