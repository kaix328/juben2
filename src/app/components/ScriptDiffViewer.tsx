/**
 * 剧本版本对比组件
 * 左右对比视图，高亮变更内容
 */
import React, { useMemo, useState } from 'react';
import { GitCompare, Clock, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';

interface ScriptVersion {
    id: string;
    versionNumber: number;
    content: string;
    description: string;
    createdAt: string;
}

interface ScriptDiffViewerProps {
    versions: ScriptVersion[];
    currentContent: string;
    onRestore: (version: ScriptVersion) => void;
}

// 简易 diff 算法
function diffLines(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const result: DiffLine[] = [];

    let i = 0, j = 0;

    while (i < oldLines.length || j < newLines.length) {
        if (i >= oldLines.length) {
            // 新增行
            result.push({ type: 'added', content: newLines[j], lineNumber: j + 1 });
            j++;
        } else if (j >= newLines.length) {
            // 删除行
            result.push({ type: 'removed', content: oldLines[i], lineNumber: i + 1 });
            i++;
        } else if (oldLines[i] === newLines[j]) {
            // 相同行
            result.push({ type: 'unchanged', content: oldLines[i], lineNumber: i + 1 });
            i++;
            j++;
        } else {
            // 查找匹配
            const newIdxInOld = oldLines.indexOf(newLines[j], i);
            const oldIdxInNew = newLines.indexOf(oldLines[i], j);

            if (newIdxInOld === -1 && oldIdxInNew === -1) {
                // 修改
                result.push({ type: 'removed', content: oldLines[i], lineNumber: i + 1 });
                result.push({ type: 'added', content: newLines[j], lineNumber: j + 1 });
                i++;
                j++;
            } else if (newIdxInOld === -1 || (oldIdxInNew !== -1 && oldIdxInNew < newIdxInOld)) {
                result.push({ type: 'added', content: newLines[j], lineNumber: j + 1 });
                j++;
            } else {
                result.push({ type: 'removed', content: oldLines[i], lineNumber: i + 1 });
                i++;
            }
        }
    }

    return result;
}

interface DiffLine {
    type: 'added' | 'removed' | 'unchanged';
    content: string;
    lineNumber: number;
}

export function ScriptDiffViewer({
    versions,
    currentContent,
    onRestore
}: ScriptDiffViewerProps) {
    const [selectedVersion, setSelectedVersion] = useState<string>(
        versions[0]?.id || ''
    );
    const [open, setOpen] = useState(false);

    const selectedVersionData = useMemo(() =>
        versions.find(v => v.id === selectedVersion),
        [versions, selectedVersion]
    );

    const diffResult = useMemo(() => {
        if (!selectedVersionData) return [];
        return diffLines(selectedVersionData.content, currentContent);
    }, [selectedVersionData, currentContent]);

    // 统计变更
    const stats = useMemo(() => ({
        added: diffResult.filter(l => l.type === 'added').length,
        removed: diffResult.filter(l => l.type === 'removed').length,
        unchanged: diffResult.filter(l => l.type === 'unchanged').length
    }), [diffResult]);

    if (versions.length === 0) {
        return (
            <Card className="bg-gray-50">
                <CardContent className="py-8 text-center text-gray-500">
                    <GitCompare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>暂无历史版本</p>
                    <p className="text-sm mt-1">保存剧本后将自动创建版本记录</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <GitCompare className="w-4 h-4" />
                    版本对比
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GitCompare className="w-5 h-5" />
                        剧本版本对比
                    </DialogTitle>
                </DialogHeader>

                {/* 版本选择器 */}
                <div className="flex items-center gap-4 py-2">
                    <div className="flex-1">
                        <label className="text-sm text-gray-500 mb-1 block">对比版本</label>
                        <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择版本" />
                            </SelectTrigger>
                            <SelectContent>
                                {versions.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            v{v.versionNumber} - {new Date(v.createdAt).toLocaleString()}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 统计 */}
                    <div className="flex gap-3 text-sm">
                        <span className="text-green-600">+{stats.added} 新增</span>
                        <span className="text-red-600">-{stats.removed} 删除</span>
                        <span className="text-gray-500">{stats.unchanged} 未变</span>
                    </div>

                    {/* 恢复按钮 */}
                    {selectedVersionData && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                onRestore(selectedVersionData);
                                setOpen(false);
                            }}
                            className="gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            恢复此版本
                        </Button>
                    )}
                </div>

                {/* Diff 视图 */}
                <div className="flex-1 overflow-auto border rounded-lg bg-gray-50">
                    <div className="font-mono text-sm">
                        {diffResult.map((line, index) => (
                            <div
                                key={index}
                                className={`px-4 py-0.5 flex ${line.type === 'added'
                                        ? 'bg-green-100 text-green-800'
                                        : line.type === 'removed'
                                            ? 'bg-red-100 text-red-800 line-through'
                                            : 'bg-white'
                                    }`}
                            >
                                <span className="w-10 text-gray-400 text-right mr-4 select-none">
                                    {line.lineNumber}
                                </span>
                                <span className="w-4 text-center select-none">
                                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                                </span>
                                <span className="flex-1 whitespace-pre-wrap break-all">
                                    {line.content || ' '}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 版本描述 */}
                {selectedVersionData?.description && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                        💡 版本说明：{selectedVersionData.description}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
