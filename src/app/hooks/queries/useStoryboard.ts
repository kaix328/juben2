/**
 * Storyboard 数据查询 Hooks
 * 使用 React Query 管理故事板数据的获取、缓存和更新
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateHelpers } from '../../../lib/queryClient';
import { storyboardStorage } from '../../utils/storage';
import type { Storyboard } from '../../types';
import { toast } from 'sonner';
import { autoMigrateStoryboard } from '../useAutoMigration';

/**
 * 获取章节的故事板数据（带自动迁移）
 */
export function useStoryboard(chapterId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.storyboard.byChapter(chapterId || ''),
    queryFn: async () => {
      if (!chapterId) return null;
      const result = await storyboardStorage.getByChapterId(chapterId);
      
      if (!result) return null;
      
      // 🆕 自动迁移旧版本数据
      const migratedResult = await autoMigrateStoryboard(result);
      
      // 如果数据被迁移了，自动保存
      if (migratedResult && migratedResult.version === 2 && result.version !== 2) {
        console.log('[useStoryboard] 数据已迁移，自动保存...');
        await storyboardStorage.save(migratedResult);
      }
      
      return migratedResult ?? null;
    },
    enabled: !!chapterId, // 只有当 chapterId 存在时才执行查询
    staleTime: 5 * 60 * 1000, // 5 分钟内数据保持新鲜
  });
}

/**
 * 保存故事板数据
 */
export function useSaveStoryboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyboard: Storyboard) => {
      return await storyboardStorage.save(storyboard);
    },
    onMutate: async (newStoryboard) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({
        queryKey: queryKeys.storyboard.byChapter(newStoryboard.chapterId),
      });

      // 保存之前的数据用于回滚
      const previousStoryboard = queryClient.getQueryData(
        queryKeys.storyboard.byChapter(newStoryboard.chapterId)
      );

      // 乐观更新：立即更新缓存
      queryClient.setQueryData(
        queryKeys.storyboard.byChapter(newStoryboard.chapterId),
        newStoryboard
      );

      return { previousStoryboard };
    },
    onError: (error, newStoryboard, context) => {
      // 发生错误时回滚
      if (context?.previousStoryboard) {
        queryClient.setQueryData(
          queryKeys.storyboard.byChapter(newStoryboard.chapterId),
          context.previousStoryboard
        );
      }
      console.error('Failed to save storyboard:', error);
      toast.error('保存失败');
    },
    onSuccess: (_, variables) => {
      // 成功后使缓存失效，确保数据一致性
      invalidateHelpers.invalidateStoryboard(variables.chapterId);
      toast.success('分镜已保存');
    },
  });
}

/**
 * 删除故事板
 */
export function useDeleteStoryboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyboardId: string) => {
      return await storyboardStorage.delete(storyboardId);
    },
    onSuccess: () => {
      // 使所有故事板查询失效
      invalidateHelpers.invalidateStoryboard();
      toast.success('分镜已删除');
    },
    onError: (error) => {
      console.error('Failed to delete storyboard:', error);
      toast.error('删除失败');
    },
  });
}

/**
 * 获取所有故事板列表
 */
export function useStoryboards() {
  return useQuery({
    queryKey: queryKeys.storyboard.all,
    queryFn: async () => {
      return await storyboardStorage.getAll();
    },
    staleTime: 10 * 60 * 1000, // 10 分钟
  });
}

/**
 * 预加载故事板数据
 * 用于在用户可能访问之前预先加载数据
 */
export function usePrefetchStoryboard() {
  const queryClient = useQueryClient();

  return async (chapterId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.storyboard.byChapter(chapterId),
      queryFn: () => storyboardStorage.getByChapterId(chapterId),
    });
  };
}
