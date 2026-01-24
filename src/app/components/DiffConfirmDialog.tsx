import { useMemo, useState } from 'react';
import { diff_match_patch } from 'diff-match-patch';
import { Sparkles, Send } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DiffConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: () => void;
    original: string;
    modified: string;
    mode: string;
    onRefine?: (instruction: string) => Promise<void>;
}

export function DiffConfirmDialog({
    open,
    onClose,
    onApply,
    original,
    modified,
    mode,
    onRefine
}: DiffConfirmDialogProps) {
    const [chatInput, setChatInput] = useState('');
    const [isRefining, setIsRefining] = useState(false);

    // 计算 Diff
    const diffHtml = useMemo(() => {
        if (!original || !modified) return null;

        const dmp = new diff_match_patch();
        const diffs = dmp.diff_main(original, modified);
        dmp.diff_cleanupSemantic(diffs);

        // 转换为 HTML
        // -1: delete (red), 1: insert (green), 0: equal
        return diffs.map((part, index) => {
            const type = part[0];
            const text = part[1];

            if (type === -1) {
                return <span key={index} className="bg-red-100 text-red-900 line-through decoration-red-400 mx-px rounded-sm">{text}</span>;
            } else if (type === 1) {
                return <span key={index} className="bg-green-100 text-green-900 font-medium mx-px rounded-sm">{text}</span>;
            } else {
                return <span key={index} className="text-gray-600">{text}</span>;
            }
        });
    }, [original, modified]);

    // Handle Chat Submit
    const handleChatSubmit = async () => {
        if (!chatInput.trim() || isRefining) return;

        setIsRefining(true);
        try {
            if (onRefine) {
                await onRefine(chatInput);
            }
            setChatInput('');
        } finally {
            setIsRefining(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        确认改写 - <Badge variant="outline">{mode}</Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 grid grid-cols-2 min-h-0 overflow-hidden bg-gray-50/50">
                    {/* 左侧：纯原文 */}
                    <div className="flex flex-col border-r bg-white min-h-0">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                            原文预览
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                            {original}
                        </div>
                    </div>

                    {/* 右侧：修订模式 */}
                    <div className="flex flex-col bg-white min-h-0">
                        <div className="px-4 py-2 text-xs font-medium text-purple-600 bg-purple-50 border-b flex items-center justify-between">
                            <span>修订预览 (Diff View)</span>
                            <span className="font-normal text-gray-400 scale-90 origin-right">
                                <span className="bg-red-100 text-red-900 px-1 rounded-sm mr-2">删除</span>
                                <span className="bg-green-100 text-green-900 px-1 rounded-sm">新增</span>
                            </span>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap relative">
                            {isRefining && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                    <div className="flex items-center gap-2 text-purple-600 bg-white shadow-lg px-4 py-2 rounded-full border">
                                        <Sparkles className="w-4 h-4 animate-spin" />
                                        <span className="text-sm font-medium">AI 正在根据指令调整...</span>
                                    </div>
                                </div>
                            )}
                            {diffHtml}
                        </div>
                    </div>
                </div>

                {/* 底部：对话与操作 */}
                <div className="p-4 bg-white border-t flex flex-col gap-3">
                    {/* Chat Input */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                                placeholder="对结果不满意？输入指令调整（例如：语气再强硬一点、删除最后一句...）"
                                className="w-full pl-4 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-gray-50 focus:bg-white transition-all"
                                disabled={isRefining}
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-purple-100 text-purple-600"
                                onClick={handleChatSubmit}
                                disabled={!chatInput.trim() || isRefining}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-400">
                            AI 生成内容仅供参考
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>放弃修改</Button>
                            <Button onClick={onApply} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                                确认应用
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default DiffConfirmDialog;
