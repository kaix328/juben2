import React from 'react';
import {
    Sparkles, Save, List, Grid3x3, Clock, Download, FileDown, History, Wand2, Users, Library, Loader2, CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/button';
import { CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import type { Script, Storyboard } from '../../types';
import type { ExportPlatform } from '../../utils/prompts';
import type { ExtractProgress } from '../../types/extraction';
import { Progress } from '../ui/progress';

export type ViewMode = 'list' | 'grid' | 'timeline';

interface StoryboardHeaderProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    selectedEpisode: number | 'all';
    setSelectedEpisode: (ep: number | 'all') => void;
    allEpisodes: number[];
    panelDensityMode: 'compact' | 'standard' | 'detailed';
    setPanelDensityMode: (mode: 'compact' | 'standard' | 'detailed') => void;
    estimatedPanelCount: { min: number, max: number };
    isExtracting: boolean;
    extractProgress?: ExtractProgress | null;
    script: Script | null;
    storyboard: Storyboard | null;
    filteredPanelsCount: number;
    handleAIExtractByEpisode: (ep: number | 'all') => void;
    handleBatchRegeneratePrompts: () => Promise<any>;
    handleExportStoryboard: (format: string) => void;
    handleExportPDF: () => void;
    handleExportPrompts: (platform: ExportPlatform) => void;
    handleSave: () => void;
    loadVersions: () => void;
    setShowHistoryDialog: (show: boolean) => void;
    onSyncToAssetLibrary?: () => void;
    showResourceLibrary?: boolean;
    onToggleResourceLibrary?: () => void;
    onQualityCheck?: () => void; // 🆕 质量检查回调
    qualityScore?: number; // 🆕 质量分数
    isCheckingQuality?: boolean; // 🆕 是否正在检查
    selectedPanelsCount?: number; // 🆕 选中数量
    enablePromptOptimization?: boolean; // 🆕 AI 提示词优化开关
    onTogglePromptOptimization?: (enabled: boolean) => void; // 🆕 切换优化开关
    children?: React.ReactNode;
}

export function StoryboardHeader({
    viewMode,
    setViewMode,
    selectedEpisode,
    setSelectedEpisode,
    allEpisodes,
    panelDensityMode,
    setPanelDensityMode,
    estimatedPanelCount,
    isExtracting,
    extractProgress,
    script,
    storyboard,
    filteredPanelsCount,
    handleAIExtractByEpisode,
    handleBatchRegeneratePrompts,
    handleExportStoryboard,
    handleExportPDF,
    handleExportPrompts,
    handleSave,
    loadVersions,
    setShowHistoryDialog,
    onSyncToAssetLibrary,
    showResourceLibrary,
    onToggleResourceLibrary,
    onQualityCheck, // 🆕
    qualityScore, // 🆕
    isCheckingQuality, // 🆕
    selectedPanelsCount = 0, // 🆕
    enablePromptOptimization = true, // 🆕
    onTogglePromptOptimization, // 🆕
    children,
}: StoryboardHeaderProps) {
    return (
        <CardHeader className="space-y-4 pb-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            {/* 第一行：标题 + 主要操作 */}
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle
                        className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                        style={{
                            backgroundImage: 'linear-gradient(to right, #9333ea, #a855f7, #ec4899)',
                        }}
                    >
                        分镜制作
                    </CardTitle>
                    <p className="text-gray-600 text-sm mt-1">专业电影分镜设计，支持按集数筛选和AI视频生成</p>
                </div>

                {/* 主要操作按钮组 */}
                <div className="flex gap-2 items-center">
                    <Button
                        onClick={() => handleAIExtractByEpisode(selectedEpisode)}
                        disabled={isExtracting || !script}
                        className="gap-2"
                        variant="secondary"
                    >
                        {isExtracting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                AI提取中...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                AI提取{selectedEpisode === 'all' ? '全部' : `第${selectedEpisode}集`}
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleBatchRegeneratePrompts}
                        disabled={!storyboard || filteredPanelsCount === 0}
                        variant="outline"
                        className="gap-2"
                        title="根据当前分镜参数重新生成提示词"
                    >
                        <Wand2 className="w-4 h-4" />
                        {selectedPanelsCount > 0 ? `刷新选中 (${selectedPanelsCount})` : '刷新全部提示词'}
                    </Button>

                    <Button onClick={handleSave} disabled={!storyboard} className="gap-2">
                        <Save className="w-4 h-4" />
                        保存
                    </Button>
                </div>
            </div>

            {/* 进度条显示 */}
            {isExtracting && extractProgress && (
                <div className="space-y-2 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="font-medium text-purple-900">{extractProgress.message}</span>
                        </div>
                        <span className="text-purple-700 font-semibold">
                            {extractProgress.percentage}%
                        </span>
                    </div>
                    <Progress value={extractProgress.percentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-purple-600">
                        <span>
                            {extractProgress.stage === 'preparing' && '📋 准备中'}
                            {extractProgress.stage === 'extracting' && '🤖 AI 生成中'}
                            {extractProgress.stage === 'processing' && '⚙️ 处理中'}
                            {extractProgress.stage === 'validating' && '✅ 验证中'}
                            {extractProgress.stage === 'complete' && '🎉 完成'}
                        </span>
                        <span>
                            {extractProgress.current} / {extractProgress.total}
                        </span>
                    </div>
                </div>
            )}

            {/* 第二行：视图控制 + 筛选 + 工具 */}
            <div className="flex gap-3 items-center justify-between">
                {/* 左侧：视图和筛选控制 */}
                <div className="flex gap-3 items-center">
                    {/* 视图切换 */}
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="rounded-none"
                            title="列表视图"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="rounded-none"
                            title="网格视图"
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('timeline')}
                            className="rounded-none"
                            title="时间轴视图"
                        >
                            <Clock className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* 集数选择器 */}
                    {allEpisodes.length > 0 && (
                        <Select
                            value={selectedEpisode === 'all' ? 'all' : String(selectedEpisode)}
                            onValueChange={(value) => {
                                setSelectedEpisode(value === 'all' ? 'all' : parseInt(value));
                            }}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="选择集" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部集数</SelectItem>
                                {allEpisodes.map(ep => (
                                    <SelectItem key={ep} value={String(ep)}>
                                        第{ep}集
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* 分镜密度模式选择 */}
                    <Select
                        value={panelDensityMode}
                        onValueChange={(value) => setPanelDensityMode(value as any)}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compact">精简</SelectItem>
                            <SelectItem value="standard">标准</SelectItem>
                            <SelectItem value="detailed">详细</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* 预估分镜数显示 */}
                    {script && (
                        <div
                            className="text-xs text-gray-700 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full flex items-center gap-1.5 whitespace-nowrap"
                            title="基于当前剧本内容和提取密度预估的分镜总数"
                        >
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span className="font-medium">预估 {estimatedPanelCount.min}-{estimatedPanelCount.max} 个</span>
                        </div>
                    )}

                    {/* 🆕 AI 提示词优化开关 */}
                    {onTogglePromptOptimization && (
                        <div 
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg"
                            title={enablePromptOptimization ? "AI 智能优化提示词（使用专业引擎）" : "使用简单模板生成提示词"}
                        >
                            <Sparkles className={`w-4 h-4 transition-colors ${enablePromptOptimization ? 'text-purple-600' : 'text-gray-400'}`} />
                            <span className="text-sm font-medium text-purple-900 whitespace-nowrap">AI 优化</span>
                            <Switch
                                checked={enablePromptOptimization}
                                onCheckedChange={onTogglePromptOptimization}
                            />
                        </div>
                    )}
                </div>

                {/* 右侧：工具按钮组 */}
                <div className="flex gap-2 items-center">
                    {/* 🆕 质量检查按钮 */}
                    {onQualityCheck && (
                        <Button
                            onClick={onQualityCheck}
                            disabled={!storyboard || filteredPanelsCount === 0 || isCheckingQuality}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                            title="检查分镜质量（连贯性、时长、角色等）"
                        >
                            {isCheckingQuality ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    检查中...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    质量检查
                                    {qualityScore !== undefined && (
                                        <Badge
                                            variant={qualityScore >= 80 ? "default" : "destructive"}
                                            className="ml-1"
                                        >
                                            {qualityScore}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </Button>
                    )}

                    {/* 同步到项目库 */}
                    {onSyncToAssetLibrary && (
                        <Button
                            onClick={onSyncToAssetLibrary}
                            disabled={!storyboard || filteredPanelsCount === 0}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
                            title="从分镜提取新角色/场景到项目库"
                        >
                            <Users className="w-4 h-4" />
                            同步项目库
                        </Button>
                    )}

                    {/* 资源库按钮 */}
                    {onToggleResourceLibrary && (
                        <Button
                            onClick={onToggleResourceLibrary}
                            variant={showResourceLibrary ? "default" : "outline"}
                            size="sm"
                            className="gap-1.5"
                            title={showResourceLibrary ? "关闭资源库" : "打开资源库"}
                        >
                            <Library className="w-4 h-4" />
                            资源库
                        </Button>
                    )}

                    {children}

                    {/* 导出下拉菜单 */}
                    <Select
                        onValueChange={(value) => {
                            if (value === 'text') handleExportStoryboard('text');
                            else if (value === 'pdf') handleExportPDF();
                            else handleExportPrompts(value as ExportPlatform);
                        }}
                    >
                        <SelectTrigger className="w-[120px]" disabled={!storyboard} size="sm">
                            <Download className="w-4 h-4 mr-1.5" />
                            导出
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text">文本格式</SelectItem>
                            <SelectItem value="pdf">PDF文档</SelectItem>
                            <SelectItem value="generic">提示词-通用</SelectItem>
                            <SelectItem value="midjourney">提示词-MJ</SelectItem>
                            <SelectItem value="comfyui">提示词-ComfyUI</SelectItem>
                            <SelectItem value="runway">提示词-Runway</SelectItem>
                            <SelectItem value="pika">提示词-Pika</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* 版本历史 */}
                    <Button
                        onClick={() => { loadVersions(); setShowHistoryDialog(true); }}
                        disabled={!storyboard}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        title="版本历史"
                    >
                        <History className="w-4 h-4" />
                        版本
                    </Button>
                </div>
            </div>
        </CardHeader>
    );
}
