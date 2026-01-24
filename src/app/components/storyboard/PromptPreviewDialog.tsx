/**
 * 提示词预览对话框
 * 用于预览和编辑分镜提示词
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Copy, Check, Sparkles, Info, Zap, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { StoryboardPanel, Character, Scene, DirectorStyle } from '../../types';

interface PromptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel: StoryboardPanel;
  characters?: Character[];
  scenes?: Scene[];
  directorStyle?: DirectorStyle;
  onUpdate: (params: Partial<StoryboardPanel>) => void;
}

export function PromptPreviewDialog({
  open,
  onOpenChange,
  panel,
  characters = [],
  scenes = [],
  directorStyle,
  onUpdate,
}: PromptPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [targetPlatform, setTargetPlatform] = useState<string>('midjourney');
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // 🔧 使用 useMemo 缓存配置，避免不必要的重新生成
  const generationKey = useMemo(() => {
    return `${panel?.id}-${useEnhanced}-${targetPlatform}`;
  }, [panel?.id, useEnhanced, targetPlatform]);

  // 生成预览
  useEffect(() => {
    if (!panel || !open) return;
    
    setLoading(true);
    setError(null);
    
    // 🔧 使用 setTimeout 防抖，避免频繁重新生成
    const timer = setTimeout(() => {
      try {
        // 动态导入 PromptEngine
        import('../../utils/promptEngine').then(({ PromptEngine }) => {
          try {
            // 🔧 传入导演风格和配置
            const engine = new PromptEngine(directorStyle, {
              useProfessionalSkills: useEnhanced,
              targetPlatform: targetPlatform as any,
            });
            
            // 🔧 传入角色和场景数据
            const imageResult = engine.forStoryboardImage(panel, characters, scenes);
            setImagePrompt(imageResult.positive.replace(/\\n/g, '\n'));
            setNegativePrompt(imageResult.negative.replace(/\\n/g, '\n'));
            setMetadata(imageResult.metadata);

            // 🔧 传入角色数据
            const videoResult = engine.forStoryboardVideo(panel, characters);
            setVideoPrompt(videoResult.positive.replace(/\\n/g, '\n'));
            
            setLoading(false);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : '生成失败';
            setError(errorMsg);
            console.error('Failed to generate prompts:', err);
            toast.error(`生成提示词失败: ${errorMsg}`);
            setLoading(false);
          }
        }).catch(err => {
          const errorMsg = err instanceof Error ? err.message : '加载模块失败';
          setError(errorMsg);
          console.error('Failed to load PromptEngine:', err);
          toast.error(`加载失败: ${errorMsg}`);
          setLoading(false);
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '未知错误';
        setError(errorMsg);
        console.error('Failed to preview prompts:', err);
        toast.error(`预览失败: ${errorMsg}`);
        setLoading(false);
      }
    }, 300); // 300ms 防抖
    
    return () => clearTimeout(timer);
    // 🔧 只依赖 generationKey 和 open，避免无限循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationKey, open]);

  // 复制到剪贴板
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  // 🆕 分析提示词质量
  const analyzePromptQuality = (prompt: string) => {
    const suggestions: string[] = [];
    
    // 检查长度
    if (prompt.length > 500) {
      suggestions.push('提示词过长（超过 500 字符），建议精简以提高生成质量');
    }
    if (prompt.length < 50) {
      suggestions.push('提示词过短，建议添加更多细节描述');
    }
    
    // 检查关键元素
    const hasShot = /远景|全景|中景|近景|特写|shot|view/i.test(prompt);
    if (!hasShot) {
      suggestions.push('建议添加景别描述（如：远景、中景、特写等）');
    }
    
    const hasAngle = /平视|仰视|俯视|angle|perspective/i.test(prompt);
    if (!hasAngle) {
      suggestions.push('建议添加拍摄角度（如：平视、仰视、俯视等）');
    }
    
    const hasLighting = /光|lighting|light|照明|阳光|月光/i.test(prompt);
    if (!hasLighting) {
      suggestions.push('建议添加光线描述以增强氛围');
    }
    
    // 检查质量标签
    const hasQuality = /quality|detailed|professional|cinematic|高质量|精细/i.test(prompt);
    if (!hasQuality) {
      suggestions.push('建议添加质量标签（如：high quality, detailed 等）');
    }
    
    return suggestions;
  };

  // 保存提示词
  const handleSave = async () => {
    if (!panel) return;

    setSaving(true);
    try {
      onUpdate({
        aiPrompt: imagePrompt,
        aiVideoPrompt: videoPrompt,
      });
      toast.success('提示词已保存');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save prompts:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!panel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            提示词预览 - 分镜 #{panel.panelNumber}
          </DialogTitle>
          <DialogDescription>
            预览和编辑 AI 生成提示词，支持图像和视频两种模式
          </DialogDescription>
        </DialogHeader>

        {/* 🆕 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-700">正在生成提示词...</span>
          </div>
        )}

        {/* 🆕 错误提示 */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium">生成失败</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 配置选项 */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <Label htmlFor="enhanced" className="font-medium">
                使用增强版 v2.0
              </Label>
              <Badge variant={useEnhanced ? 'default' : 'secondary'} className="text-xs">
                {useEnhanced ? '专业增强' : '标准版'}
              </Badge>
            </div>
            <Switch
              id="enhanced"
              checked={useEnhanced}
              onCheckedChange={setUseEnhanced}
            />
          </div>

          {useEnhanced && (
            <div className="flex items-center gap-4">
              <Label htmlFor="platform" className="whitespace-nowrap">
                目标平台:
              </Label>
              <Select value={targetPlatform} onValueChange={setTargetPlatform}>
                <SelectTrigger id="platform" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midjourney">Midjourney</SelectItem>
                  <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                  <SelectItem value="nanobanana-pro">nanobananaPro</SelectItem>
                  <SelectItem value="runway">Runway</SelectItem>
                  <SelectItem value="pika">Pika</SelectItem>
                  <SelectItem value="sora">Sora</SelectItem>
                  <SelectItem value="kling">Kling (快手)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 元数据信息 */}
          {metadata && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>总词数: {metadata.totalParts}</span>
              <span>语言: {metadata.language === 'mixed' ? '中英混合' : metadata.language === 'zh' ? '中文' : '英文'}</span>
              {metadata.hasStyle && <Badge variant="outline">已应用导演风格</Badge>}
            </div>
          )}
        </div>

        {/* 提示词标签页 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'image' | 'video')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image">图像提示词</TabsTrigger>
            <TabsTrigger value="video">视频提示词</TabsTrigger>
          </TabsList>

          {/* 图像提示词 */}
          <TabsContent value="image" className="space-y-4">
            {/* 🆕 对比模式切换 */}
            {panel.aiPrompt && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <Label htmlFor="comparison" className="text-sm">
                  显示原始提示词对比
                </Label>
                <Switch
                  id="comparison"
                  checked={showComparison}
                  onCheckedChange={setShowComparison}
                />
              </div>
            )}

            {showComparison && panel.aiPrompt ? (
              // 🆕 对比视图
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">原始提示词</Label>
                  <Textarea
                    value={(panel.aiPrompt || '').replace(/\\n/g, '\n')}
                    readOnly
                    rows={8}
                    className="font-mono text-sm bg-gray-50"
                  />
                  <div className="text-xs text-gray-500">
                    词数: {panel.aiPrompt.split(',').filter(Boolean).length} 个
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-500">新生成提示词</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(imagePrompt)}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="text-xs text-gray-500">
                    词数: {imagePrompt.split(',').filter(Boolean).length} 个
                  </div>
                </div>
              </div>
            ) : (
              // 单一视图
              <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="image-positive">正面提示词</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(imagePrompt)}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="ml-2">复制</span>
                </Button>
              </div>
              <Textarea
                id="image-positive"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                placeholder="图像正面提示词..."
              />
              <div className="text-xs text-gray-500">
                词数: {imagePrompt.split(',').filter(Boolean).length} 个
              </div>
            </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="negative">负面提示词</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(negativePrompt)}
                >
                  <Copy className="w-4 h-4" />
                  <span className="ml-2">复制</span>
                </Button>
              </div>
              <Textarea
                id="negative"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={4}
                className="font-mono text-sm"
                placeholder="负面提示词..."
              />
              <div className="text-xs text-gray-500">
                词数: {negativePrompt.split(',').filter(Boolean).length} 个
              </div>
            </div>

            {/* 🆕 优化建议 */}
            {!loading && imagePrompt && (() => {
              const suggestions = analyzePromptQuality(imagePrompt);
              return suggestions.length > 0 ? (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium mb-2">💡 优化建议：</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </TabsContent>

          {/* 视频提示词 */}
          <TabsContent value="video" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="video-prompt">视频描述提示词</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(videoPrompt)}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="ml-2">复制</span>
                </Button>
              </div>
              <Textarea
                id="video-prompt"
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="视频描述提示词..."
              />
              <div className="text-xs text-gray-500">
                词数: {videoPrompt.split(/\s+/).filter(Boolean).length} 个
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">视频提示词使用建议：</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Runway/Sora: 使用自然语言描述，包含相机运动和动作细节</li>
                    <li>Pika: 简洁描述，重点突出运动和变化</li>
                    <li>Kling: 支持中文，可以使用中文描述</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存提示词'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
