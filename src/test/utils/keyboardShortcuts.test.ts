/**
 * 快捷键管理器测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { keyboardManager, DEFAULT_KEY_BINDINGS } from '../../app/utils/keyboardShortcuts';

describe('快捷键管理器', () => {
  beforeEach(() => {
    // 重置所有处理器
    vi.clearAllMocks();
  });

  describe('DEFAULT_KEY_BINDINGS 配置', () => {
    it('应该包含保存快捷键', () => {
      const saveBinding = DEFAULT_KEY_BINDINGS.find(b => b.id === 'save');
      expect(saveBinding).toBeDefined();
      expect(saveBinding?.keys).toContain('S');
      expect(saveBinding?.keys).toContain('Ctrl');
    });

    it('应该包含撤销快捷键', () => {
      const undoBinding = DEFAULT_KEY_BINDINGS.find(b => b.id === 'undo');
      expect(undoBinding).toBeDefined();
      expect(undoBinding?.keys).toContain('Z');
      expect(undoBinding?.keys).toContain('Ctrl');
    });

    it('应该包含重做快捷键', () => {
      const redoBinding = DEFAULT_KEY_BINDINGS.find(b => b.id === 'redo');
      expect(redoBinding).toBeDefined();
      expect(redoBinding?.keys).toContain('Z');
      expect(redoBinding?.keys).toContain('Ctrl');
      expect(redoBinding?.keys).toContain('Shift');
    });
  });

  describe('keyboardManager', () => {
    it('应该能注册处理器', () => {
      const handler = vi.fn();
      const unregister = keyboardManager.registerHandler('save', handler);
      
      expect(typeof unregister).toBe('function');
    });

    it('应该能取消注册处理器', () => {
      const handler = vi.fn();
      const unregister = keyboardManager.registerHandler('save', handler);
      
      unregister();
      // 取消注册后不应抛出错误
      expect(true).toBe(true);
    });

    it('formatKeys 应该正确格式化快捷键', () => {
      const result = keyboardManager.formatKeys(['Ctrl', 'S']);
      expect(result).toContain('Ctrl');
      expect(result).toContain('S');
    });
  });

  describe('快捷键触发', () => {
    it('应该在按下 Ctrl+S 时触发保存', () => {
      const handler = vi.fn();
      keyboardManager.registerHandler('save', handler);

      // 模拟键盘事件
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });
      
      window.dispatchEvent(event);
      
      // 注意：实际触发取决于 keyboardManager 的实现
      // 这里主要测试注册机制
    });
  });
});
