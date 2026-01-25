/**
 * 剧本数据加载 Hook
 * 负责从存储中加载章节和剧本数据
 */
import { useState, useEffect, useRef } from 'react';
import { chapterStorage, scriptStorage, projectStorage } from '../../../utils/storage';
import type { Script, ScriptScene, Chapter } from '../types';

interface UseScriptLoaderOptions {
  chapterId: string | undefined;
}

interface UseScriptLoaderReturn {
  chapter: Chapter | null;
  script: Script | null;
  directorStyle: { artStyle?: string; mood?: string; customPrompt?: string } | undefined;
  isLoading: boolean;
  error: Error | null;
  setScript: React.Dispatch<React.SetStateAction<Script | null>>;
}

/**
 * 剧本数据加载 Hook
 * 
 * @param chapterId - 章节ID
 * @returns 章节数据、剧本数据、导演风格、加载状态
 */
export function useScriptLoader({ chapterId }: UseScriptLoaderOptions): UseScriptLoaderReturn {
  const isMountedRef = useRef(true);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [directorStyle, setDirectorStyle] = useState<{ artStyle?: string; mood?: string; customPrompt?: string } | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    const loadData = async () => {
      if (!chapterId) {
        setChapter(null);
        setScript(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 加载章节数据
        const chapterData = await chapterStorage.getById(chapterId);
        if (isMountedRef.current) {
          setChapter(chapterData || null);
        }

        // 加载项目的导演风格
        if (chapterData?.projectId) {
          try {
            const project = await projectStorage.getById(chapterData.projectId);
            if (project?.directorStyle && isMountedRef.current) {
              setDirectorStyle(project.directorStyle);
            }
          } catch (err) {
            console.error('[useScriptLoader] Failed to load project:', err);
          }
        }

        // 加载剧本数据
        const scriptData = await scriptStorage.getByChapterId(chapterId);

        if (scriptData && isMountedRef.current) {
          // 数据迁移：确保所有必需字段存在
          const migratedScenes = scriptData.scenes.map(scene => ({
            ...scene,
            sceneType: scene.sceneType || 'INT' as const,
            dialogues: scene.dialogues || [],
            transition: scene.transition,
            estimatedDuration: scene.estimatedDuration || 0,
          }));
          const migratedScript = { ...scriptData, scenes: migratedScenes };
          setScript(migratedScript);
        } else if (isMountedRef.current) {
          setScript(null);
        }
      } catch (err) {
        console.error('[useScriptLoader] Failed to load data:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('加载数据失败'));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [chapterId]);

  return {
    chapter,
    script,
    directorStyle,
    isLoading,
    error,
    setScript,
  };
}
