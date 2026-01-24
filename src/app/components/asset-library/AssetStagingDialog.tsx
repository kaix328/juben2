import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { calculateSimilarity } from '../../utils/stringSimilarity';
import {
    AlertCircle,
    CheckCircle2,
    Copy,
    Merge,
    UserPlus,
    Plus,
    XCircle,
    Info,
    ArrowRight
} from 'lucide-react';

interface Asset {
    id: string;
    name: string;
    description?: string;
    appearance?: string; // 角色特有
    personality?: string; // 角色特有
    environment?: string; // 场景特有
    type: 'character' | 'scene' | 'prop' | 'costume';
    [key: string]: any;
}

interface StagedAsset extends Asset {
    action: 'add' | 'merge' | 'ignore';
    mergeWithId?: string;
    similarityScore?: number;
    matchReason?: string;
}

interface AssetStagingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pendingAssets: Asset[];
    existingAssets: Asset[];
    onConfirm: (finalAssets: StagedAsset[]) => void;
}

export function AssetStagingDialog({
    open,
    onOpenChange,
    pendingAssets,
    existingAssets,
    onConfirm
}: AssetStagingDialogProps) {
    const [stagedAssets, setStagedAssets] = useState<StagedAsset[]>([]);

    // 初始化处理：计算相似度并进行默认分类
    React.useEffect(() => {
        if (!open) return;

        const processed = pendingAssets.map(pending => {
            const matches = existingAssets
                .filter(e => e.type === pending.type)
                .map(e => ({
                    id: e.id,
                    score: calculateSimilarity(pending.name, e.name)
                }))
                .sort((a, b) => b.score - a.score);

            const bestMatch = matches[0];

            // 逻辑：
            // 1. 如果有 1.0 的完全匹配 -> 默认为 merge (更新已有)
            // 2. 如果相似度 > 0.7 -> 标记为疑似重复，默认 add (以免误伤用户资产)，但提示合并
            // 3. 其他 -> 默认为 add
            let action: 'add' | 'merge' | 'ignore' = 'add';
            let mergeWithId: string | undefined = undefined;
            let matchReason: string | undefined = undefined;

            if (bestMatch && bestMatch.score === 1.0) {
                action = 'merge';
                mergeWithId = bestMatch.id;
                matchReason = '名称完全匹配';
            } else if (bestMatch && bestMatch.score >= 0.7) {
                matchReason = `疑似重复 (${Math.round(bestMatch.score * 100)}% 相似)`;
                mergeWithId = bestMatch.id;
            }

            return {
                ...pending,
                action,
                mergeWithId,
                similarityScore: bestMatch?.score,
                matchReason
            } as StagedAsset;
        });

        setStagedAssets(processed);
    }, [open, pendingAssets, existingAssets]);

    const updateAction = (id: string, action: 'add' | 'merge' | 'ignore', mergeWithId?: string) => {
        setStagedAssets(prev => prev.map(a =>
            a.id === id ? { ...a, action, mergeWithId } : a
        ));
    };

    const groupedAssets = useMemo(() => {
        return {
            character: stagedAssets.filter(a => a.type === 'character'),
            scene: stagedAssets.filter(a => a.type === 'scene'),
            prop: stagedAssets.filter(a => a.type === 'prop'),
            costume: stagedAssets.filter(a => a.type === 'costume'),
        };
    }, [stagedAssets]);

    const stats = {
        add: stagedAssets.filter(a => a.action === 'add').length,
        merge: stagedAssets.filter(a => a.action === 'merge').length,
        ignore: stagedAssets.filter(a => a.action === 'ignore').length,
    };

    const renderAssetCard = (asset: StagedAsset) => {
        const match = asset.mergeWithId ? existingAssets.find(e => e.id === asset.mergeWithId) : null;

        return (
            <Card key={asset.id} className="mb-4 overflow-hidden border-slate-200 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg">{asset.name}</h4>
                                {asset.matchReason && (
                                    <Badge variant={(asset.similarityScore || 0) > 0.9 ? "destructive" : "secondary"} className="text-[10px] py-0">
                                        {asset.matchReason}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-1 mb-3">
                                {asset.description || asset.appearance || asset.environment || '暂无描述'}
                            </p>

                            {/* 冲突对比视图 (如果选择了合并) */}
                            {asset.action === 'merge' && match && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-2 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center text-slate-400 font-medium">
                                        <Merge className="w-3 h-3 mr-1" /> 合并到已有资产：<span className="text-slate-900 dark:text-slate-100 ml-1">{match.name}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">新描述 (AI)</div>
                                            <div className="text-slate-600 dark:text-slate-400 line-clamp-2">{asset.description || '无'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">原描述 (库)</div>
                                            <div className="text-slate-600 dark:text-slate-400 line-clamp-2">{match.description || '无'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 疑似重复但选择新增 提示 */}
                            {asset.action === 'add' && match && asset.similarityScore && asset.similarityScore > 0.7 && asset.similarityScore < 1.0 && (
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-900/30">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>库中已存在名为 "{match.name}" 的资产，确定要重复创建吗？</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-1.5 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                                        onClick={() => updateAction(asset.id, 'merge', match.id)}
                                    >
                                        改为合并
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                            <Button
                                size="sm"
                                variant={asset.action === 'add' ? "default" : "outline"}
                                className="h-8 px-3 text-xs justify-start gap-2"
                                onClick={() => updateAction(asset.id, 'add')}
                            >
                                <Plus className="w-3.5 h-3.5" /> 作为新项
                            </Button>
                            {match && (
                                <Button
                                    size="sm"
                                    variant={asset.action === 'merge' ? "default" : "outline"}
                                    className="h-8 px-3 text-xs justify-start gap-2 border-slate-200"
                                    onClick={() => updateAction(asset.id, 'merge', match.id)}
                                >
                                    <Merge className="w-3.5 h-3.5" /> 合并更新
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant={asset.action === 'ignore' ? "destructive" : "outline"}
                                className="h-8 px-3 text-xs justify-start gap-2"
                                onClick={() => updateAction(asset.id, 'ignore')}
                            >
                                <XCircle className="w-3.5 h-3.5" /> 忽略此项
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderTabContent = (type: keyof typeof groupedAssets) => {
        const assets = groupedAssets[type];
        if (assets.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Info className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">未在此类别下提取到新资产</p>
                </div>
            );
        }

        return (
            <ScrollArea className="h-[400px] pr-4 mt-4">
                {assets.map(renderAssetCard)}
            </ScrollArea>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                                资产提取审核
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                剧本已处理，发现 {pendingAssets.length} 项资产建议。请审核并将它们入库。
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 flex gap-1">
                                <Plus className="w-3 h-3" /> 新增: {stats.add}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 flex gap-1">
                                <Merge className="w-3 h-3" /> 合并: {stats.merge}
                            </Badge>
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 flex gap-1">
                                <XCircle className="w-3 h-3" /> 忽略: {stats.ignore}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-4 flex-1 overflow-hidden bg-slate-50/30 dark:bg-slate-900/10">
                    <Tabs defaultValue="character" className="w-full h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 p-1 dark:bg-slate-800/80">
                            <TabsTrigger value="character" className="gap-2">角色 ({groupedAssets.character.length})</TabsTrigger>
                            <TabsTrigger value="scene" className="gap-2">场景 ({groupedAssets.scene.length})</TabsTrigger>
                            <TabsTrigger value="prop" className="gap-2">道具 ({groupedAssets.prop.length})</TabsTrigger>
                            <TabsTrigger value="costume" className="gap-2">服装 ({groupedAssets.costume.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="character" className="flex-1 mt-0">{renderTabContent('character')}</TabsContent>
                        <TabsContent value="scene" className="flex-1 mt-0">{renderTabContent('scene')}</TabsContent>
                        <TabsContent value="prop" className="flex-1 mt-0">{renderTabContent('prop')}</TabsContent>
                        <TabsContent value="costume" className="flex-1 mt-0">{renderTabContent('costume')}</TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="p-6 border-t bg-white dark:bg-slate-950">
                    <div className="flex justify-between w-full items-center">
                        <div className="text-xs text-slate-500 italic flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> 审核完成后，资产将被永久同步至项目库。
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>取消并丢弃</Button>
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                                onClick={() => onConfirm(stagedAssets)}
                                disabled={stagedAssets.length === 0}
                            >
                                完成审核并入库 ({stagedAssets.length})
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
