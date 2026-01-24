/**
 * 多级缓存管理器
 * 实现内存缓存 + IndexedDB 缓存的多级缓存策略
 */

import Dexie, { Table } from 'dexie';

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * IndexedDB 缓存数据库
 */
class CacheDB extends Dexie {
  cache!: Table<CacheEntry, string>;

  constructor() {
    super('AppCache');
    this.version(1).stores({
      cache: 'key, timestamp',
    });
  }
}

/**
 * 多级缓存管理器
 * 
 * 缓存层级:
 * 1. 内存缓存 (Map) - 最快，但容量有限
 * 2. IndexedDB 缓存 (Dexie) - 较快，容量大
 * 3. React Query 缓存 - 自动管理
 */
export class CacheManager {
  private memoryCache = new Map<string, { value: any; timestamp: number; ttl?: number }>();
  private db: CacheDB;
  private maxMemoryCacheSize = 100; // 内存缓存最大条目数
  private defaultTTL = 30 * 60 * 1000; // 默认 30 分钟

  constructor() {
    this.db = new CacheDB();
  }

  /**
   * 获取缓存数据
   * 按优先级从内存 -> IndexedDB 查找
   */
  async get<T = any>(key: string): Promise<T | null> {
    // 1. 检查内存缓存
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      // 检查是否过期
      if (this.isExpired(memoryEntry.timestamp, memoryEntry.ttl)) {
        this.memoryCache.delete(key);
      } else {
        return memoryEntry.value as T;
      }
    }

    // 2. 检查 IndexedDB 缓存
    try {
      const dbEntry = await this.db.cache.get(key);
      if (dbEntry) {
        // 检查是否过期
        if (this.isExpired(dbEntry.timestamp, dbEntry.ttl)) {
          await this.db.cache.delete(key);
          return null;
        }

        // 提升到内存缓存
        this.setMemoryCache(key, dbEntry.value, dbEntry.ttl);
        return dbEntry.value as T;
      }
    } catch (error) {
      console.error('Failed to get from IndexedDB cache:', error);
    }

    return null;
  }

  /**
   * 设置缓存数据
   * 同时写入内存和 IndexedDB
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const timestamp = Date.now();
    const effectiveTTL = ttl || this.defaultTTL;

    // 1. 写入内存缓存
    this.setMemoryCache(key, value, effectiveTTL);

    // 2. 写入 IndexedDB 缓存
    try {
      await this.db.cache.put({
        key,
        value,
        timestamp,
        ttl: effectiveTTL,
      });
    } catch (error) {
      console.error('Failed to set IndexedDB cache:', error);
    }
  }

  /**
   * 删除缓存数据
   */
  async delete(key: string): Promise<void> {
    // 1. 从内存缓存删除
    this.memoryCache.delete(key);

    // 2. 从 IndexedDB 删除
    try {
      await this.db.cache.delete(key);
    } catch (error) {
      console.error('Failed to delete from IndexedDB cache:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    // 1. 清空内存缓存
    this.memoryCache.clear();

    // 2. 清空 IndexedDB 缓存
    try {
      await this.db.cache.clear();
    } catch (error) {
      console.error('Failed to clear IndexedDB cache:', error);
    }
  }

  /**
   * 批量获取
   */
  async getMany<T = any>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * 批量设置
   */
  async setMany(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    const timestamp = Date.now();

    // 1. 批量写入内存
    for (const entry of entries) {
      this.setMemoryCache(entry.key, entry.value, entry.ttl);
    }

    // 2. 批量写入 IndexedDB
    try {
      await this.db.cache.bulkPut(
        entries.map(entry => ({
          key: entry.key,
          value: entry.value,
          timestamp,
          ttl: entry.ttl || this.defaultTTL,
        }))
      );
    } catch (error) {
      console.error('Failed to bulk set IndexedDB cache:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    const memoryCacheSize = this.memoryCache.size;
    const dbCacheSize = await this.db.cache.count();

    return {
      memoryCache: {
        size: memoryCacheSize,
        maxSize: this.maxMemoryCacheSize,
        usage: (memoryCacheSize / this.maxMemoryCacheSize) * 100,
      },
      dbCache: {
        size: dbCacheSize,
      },
      total: memoryCacheSize + dbCacheSize,
    };
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<number> {
    let cleaned = 0;

    // 1. 清理内存缓存
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry.timestamp, entry.ttl)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // 2. 清理 IndexedDB 缓存
    try {
      const allEntries = await this.db.cache.toArray();
      const expiredKeys = allEntries
        .filter(entry => this.isExpired(entry.timestamp, entry.ttl))
        .map(entry => entry.key);

      if (expiredKeys.length > 0) {
        await this.db.cache.bulkDelete(expiredKeys);
        cleaned += expiredKeys.length;
      }
    } catch (error) {
      console.error('Failed to cleanup IndexedDB cache:', error);
    }

    return cleaned;
  }

  /**
   * 预热缓存
   * 预先加载常用数据到缓存
   */
  async warmup(entries: Array<{ key: string; loader: () => Promise<any>; ttl?: number }>): Promise<void> {
    const promises = entries.map(async (entry) => {
      try {
        const value = await entry.loader();
        await this.set(entry.key, value, entry.ttl);
      } catch (error) {
        console.error(`Failed to warmup cache for key ${entry.key}:`, error);
      }
    });

    await Promise.all(promises);
  }

  // ========== 私有方法 ==========

  /**
   * 设置内存缓存
   * 实现 LRU 策略
   */
  private setMemoryCache(key: string, value: any, ttl?: number): void {
    // 如果缓存已满，删除最旧的条目
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 检查是否过期
   */
  private isExpired(timestamp: number, ttl?: number): boolean {
    if (!ttl) return false;
    return Date.now() - timestamp > ttl;
  }
}

/**
 * 全局缓存管理器实例
 */
export const cacheManager = new CacheManager();

/**
 * 缓存键生成器
 * 提供统一的缓存键命名规范
 */
export const cacheKeys = {
  storyboard: (chapterId: string) => `storyboard:${chapterId}`,
  script: (chapterId: string) => `script:${chapterId}`,
  project: (projectId: string) => `project:${projectId}`,
  assets: (projectId: string) => `assets:${projectId}`,
  chapter: (chapterId: string) => `chapter:${chapterId}`,
  
  // 列表缓存
  projectList: () => 'project:list',
  chapterList: (projectId: string) => `chapter:list:${projectId}`,
  
  // 临时数据缓存
  temp: (key: string) => `temp:${key}`,
  
  // 用户偏好缓存
  preference: (key: string) => `preference:${key}`,
};

/**
 * 缓存装饰器
 * 自动缓存函数结果
 */
export function cached(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      await cacheManager.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * 缓存预热辅助函数
 */
export const cacheWarmup = {
  /**
   * 预热项目数据
   */
  async warmupProject(projectId: string) {
    const { projectStorage, assetStorage } = await import('../../app/utils/storage');
    
    await cacheManager.warmup([
      {
        key: cacheKeys.project(projectId),
        loader: () => projectStorage.getById(projectId),
        ttl: 10 * 60 * 1000,
      },
      {
        key: cacheKeys.assets(projectId),
        loader: () => assetStorage.getByProjectId(projectId),
        ttl: 10 * 60 * 1000,
      },
    ]);
  },

  /**
   * 预热章节数据
   */
  async warmupChapter(chapterId: string) {
    const { scriptStorage, storyboardStorage } = await import('../../app/utils/storage');
    
    await cacheManager.warmup([
      {
        key: cacheKeys.script(chapterId),
        loader: () => scriptStorage.getByChapterId(chapterId),
        ttl: 5 * 60 * 1000,
      },
      {
        key: cacheKeys.storyboard(chapterId),
        loader: () => storyboardStorage.getByChapterId(chapterId),
        ttl: 5 * 60 * 1000,
      },
    ]);
  },
};

/**
 * 定期清理过期缓存
 * 建议在应用启动时调用
 */
export function startCacheCleanup(interval = 5 * 60 * 1000) {
  // 立即执行一次清理
  cacheManager.cleanup();

  // 定期清理
  return setInterval(() => {
    cacheManager.cleanup().then(cleaned => {
      if (cleaned > 0) {
        console.log(`[Cache] Cleaned ${cleaned} expired entries`);
      }
    });
  }, interval);
}
