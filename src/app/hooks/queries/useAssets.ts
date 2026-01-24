/**
 * Assets 数据查询 Hooks
 * 使用 React Query 管理资产库数据
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateHelpers } from '../../../lib/queryClient';
import { assetStorage } from '../../utils/storage';
import type { AssetLibrary } from '../../types';
import { toast } from 'sonner';

import { chapterStorage } from '../../utils/storage';

/**
 * 获取项目的资产库
 */
export function useAssets(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.assets.byProject(projectId || ''),
    queryFn: async () => {
      if (!projectId) return null;
      return await assetStorage.getByProjectId(projectId);
    },
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 通过章节ID获取项目的资产库
 */
export function useAssetsByChapter(chapterId: string | undefined) {
  return useQuery({
    queryKey: ['assets', 'byChapter', chapterId || ''],
    queryFn: async () => {
      if (!chapterId) return null;
      const projectId = await chapterStorage.getProjectIdByChapterId(chapterId);
      if (!projectId) return null;
      return await assetStorage.getByProjectId(projectId);
    },
    enabled: !!chapterId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 保存资产库数据
 */
export function useSaveAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assets: AssetLibrary) => {
      return await assetStorage.save(assets);
    },
    onMutate: async (newAssets) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.assets.byProject(newAssets.projectId),
      });

      const previousAssets = queryClient.getQueryData(
        queryKeys.assets.byProject(newAssets.projectId)
      );

      queryClient.setQueryData(
        queryKeys.assets.byProject(newAssets.projectId),
        newAssets
      );

      return { previousAssets };
    },
    onError: (error, newAssets, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(
          queryKeys.assets.byProject(newAssets.projectId),
          context.previousAssets
        );
      }
      console.error('Failed to save assets:', error);
      toast.error('保存失败');
    },
    onSuccess: (_, variables) => {
      invalidateHelpers.invalidateAssets(variables.projectId);
      toast.success('资产已保存');
    },
  });
}
