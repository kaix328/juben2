import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Badge } from "../../../components/ui/badge";
import {
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    Info,
    Trash2,
    RefreshCw,
} from "lucide-react";
import { AssetAdvice } from "../../../utils/ai/assetAdvisor";

interface AssetAdviceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    advice: AssetAdvice[];
    onAccept: (advice: AssetAdvice) => void;
}

export const AssetAdviceDialog: React.FC<AssetAdviceDialogProps> = ({
    open,
    onOpenChange,
    advice,
    onAccept,
}) => {
    const getPriorityColor = (priority: AssetAdvice['priority']) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getTypeColor = (type: AssetAdvice['type']) => {
        switch (type) {
            case 'merge': return 'text-indigo-500';
            case 'complete': return 'text-amber-500';
            case 'cleanup': return 'text-gray-500';
            case 'optimize': return 'text-purple-500';
            case 'refine': return 'text-blue-600';
            default: return 'text-gray-500';
        }
    };

    const getTypeIcon = (type: AssetAdvice['type']) => {
        switch (type) {
            case 'merge': return <RefreshCw className="w-5 h-5 text-indigo-500" />;
            case 'complete': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'cleanup': return <Trash2 className="w-5 h-5 text-gray-500" />;
            case 'optimize': return <Sparkles className="w-5 h-5 text-purple-500" />;
            case 'refine': return <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Sparkles className="w-5 h-5 text-amber-600" />
                            </div>
                            <DialogTitle className="text-xl">AI 资产优化建议</DialogTitle>
                        </div>
                        <DialogDescription>
                            AI 助手扫描了您的资料库，发现了以下可以优化的地方，以提升您的创作体验。
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1 p-6 pt-0 mt-4 overflow-y-auto">
                    {advice.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">您的资产库非常健康！</h3>
                            <p className="text-gray-500 mt-1">目前没有发现需要优化的项目。</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {advice.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {getTypeIcon(item.type)}
                                    </div>
                                    <div className="flex-1 pr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${getPriorityColor(item.priority)} lowercase`}>
                                                {item.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                            {item.description}
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={`h-8 px-2 -ml-2 group-hover:bg-opacity-50 ${getTypeColor(item.type)} hover:bg-current hover:bg-opacity-10`}
                                            onClick={() => onAccept(item)}
                                        >
                                            <span className="text-xs font-medium mr-1">{item.actionLabel}</span>
                                            {item.type === 'merge' ? (
                                                <RefreshCw className="w-3 h-3 transition-transform group-hover:rotate-180 duration-500" />
                                            ) : (
                                                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t bg-gray-50/50 rounded-b-lg">
                    <div className="flex items-start gap-2 text-[10px] text-gray-400">
                        <Info className="w-3 h-3 mt-0.5" />
                        <p>这些建议由 AI 离线分析产生，不会上传您的项目数据。建议仅供参考，请根据您的创作需要进行调整。</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
