/**
 * 移动端场景卡片
 * 专为手机和小屏幕设备优化的剧本场景卡片
 */
import React, { memo } from 'react';
import { Edit, Trash2, MoreVertical, MapPin, Clock, Users, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { ScriptScene } from '../../types';

export interface MobileSceneCardProps {
  scene: ScriptScene;
  sceneNumber: number;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 移动端场景卡片
 */
export const MobileSceneCard = memo(function MobileSceneCard({
  scene,
  sceneNumber,
  onEdit,
  onDelete,
}: MobileSceneCardProps) {
  // 计算统计信息
  const dialogueCount = scene.dialogues?.length || 0;
  const characterCount = new Set(scene.dialogues?.map(d => d.character) || []).size;
  
  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 overflow-hidden active:scale-[0.98] transition-transform touch-manipulation"
      onClick={onEdit}
    >
      {/* 顶部信息栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
            {sceneNumber}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              场景 {sceneNumber}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
              {scene.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{scene.location}</span>
                </div>
              )}
              {scene.timeOfDay && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{scene.timeOfDay}</span>
                </div>
              )}
            </div>
          </div>
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
              编辑场景
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

      {/* 场景描述 */}
      <div className="p-4 space-y-3">
        {/* 场景标题 */}
        {scene.slugline && (
          <div className="text-sm font-medium text-gray-900">
            {scene.slugline}
          </div>
        )}

        {/* 场景描述 */}
        {scene.action && (
          <p className="text-sm text-gray-700 line-clamp-3">
            {scene.action}
          </p>
        )}

        {/* 统计信息 */}
        <div className="flex items-center gap-3 pt-2">
          {characterCount > 0 && (
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              {characterCount} 角色
            </Badge>
          )}
          {dialogueCount > 0 && (
            <Badge variant="outline" className="gap-1">
              <MessageSquare className="w-3 h-3" />
              {dialogueCount} 对白
            </Badge>
          )}
        </div>

        {/* 对白预览 */}
        {scene.dialogues && scene.dialogues.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="space-y-2">
              {scene.dialogues.slice(0, 2).map((dialogue, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium text-blue-600">
                    {dialogue.character}:
                  </span>
                  <span className="text-gray-700 ml-2 line-clamp-1">
                    {dialogue.lines}
                  </span>
                </div>
              ))}
              {scene.dialogues.length > 2 && (
                <p className="text-xs text-gray-500 italic">
                  还有 {scene.dialogues.length - 2} 条对白...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部操作按钮 */}
      <div className="px-4 pb-4">
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-full h-11 gap-2 touch-manipulation"
        >
          <Edit className="w-4 h-4" />
          编辑场景
        </Button>
      </div>
    </div>
  );
});

MobileSceneCard.displayName = 'MobileSceneCard';

export default MobileSceneCard;
