/**
 * React Query 持久化缓存配置
 * 将查询结果持久化到 localStorage，提升用户体验
 */

import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

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
      
      // 窗口重新获得焦点时不自动重新获取数据
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
 * 🆕 创建持久化存储器
 * 使用 localStorage 持久化查询缓存
 */
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'screenplay-creator-cache',
  // 序列化和反序列化函数
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});

/**
 * 🆕 配置持久化
 * 将查询结果持久化到 localStorage
 */
persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  // 只持久化特定的查询
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // 只持久化成功的查询
      const queryIsReadyToDehydrate = query.state.status === 'success';
      
      // 排除某些不需要持久化的查询
      const queryKey = query.queryKey[0] as string;
      const shouldNotPersist = [
        'temp',
        'realtime',
        'volatile',
      ].some(key => queryKey?.includes(key));
      
      return queryIsReadyToDehydrate && !shouldNotPersist;
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

/**
 * 🆕 清理缓存辅助函数
 */
export const cacheHelpers = {
  /**
   * 清理所有缓存
   */
  clearAll() {
    queryClient.clear();
    localStorage.removeItem('screenplay-creator-cache');
  },
  
  /**
   * 清理过期缓存
   */
  clearStale() {
    queryClient.invalidateQueries({
      predicate: (query) => query.isStale(),
    });
  },
  
  /**
   * 获取缓存统计信息
   */
  getStats() {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      total: queries.length,
      active: queries.filter(q => q.getObserversCount() > 0).length,
      stale: queries.filter(q => q.isStale()).length,
      fetching: queries.filter(q => q.state.fetchStatus === 'fetching').length,
    };
  },
};
