/**
 * 对话框管理 Hook
 * 统一管理所有对话框的显示状态
 */

import { useState, useCallback } from 'react';

export type DialogType = 
  | 'preview' 
  | 'history' 
  | 'continuity' 
  | null;

export interface DialogState {
  activeDialog: DialogType;
  showResourceSidebar: boolean;
}

export function useDialogManager() {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [showResourceSidebar, setShowResourceSidebar] = useState(true);

  const openDialog = useCallback((type: DialogType) => {
    setActiveDialog(type);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
  }, []);

  const toggleResourceSidebar = useCallback(() => {
    setShowResourceSidebar(prev => !prev);
  }, []);

  return {
    // 状态
    activeDialog,
    showResourceSidebar,
    showPreviewDialog: activeDialog === 'preview',
    showHistoryDialog: activeDialog === 'history',
    showContinuityDialog: activeDialog === 'continuity',
    
    // 操作
    openDialog,
    closeDialog,
    setShowResourceSidebar,
    toggleResourceSidebar,
    
    // 便捷方法
    openPreview: () => openDialog('preview'),
    openHistory: () => openDialog('history'),
    openContinuity: () => openDialog('continuity'),
  };
}
