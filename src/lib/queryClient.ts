/**
 * React Query 配置
 * 提供全局的查询客户端配置
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * 创建 QueryClient 实例
 * 配置默认选项以优化性能和用户体验
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据保持新鲜的时间（5分钟）
      staleTime: 5 * 60 * 1000,
      
      // 缓存时间（10分钟）
      gcTime: 10 * 60 * 1000,
      
      // 窗口重新获得焦点时重新获取数据
      refetchOnWindowFocus: false,
      
      // 网络重新连接时重新获取数据
      refetchOnReconnect: true,
      
      // 组件挂载时不自动重新获取
      refetchOnMount: false,
      
      // 失败后重试次数
      retry: 1,
      
      // 重试延迟（指数退避）
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // 失败后重试次数
      retry: 0,
      
      // 错误时的回调
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

/**
 * 查询键工厂
 * 提供类型安全的查询键生成
 */
export const queryKeys = {
  // 故事板相关
  storyboard: {
    all: ['storyboard'] as const,
    byChapter: (chapterId: string) => ['storyboard', chapterId] as const,
    detail: (id: string) => ['storyboard', 'detail', id] as const,
  },
  
  // 剧本相关
  script: {
    all: ['script'] as const,
    byChapter: (chapterId: string) => ['script', chapterId] as const,
    detail: (id: string) => ['script', 'detail', id] as const,
  },
  
  // 项目相关
  project: {
    all: ['project'] as const,
    detail: (id: string) => ['project', 'detail', id] as const,
    list: () => ['project', 'list'] as const,
  },
  
  // 资产相关
  assets: {
    all: ['assets'] as const,
    byProject: (projectId: string) => ['assets', projectId] as const,
    characters: (projectId: string) => ['assets', 'characters', projectId] as const,
    scenes: (projectId: string) => ['assets', 'scenes', projectId] as const,
  },
  
  // 章节相关
  chapter: {
    all: ['chapter'] as const,
    byProject: (projectId: string) => ['chapter', projectId] as const,
    detail: (id: string) => ['chapter', 'detail', id] as const,
  },
  
  // 版本相关
  version: {
    all: ['version'] as const,
    byChapter: (chapterId: string) => ['version', chapterId] as const,
  },
};

/**
 * 预加载辅助函数
 */
export const prefetchHelpers = {
  /**
   * 预加载故事板数据
   */
  async prefetchStoryboard(chapterId: string) {
    const { storyboardStorage } = await import('../app/utils/storage');
    const data = await storyboardStorage.getByChapterId(chapterId);
    // 只有当数据存在时才预加载
    if (data) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.storyboard.byChapter(chapterId),
        queryFn: () => Promise.resolve(data),
      });
    }
  },
  
  /**
   * 预加载剧本数据
   */
  async prefetchScript(chapterId: string) {
    const { scriptStorage } = await import('../app/utils/storage');
    const data = await scriptStorage.getByChapterId(chapterId);
    // 只有当数据存在时才预加载
    if (data) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.script.byChapter(chapterId),
        queryFn: () => Promise.resolve(data),
      });
    }
  },
  
  /**
   * 预加载项目数据
   */
  async prefetchProject(projectId: string) {
    const { projectStorage } = await import('../app/utils/storage');
    await queryClient.prefetchQuery({
      queryKey: queryKeys.project.detail(projectId),
      queryFn: () => projectStorage.getById(projectId),
    });
  },
  
  /**
   * 预加载资产库数据
   */
  async prefetchAssets(projectId: string) {
    const { assetStorage } = await import('../app/utils/storage');
    await queryClient.prefetchQuery({
      queryKey: queryKeys.assets.byProject(projectId),
      queryFn: () => assetStorage.getByProjectId(projectId),
      staleTime: 10 * 60 * 1000,
    });
  },
};

/**
 * 缓存失效辅助函数
 */
export const invalidateHelpers = {
  /**
   * 使故事板缓存失效
   */
  invalidateStoryboard(chapterId?: string) {
    if (chapterId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.storyboard.byChapter(chapterId),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: queryKeys.storyboard.all,
      });
    }
  },
  
  /**
   * 使剧本缓存失效
   */
  invalidateScript(chapterId?: string) {
    if (chapterId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.script.byChapter(chapterId),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: queryKeys.script.all,
      });
    }
  },
  
  /**
   * 使项目缓存失效
   */
  invalidateProject(projectId?: string) {
    if (projectId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.project.detail(projectId),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: queryKeys.project.all,
      });
    }
  },
  
  /**
   * 使资产缓存失效
   */
  invalidateAssets(projectId?: string) {
    if (projectId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assets.byProject(projectId),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assets.all,
      });
    }
  },
};
