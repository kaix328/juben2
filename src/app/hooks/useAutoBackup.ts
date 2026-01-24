import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { AssetLibrary } from '../types';

interface BackupData {
  timestamp: string;
  data: AssetLibrary;
  version: string;
}

const BACKUP_PREFIX = 'backup_';
const MAX_BACKUPS = 10; // 最多保留10个备份
const BACKUP_INTERVAL = 5 * 60 * 1000; // 5分钟自动备份一次

export function useAutoBackup(projectId: string, assets: AssetLibrary | null) {
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastBackupRef = useRef<string>('');

  // 创建备份
  const createBackup = useCallback((manual: boolean = false) => {
    if (!assets) return;

    try {
      const backup: BackupData = {
        timestamp: new Date().toISOString(),
        data: assets,
        version: '1.0',
      };

      const backupKey = `${BACKUP_PREFIX}${projectId}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));

      // 清理旧备份
      cleanOldBackups(projectId);

      lastBackupRef.current = backupKey;

      if (manual) {
        toast.success('备份已创建');
      }

      console.log(`[AutoBackup] 备份已创建: ${backupKey}`);
    } catch (error) {
      console.error('[AutoBackup] 备份失败:', error);
      if (manual) {
        toast.error('备份失败，存储空间可能不足');
      }
    }
  }, [assets, projectId]);

  // 清理旧备份
  const cleanOldBackups = useCallback((projectId: string) => {
    try {
      const backups = getBackups(projectId);
      
      if (backups.length > MAX_BACKUPS) {
        // 按时间排序，删除最旧的
        backups.sort((a, b) => 
          new Date(a.backup.timestamp).getTime() - new Date(b.backup.timestamp).getTime()
        );

        const toDelete = backups.slice(0, backups.length - MAX_BACKUPS);
        toDelete.forEach(({ key }) => {
          localStorage.removeItem(key);
          console.log(`[AutoBackup] 已删除旧备份: ${key}`);
        });
      }
    } catch (error) {
      console.error('[AutoBackup] 清理备份失败:', error);
    }
  }, []);

  // 获取所有备份
  const getBackups = useCallback((projectId: string): Array<{ key: string; backup: BackupData }> => {
    const backups: Array<{ key: string; backup: BackupData }> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${BACKUP_PREFIX}${projectId}_`)) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const backup = JSON.parse(data) as BackupData;
              backups.push({ key, backup });
            } catch {
              // 忽略无效的备份
            }
          }
        }
      }
    } catch (error) {
      console.error('[AutoBackup] 获取备份列表失败:', error);
    }

    return backups;
  }, []);

  // 恢复备份
  const restoreBackup = useCallback((backupKey: string): AssetLibrary | null => {
    try {
      const data = localStorage.getItem(backupKey);
      if (!data) {
        toast.error('备份不存在');
        return null;
      }

      const backup = JSON.parse(data) as BackupData;
      toast.success('备份已恢复');
      return backup.data;
    } catch (error) {
      console.error('[AutoBackup] 恢复备份失败:', error);
      toast.error('恢复备份失败');
      return null;
    }
  }, []);

  // 删除备份
  const deleteBackup = useCallback((backupKey: string) => {
    try {
      localStorage.removeItem(backupKey);
      toast.success('备份已删除');
    } catch (error) {
      console.error('[AutoBackup] 删除备份失败:', error);
      toast.error('删除备份失败');
    }
  }, []);

  // 导出备份到文件
  const exportBackup = useCallback((backupKey: string) => {
    try {
      const data = localStorage.getItem(backupKey);
      if (!data) {
        toast.error('备份不存在');
        return;
      }

      const backup = JSON.parse(data) as BackupData;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('备份已导出');
    } catch (error) {
      console.error('[AutoBackup] 导出备份失败:', error);
      toast.error('导出备份失败');
    }
  }, []);

  // 导入备份
  const importBackup = useCallback((file: File): Promise<AssetLibrary | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as BackupData;
          
          // 验证备份数据
          if (!data.data || !data.timestamp) {
            toast.error('备份文件格式无效');
            resolve(null);
            return;
          }

          toast.success('备份已导入');
          resolve(data.data);
        } catch (error) {
          console.error('[AutoBackup] 导入备份失败:', error);
          toast.error('导入备份失败，文件格式错误');
          resolve(null);
        }
      };

      reader.onerror = () => {
        toast.error('读取文件失败');
        resolve(null);
      };

      reader.readAsText(file);
    });
  }, []);

  // 获取存储使用情况
  const getStorageUsage = useCallback(() => {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }

      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
      const maxSizeMB = 10; // 大多数浏览器限制为10MB
      const usagePercent = ((totalSize / (maxSizeMB * 1024 * 1024)) * 100).toFixed(1);

      return {
        totalSize,
        totalSizeMB,
        maxSizeMB,
        usagePercent: parseFloat(usagePercent),
      };
    } catch (error) {
      console.error('[AutoBackup] 获取存储使用情况失败:', error);
      return null;
    }
  }, []);

  // 自动备份
  useEffect(() => {
    if (!assets || !projectId) return;

    // 立即创建一次备份
    createBackup(false);

    // 设置定时备份
    intervalRef.current = setInterval(() => {
      createBackup(false);
    }, BACKUP_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [assets, projectId, createBackup]);

  // 页面卸载前备份
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (assets) {
        createBackup(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [assets, createBackup]);

  return {
    createBackup: () => createBackup(true),
    getBackups: () => getBackups(projectId),
    restoreBackup,
    deleteBackup,
    exportBackup,
    importBackup,
    getStorageUsage,
  };
}
