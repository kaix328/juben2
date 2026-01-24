/**
 * 增强的提示词编辑器
 * 支持：模板选择、语法高亮、权重调整、正负提示词分离
 */

import React, { useState, useCallback } from 'react';
import { Wand2, Copy, Trash2, Plus, Minus, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { PromptTemplateSelector } from '../PromptTemplateSelector';
import { toast } from 'sonner';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  type: 'image' | 'video';
  templateType?: 'character' | 'scene' | 'prop' | 'costume';
  templateSubType?: 'fullBody' | 'face' | 'wide' | 'medium' | 'closeup';
  showNegativePrompt?: boolean;
  negativeValue?: string;
  onNegativeChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PromptEditor({
  value,
  onChange,
  type,
  templateType = 'scene',
  templateSubType = 'wide',
  showNegativePrompt = true,
  negativeValue = '',
  onNegativeChange,
  placeholder = '输入提示词...',
  className = '',
}: PromptEditorProps) {
  const [selectedText, setSelectedText] = useState('');
  const [weight, setWeight] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');

  // 处理文本选择
  const handleTextSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selected = target.value.substring(target.selectionStart, target.selectionEnd);
    setSelectedText(selected);
  }, []);

  // 应用权重到选中文本
  const applyWeight = useCallback(() => {
    if (!selectedText) {
      toast.warning('请先选中要调整权重的文本');
      return;
    }

    const weightedText = `(${selectedText}:${weight.toFixed(1)})`;
    const newValue = value.replace(selectedText, weightedText);
    onChange(newValue);
    toast.success(`已应用权重 ${weight.toFixed(1)}`);
  }, [selectedText, weight, value, onChange]);

  // 插入模板
  const handleInsertTemplate = useCallback((template: string) => {
    const newValue = value ? `${value}, ${template}` : template;
    onChange(newValue);
    toast.success('已插入模板');
  }, [value, onChange]);

  // 清空提示词
  const handleClear = useCallback(() => {
    onChange('');
    toast.success('已清空');
  }, [onChange]);

  // 复制提示词
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    toast.success('已复制到剪贴板');
  }, [value]);

  // 统计信息
  const wordCount = value.split(/[,，]/).filter(Boolean).length;
  const charCount = value.length;

  // 语法高亮（简单实现）
  const highlightSyntax = (text: string) => {
    // 高亮权重语法 (word:1.2)
    const weightPattern = /\(([^:]+):(\d+\.?\d*)\)/g;
    const highlighted = text.replace(weightPattern, (match, word, w) => {
      const weightNum = parseFloat(w);
      const color = weightNum > 1.0 ? 'text-green-600' : weightNum < 1.0 ? 'text-orange-600' : 'text-gray-700';
      return `<span class="${color} font-semibold">${match}</span>`;
    });
    return highlighted;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Label className="text-sm font-medium text-gray-700">
            {type === 'image' ? '绘画提示词' : '视频提示词'}
          </Label>
          <Badge variant="outline" className="text-xs">
            {wordCount} 词 / {charCount} 字符
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          {/* 模板选择器 */}
          <PromptTemplateSelector
            type={templateType}
            subType={templateSubType}
            onSelect={handleInsertTemplate}
          />

          {/* 复制按钮 */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8 gap-1"
            title="复制提示词"
          >
            <Copy className="w-3 h-3" />
            复制
          </Button>

          {/* 清空按钮 */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleClear}
            className="h-8 gap-1 text-red-600 hover:bg-red-50"
            title="清空提示词"
          >
            <Trash2 className="w-3 h-3" />
            清空
          </Button>
        </div>
      </div>

      {/* 正负提示词标签页 */}
      {showNegativePrompt ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'positive' | 'negative')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="positive" className="gap-2">
              <Sparkles className="w-4 h-4" />
              正面提示词
            </TabsTrigger>
            <TabsTrigger value="negative" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              负面提示词
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positive" className="space-y-3">
            {/* 正面提示词编辑区 */}
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onSelect={handleTextSelect}
              className="min-h-[120px] text-sm font-mono bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-200"
              placeholder={placeholder}
            />

            {/* 权重调整工具 */}
            {selectedText && (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-purple-900">选中文本权重:</span>
                    <Badge variant="outline" className="font-mono">
                      {selectedText.substring(0, 20)}{selectedText.length > 20 ? '...' : ''}
                    </Badge>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{weight.toFixed(1)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setWeight(Math.max(0.1, weight - 0.1))}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>

                  <Slider
                    value={[weight]}
                    onValueChange={(v) => setWeight(v[0])}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    className="flex-1"
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setWeight(Math.min(2.0, weight + 0.1))}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={applyWeight}
                    className="gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    应用
                  </Button>
                </div>

                <div className="text-xs text-purple-600">
                  💡 提示：权重 &gt; 1.0 增强，&lt; 1.0 减弱。格式：(词语:权重)
                </div>
              </div>
            )}

            {/* 提示 */}
            <div className="text-xs text-gray-500 flex items-start gap-2">
              <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div>
                <strong>使用技巧：</strong>
                选中文本后可调整权重 | 使用模板快速插入 | 用逗号分隔不同元素
              </div>
            </div>
          </TabsContent>

          <TabsContent value="negative" className="space-y-3">
            {/* 负面提示词编辑区 */}
            <Textarea
              value={negativeValue}
              onChange={(e) => onNegativeChange?.(e.target.value)}
              className="min-h-[120px] text-sm font-mono bg-gradient-to-br from-red-50/50 to-orange-50/50 border-red-200"
              placeholder="输入不希望出现的元素..."
            />

            {/* 常用负面提示词快捷按钮 */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">常用负面提示词：</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  'low quality',
                  'blurry',
                  'bad anatomy',
                  'deformed',
                  'watermark',
                  'text',
                  'ugly',
                  'duplicate',
                ].map((tag) => (
                  <Button
                    key={tag}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newValue = negativeValue
                        ? `${negativeValue}, ${tag}`
                        : tag;
                      onNegativeChange?.(newValue);
                    }}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* 提示 */}
            <div className="text-xs text-gray-500 flex items-start gap-2">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div>
                <strong>负面提示词：</strong>
                描述不希望在生成结果中出现的元素，如低质量、模糊、变形等
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // 不显示负面提示词时的简化版本
        <div className="space-y-3">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onSelect={handleTextSelect}
            className="min-h-[120px] text-sm font-mono bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-200"
            placeholder={placeholder}
          />

          {/* 权重调整工具 */}
          {selectedText && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-900">选中文本权重:</span>
                  <Badge variant="outline" className="font-mono">
                    {selectedText.substring(0, 20)}{selectedText.length > 20 ? '...' : ''}
                  </Badge>
                </div>
                <span className="text-lg font-bold text-purple-600">{weight.toFixed(1)}</span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWeight(Math.max(0.1, weight - 0.1))}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>

                <Slider
                  value={[weight]}
                  onValueChange={(v) => setWeight(v[0])}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  className="flex-1"
                />

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWeight(Math.min(2.0, weight + 0.1))}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  onClick={applyWeight}
                  className="gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  应用
                </Button>
              </div>

              <div className="text-xs text-purple-600">
                💡 提示：权重 &gt; 1.0 增强，&lt; 1.0 减弱。格式：(词语:权重)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
