/**
 * localStorage 操作封装
 * 统一处理 localStorage 的读写操作，提供类型安全和错误处理
 */

/**
 * 创建类型安全的 localStorage 存储对象
 */
export function createStorage<T>(keyPrefix: string) {
    return {
        /**
         * 生成完整的存储键
         */
        key: (id: string) => `${keyPrefix}_${id}`,

        /**
         * 获取存储的数据
         */
        get: (id: string): T | null => {
            try {
                const key = `${keyPrefix}_${id}`;
                const data = localStorage.getItem(key);
                if (!data) return null;
                return JSON.parse(data) as T;
            } catch (error) {
                console.error(`[Storage] Failed to get ${keyPrefix}_${id}:`, error);
                return null;
            }
        },

        /**
         * 保存数据到存储
         */
        set: (id: string, data: T): boolean => {
            try {
                const key = `${keyPrefix}_${id}`;
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error(`[Storage] Failed to set ${keyPrefix}_${id}:`, error);
                return false;
            }
        },

        /**
         * 删除存储的数据
         */
        remove: (id: string): boolean => {
            try {
                const key = `${keyPrefix}_${id}`;
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error(`[Storage] Failed to remove ${keyPrefix}_${id}:`, error);
                return false;
            }
        },

        /**
         * 检查数据是否存在
         */
        has: (id: string): boolean => {
            const key = `${keyPrefix}_${id}`;
            return localStorage.getItem(key) !== null;
        },
    };
}

// ============ 预定义的存储实例 ============

import type { StyleApplicationSettings } from '../types';

/**
 * 风格应用设置存储
 */
export const styleSettingsStorage = createStorage<StyleApplicationSettings>('styleSettings');

/**
 * 用户偏好设置存储
 */
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    sidebarCollapsed?: boolean;
    recentProjects?: string[];
}

export const userPreferencesStorage = createStorage<UserPreferences>('userPrefs');

/**
 * 编辑器设置存储
 */
export interface EditorSettings {
    fontSize?: number;
    lineHeight?: number;
    wordWrap?: boolean;
    autoSave?: boolean;
    autoSaveInterval?: number;
}

export const editorSettingsStorage = createStorage<EditorSettings>('editorSettings');

/**
 * 面板布局存储
 */
export interface PanelLayout {
    leftPanelWidth?: number;
    rightPanelWidth?: number;
    bottomPanelHeight?: number;
    visiblePanels?: string[];
}

export const panelLayoutStorage = createStorage<PanelLayout>('panelLayout');

// ============ 通用工具函数 ============

/**
 * 获取所有以指定前缀开头的存储键
 */
export function getStorageKeysByPrefix(prefix: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
            keys.push(key);
        }
    }
    return keys;
}

/**
 * 清除所有以指定前缀开头的存储数据
 */
export function clearStorageByPrefix(prefix: string): number {
    const keys = getStorageKeysByPrefix(prefix);
    keys.forEach(key => localStorage.removeItem(key));
    return keys.length;
}

/**
 * 获取 localStorage 使用量（字节）
 */
export function getStorageUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            const value = localStorage.getItem(key);
            if (value) {
                used += key.length + value.length;
            }
        }
    }

    // localStorage 通常限制为 5-10 MB
    const total = 5 * 1024 * 1024; // 5 MB
    const percentage = (used / total) * 100;

    return { used, total, percentage };
}

/**
 * 安全的 JSON 解析
 */
export function safeParseJSON<T>(json: string, defaultValue: T): T {
    try {
        return JSON.parse(json) as T;
    } catch {
        return defaultValue;
    }
}

/**
 * 安全的 localStorage 读取（带默认值）
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        if (!item) return defaultValue;
        return JSON.parse(item) as T;
    } catch {
        return defaultValue;
    }
}

/**
 * 安全的 localStorage 写入
 */
export function setStorageItem<T>(key: string, value: T): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`[Storage] Failed to set ${key}:`, error);
        return false;
    }
}
