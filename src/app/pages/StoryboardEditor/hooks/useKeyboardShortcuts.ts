/**
 * 分镜编辑器快捷键 Hook
 * 基于全局快捷键管理器实现，避免重复代码
 */
import { useEffect, useCallback } from 'react';
import { keyboardManager, useKeyboardShortcuts as useGlobalShortcuts } from '../../../utils/keyboardShortcuts';

interface KeyboardShortcutsConfig {
    onUndo?: () => void;
    onRedo?: () => void;
    onDelete?: () => void;
    onSelectAll?: () => void;
    onEscape?: () => void;
    onSave?: () => void;
    onCopy?: () => void;
    enabled?: boolean;
}

/**
 * 分镜编辑器键盘快捷键 Hook
 * 使用全局快捷键管理器，支持：
 * - Ctrl+Z: 撤销
 * - Ctrl+Y / Ctrl+Shift+Z: 重做
 * - Delete/Backspace: 删除选中
 * - Ctrl+A: 全选
 * - Escape: 取消选择/停止
 * - Ctrl+S: 保存
 * - Ctrl+C: 复制
 */
export function useKeyboardShortcuts({
    onUndo,
    onRedo,
    onDelete,
    onSelectAll,
    onEscape,
    onSave,
    onCopy,
    enabled = true
}: KeyboardShortcutsConfig) {
    
    // 使用全局快捷键系统注册处理器
    useEffect(() => {
        if (!enabled) return;

        const unregisters: (() => void)[] = [];

        // 注册各个动作的处理器
        if (onUndo) {
            unregisters.push(keyboardManager.registerHandler('undo', onUndo));
        }
        if (onRedo) {
            unregisters.push(keyboardManager.registerHandler('redo', onRedo));
        }
        if (onDelete) {
            unregisters.push(keyboardManager.registerHandler('deletePanel', onDelete));
        }
        if (onSelectAll) {
            unregisters.push(keyboardManager.registerHandler('selectAll', onSelectAll));
        }
        if (onEscape) {
            unregisters.push(keyboardManager.registerHandler('stop', onEscape));
        }
        if (onSave) {
            unregisters.push(keyboardManager.registerHandler('save', onSave));
        }
        if (onCopy) {
            unregisters.push(keyboardManager.registerHandler('copy', onCopy));
        }

        return () => {
            unregisters.forEach(unregister => unregister());
        };
    }, [enabled, onUndo, onRedo, onDelete, onSelectAll, onEscape, onSave, onCopy]);
}

// 导出快捷键提示（从全局管理器获取）
export const SHORTCUT_HINTS = [
    { key: keyboardManager.formatKeys(['Ctrl', 'S']), action: '保存' },
    { key: keyboardManager.formatKeys(['Ctrl', 'Z']), action: '撤销' },
    { key: keyboardManager.formatKeys(['Ctrl', 'Shift', 'Z']), action: '重做' },
    { key: keyboardManager.formatKeys(['Delete']), action: '删除选中' },
    { key: keyboardManager.formatKeys(['Ctrl', 'A']), action: '全选' },
    { key: keyboardManager.formatKeys(['Escape']), action: '取消选择' },
    { key: keyboardManager.formatKeys(['Ctrl', 'C']), action: '复制' },
];
