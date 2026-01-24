/**
 * 移动端简化分镜卡片
 * 专为手机和小屏幕设备优化
 */
import React, { memo } from 'react';
import { Sparkles, Trash2, Edit, MoreVertical, Clock, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { StoryboardPanel } from '../../types';
import type { PanelStatus } from '../../pages/StoryboardEditor/types';
import { ClickableImage } from '../ImagePreviewDialog';

export interface MobileShotCardProps {
  panel: StoryboardPanel;
  isSelected: boolean;
  status?: PanelStatus;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateImage: () => Promise<any>;
  onCopy: () => void;
}

/**
 * 移动端简化分镜卡片
 */
export const MobileShotCard = memo(function MobileShotCard({
  panel,
  isSelected,
  status = 'idle',
  onSelect,
  onEdit,
  onDelete,
  onGenerateImage,
  onCopy,
}: MobileShotCardProps) {
  const statusStyles: Record<PanelStatus, { label: string; color: string }> = {
    idle: { label: '', color: '' },
    pending: { label: '排队中', color: 'bg-yellow-100 text-yellow-700' },
    processing: { label: '生成中', color: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
    failed: { label: '失败', color: 'bg-red-100 text-red-700' },
    cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700' }
  };
  
  const currentStatus = statusStyles[status] || statusStyles['idle'];

  return (
    <div 
      className={`
        relative rounded-xl overflow-hidden
        transition-all duration-200
        ${isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'bg-white border border-gray-200'
        }
        active:scale-[0.98]
        touch-manipulation
      `}
      onClick={onEdit}
    >
      {/* 顶部信息栏 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-6 h-6"
          />
          <span className="text-lg font-bold text-gray-700">
            #{panel.panelNumber}
          </span>
          {status !== 'idle' && currentStatus.label && (
            <Badge className={`text-xs ${currentStatus.color}`}>
              {currentStatus.label}
            </Badge>
          )}
        </div>
        
        {/* 操作菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon"
              className="w-11 h-11 touch-manipulation"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="py-3"
            >
              <Edit className="w-4 h-4 mr-2" />
              编辑分镜
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onGenerateImage();
              }}
              className="py-3"
              disabled={status === 'processing'}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              生成图片
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className="py-3"
            >
              <Users className="w-4 h-4 mr-2" />
              复制分镜
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="py-3 text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 预览图 */}
      <div className="aspect-video bg-gray-100 relative">
        {panel.generatedImage ? (
          <ClickableImage
            src={panel.generatedImage}
            alt={`分镜 ${panel.panelNumber}`}
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">点击生成预览图</p>
            </div>
          </div>
        )}
        
        {/* 状态指示器 */}
        {status === 'processing' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">生成中...</p>
            </div>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="p-3 space-y-2">
        {/* 基本信息 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Badge variant="outline" className="text-xs">
            {panel.shot}
          </Badge>
          {panel.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{panel.duration}s</span>
            </div>
          )}
          {panel.characters?.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{panel.characters.length}角色</span>
            </div>
          )}
        </div>

        {/* 描述 */}
        <p className="text-sm text-gray-700 line-clamp-2 min-h-[40px]">
          {panel.description || '暂无描述'}
        </p>

        {/* 对白 */}
        {panel.dialogue && (
          <p className="text-xs text-blue-600 italic line-clamp-1">
            "{panel.dialogue}"
          </p>
        )}
      </div>

      {/* 快速操作按钮 */}
      <div className="px-3 pb-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onGenerateImage();
          }}
          disabled={status === 'processing'}
          className="flex-1 h-11 touch-manipulation"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {panel.generatedImage ? '重新生成' : '生成图片'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="h-11 px-4 touch-manipulation"
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

MobileShotCard.displayName = 'MobileShotCard';

export default MobileShotCard;
