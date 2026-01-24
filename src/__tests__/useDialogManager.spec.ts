/**
 * useDialogManager Hook 测试
 * 测试对话框状态管理
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDialogManager } from '../app/pages/StoryboardEditor/hooks/useDialogManager';

describe('useDialogManager', () => {
  describe('初始状态', () => {
    it('所有对话框应该默认关闭', () => {
      const { result } = renderHook(() => useDialogManager());

      expect(result.current.activeDialog).toBeNull();
      expect(result.current.showPreviewDialog).toBe(false);
      expect(result.current.showHistoryDialog).toBe(false);
      expect(result.current.showContinuityDialog).toBe(false);
    });

    it('资源侧边栏应该默认显示', () => {
      const { result } = renderHook(() => useDialogManager());

      expect(result.current.showResourceSidebar).toBe(true);
    });
  });

  describe('预览对话框', () => {
    it('应该能打开预览对话框', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openPreview();
      });

      expect(result.current.activeDialog).toBe('preview');
      expect(result.current.showPreviewDialog).toBe(true);
    });

    it('应该能使用 openDialog 打开预览', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openDialog('preview');
      });

      expect(result.current.activeDialog).toBe('preview');
      expect(result.current.showPreviewDialog).toBe(true);
    });
  });

  describe('历史对话框', () => {
    it('应该能打开历史对话框', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openHistory();
      });

      expect(result.current.activeDialog).toBe('history');
      expect(result.current.showHistoryDialog).toBe(true);
    });

    it('应该能使用 openDialog 打开历史', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openDialog('history');
      });

      expect(result.current.activeDialog).toBe('history');
      expect(result.current.showHistoryDialog).toBe(true);
    });
  });

  describe('连贯性对话框', () => {
    it('应该能打开连贯性对话框', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openContinuity();
      });

      expect(result.current.activeDialog).toBe('continuity');
      expect(result.current.showContinuityDialog).toBe(true);
    });

    it('应该能使用 openDialog 打开连贯性检查', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openDialog('continuity');
      });

      expect(result.current.activeDialog).toBe('continuity');
      expect(result.current.showContinuityDialog).toBe(true);
    });
  });

  describe('关闭对话框', () => {
    it('应该能关闭任何打开的对话框', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openPreview();
      });

      expect(result.current.activeDialog).toBe('preview');

      act(() => {
        result.current.closeDialog();
      });

      expect(result.current.activeDialog).toBeNull();
      expect(result.current.showPreviewDialog).toBe(false);
    });

    it('关闭对话框后所有标志位应该为 false', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openHistory();
      });

      act(() => {
        result.current.closeDialog();
      });

      expect(result.current.showPreviewDialog).toBe(false);
      expect(result.current.showHistoryDialog).toBe(false);
      expect(result.current.showContinuityDialog).toBe(false);
    });
  });

  describe('对话框切换', () => {
    it('打开新对话框应该替换当前对话框', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openPreview();
      });

      expect(result.current.activeDialog).toBe('preview');

      act(() => {
        result.current.openHistory();
      });

      expect(result.current.activeDialog).toBe('history');
      expect(result.current.showPreviewDialog).toBe(false);
      expect(result.current.showHistoryDialog).toBe(true);
    });

    it('同一时间只能有一个对话框打开', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openPreview();
        result.current.openHistory();
      });

      // 最后打开的对话框应该是活动的
      expect(result.current.activeDialog).toBe('history');
      expect(result.current.showPreviewDialog).toBe(false);
      expect(result.current.showHistoryDialog).toBe(true);
      expect(result.current.showContinuityDialog).toBe(false);
    });
  });

  describe('资源侧边栏', () => {
    it('应该能切换资源侧边栏', () => {
      const { result } = renderHook(() => useDialogManager());

      expect(result.current.showResourceSidebar).toBe(true);

      act(() => {
        result.current.toggleResourceSidebar();
      });

      expect(result.current.showResourceSidebar).toBe(false);

      act(() => {
        result.current.toggleResourceSidebar();
      });

      expect(result.current.showResourceSidebar).toBe(true);
    });

    it('应该能直接设置资源侧边栏状态', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.setShowResourceSidebar(false);
      });

      expect(result.current.showResourceSidebar).toBe(false);

      act(() => {
        result.current.setShowResourceSidebar(true);
      });

      expect(result.current.showResourceSidebar).toBe(true);
    });

    it('资源侧边栏状态应该独立于对话框状态', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openPreview();
        result.current.toggleResourceSidebar();
      });

      expect(result.current.activeDialog).toBe('preview');
      expect(result.current.showResourceSidebar).toBe(false);

      act(() => {
        result.current.closeDialog();
      });

      expect(result.current.activeDialog).toBeNull();
      expect(result.current.showResourceSidebar).toBe(false); // 应该保持关闭状态
    });
  });

  describe('边界情况', () => {
    it('重复打开同一对话框应该保持打开状态', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openPreview();
        result.current.openPreview();
      });

      expect(result.current.activeDialog).toBe('preview');
      expect(result.current.showPreviewDialog).toBe(true);
    });

    it('关闭未打开的对话框应该不报错', () => {
      const { result } = renderHook(() => useDialogManager());

      expect(() => {
        act(() => {
          result.current.closeDialog();
        });
      }).not.toThrow();

      expect(result.current.activeDialog).toBeNull();
    });

    it('传入 null 应该关闭对话框', () => {
      const { result } = renderHook(() => useDialogManager());

      act(() => {
        result.current.openPreview();
      });

      act(() => {
        result.current.openDialog(null);
      });

      expect(result.current.activeDialog).toBeNull();
      expect(result.current.showPreviewDialog).toBe(false);
    });
  });

  describe('便捷方法', () => {
    it('所有便捷方法应该正确工作', () => {
      const { result } = renderHook(() => useDialogManager());

      // 测试 openPreview
      act(() => {
        result.current.openPreview();
      });
      expect(result.current.showPreviewDialog).toBe(true);

      // 测试 openHistory
      act(() => {
        result.current.openHistory();
      });
      expect(result.current.showHistoryDialog).toBe(true);
      expect(result.current.showPreviewDialog).toBe(false);

      // 测试 openContinuity
      act(() => {
        result.current.openContinuity();
      });
      expect(result.current.showContinuityDialog).toBe(true);
      expect(result.current.showHistoryDialog).toBe(false);
    });
  });
});
