/**
 * 剧本编辑器快捷键 Hook
 * 基于全局快捷键管理器实现，避免重复代码
 */
import { useEffect } from 'react';
import { keyboardManager } from '../../../utils/keyboardShortcuts';

interface UseKeyboardShortcutsOptions {
    onSave?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onAddScene?: () => void;
    onToggleStats?: () => void;
    onToggleBatchMode?: () => void;
    enabled?: boolean;
}

/**
 * 剧本编辑器键盘快捷键 Hook
 * 使用全局快捷键管理器，支持：
 * - Ctrl+S: 保存
 * - Ctrl+Z: 撤销
 * - Ctrl+Shift+Z: 重做
 * - Ctrl+Enter: 添加场景
 * - Ctrl+I: 统计面板
 * - Ctrl+B: 批量模式
 * - Esc: 取消选择
 */
export function useKeyboardShortcuts({
    onSave,
    onUndo,
    onRedo,
    onAddScene,
    onToggleStats,
    onToggleBatchMode,
    enabled = true,
}: UseKeyboardShortcutsOptions) {
    
    useEffect(() => {
        if (!enabled) return;

        const unregisters: (() => void)[] = [];

        // 注册各个动作的处理器
        if (onSave) {
            unregisters.push(keyboardManager.registerHandler('save', onSave));
        }
        if (onUndo) {
            unregisters.push(keyboardManager.registerHandler('undo', onUndo));
        }
        if (onRedo) {
            unregisters.push(keyboardManager.registerHandler('redo', onRedo));
        }
        if (onAddScene) {
            unregisters.push(keyboardManager.registerHandler('newPanel', onAddScene));
        }
        if (onToggleStats) {
            // 使用自定义处理器，因为全局没有这个动作
            const handleToggleStats = (e: KeyboardEvent) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                    e.preventDefault();
                    onToggleStats();
                }
            };
            window.addEventListener('keydown', handleToggleStats);
            unregisters.push(() => window.removeEventListener('keydown', handleToggleStats));
        }
        if (onToggleBatchMode) {
            unregisters.push(keyboardManager.registerHandler('toggleSidebar', onToggleBatchMode));
            // 也监听 Escape 退出批量模式
            unregisters.push(keyboardManager.registerHandler('stop', onToggleBatchMode));
        }

        return () => {
            unregisters.forEach(unregister => unregister());
        };
    }, [enabled, onSave, onUndo, onRedo, onAddScene, onToggleStats, onToggleBatchMode]);
}

// 快捷键提示组件（从全局管理器获取格式化的快捷键）
export const SHORTCUT_HINTS = [
    { key: keyboardManager.formatKeys(['Ctrl', 'S']), action: '保存' },
    { key: keyboardManager.formatKeys(['Ctrl', 'Z']), action: '撤销' },
    { key: keyboardManager.formatKeys(['Ctrl', 'Shift', 'Z']), action: '重做' },
    { key: keyboardManager.formatKeys(['Ctrl', 'N']), action: '添加场景' },
    { key: keyboardManager.formatKeys(['Ctrl', 'I']), action: '统计面板' },
    { key: keyboardManager.formatKeys(['Ctrl', 'B']), action: '批量模式' },
    { key: keyboardManager.formatKeys(['Escape']), action: '取消选择' },
];
