import React from 'react';
import {
    Sparkles, Save, Upload, Download, Wand2, RefreshCw,
    Network, BarChart3, Database, Eye
} from 'lucide-react';
import { Button } from "../../../components/ui/button";
import { CardTitle } from "../../../components/ui/card";
import { Switch } from "../../../components/ui/switch";
import { Label } from "../../../components/ui/label";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../../components/ui/tooltip";

interface AssetLibraryHeaderProps {
    projectId: string | undefined;
    projectName: string | undefined;
    isExtracting: boolean;
    isSyncing: boolean;
    isBatchGenerating: boolean;
    onAIExtractClick: () => void;
    onSyncStyle: () => void;
    onBatchGenerate: () => void;
    onSave: () => void;
    onExport: () => void;
    onImportClick: () => void;
    groupBy: 'none' | 'tags' | 'source';
    onGroupByChange: (val: 'none' | 'tags' | 'source') => void;

    // New Feature Handlers
    onShowRelationGraph?: () => void;
    onShowAnalytics?: () => void;
    onShowBackupManager?: () => void;
    onBatchDeduplicate?: () => void;
    onShowAssetAdvisor?: () => void;
    
    // 🆕 提示词预览开关
    enablePromptPreview?: boolean;
    onTogglePromptPreview?: (enabled: boolean) => void;
}

export const AssetLibraryHeader: React.FC<AssetLibraryHeaderProps> = ({
    projectId,
    projectName,
    isExtracting,
    isSyncing,
    isBatchGenerating,
    onAIExtractClick,
    onSyncStyle,
    onBatchGenerate,
    onSave,
    onExport,
    onImportClick,
    groupBy,
    onGroupByChange,
    onShowRelationGraph,
    onShowAnalytics,
    onShowBackupManager,
    onBatchDeduplicate,
    onShowAssetAdvisor,
    enablePromptPreview,
    onTogglePromptPreview
}) => {
    return (
        <>
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">首页</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/project/${projectId}`}>{projectName || '项目'}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>项目库</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
                <div>
                    <CardTitle>项目库</CardTitle>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-gray-600 text-sm">管理角色、场景、道具和服饰</p>
                        <div className="h-4 w-[1px] bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">分组显示:</span>
                            <div className="flex bg-gray-100 p-0.5 rounded-md">
                                <button
                                    onClick={() => onGroupByChange('none')}
                                    className={`px-2 py-0.5 text-xs rounded transition-all ${groupBy === 'none' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    平铺
                                </button>
                                <button
                                    onClick={() => onGroupByChange('tags')}
                                    className={`px-2 py-0.5 text-xs rounded transition-all ${groupBy === 'tags' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    标签
                                </button>
                                <button
                                    onClick={() => onGroupByChange('source')}
                                    className={`px-2 py-0.5 text-xs rounded transition-all ${groupBy === 'source' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    来源
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* New Function Buttons */}
                    {onShowRelationGraph && (
                        <Button variant="outline" onClick={onShowRelationGraph} className="gap-2">
                            <Network className="w-4 h-4" />
                            关系图谱
                        </Button>
                    )}

                    {onShowAnalytics && (
                        <Button variant="outline" onClick={onShowAnalytics} className="gap-2">
                            <BarChart3 className="w-4 h-4" />
                            数据分析
                        </Button>
                    )}

                    {onShowBackupManager && (
                        <Button variant="outline" onClick={onShowBackupManager} className="gap-2">
                            <Database className="w-4 h-4" />
                            备份管理
                        </Button>
                    )}

                    {onBatchDeduplicate && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    disabled={isSyncing}
                                >
                                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    一键整理
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>确定要进行全库整理吗？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        系统将扫描整个资料库并自动合并相似度极高的角色、场景、道具等。
                                        <br /><br />
                                        <span className="text-amber-600 font-medium">⚠️ 注意：</span>
                                        此操作会自动修复分镜中的引用关系，但为了保险起见，建议在执行前先进行备份。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            console.log('[AssetLibraryHeader] 确认一键整理');
                                            onBatchDeduplicate();
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        开始整理
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {onShowAssetAdvisor && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={onShowAssetAdvisor}
                                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>AI 优化建议</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <div className="w-[1px] h-8 bg-gray-200 mx-1 hidden lg:block" />

                    {/* 🆕 提示词预览开关 */}
                    {onTogglePromptPreview && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white hover:bg-gray-50 transition-colors">
                                        <Eye className="w-4 h-4 text-blue-600" />
                                        <Switch
                                            checked={enablePromptPreview}
                                            onCheckedChange={onTogglePromptPreview}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                        <Label className="text-xs cursor-pointer">预览</Label>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>启用后，生成前会显示提示词预览</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <Button
                        variant="outline"
                        onClick={onAIExtractClick}
                        disabled={isExtracting}
                        className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                        <Sparkles className={`w-4 h-4 ${isExtracting ? 'animate-spin' : ''}`} />
                        {isExtracting ? '分析中...' : 'AI 一键提取'}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onBatchGenerate}
                        disabled={isBatchGenerating}
                        className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isBatchGenerating ? 'animate-spin' : ''}`} />
                        {isBatchGenerating ? '生成中...' : '批量生图'}
                    </Button>

                    <Button variant="outline" onClick={onImportClick} className="gap-2">
                        <Upload className="w-4 h-4" />
                        导入
                    </Button>

                    <Button variant="outline" onClick={onExport} className="gap-2">
                        <Download className="w-4 h-4" />
                        导出
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onSyncStyle}
                        disabled={isSyncing}
                        className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                        <Wand2 className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        同步风格
                    </Button>

                    <Button onClick={onSave} className="gap-2">
                        <Save className="w-4 h-4" />
                        保存资源
                    </Button>
                </div>
            </div>
        </>
    );
};
