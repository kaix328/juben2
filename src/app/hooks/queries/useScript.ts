/**
 * Script 数据查询 Hooks
 * 使用 React Query 管理剧本数据
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateHelpers } from '../../../lib/queryClient';
import { scriptStorage } from '../../utils/storage';
import type { Script } from '../../types';
import { toast } from 'sonner';

/**
 * 获取章节的剧本数据
 */
export function useScript(chapterId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.script.byChapter(chapterId || ''),
    queryFn: async () => {
      if (!chapterId) return null;
      const result = await scriptStorage.getByChapterId(chapterId);
      return result ?? null; // 确保返回 null 而不是 undefined
    },
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 保存剧本数据
 */
export function useSaveScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (script: Script) => {
      return await scriptStorage.save(script);
    },
    onMutate: async (newScript) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.script.byChapter(newScript.chapterId),
      });

      const previousScript = queryClient.getQueryData(
        queryKeys.script.byChapter(newScript.chapterId)
      );

      queryClient.setQueryData(
        queryKeys.script.byChapter(newScript.chapterId),
        newScript
      );

      return { previousScript };
    },
    onError: (error, newScript, context) => {
      if (context?.previousScript) {
        queryClient.setQueryData(
          queryKeys.script.byChapter(newScript.chapterId),
          context.previousScript
        );
      }
      console.error('Failed to save script:', error);
      toast.error('保存失败');
    },
    onSuccess: (_, variables) => {
      invalidateHelpers.invalidateScript(variables.chapterId);
      toast.success('剧本已保存');
    },
  });
}

/**
 * 删除剧本
 */
export function useDeleteScript() {
  return useMutation({
    mutationFn: async (scriptId: string) => {
      return await scriptStorage.delete(scriptId);
    },
    onSuccess: () => {
      invalidateHelpers.invalidateScript();
      toast.success('剧本已删除');
    },
    onError: (error) => {
      console.error('Failed to delete script:', error);
      toast.error('删除失败');
    },
  });
}
