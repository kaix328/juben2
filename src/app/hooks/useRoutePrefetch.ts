/**
 * 路由预加载 Hook
 * 在用户可能访问的页面之前预先加载数据
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchHelpers } from '../../lib/queryClient';
import { chapterStorage } from '../utils/storage';

/**
 * 路由预加载 Hook
 * 提供预加载不同页面数据的方法
 */
export function useRoutePrefetch() {
  const queryClient = useQueryClient();

  /**
   * 预加载章节编辑器数据
   * 当用户可能访问剧本或分镜编辑器时调用
   */
  const prefetchChapterEditor = useCallback(async (chapterId: string) => {
    if (!chapterId) return;

    try {
      // 并行预加载剧本和分镜数据
      await Promise.all([
        prefetchHelpers.prefetchScript(chapterId),
        prefetchHelpers.prefetchStoryboard(chapterId),
      ]);
    } catch (error) {
      console.error('Failed to prefetch chapter editor data:', error);
    }
  }, []);

  /**
   * 预加载项目数据
   * 当用户可能访问项目详情页时调用
   */
  const prefetchProject = useCallback(async (projectId: string) => {
    if (!projectId) return;

    try {
      await prefetchHelpers.prefetchProject(projectId);
      
      // 同时预加载项目的所有章节数据（用于侧边栏）
      const chapters = await chapterStorage.getByProjectId(projectId);
      if (chapters && chapters.length > 0) {
        // 预加载第一个章节的数据（最可能访问的）
        const firstChapter = chapters[0];
        if (firstChapter) {
          await prefetchChapterEditor(firstChapter.id);
        }
      }
    } catch (error) {
      console.error('Failed to prefetch project data:', error);
    }
  }, [prefetchChapterEditor]);

  /**
   * 预加载资产库数据
   * 当用户可能访问资产库时调用
   */
  const prefetchAssets = useCallback(async (projectId: string) => {
    if (!projectId) return;

    try {
      const { assetStorage } = await import('../utils/storage');
      await queryClient.prefetchQuery({
        queryKey: ['assets', 'byProject', projectId],
        queryFn: () => assetStorage.getByProjectId(projectId),
        staleTime: 10 * 60 * 1000,
      });
    } catch (error) {
      console.error('Failed to prefetch assets data:', error);
    }
  }, [queryClient]);

  /**
   * 根据路由路径预加载数据
   * 智能识别路由并预加载相应数据
   */
  const prefetchByRoute = useCallback(async (path: string) => {
    try {
      // 解析路由路径
      const pathParts = path.split('/').filter(Boolean);

      // 项目详情页: /projects/:projectId
      if (pathParts.length === 2 && pathParts[0] === 'projects') {
        const projectId = pathParts[1];
        await prefetchProject(projectId);
      }

      // 剧本编辑器: /projects/:projectId/script/:chapterId
      if (pathParts.length === 4 && pathParts[2] === 'script') {
        const chapterId = pathParts[3];
        await prefetchChapterEditor(chapterId);
      }

      // 分镜编辑器: /projects/:projectId/storyboard/:chapterId
      if (pathParts.length === 4 && pathParts[2] === 'storyboard') {
        const chapterId = pathParts[3];
        await prefetchChapterEditor(chapterId);
      }

      // 资产库: /projects/:projectId/assets
      if (pathParts.length === 3 && pathParts[2] === 'assets') {
        const projectId = pathParts[1];
        await prefetchAssets(projectId);
      }
    } catch (error) {
      console.error('Failed to prefetch by route:', error);
    }
  }, [prefetchProject, prefetchChapterEditor, prefetchAssets]);

  return {
    prefetchChapterEditor,
    prefetchProject,
    prefetchAssets,
    prefetchByRoute,
  };
}
