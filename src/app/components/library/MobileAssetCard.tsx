/**
 * 移动端资源卡片
 * 专为手机和小屏幕设备优化的资源库卡片
 */
import React, { memo } from 'react';
import { MoreVertical, Download, Trash2, Eye, Copy, Image as ImageIcon, Film, Music, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { Asset } from '../../types';

export interface MobileAssetCardProps {
  asset: Asset;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onCopy?: () => void;
}

/**
 * 获取资源类型图标
 */
function getAssetIcon(type: string) {
  switch (type) {
    case 'image':
      return ImageIcon;
    case 'video':
      return Film;
    case 'audio':
      return Music;
    default:
      return FileText;
  }
}

/**
 * 获取资源类型标签
 */
function getAssetTypeLabel(type: string) {
  switch (type) {
    case 'image':
      return '图片';
    case 'video':
      return '视频';
    case 'audio':
      return '音频';
    default:
      return '文件';
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 移动端资源卡片
 */
export const MobileAssetCard = memo(function MobileAssetCard({
  asset,
  onView,
  onDownload,
  onDelete,
  onCopy,
}: MobileAssetCardProps) {
  const Icon = getAssetIcon(asset.type);
  const typeLabel = getAssetTypeLabel(asset.type);

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 overflow-hidden active:scale-[0.98] transition-transform touch-manipulation"
      onClick={onView}
    >
      {/* 预览区域 */}
      <div className="aspect-video bg-gray-100 relative">
        {asset.type === 'image' && asset.url ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : asset.type === 'video' && asset.url ? (
          <video
            src={asset.url}
            className="w-full h-full object-cover"
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* 类型标签 */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-black/70 text-white border-0">
            {typeLabel}
          </Badge>
        </div>

        {/* 操作菜单 */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="secondary" 
                size="icon"
                className="w-9 h-9 bg-white/90 hover:bg-white"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="py-3"
              >
                <Eye className="w-4 h-4 mr-2" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="py-3"
              >
                <Download className="w-4 h-4 mr-2" />
                下载
              </DropdownMenuItem>
              {onCopy && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  className="py-3"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  复制链接
                </DropdownMenuItem>
              )}
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
      </div>

      {/* 信息区域 */}
      <div className="p-3 space-y-2">
        {/* 文件名 */}
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 min-h-[40px]">
          {asset.name}
        </h3>

        {/* 元信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatFileSize(asset.size)}</span>
          {asset.createdAt && (
            <span>
              {new Date(asset.createdAt).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
        </div>

        {/* 标签 */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {asset.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{asset.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 快速操作按钮 */}
      <div className="px-3 pb-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="flex-1 h-10 touch-manipulation"
        >
          <Eye className="w-4 h-4 mr-2" />
          查看
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="h-10 px-4 touch-manipulation"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

MobileAssetCard.displayName = 'MobileAssetCard';

export default MobileAssetCard;
