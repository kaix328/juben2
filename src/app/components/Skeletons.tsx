/**
 * Skeleton 加载占位组件集合
 * 提供各种场景的骨架屏
 */
import React from 'react';
import { cn } from '../lib/utils';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader } from './ui/card';

// ============ 基础骨架 ============

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/**
 * 文本骨架
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

/**
 * 头像骨架
 */
export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />;
}

/**
 * 按钮骨架
 */
export function SkeletonButton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-8 w-16',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return <Skeleton className={cn('rounded-md', sizeClasses[size], className)} />;
}

// ============ 卡片骨架 ============

/**
 * 项目卡片骨架
 */
export function SkeletonProjectCard({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <Skeleton className="aspect-video w-full" />
      <CardContent className="pt-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

/**
 * 分镜卡片骨架
 */
export function SkeletonPanelCard({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <SkeletonText lines={2} />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 场景卡片骨架
 */
export function SkeletonSceneCard({ className }: { className?: string }) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          <SkeletonText lines={2} />
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 角色卡片骨架
 */
export function SkeletonCharacterCard({ className }: { className?: string }) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </Card>
  );
}

// ============ 列表骨架 ============

/**
 * 项目列表骨架
 */
export function SkeletonProjectList({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProjectCard key={i} />
      ))}
    </div>
  );
}

/**
 * 分镜列表骨架
 */
export function SkeletonPanelList({
  count = 6,
  columns = 3,
  className,
}: {
  count?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPanelCard key={i} />
      ))}
    </div>
  );
}

/**
 * 场景列表骨架
 */
export function SkeletonSceneList({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonSceneCard key={i} />
      ))}
    </div>
  );
}

// ============ 页面骨架 ============

/**
 * 分镜编辑器页面骨架
 */
export function SkeletonStoryboardEditor({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* 分镜网格 */}
      <SkeletonPanelList count={9} columns={3} />
    </div>
  );
}

/**
 * 剧本编辑器页面骨架
 */
export function SkeletonScriptEditor({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* 统计面板 */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-12" />
          </Card>
        ))}
      </div>

      {/* 场景列表 */}
      <SkeletonSceneList count={3} />
    </div>
  );
}

/**
 * 资源库页面骨架
 */
export function SkeletonAssetLibrary({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 标签页 */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-lg" />
        ))}
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* 资源网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCharacterCard key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * 数据统计页面骨架
 */
export function SkeletonDashboard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* 进度条 */}
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-4 w-full rounded-full" />
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-16" />
          </Card>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-48 w-full" />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    </div>
  );
}

// ============ 通用加载组件 ============

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  className?: string;
}

/**
 * 加载遮罩层
 */
export function LoadingOverlay({ visible, message, className }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50',
        className
      )}
    >
      <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        {message && <p className="text-gray-600 font-medium">{message}</p>}
      </div>
    </div>
  );
}

/**
 * 内联加载指示器
 */
export function InlineLoader({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={cn(
        'border-gray-200 border-t-purple-600 rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}

export default {
  Text: SkeletonText,
  Avatar: SkeletonAvatar,
  Button: SkeletonButton,
  ProjectCard: SkeletonProjectCard,
  PanelCard: SkeletonPanelCard,
  SceneCard: SkeletonSceneCard,
  CharacterCard: SkeletonCharacterCard,
  ProjectList: SkeletonProjectList,
  PanelList: SkeletonPanelList,
  SceneList: SkeletonSceneList,
  StoryboardEditor: SkeletonStoryboardEditor,
  ScriptEditor: SkeletonScriptEditor,
  AssetLibrary: SkeletonAssetLibrary,
  Dashboard: SkeletonDashboard,
  LoadingOverlay,
  InlineLoader,
};
