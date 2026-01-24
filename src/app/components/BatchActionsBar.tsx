import { Trash2, Tag, Download, Copy, CheckSquare, Square } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface BatchActionsBarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchDelete?: () => void;
  onBatchAddTag?: () => void;
  onBatchExport?: () => void;
  onBatchCopy?: () => void;
  onBatchGenerate?: () => void;
}

export function BatchActionsBar({
  selectedCount,
  totalCount,
  isAllSelected,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
  onBatchAddTag,
  onBatchExport,
  onBatchCopy,
  onBatchGenerate,
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4">
        {/* 选择状态 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={isAllSelected ? onClearSelection : onSelectAll}
            className="text-white hover:bg-white/20 h-8"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 mr-2" />
            ) : (
              <Square className="w-4 h-4 mr-2" />
            )}
            {isAllSelected ? '取消全选' : '全选'}
          </Button>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            已选 {selectedCount} / {totalCount}
          </Badge>
        </div>

        <div className="w-px h-6 bg-white/30" />

        {/* 批量操作按钮 */}
        <div className="flex items-center gap-2">
          {onBatchAddTag && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchAddTag}
              className="text-white hover:bg-white/20 h-8"
            >
              <Tag className="w-4 h-4 mr-2" />
              添加标签
            </Button>
          )}

          {onBatchGenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchGenerate}
              className="text-white hover:bg-white/20 h-8"
            >
              <Download className="w-4 h-4 mr-2" />
              批量生成
            </Button>
          )}

          {onBatchExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchExport}
              className="text-white hover:bg-white/20 h-8"
            >
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          )}

          {onBatchCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchCopy}
              className="text-white hover:bg-white/20 h-8"
            >
              <Copy className="w-4 h-4 mr-2" />
              复制
            </Button>
          )}

          {onBatchDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchDelete}
              className="text-white hover:bg-red-500/20 h-8"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </Button>
          )}
        </div>

        <div className="w-px h-6 bg-white/30" />

        {/* 取消按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-white hover:bg-white/20 h-8"
        >
          取消
        </Button>
      </div>
    </div>
  );
}
