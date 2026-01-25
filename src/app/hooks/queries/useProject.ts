/**
 * Project 数据查询 Hooks
 * 使用 React Query 管理项目数据
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateHelpers } from '../../../lib/queryClient';
import { projectStorage } from '../../utils/storage';
import type { Project } from '../../types';
import { toast } from 'sonner';

import { chapterStorage } from '../../utils/storage';

/**
 * 获取项目详情
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.project.detail(projectId || ''),
    queryFn: async () => {
      if (!projectId) return null;
      const project = await projectStorage.getById(projectId);
      return project ?? null;
    },
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000, // 项目数据变化较少，可以缓存更久
  });
}

/**
 * 通过章节ID获取项目详情
 */
export function useProjectByChapter(chapterId: string | undefined) {
  return useQuery({
    queryKey: ['project', 'byChapter', chapterId || ''],
    queryFn: async () => {
      if (!chapterId) return null;
      const projectId = await chapterStorage.getProjectIdByChapterId(chapterId);
      if (!projectId) return null;
      const project = await projectStorage.getById(projectId);
      return project ?? null;
    },
    enabled: !!chapterId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 获取所有项目列表
 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.project.list(),
    queryFn: async () => {
      const projects = await projectStorage.getAll();
      return projects ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 保存项目数据
 */
export function useSaveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: Project) => {
      return await projectStorage.save(project);
    },
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.project.detail(newProject.id),
      });

      const previousProject = queryClient.getQueryData(
        queryKeys.project.detail(newProject.id)
      );

      queryClient.setQueryData(
        queryKeys.project.detail(newProject.id),
        newProject
      );

      return { previousProject };
    },
    onError: (error, newProject, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          queryKeys.project.detail(newProject.id),
          context.previousProject
        );
      }
      console.error('Failed to save project:', error);
      toast.error('保存失败');
    },
    onSuccess: (_, variables) => {
      invalidateHelpers.invalidateProject(variables.id);
      // 同时使项目列表失效
      queryClient.invalidateQueries({
        queryKey: queryKeys.project.list(),
      });
      toast.success('项目已保存');
    },
  });
}

/**
 * 删除项目
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      return await projectStorage.delete(projectId);
    },
    onSuccess: () => {
      invalidateHelpers.invalidateProject();
      queryClient.invalidateQueries({
        queryKey: queryKeys.project.list(),
      });
      toast.success('项目已删除');
    },
    onError: (error) => {
      console.error('Failed to delete project:', error);
      toast.error('删除失败');
    },
  });
}
