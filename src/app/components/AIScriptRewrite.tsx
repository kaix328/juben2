/**
 * AI 对话式改稿组件
 * 选中剧本片段，通过对话方式进行 AI 改写
 */
import React, { useState, useCallback } from 'react';
import { Sparkles, Send, RefreshCw, Check, Copy, X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner';
import { cn } from '../utils/classnames';

interface AIScriptRewriteProps {
    selectedText: string;
    onApply: (newText: string) => void;
    onClose: () => void;
    open: boolean;
}

interface RewriteVersion {
    id: string;
    text: string;
    instruction: string;
    createdAt: Date;
}

// 预设改写指令
const QUICK_INSTRUCTIONS = [
    { label: '更紧张', prompt: '让这段更加紧张刺激，增加冲突感' },
    { label: '更浪漫', prompt: '让这段更加浪漫，增添温情' },
    { label: '更幽默', prompt: '让这段更加幽默风趣' },
    { label: '更简洁', prompt: '精简语言，保留核心内容' },
    { label: '更详细', prompt: '增加细节描写，让画面更丰富' },
    { label: '增加对白', prompt: '为这段场景添加角色对白' },
];

export function AIScriptRewrite({
    selectedText,
    onApply,
    onClose,
    open
}: AIScriptRewriteProps) {
    const [instruction, setInstruction] = useState('');
    const [versions, setVersions] = useState<RewriteVersion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

    // 模拟 AI 改写（实际应调用 AI API）
    const handleRewrite = useCallback(async (customInstruction?: string) => {
        const finalInstruction = customInstruction || instruction;
        if (!finalInstruction.trim()) {
            toast.error('请输入改写指令');
            return;
        }

        setIsLoading(true);

        try {
            // 模拟 AI 响应（实际项目中替换为真实 API 调用）
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 生成改写版本（示例）
            const rewrittenText = generateMockRewrite(selectedText, finalInstruction);

            const newVersion: RewriteVersion = {
                id: Date.now().toString(),
                text: rewrittenText,
                instruction: finalInstruction,
                createdAt: new Date()
            };

            setVersions(prev => [newVersion, ...prev]);
            setSelectedVersion(newVersion.id);
            setInstruction('');
            toast.success('AI 改写完成');
        } catch (error) {
            toast.error('改写失败，请重试');
        } finally {
            setIsLoading(false);
        }
    }, [instruction, selectedText]);

    const handleApply = useCallback(() => {
        const version = versions.find(v => v.id === selectedVersion);
        if (version) {
            onApply(version.text);
            toast.success('已应用改写内容');
            onClose();
        }
    }, [selectedVersion, versions, onApply, onClose]);

    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('已复制到剪贴板');
    }, []);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI 对话式改稿
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex gap-4">
                    {/* 左侧：原文 + 输入 */}
                    <div className="flex-1 flex flex-col gap-3">
                        {/* 原文 */}
                        <div>
                            <label className="text-sm font-medium text-gray-500 block mb-1">原文</label>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm max-h-32 overflow-y-auto">
                                {selectedText || '请选中剧本片段'}
                            </div>
                        </div>

                        {/* 快捷指令 */}
                        <div>
                            <label className="text-sm font-medium text-gray-500 block mb-1">快捷指令</label>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_INSTRUCTIONS.map(item => (
                                    <Button
                                        key={item.label}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRewrite(item.prompt)}
                                        disabled={isLoading}
                                        className="text-xs"
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* 自定义指令 */}
                        <div className="flex-1 flex flex-col">
                            <label className="text-sm font-medium text-gray-500 block mb-1">自定义改写指令</label>
                            <div className="flex gap-2">
                                <Textarea
                                    value={instruction}
                                    onChange={(e) => setInstruction(e.target.value)}
                                    placeholder="例如：让这段对话更加紧张，角色语气更加强硬..."
                                    className="flex-1 resize-none"
                                    rows={3}
                                />
                                <Button
                                    onClick={() => handleRewrite()}
                                    disabled={isLoading || !instruction.trim()}
                                    className="h-auto"
                                >
                                    {isLoading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 右侧：改写版本 */}
                    <div className="flex-1 flex flex-col">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            改写版本 ({versions.length})
                        </label>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {versions.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">
                                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">点击快捷指令或输入自定义指令</p>
                                    <p className="text-sm">开始 AI 改写</p>
                                </div>
                            ) : (
                                versions.map(version => (
                                    <Card
                                        key={version.id}
                                        className={cn(
                                            "cursor-pointer transition-all",
                                            selectedVersion === version.id
                                                ? "ring-2 ring-purple-500 bg-purple-50"
                                                : "hover:bg-gray-50"
                                        )}
                                        onClick={() => setSelectedVersion(version.id)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1">
                                                    <p className="text-xs text-purple-600 mb-1">
                                                        💬 {version.instruction}
                                                    </p>
                                                    <p className="text-sm whitespace-pre-wrap line-clamp-4">
                                                        {version.text}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopy(version.text);
                                                    }}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 底部操作 */}
                <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button variant="outline" onClick={onClose}>
                        取消
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={!selectedVersion}
                        className="gap-2"
                    >
                        <Check className="w-4 h-4" />
                        应用选中版本
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// 模拟 AI 改写（实际应替换为真实 API）
function generateMockRewrite(original: string, instruction: string): string {
    // 简单的模拟改写逻辑
    const modifications: Record<string, (text: string) => string> = {
        '紧张': (text) => text.replace(/。/g, '！').replace(/[，,]/g, '，') + '\n（气氛紧张）',
        '浪漫': (text) => `月光洒落，${text.replace(/。/g, '...').replace(/！/g, '~')}`,
        '幽默': (text) => text + '\n（观众笑声）',
        '简洁': (text) => text.split('。').slice(0, 2).join('。') + '。',
        '详细': (text) => `在这个场景中，${text}\n（镜头缓慢推进，细节丰富）`,
        '对白': (text) => `角色A：${text.slice(0, 20)}...\n角色B：我明白了。\n${text}`,
    };

    for (const [key, transform] of Object.entries(modifications)) {
        if (instruction.includes(key)) {
            return transform(original);
        }
    }

    // 默认改写
    return `【AI改写】${original}\n\n（根据指令"${instruction}"进行了优化）`;
}
