/**
 * 导出提示词对话框
 * 支持多平台格式导出
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
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Download, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { StoryboardPanel, Character, Scene, DirectorStyle } from '../../types';
import { exportAllPanelPrompts, type ExportPlatform } from '../../utils/prompts/generators';

interface ExportPromptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panels: StoryboardPanel[];
  characters: Character[];
  scenes: Scene[];
  directorStyle?: DirectorStyle;
  storyboardTitle?: string;
}

export function ExportPromptsDialog({
  open,
  onOpenChange,
  panels,
  characters,
  scenes,
  directorStyle,
  storyboardTitle = '分镜提示词',
}: ExportPromptsDialogProps) {
  const [platform, setPlatform] = useState<ExportPlatform>('generic');
  const [includeCharacterDefs, setIncludeCharacterDefs] = useState(true);
  const [includeNegative, setIncludeNegative] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exporting, setExporting] = useState(false);

  const platformOptions = [
    {
      value: 'generic' as ExportPlatform,
      label: '通用格式',
      description: '中英文混合，完整信息',
      badge: '推荐',
    },
    {
      value: 'midjourney' as ExportPlatform,
      label: 'Midjourney',
      description: '纯英文，--ar --style 参数',
      badge: null,
    },
    {
      value: 'stable-diffusion' as ExportPlatform,
      label: 'Stable Diffusion',
      description: '纯英文，支持权重语法',
      badge: null,
    },
    {
      value: 'runway' as ExportPlatform,
      label: 'Runway Gen-3',
      description: '视频生成，--resolution --duration',
      badge: '视频',
    },
    {
      value: 'pika' as ExportPlatform,
      label: 'Pika',
      description: '简洁自然语言',
      badge: '视频',
    },
  ];

  const handleExport = async () => {
    if (panels.length === 0) {
      toast.error('没有可导出的分镜');
      return;
    }

    setExporting(true);
    try {
      // 生成提示词内容
      const content = exportAllPanelPrompts(
        panels,
        characters,
        scenes,
        directorStyle,
        platform
      );

      // 创建下载
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${storyboardTitle}_${platform}_prompts.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`已导出 ${panels.length} 个分镜的提示词`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            导出提示词
          </DialogTitle>
          <DialogDescription>
            选择目标平台和导出选项，将生成 Markdown 格式的提示词文档
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 平台选择 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">目标平台</Label>
            <RadioGroup value={platform} onValueChange={(v) => setPlatform(v as ExportPlatform)}>
              <div className="space-y-2">
                {platformOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      platform === option.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPlatform(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={option.value} className="font-medium cursor-pointer">
                          {option.label}
                        </Label>
                        {option.badge && (
                          <Badge variant={option.badge === '推荐' ? 'default' : 'secondary'} className="text-xs">
                            {option.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* 导出选项 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">导出选项</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="character-defs"
                  checked={includeCharacterDefs}
                  onCheckedChange={(checked) => setIncludeCharacterDefs(checked as boolean)}
                />
                <Label htmlFor="character-defs" className="cursor-pointer">
                  包含角色定义（触发词和外貌描述）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="negative"
                  checked={includeNegative}
                  onCheckedChange={(checked) => setIncludeNegative(checked as boolean)}
                />
                <Label htmlFor="negative" className="cursor-pointer">
                  包含负面提示词
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                />
                <Label htmlFor="metadata" className="cursor-pointer">
                  包含元数据（时长、转场等）
                </Label>
              </div>
            </div>
          </div>

          {/* 预览信息 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">将导出以下内容：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{panels.length} 个分镜的图像提示词</li>
                  <li>{panels.length} 个分镜的视频提示词</li>
                  {includeCharacterDefs && <li>{characters.length} 个角色定义</li>}
                  {includeNegative && <li>负面提示词（通用）</li>}
                  {includeMetadata && <li>分镜元数据（时长、转场、镜头参数）</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出 Markdown
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
