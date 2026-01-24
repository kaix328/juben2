import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Info, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { PromptValidator, type ValidationResult } from '../utils/validation/promptValidator';

interface PromptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPrompt: string;
  optimizedPrompt: string;
  negativePrompt?: string;
  platform?: string;
  onConfirm: (editedPrompt: string) => void;
  onCancel?: () => void;
}

export const PromptPreviewDialog: React.FC<PromptPreviewDialogProps> = ({
  open,
  onOpenChange,
  originalPrompt,
  optimizedPrompt,
  negativePrompt,
  platform = 'default',
  onConfirm,
  onCancel,
}) => {
  const [editedPrompt, setEditedPrompt] = useState(optimizedPrompt);
  const [copied, setCopied] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // 验证提示词
  const validation: ValidationResult = PromptValidator.validate(editedPrompt, platform);
  const analysis = PromptValidator.analyze(editedPrompt);

  // 复制到剪贴板
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 确认生成
  const handleConfirm = () => {
    onConfirm(editedPrompt);
    onOpenChange(false);
  };

  // 取消
  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  // 重置为优化后的提示词
  const handleReset = () => {
    setEditedPrompt(optimizedPrompt);
  };

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 获取评分星级
  const getScoreStars = (score: number) => {
    const stars = Math.round(score / 20);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            提示词预览与编辑
          </DialogTitle>
          <DialogDescription>
            查看优化后的提示词，您可以手动编辑后再生成图片
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 质量评分 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">提示词质量评分</div>
                <div className={`text-3xl font-bold ${getScoreColor(validation.score)}`}>
                  {validation.score}/100
                </div>
                <div className="text-lg text-yellow-500 mt-1">
                  {getScoreStars(validation.score)}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-gray-600">
                  长度: <span className="font-semibold">{analysis.length}</span> 字符
                </div>
                <div className="text-sm text-gray-600">
                  Tokens: <span className="font-semibold">{analysis.tokenCount}</span>
                </div>
                <div className="text-sm text-gray-600">
                  关键词: <span className="font-semibold">{analysis.keywordCount}</span>
                </div>
                <div className="text-sm text-gray-600">
                  平台: <span className="font-semibold">{platform}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 问题和警告 */}
          {(validation.issues.length > 0 || validation.warnings.length > 0) && (
            <div className="space-y-2">
              {validation.issues.map((issue, index) => (
                <div key={`issue-${index}`} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{issue}</span>
                </div>
              ))}
              {validation.warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="flex items-start gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* 优化建议 */}
          {validation.suggestions.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-900 mb-2">💡 优化建议</div>
              <ul className="space-y-1">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-blue-700">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* 原始提示词（可选显示）*/}
          {originalPrompt && originalPrompt !== optimizedPrompt && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">原始提示词</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOriginal(!showOriginal)}
                >
                  {showOriginal ? '隐藏' : '显示'}
                </Button>
              </div>
              {showOriginal && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-600 max-h-32 overflow-y-auto">
                  {originalPrompt}
                </div>
              )}
            </div>
          )}

          {/* 优化后的提示词（可编辑）*/}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">
                优化后的提示词 <Badge variant="secondary">可编辑</Badge>
              </label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={editedPrompt === optimizedPrompt}
                >
                  重置
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
              placeholder="在此编辑提示词..."
            />
          </div>

          {/* 负面提示词 */}
          {negativePrompt && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                负面提示词
              </label>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-600 max-h-24 overflow-y-auto">
                {negativePrompt}
              </div>
            </div>
          )}

          {/* 语言分析 */}
          <div className="flex gap-2">
            {analysis.hasChinese && (
              <Badge variant="outline">包含中文</Badge>
            )}
            {analysis.hasEnglish && (
              <Badge variant="outline">包含英文</Badge>
            )}
            {analysis.languageMix && (
              <Badge variant="secondary">中英混合</Badge>
            )}
            {analysis.duplicateRate > 0.2 && (
              <Badge variant="destructive">
                重复率 {Math.round(analysis.duplicateRate * 100)}%
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!validation.isValid}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            确认生成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
