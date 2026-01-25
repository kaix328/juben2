/**
 * 场景连贯性检查器
 * 检查剧本中的逻辑连贯性、时间线、角色一致性等问题
 */

import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Clock,
  Users,
  MapPin,
  Zap,
  TrendingUp,
  Eye,
} from 'lucide-react';
import type { Script, ScriptScene } from '../../pages/ScriptEditor/types';

interface ContinuityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'timeline' | 'character' | 'location' | 'logic' | 'pacing';
  sceneNumber: number;
  title: string;
  description: string;
  suggestion?: string;
}

interface SceneContinuityCheckerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  script: Script;
  onJumpToScene: (sceneNumber: number) => void;
}

export function SceneContinuityChecker({
  open,
  onOpenChange,
  script,
  onJumpToScene,
}: SceneContinuityCheckerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 执行连贯性检查
  const issues = useMemo(() => {
    const foundIssues: ContinuityIssue[] = [];
    const scenes = script.scenes;

    // 1. 时间线检查
    const timeOfDaySequence: string[] = [];
    scenes.forEach((scene, index) => {
      timeOfDaySequence.push(scene.timeOfDay);

      // 检查不合理的时间跳转
      if (index > 0) {
        const prev = scenes[index - 1];
        const curr = scene;

        // 同一地点，时间倒退
        if (prev.location === curr.location && prev.episodeNumber === curr.episodeNumber) {
          const timeOrder = ['清晨', '早晨', '上午', '中午', '下午', '傍晚', '黄昏', '夜晚', '深夜', '凌晨'];
          const prevIndex = timeOrder.indexOf(prev.timeOfDay);
          const currIndex = timeOrder.indexOf(curr.timeOfDay);

          if (prevIndex !== -1 && currIndex !== -1 && currIndex < prevIndex - 1) {
            foundIssues.push({
              id: `timeline-${scene.id}`,
              type: 'warning',
              category: 'timeline',
              sceneNumber: scene.sceneNumber,
              title: '时间线可能倒退',
              description: `场景 ${prev.sceneNumber} (${prev.timeOfDay}) 到场景 ${scene.sceneNumber} (${scene.timeOfDay})，同一地点时间似乎倒退了`,
              suggestion: '检查是否需要添加过渡场景或调整时间设定',
            });
          }
        }
      }
    });

    // 2. 角色一致性检查
    const characterFirstAppearance = new Map<string, number>();
    const characterScenes = new Map<string, number[]>();

    scenes.forEach((scene) => {
      scene.characters.forEach((char) => {
        if (!characterFirstAppearance.has(char)) {
          characterFirstAppearance.set(char, scene.sceneNumber);
        }
        if (!characterScenes.has(char)) {
          characterScenes.set(char, []);
        }
        characterScenes.get(char)!.push(scene.sceneNumber);
      });

      // 检查对白中提到但未在角色列表中的角色
      scene.dialogues.forEach((dialogue) => {
        if (!scene.characters.includes(dialogue.character)) {
          foundIssues.push({
            id: `character-missing-${scene.id}-${dialogue.id}`,
            type: 'error',
            category: 'character',
            sceneNumber: scene.sceneNumber,
            title: '角色列表缺失',
            description: `角色 "${dialogue.character}" 有对白但未在场景角色列表中`,
            suggestion: '将该角色添加到场景的角色列表中',
          });
        }
      });
    });

    // 检查角色突然消失又出现
    characterScenes.forEach((sceneNumbers, character) => {
      for (let i = 1; i < sceneNumbers.length; i++) {
        const gap = sceneNumbers[i] - sceneNumbers[i - 1];
        if (gap > 10) {
          foundIssues.push({
            id: `character-gap-${character}-${i}`,
            type: 'info',
            category: 'character',
            sceneNumber: sceneNumbers[i],
            title: '角色长时间未出现',
            description: `角色 "${character}" 在场景 ${sceneNumbers[i - 1]} 后消失了 ${gap} 个场景`,
            suggestion: '考虑是否需要交代角色去向或添加过渡',
          });
        }
      }
    });

    // 3. 地点连贯性检查
    scenes.forEach((scene, index) => {
      if (index > 0) {
        const prev = scenes[index - 1];
        const curr = scene;

        // 检查地点突然变化但没有过渡
        if (prev.location !== curr.location && prev.episodeNumber === curr.episodeNumber) {
          const hasTransition = prev.transition && prev.transition.trim() !== '';
          const locationDistance = getLocationDistance(prev.location, curr.location);

          if (locationDistance === 'far' && !hasTransition) {
            foundIssues.push({
              id: `location-${scene.id}`,
              type: 'warning',
              category: 'location',
              sceneNumber: scene.sceneNumber,
              title: '地点跳转缺少过渡',
              description: `从 "${prev.location}" 到 "${curr.location}" 距离较远，建议添加转场`,
              suggestion: '添加转场说明（如：CUT TO、DISSOLVE TO）或过渡场景',
            });
          }
        }
      }
    });

    // 4. 逻辑连贯性检查
    scenes.forEach((scene, index) => {
      // 检查空场景
      if (!scene.action && scene.dialogues.length === 0) {
        foundIssues.push({
          id: `empty-${scene.id}`,
          type: 'error',
          category: 'logic',
          sceneNumber: scene.sceneNumber,
          title: '空场景',
          description: '场景没有动作描述也没有对白',
          suggestion: '添加场景内容或删除此场景',
        });
      }

      // 检查只有动作没有角色
      if (scene.action && scene.characters.length === 0 && scene.dialogues.length === 0) {
        foundIssues.push({
          id: `no-character-${scene.id}`,
          type: 'warning',
          category: 'logic',
          sceneNumber: scene.sceneNumber,
          title: '场景无角色',
          description: '场景有动作描述但没有角色出现',
          suggestion: '确认是否为环境描写场景，或添加相关角色',
        });
      }

      // 检查场景时长异常
      if (scene.estimatedDuration > 600) {
        foundIssues.push({
          id: `long-scene-${scene.id}`,
          type: 'warning',
          category: 'pacing',
          sceneNumber: scene.sceneNumber,
          title: '场景过长',
          description: `场景时长 ${Math.round(scene.estimatedDuration / 60)} 分钟，可能过长`,
          suggestion: '考虑拆分为多个场景以保持节奏',
        });
      }

      if (scene.estimatedDuration < 10 && scene.dialogues.length > 0) {
        foundIssues.push({
          id: `short-scene-${scene.id}`,
          type: 'info',
          category: 'pacing',
          sceneNumber: scene.sceneNumber,
          title: '场景过短',
          description: `场景时长仅 ${scene.estimatedDuration} 秒，可能过短`,
          suggestion: '考虑与相邻场景合并或扩充内容',
        });
      }
    });

    // 5. 节奏检查
    const episodeDurations = new Map<number, number>();
    scenes.forEach((scene) => {
      const current = episodeDurations.get(scene.episodeNumber) || 0;
      episodeDurations.set(scene.episodeNumber, current + scene.estimatedDuration);
    });

    episodeDurations.forEach((duration, episode) => {
      const minutes = Math.round(duration / 60);
      if (minutes < 20) {
        foundIssues.push({
          id: `episode-short-${episode}`,
          type: 'warning',
          category: 'pacing',
          sceneNumber: scenes.find((s) => s.episodeNumber === episode)?.sceneNumber || 1,
          title: `第 ${episode} 集时长过短`,
          description: `总时长约 ${minutes} 分钟，可能不足`,
          suggestion: '考虑增加场景或扩充现有场景内容',
        });
      } else if (minutes > 60) {
        foundIssues.push({
          id: `episode-long-${episode}`,
          type: 'warning',
          category: 'pacing',
          sceneNumber: scenes.find((s) => s.episodeNumber === episode)?.sceneNumber || 1,
          title: `第 ${episode} 集时长过长`,
          description: `总时长约 ${minutes} 分钟，可能过长`,
          suggestion: '考虑删减场景或拆分为多集',
        });
      }
    });

    return foundIssues;
  }, [script]);

  // 按类别筛选
  const filteredIssues = useMemo(() => {
    if (selectedCategory === 'all') return issues;
    return issues.filter((issue) => issue.category === selectedCategory);
  }, [issues, selectedCategory]);

  // 统计
  const stats = useMemo(() => {
    const errors = issues.filter((i) => i.type === 'error').length;
    const warnings = issues.filter((i) => i.type === 'warning').length;
    const infos = issues.filter((i) => i.type === 'info').length;

    return { errors, warnings, infos, total: issues.length };
  }, [issues]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'timeline':
        return Clock;
      case 'character':
        return Users;
      case 'location':
        return MapPin;
      case 'logic':
        return Zap;
      case 'pacing':
        return TrendingUp;
      default:
        return Info;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      default:
        return Info;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            场景连贯性检查
          </DialogTitle>
          <DialogDescription>
            自动检测剧本中的时间线、角色、地点、逻辑和节奏问题
          </DialogDescription>
        </DialogHeader>

        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">总问题数</div>
          </div>
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <div className="text-sm text-red-700">错误</div>
          </div>
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-2xl font-bold text-amber-600">{stats.warnings}</div>
            <div className="text-sm text-amber-700">警告</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.infos}</div>
            <div className="text-sm text-blue-700">提示</div>
          </div>
        </div>

        {/* 分类标签 */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-shrink-0">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">全部 ({issues.length})</TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1">
              <Clock className="w-3 h-3" />
              时间线
            </TabsTrigger>
            <TabsTrigger value="character" className="gap-1">
              <Users className="w-3 h-3" />
              角色
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-1">
              <MapPin className="w-3 h-3" />
              地点
            </TabsTrigger>
            <TabsTrigger value="logic" className="gap-1">
              <Zap className="w-3 h-3" />
              逻辑
            </TabsTrigger>
            <TabsTrigger value="pacing" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              节奏
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 问题列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <CheckCircle2 className="w-16 h-16 mb-4 text-green-500" />
              <p className="text-lg font-medium text-green-600">
                {selectedCategory === 'all' ? '未发现问题！' : '该类别未发现问题'}
              </p>
              <p className="text-sm mt-2">剧本连贯性良好</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => {
                const TypeIcon = getTypeIcon(issue.type);
                const CategoryIcon = getCategoryIcon(issue.category);
                const typeColor = getTypeColor(issue.type);

                return (
                  <div
                    key={issue.id}
                    className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <TypeIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${typeColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                          <Badge variant="outline" className="gap-1">
                            <CategoryIcon className="w-3 h-3" />
                            场景 {issue.sceneNumber}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                        {issue.suggestion && (
                          <div className="p-2 rounded bg-blue-50 border border-blue-200">
                            <p className="text-xs text-blue-700">
                              <strong>建议：</strong>
                              {issue.suggestion}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onJumpToScene(issue.sceneNumber);
                          onOpenChange(false);
                        }}
                      >
                        跳转
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 辅助函数：判断地点距离
function getLocationDistance(loc1: string, loc2: string): 'near' | 'far' {
  // 简单的启发式判断
  const indoor = ['房间', '客厅', '卧室', '厨房', '办公室', '教室', '会议室'];
  const outdoor = ['街道', '公园', '广场', '山', '海边', '森林'];

  const loc1Indoor = indoor.some((keyword) => loc1.includes(keyword));
  const loc2Indoor = indoor.some((keyword) => loc2.includes(keyword));

  const loc1Outdoor = outdoor.some((keyword) => loc1.includes(keyword));
  const loc2Outdoor = outdoor.some((keyword) => loc2.includes(keyword));

  // 室内到室外，或不同类型的地点，认为距离较远
  if ((loc1Indoor && loc2Outdoor) || (loc1Outdoor && loc2Indoor)) {
    return 'far';
  }

  // 包含相同关键词，认为距离较近
  const commonWords = loc1.split('').filter((char) => loc2.includes(char));
  if (commonWords.length > 2) {
    return 'near';
  }

  return 'far';
}
