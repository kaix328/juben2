/**
 * 一键优化按钮组件
 * 显示在质量问题列表中，允许用户选择问题进行自动优化
 */
import React, { useState } from 'react';
import { Wand2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import type { QualityIssue } from '../../utils/ai/qualityChecker';
import type { OptimizationResult } from '../../utils/ai/autoOptimizer';

interface AutoOptimizeButtonProps {
    issues: QualityIssue[];
    onOptimize: (selectedIssues: QualityIssue[]) => Promise<OptimizationResult[]>;
    disabled?: boolean;
}

export function AutoOptimizeButton({ issues, onOptimize, disabled }: AutoOptimizeButtonProps) {
    const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [showSelection, setShowSelection] = useState(false);
    const [results, setResults] = useState<OptimizationResult[] | null>(null);

    // 过滤可优化的问题
    const optimizableIssues = issues.filter(issue => 
        !issue.message.includes('ID 重复')
    );

    const handleToggleIssue = (issueId: string) => {
        const newSelected = new Set(selectedIssues);
        if (newSelected.has(issueId)) {
            newSelected.delete(issueId);
        } else {
            newSelected.add(issueId);
        }
        setSelectedIssues(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIssues.size === optimizableIssues.length) {
            setSelectedIssues(new Set());
        } else {
            setSelectedIssues(new Set(optimizableIssues.map(i => i.id)));
        }
    };

    const handleOptimize = async () => {
        const issuesToOptimize = optimizableIssues.filter(i => selectedIssues.has(i.id));
        
        if (issuesToOptimize.length === 0) {
            return;
        }

        setIsOptimizing(true);
        try {
            const optimizationResults = await onOptimize(issuesToOptimize);
            setResults(optimizationResults);
            setSelectedIssues(new Set());
            setShowSelection(false);
        } catch (error) {
            console.error('优化失败:', error);
        } finally {
            setIsOptimizing(false);
        }
    };

    if (optimizableIssues.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* 主按钮 */}
            <div className="flex items-center gap-2">
                <Button
                    onClick={() => setShowSelection(!showSelection)}
                    disabled={disabled || isOptimizing}
                    className="flex items-center gap-2"
                    variant="outline"
                >
                    <Wand2 className="w-4 h-4" />
                    一键优化
                    <Badge variant="secondary" className="ml-1">
                        {optimizableIssues.length}
                    </Badge>
                </Button>

                {selectedIssues.size > 0 && (
                    <Button
                        onClick={handleOptimize}
                        disabled={isOptimizing}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        {isOptimizing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                优化中...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                优化选中的 {selectedIssues.size} 个问题
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* 问题选择列表 */}
            {showSelection && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">选择要优化的问题</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                        >
                            {selectedIssues.size === optimizableIssues.length ? '取消全选' : '全选'}
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {optimizableIssues.map(issue => (
                            <div
                                key={issue.id}
                                className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors cursor-pointer"
                                onClick={() => handleToggleIssue(issue.id)}
                            >
                                <Checkbox
                                    checked={selectedIssues.has(issue.id)}
                                    onCheckedChange={() => handleToggleIssue(issue.id)}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={
                                            issue.severity === 'error' ? 'destructive' :
                                            issue.severity === 'warning' ? 'default' : 'secondary'
                                        }>
                                            {issue.severity === 'error' ? '错误' :
                                             issue.severity === 'warning' ? '警告' : '提示'}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            分镜 #{issue.panelNumber}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-900">{issue.message}</p>
                                    {issue.suggestion && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            💡 {issue.suggestion}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 优化结果 */}
            {results && (
                <div className="border rounded-lg p-4 bg-green-50 border-green-200 space-y-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-green-900">优化完成</h4>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white rounded p-2">
                            <div className="text-gray-500">总计</div>
                            <div className="text-lg font-bold">{results.length}</div>
                        </div>
                        <div className="bg-white rounded p-2">
                            <div className="text-gray-500">成功</div>
                            <div className="text-lg font-bold text-green-600">
                                {results.filter(r => r.success).length}
                            </div>
                        </div>
                        <div className="bg-white rounded p-2">
                            <div className="text-gray-500">失败</div>
                            <div className="text-lg font-bold text-red-600">
                                {results.filter(r => !r.success).length}
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResults(null)}
                        className="w-full"
                    >
                        关闭
                    </Button>
                </div>
            )}
        </div>
    );
}
