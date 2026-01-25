/**
 * 批量生成视频提示词对话框
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import { Video, Loader2, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { StoryboardPanel } from '../../types';
import type { VideoPlatform } from '../../utils/exportUtils';

interface VideoPromptGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panels: StoryboardPanel[];
  selectedPanels: Set<string>;
  onGenerate: (platform: VideoPlatform) => Promise<void>;
}

export function VideoPromptGenerationDialog({
  open,
  onOpenChange,
  panels,
  selectedPanels,
  onGenerate,
}: VideoPromptGenerationDialogProps) {
  const [platform, setPlatform] = useState<VideoPlatform>('runway');
  const [generating, setGenerating] = useState(false);

  const platformOptions = [
    {
      value: 'runway' as VideoPlatform,
      label: 'Runway Gen-3',
      description: '专业视频生成，支持复杂镜头运动',
      badge: '推荐',
      features: ['4K分辨率', '最长10秒', '精确镜头控制'],
    },
    {
      value: 'pika' as VideoPlatform,
      label: 'Pika',
      description: '快速生成，适合短视频和动画',
      badge: '快速',
      features: ['1080p分辨率', '最长3秒', '简洁提示词'],
    },
    {
      value: 'kling' as VideoPlatform,
      label: '可灵 (Kling)',
      description: '国产平台，支持中文提示词',
      badge: '中文',
      features: ['支持中文', '最长5秒', '本地化优化'],
    },
    {
      value: 'sora' as VideoPlatform,
      label: 'Sora (OpenAI)',
      description: '最先进的视频生成模型',
      badge: '高级',
      features: ['最高质量', '最长60秒', '物理真实感'],
    },
  ];

  const handleGenerate = async () => {
    if (panels.length === 0) {
      toast.error('没有可生成的分镜');
      return;
    }

    setGenerating(true);
    try {
      await onGenerate(platform);
    } catch (error) {
      console.error('Generate video prompts failed:', error);
      toast.error('生成视频提示词失败');
    } finally {
      setGenerating(false);
    }
  };

  const targetCount = selectedPanels.size > 0 ? selectedPanels.size : panels.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-500" />
            批量生成视频提示词
          </DialogTitle>
          <DialogDescription>
            为 {targetCount} 个分镜生成专业的视频提示词，支持多个主流AI视频平台
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 平台选择 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">选择目标平台</Label>
            <RadioGroup value={platform} onValueChange={(v) => setPlatform(v as VideoPlatform)}>
              <div className="space-y-3">
                {platformOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      platform === option.value
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPlatform(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor={option.value} className="font-medium cursor-pointer">
                          {option.label}
                        </Label>
                        {option.badge && (
                          <Badge 
                            variant={option.badge === '推荐' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {option.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{option.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {option.features.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* 生成说明 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">生成内容包括：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>镜头运动描述（推拉摇移跟升降）</li>
                  <li>角色动作和表情</li>
                  <li>环境动态效果</li>
                  <li>灯光和氛围</li>
                  <li>上下文连贯性（前后镜衔接）</li>
                  <li>平台特定格式优化</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 预览信息 */}
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-emerald-700">
                <p className="font-medium mb-1">将为以下分镜生成视频提示词：</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold">{targetCount}</span>
                  <span>个分镜</span>
                  {selectedPanels.size > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      已选中
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 平台特性说明 */}
          {platform === 'runway' && (
            <div className="p-3 bg-purple-50 rounded border border-purple-200 text-sm text-purple-700">
              <p className="font-medium mb-1">Runway Gen-3 特性：</p>
              <p>支持复杂的镜头运动和精确的参数控制，适合专业影视制作。生成的提示词将包含 --resolution 和 --duration 参数。</p>
            </div>
          )}
          {platform === 'pika' && (
            <div className="p-3 bg-orange-50 rounded border border-orange-200 text-sm text-orange-700">
              <p className="font-medium mb-1">Pika 特性：</p>
              <p>使用简洁自然的语言描述，生成速度快，适合快速预览和迭代。提示词将优化为前10个关键词。</p>
            </div>
          )}
          {platform === 'kling' && (
            <div className="p-3 bg-red-50 rounded border border-red-200 text-sm text-red-700">
              <p className="font-medium mb-1">可灵特性：</p>
              <p>支持中文提示词，本地化优化，适合国内用户。生成的提示词将添加 #标签 格式。</p>
            </div>
          )}
          {platform === 'sora' && (
            <div className="p-3 bg-indigo-50 rounded border border-indigo-200 text-sm text-indigo-700">
              <p className="font-medium mb-1">Sora 特性：</p>
              <p>OpenAI 最先进的视频生成模型，支持长视频和复杂场景。提示词将优化为详细的自然语言描述。</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            取消
          </Button>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                开始生成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
