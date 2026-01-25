/**
 * 剧本大纲视图
 * 提供剧本结构的鸟瞰图和快速编辑功能
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  List,
  Grid3x3,
  ChevronRight,
  ChevronDown,
  Clock,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Plus,
  Eye,
  BarChart3,
} from 'lucide-react';
import type { Script, ScriptScene } from '../../pages/ScriptEditor/types';

interface ScriptOutlineViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  script: Script;
  onJumpToScene: (sceneNumber: number) => void;
  onUpdateScene: (sceneId: string, updates: Partial<ScriptScene>) => void;
  onDeleteScene: (sceneId: string) => void;
  onAddScene: () => void;
}

interface OutlineNode {
  id: string;
  type: 'episode' | 'act' | 'scene';
  title: string;
  sceneNumber?: number;
  duration: number;
  sceneCount: number;
  children?: OutlineNode[];
  scene?: ScriptScene;
}

export function ScriptOutlineView({
  open,
  onOpenChange,
  script,
  onJumpToScene,
  onUpdateScene,
  onDeleteScene,
  onAddScene,
}: ScriptOutlineViewProps) {
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'grid'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['all']));
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // 构建大纲树结构
  const outlineTree = useMemo(() => {
    const tree: OutlineNode[] = [];
    const episodeMap = new Map<number, OutlineNode>();

    // 按集数分组
    script.scenes.forEach((scene) => {
      if (!episodeMap.has(scene.episodeNumber)) {
        const episodeNode: OutlineNode = {
          id: `episode-${scene.episodeNumber}`,
          type: 'episode',
          title: `第 ${scene.episodeNumber} 集`,
          duration: 0,
          sceneCount: 0,
          children: [],
        };
        episodeMap.set(scene.episodeNumber, episodeNode);
        tree.push(episodeNode);
      }

      const episodeNode = episodeMap.get(scene.episodeNumber)!;
      episodeNode.duration += scene.estimatedDuration;
      episodeNode.sceneCount += 1;

      // 添加场景节点
      const sceneNode: OutlineNode = {
        id: scene.id,
        type: 'scene',
        title: `场景 ${scene.sceneNumber}: ${scene.location}`,
        sceneNumber: scene.sceneNumber,
        duration: scene.estimatedDuration,
        sceneCount: 1,
        scene,
      };

      episodeNode.children!.push(sceneNode);
    });

    return tree;
  }, [script]);

  // 统计信息
  const stats = useMemo(() => {
    const totalScenes = script.scenes.length;
    const totalDuration = script.scenes.reduce((sum, s) => sum + s.estimatedDuration, 0);
    const episodes = new Set(script.scenes.map((s) => s.episodeNumber)).size;
    const locations = new Set(script.scenes.map((s) => s.location)).size;
    const characters = new Set(script.scenes.flatMap((s) => s.characters)).size;

    return {
      totalScenes,
      totalDuration: Math.round(totalDuration / 60),
      episodes,
      locations,
      characters,
    };
  }, [script]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleStartEdit = (node: OutlineNode) => {
    setEditingNode(node.id);
    setEditValue(node.scene?.location || '');
  };

  const handleSaveEdit = (node: OutlineNode) => {
    if (node.scene && editValue.trim()) {
      onUpdateScene(node.scene.id, { location: editValue.trim() });
    }
    setEditingNode(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingNode(null);
    setEditValue('');
  };

  const renderTreeNode = (node: OutlineNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isEditing = editingNode === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer
            ${level > 0 ? 'ml-6' : ''}
          `}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
        >
          {/* 展开/折叠按钮 */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {/* 节点图标 */}
          <div
            className={`
              p-1.5 rounded
              ${node.type === 'episode' ? 'bg-blue-100 text-blue-600' : ''}
              ${node.type === 'scene' ? 'bg-green-100 text-green-600' : ''}
            `}
          >
            {node.type === 'episode' && <BarChart3 className="w-4 h-4" />}
            {node.type === 'scene' && <MapPin className="w-4 h-4" />}
          </div>

          {/* 节点标题 */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(node);
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="h-8"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleSaveEdit(node)}>
                  保存
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  取消
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{node.title}</span>
                {node.scene && (
                  <>
                    <Badge variant="outline" className="text-xs">
                      {node.scene.sceneType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {node.scene.timeOfDay}
                    </Badge>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 时长 */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {Math.round(node.duration / 60)}分钟
          </div>

          {/* 场景数 */}
          {node.type === 'episode' && (
            <div className="text-xs text-gray-500">{node.sceneCount} 场景</div>
          )}

          {/* 操作按钮 */}
          {node.scene && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStartEdit(node)}
                className="h-7 w-7 p-0"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onJumpToScene(node.sceneNumber!);
                  onOpenChange(false);
                }}
                className="h-7 w-7 p-0"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteScene(node.scene!.id)}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div>{node.children!.map((child) => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-2">
        {script.scenes.map((scene) => (
          <div
            key={scene.id}
            className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    场景 {scene.sceneNumber}
                  </span>
                  <Badge variant="outline">{scene.sceneType}</Badge>
                  <Badge variant="outline">{scene.timeOfDay}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{scene.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onJumpToScene(scene.sceneNumber);
                    onOpenChange(false);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  查看
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.round(scene.estimatedDuration / 60)}分钟
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {scene.characters.length} 个角色
              </div>
            </div>

            {scene.action && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{scene.action}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {script.scenes.map((scene) => (
          <div
            key={scene.id}
            className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              onJumpToScene(scene.sceneNumber);
              onOpenChange(false);
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                  {scene.sceneNumber}
                </div>
                <div>
                  <Badge variant="outline" className="text-xs">
                    {scene.sceneType}
                  </Badge>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {scene.timeOfDay}
              </Badge>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
                <MapPin className="w-4 h-4" />
                {scene.location}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.round(scene.estimatedDuration / 60)}分
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {scene.characters.length}人
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <List className="w-5 h-5 text-blue-500" />
            剧本大纲视图
          </DialogTitle>
          <DialogDescription>剧本结构的鸟瞰图，快速浏览和编辑</DialogDescription>
        </DialogHeader>

        {/* 统计信息 */}
        <div className="grid grid-cols-5 gap-4 flex-shrink-0">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalScenes}</div>
            <div className="text-xs text-blue-700">总场景数</div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.totalDuration}</div>
            <div className="text-xs text-green-700">总时长(分钟)</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{stats.episodes}</div>
            <div className="text-xs text-purple-700">集数</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-2xl font-bold text-amber-600">{stats.locations}</div>
            <div className="text-xs text-amber-700">地点数</div>
          </div>
          <div className="p-3 rounded-lg bg-pink-50 border border-pink-200">
            <div className="text-2xl font-bold text-pink-600">{stats.characters}</div>
            <div className="text-xs text-pink-700">角色数</div>
          </div>
        </div>

        {/* 视图切换 */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="flex-shrink-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tree" className="gap-2">
              <List className="w-4 h-4" />
              树形视图
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              列表视图
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-2">
              <Grid3x3 className="w-4 h-4" />
              卡片视图
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'tree' && (
            <div className="space-y-1">
              {outlineTree.map((node) => renderTreeNode(node))}
            </div>
          )}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'grid' && renderGridView()}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={onAddScene} className="gap-2">
            <Plus className="w-4 h-4" />
            添加场景
          </Button>
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
