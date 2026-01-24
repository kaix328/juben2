/**
 * 剧本数据备份工具
 * 提供自动备份、手动备份和数据恢复功能
 */

import type { Script } from '../types';

const BACKUP_PREFIX = 'script_backup_';
const BACKUP_INTERVAL = 60000; // 1分钟备份一次
const MAX_BACKUPS = 10; // 最多保留10个备份

export interface ScriptBackup {
  id: string;
  chapterId: string;
  script: Script;
  timestamp: number;
  type: 'auto' | 'manual';
  description?: string;
}

/**
 * 保存备份
 */
export function saveBackup(
  chapterId: string,
  script: Script,
  type: 'auto' | 'manual' = 'auto',
  description?: string
): void {
  try {
    const backup: ScriptBackup = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chapterId,
      script: JSON.parse(JSON.stringify(script)), // 深拷贝
      timestamp: Date.now(),
      type,
      description,
    };

    // 获取现有备份
    const backups = getBackups(chapterId);
    
    // 添加新备份
    backups.push(backup);
    
    // 只保留最新的 MAX_BACKUPS 个备份
    const sortedBackups = backups
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_BACKUPS);
    
    // 保存到 localStorage
    localStorage.setItem(
      `${BACKUP_PREFIX}${chapterId}`,
      JSON.stringify(sortedBackups)
    );
    
    console.log(`[Backup] 已保存${type === 'auto' ? '自动' : '手动'}备份:`, backup.id);
  } catch (error) {
    console.error('[Backup] 保存备份失败:', error);
  }
}

/**
 * 获取所有备份
 */
export function getBackups(chapterId: string): ScriptBackup[] {
  try {
    const data = localStorage.getItem(`${BACKUP_PREFIX}${chapterId}`);
    if (!data) return [];
    
    const backups = JSON.parse(data) as ScriptBackup[];
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[Backup] 读取备份失败:', error);
    return [];
  }
}

/**
 * 获取最新备份
 */
export function getLatestBackup(chapterId: string): ScriptBackup | null {
  const backups = getBackups(chapterId);
  return backups.length > 0 ? backups[0] : null;
}

/**
 * 恢复备份
 */
export function restoreBackup(backupId: string, chapterId: string): Script | null {
  try {
    const backups = getBackups(chapterId);
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      console.error('[Backup] 未找到备份:', backupId);
      return null;
    }
    
    console.log('[Backup] 恢复备份:', backupId);
    return JSON.parse(JSON.stringify(backup.script)); // 深拷贝
  } catch (error) {
    console.error('[Backup] 恢复备份失败:', error);
    return null;
  }
}

/**
 * 删除备份
 */
export function deleteBackup(backupId: string, chapterId: string): void {
  try {
    const backups = getBackups(chapterId);
    const filtered = backups.filter(b => b.id !== backupId);
    
    localStorage.setItem(
      `${BACKUP_PREFIX}${chapterId}`,
      JSON.stringify(filtered)
    );
    
    console.log('[Backup] 已删除备份:', backupId);
  } catch (error) {
    console.error('[Backup] 删除备份失败:', error);
  }
}

/**
 * 清空所有备份
 */
export function clearBackups(chapterId: string): void {
  try {
    localStorage.removeItem(`${BACKUP_PREFIX}${chapterId}`);
    console.log('[Backup] 已清空所有备份');
  } catch (error) {
    console.error('[Backup] 清空备份失败:', error);
  }
}

/**
 * 格式化时间戳
 */
export function formatBackupTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }
  
  // 小于1天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
  
  // 显示完整日期
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 获取备份统计信息
 */
export function getBackupStats(chapterId: string): {
  total: number;
  auto: number;
  manual: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
} {
  const backups = getBackups(chapterId);
  
  return {
    total: backups.length,
    auto: backups.filter(b => b.type === 'auto').length,
    manual: backups.filter(b => b.type === 'manual').length,
    oldestTimestamp: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
    newestTimestamp: backups.length > 0 ? backups[0].timestamp : null,
  };
}

/**
 * 自动备份 Hook
 */
export function useAutoBackup(
  chapterId: string | undefined,
  script: Script | null,
  enabled: boolean = true
): void {
  if (typeof window === 'undefined') return;
  
  // 使用 setInterval 进行定期备份
  if (enabled && chapterId && script) {
    const intervalId = setInterval(() => {
      saveBackup(chapterId, script, 'auto');
    }, BACKUP_INTERVAL);
    
    return () => clearInterval(intervalId);
  }
}
