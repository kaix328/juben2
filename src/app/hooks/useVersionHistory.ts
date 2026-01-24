import { useState, useCallback } from 'react';
import type { Character, Scene, Prop, Costume } from '../types';

export interface AssetVersion<T = any> {
  id: string;
  assetId: string;
  assetType: 'character' | 'scene' | 'prop' | 'costume';
  timestamp: string;
  changes: Partial<T>;
  previousData: Partial<T>;
  user?: string;
  description?: string;
}

const MAX_VERSIONS = 50; // 每个资产最多保存50个版本

export function useVersionHistory(projectId: string) {
  const [versions, setVersions] = useState<Map<string, AssetVersion[]>>(new Map());

  // 保存版本
  const saveVersion = useCallback(<T extends Character | Scene | Prop | Costume>(
    assetId: string,
    assetType: 'character' | 'scene' | 'prop' | 'costume',
    previousData: Partial<T>,
    changes: Partial<T>,
    description?: string
  ) => {
    const version: AssetVersion<T> = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      assetType,
      timestamp: new Date().toISOString(),
      changes,
      previousData,
      description,
    };

    setVersions(prev => {
      const newVersions = new Map(prev);
      const assetVersions = newVersions.get(assetId) || [];
      
      // 添加新版本，保持最多 MAX_VERSIONS 个
      const updatedVersions = [version, ...assetVersions].slice(0, MAX_VERSIONS);
      newVersions.set(assetId, updatedVersions);
      
      // 保存到 localStorage
      try {
        localStorage.setItem(
          `versions_${projectId}_${assetId}`,
          JSON.stringify(updatedVersions)
        );
      } catch (error) {
        console.error('保存版本历史失败:', error);
      }
      
      return newVersions;
    });
  }, [projectId]);

  // 加载版本历史
  const loadVersions = useCallback((assetId: string) => {
    try {
      const stored = localStorage.getItem(`versions_${projectId}_${assetId}`);
      if (stored) {
        const assetVersions = JSON.parse(stored) as AssetVersion[];
        setVersions(prev => {
          const newVersions = new Map(prev);
          newVersions.set(assetId, assetVersions);
          return newVersions;
        });
        return assetVersions;
      }
    } catch (error) {
      console.error('加载版本历史失败:', error);
    }
    return [];
  }, [projectId]);

  // 获取版本历史
  const getVersions = useCallback((assetId: string): AssetVersion[] => {
    return versions.get(assetId) || loadVersions(assetId);
  }, [versions, loadVersions]);

  // 回滚到指定版本
  const rollbackToVersion = useCallback((versionId: string, assetId: string) => {
    const assetVersions = versions.get(assetId);
    if (!assetVersions) return null;

    const version = assetVersions.find(v => v.id === versionId);
    if (!version) return null;

    return version.previousData;
  }, [versions]);

  // 清除资产的版本历史
  const clearVersions = useCallback((assetId: string) => {
    setVersions(prev => {
      const newVersions = new Map(prev);
      newVersions.delete(assetId);
      
      try {
        localStorage.removeItem(`versions_${projectId}_${assetId}`);
      } catch (error) {
        console.error('清除版本历史失败:', error);
      }
      
      return newVersions;
    });
  }, [projectId]);

  // 对比两个版本
  const compareVersions = useCallback((version1: AssetVersion, version2: AssetVersion) => {
    const changes: { field: string; old: any; new: any }[] = [];
    
    const allKeys = new Set([
      ...Object.keys(version1.changes),
      ...Object.keys(version2.changes),
    ]);

    allKeys.forEach(key => {
      const val1 = (version1.changes as any)[key];
      const val2 = (version2.changes as any)[key];
      
      if (val1 !== val2) {
        changes.push({
          field: key,
          old: val1,
          new: val2,
        });
      }
    });

    return changes;
  }, []);

  return {
    saveVersion,
    getVersions,
    rollbackToVersion,
    clearVersions,
    compareVersions,
  };
}
