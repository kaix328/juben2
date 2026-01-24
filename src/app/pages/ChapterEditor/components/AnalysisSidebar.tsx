/**
 * 智能助手侧边栏组件
 * 完全重写版本 - 2026-01-20
 */

import { Sparkles, Plus, Check, CheckCheck, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../utils/classnames';

// ==================== 类型定义 ====================

export interface AssetPreview {
    type: 'character' | 'scene' | 'prop';
    name: string;
    description: string;
    isAdded?: boolean;
    isDuplicate?: boolean;
    existingAsset?: any;
    data?: any;
}

interface AnalysisSidebarProps {
    isAnalyzing: boolean;
    detectedAssets: AssetPreview[];
    onAnalyze: () => void;
    onAddToLibrary: (asset: AssetPreview) => void;
    onAddAllToLibrary?: () => void;
    onClearAnalysis?: () => void;
}

// ==================== 辅助函数 ====================

/**
 * 获取资产类型的中文标签
 */
function getAssetTypeLabel(type: 'character' | 'scene' | 'prop'): string {
    const labels = {
        character: '角色',
        scene: '场景',
        prop: '道具'
    };
    return labels[type];
}

/**
 * 获取资产类型的颜色样式
 */
function getAssetTypeColor(type: 'character' | 'scene' | 'prop'): string {
    const colors = {
        character: 'bg-blue-50 text-blue-700 border-blue-200',
        scene: 'bg-green-50 text-green-700 border-green-200',
        prop: 'bg-amber-50 text-amber-700 border-amber-200'
    };
    return colors[type];
}

// ==================== 主组件 ====================

export function AnalysisSidebar({
    isAnalyzing,
    detectedAssets,
    onAnalyze,
    onAddToLibrary,
    onAddAllToLibrary,
    onClearAnalysis
}: AnalysisSidebarProps) {
    // 统计数据
    const totalCount = detectedAssets.length;
    const addedCount = detectedAssets.filter(a => a.isAdded).length;
    const duplicateCount = detectedAssets.filter(a => a.isDuplicate).length;
    const unaddedCount = detectedAssets.filter(a => !a.isAdded && !a.isDuplicate).length;
    const allAdded = totalCount > 0 && unaddedCount === 0;

    return (
        <Card className="h-full flex flex-col bg-slate-50 border-slate-200">
            {/* 头部 */}
            <CardHeader className="py-4 border-b bg-white rounded-t-lg">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        智能助手
                    </CardTitle>
                    {totalCount > 0 && onClearAnalysis && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAnalysis}
                            className="h-7 px-2 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50"
                            title="清除所有分析结果"
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            清除
                        </Button>
                    )}
                </div>
            </CardHeader>

            {/* 操作区域 */}
            <div className="p-4 bg-white border-b space-y-2">
                {/* 分析按钮 */}
                <Button
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-sm"
                >
                    {isAnalyzing ? (
                        <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            正在分析...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            分析文中资产
                        </>
                    )}
                </Button>
                
                {/* 一键添加按钮 */}
                {totalCount > 0 && onAddAllToLibrary && (
                    <Button
                        onClick={onAddAllToLibrary}
                        disabled={allAdded}
                        variant={allAdded ? "secondary" : "outline"}
                        className={cn(
                            "w-full",
                            allAdded 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                        )}
                    >
                        {allAdded ? (
                            <>
                                <CheckCheck className="w-4 h-4 mr-2" />
                                全部已添加
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                一键添加全部 ({unaddedCount})
                            </>
                        )}
                    </Button>
                )}
                
                {/* 状态提示 */}
                <div className="text-xs text-slate-500 text-center space-y-1">
                    {totalCount > 0 ? (
                        <>
                            <p>已识别 {totalCount} 个资产 💾 已自动保存</p>
                            {duplicateCount > 0 && (
                                <p className="text-orange-600">
                                    ⚠️ {duplicateCount} 个重复资产
                                </p>
                            )}
                        </>
                    ) : (
                        <p>AI将识别文中的角色、场景和道具</p>
                    )}
                </div>
            </div>

            {/* 资产列表 */}
            <CardContent className="flex-1 overflow-y-auto p-4">
                {totalCount === 0 ? (
                    // 空状态
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-slate-300" />
                        </div>
                        <span className="text-sm">暂无分析结果</span>
                        <span className="text-xs text-slate-400">分析结果会自动保存</span>
                    </div>
                ) : (
                    // 资产卡片列表
                    <div className="space-y-3">
                        {detectedAssets.map((asset, idx) => (
                            <AssetCard
                                key={`${asset.type}-${asset.name}-${idx}`}
                                asset={asset}
                                onAdd={() => onAddToLibrary(asset)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ==================== 资产卡片组件 ====================

interface AssetCardProps {
    asset: AssetPreview;
    onAdd: () => void;
}

function AssetCard({ asset, onAdd }: AssetCardProps) {
    // 调试：打印资产数据
    console.log('🎨 [UI] 渲染资产卡片:', {
        name: asset.name,
        type: asset.type,
        description: asset.description,
        descriptionType: typeof asset.description,
        descriptionLength: asset.description?.length
    });
    
    return (
        <div 
            className={cn(
                "group rounded-lg p-3 border shadow-sm transition-all",
                asset.isDuplicate 
                    ? "bg-orange-50 border-orange-300 hover:shadow-md" 
                    : "bg-white hover:shadow-md"
            )}
        >
            {/* 头部：类型标签 + 操作按钮 */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {/* 类型标签 */}
                    <Badge 
                        variant="secondary" 
                        className={cn(
                            "text-xs font-normal",
                            getAssetTypeColor(asset.type)
                        )}
                    >
                        {getAssetTypeLabel(asset.type)}
                    </Badge>
                    
                    {/* 重复标记 */}
                    {asset.isDuplicate && (
                        <Badge 
                            variant="outline" 
                            className="text-xs font-normal bg-orange-100 text-orange-700 border-orange-300"
                        >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            已存在
                        </Badge>
                    )}
                </div>
                
                {/* 添加按钮 */}
                <Button
                    size="sm"
                    variant={asset.isAdded || asset.isDuplicate ? "secondary" : "outline"}
                    disabled={asset.isAdded || asset.isDuplicate}
                    onClick={onAdd}
                    className={cn(
                        "h-6 px-2 text-xs flex-shrink-0",
                        asset.isDuplicate 
                            ? "text-orange-600 bg-orange-100 cursor-not-allowed" 
                            : asset.isAdded 
                                ? "text-green-600 bg-green-50" 
                                : "hover:bg-purple-50 hover:text-purple-600"
                    )}
                    title={asset.isDuplicate ? "该资产已存在于项目库中" : undefined}
                >
                    {asset.isDuplicate ? (
                        <>
                            <AlertCircle className="w-3 h-3 mr-1" /> 重复
                        </>
                    ) : asset.isAdded ? (
                        <>
                            <Check className="w-3 h-3 mr-1" /> 已添加
                        </>
                    ) : (
                        <>
                            <Plus className="w-3 h-3 mr-1" /> 添加
                        </>
                    )}
                </Button>
            </div>
            
            {/* 资产名称 */}
            <h4 className={cn(
                "font-medium text-sm mb-1",
                asset.isDuplicate ? "text-orange-900" : "text-slate-900"
            )}>
                {asset.name}
            </h4>
            
            {/* 资产描述 */}
            <p className={cn(
                "text-xs leading-relaxed whitespace-pre-wrap break-words",
                asset.isDuplicate ? "text-orange-700" : "text-slate-600"
            )}>
                {asset.description}
            </p>
            
            {/* 重复提示 */}
            {asset.isDuplicate && (
                <div className="mt-2 pt-2 border-t border-orange-200">
                    <p className="text-xs text-orange-600">
                        💡 该资产已存在于项目库中，无需重复添加
                    </p>
                </div>
            )}
        </div>
    );
}

export default AnalysisSidebar;
