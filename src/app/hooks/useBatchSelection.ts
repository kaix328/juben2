import { useState, useCallback } from 'react';

export interface BatchSelection {
  selectedIds: Set<string>;
  isAllSelected: boolean;
}

export function useBatchSelection(totalItems: number) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  const toggleBatchMode = useCallback(() => {
    setIsBatchMode(prev => !prev);
    if (isBatchMode) {
      setSelectedIds(new Set());
    }
  }, [isBatchMode]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const isAllSelected = selectedIds.size === totalItems && totalItems > 0;

  return {
    selectedIds,
    isBatchMode,
    isAllSelected,
    toggleBatchMode,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedIds.size,
  };
}
