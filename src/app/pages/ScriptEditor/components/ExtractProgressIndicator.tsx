// AI 提取进度指示器组件
import React, { memo } from 'react';
import { Loader2, CheckCircle, AlertCircle, Sparkles, Pause, Play, Square } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { ExtractProgress } from '../types';

interface ExtractProgressIndicatorProps {
    progress: ExtractProgress;
    isPaused?: boolean;
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
}

export const ExtractProgressIndicator = memo(function ExtractProgressIndicator({
    progress,
    isPaused,
    onPause,
    onResume,
    onStop
}: ExtractProgressIndicatorProps) {
    if (progress.step === 'idle') return null;

    const getIcon = () => {
        switch (progress.step) {
            case 'parsing':
            case 'extracting':
            case 'validating':
                return <Loader2 className="w-4 h-4 animate-spin" />;
            case 'done':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Sparkles className="w-4 h-4" />;
        }
    };

    const getStepNumber = () => {
        switch (progress.step) {
            case 'parsing': return 1;
            case 'extracting': return 2;
            case 'validating': return 3;
            case 'done': return 4;
            default: return 0;
        }
    };

    const getBgColor = () => {
        if (isPaused) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
        switch (progress.step) {
            case 'done':
                return 'bg-green-50 border-green-200 text-green-700';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-700';
            default:
                return 'bg-blue-50 border-blue-200 text-blue-700';
        }
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${getBgColor()}`}>
            {getIcon()}
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                        {isPaused ? '提取已暂停' : progress.message}
                    </div>
                    {/* 🆕 控制按钮 */}
                    {(progress.step === 'extracting' || isPaused) && (
                        <div className="flex items-center gap-2">
                            {!isPaused ? (
                                <Button variant="ghost" size="sm" onClick={onPause} className="h-6 px-2 text-xs">
                                    <Pause className="w-3 h-3 mr-1" /> 暂停
                                </Button>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={onResume} className="h-6 px-2 text-xs">
                                    <Play className="w-3 h-3 mr-1" /> 继续
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={onStop} className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Square className="w-3 h-3 mr-1" /> 终止
                            </Button>
                        </div>
                    )}
                </div>

                {progress.step !== 'done' && progress.step !== 'error' && (
                    <div className="flex gap-1 mt-1">
                        {[1, 2, 3].map((step) => (
                            <div
                                key={step}
                                className={`h-1 w-8 rounded-full ${step <= getStepNumber() ? 'bg-blue-500' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});
