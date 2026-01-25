// ScriptEditor 工具栏组件
import { Button } from '../../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu';
import {
    Sparkles, Save, Plus, BarChart3, Download, Upload,
    CheckSquare, Undo2, Redo2, Replace, BookOpen, Clock, FileText, FileCode, Library, Eye, List
} from 'lucide-react';
import type { ScriptMode } from '../../../utils/aiService';

interface ScriptEditorToolbarProps {
    viewMode: 'edit' | 'preview';
    onViewModeChange: (mode: 'edit' | 'preview') => void;
    scriptMode: ScriptMode;
    onScriptModeChange: (mode: ScriptMode) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
    onAIExtract: () => void;
    onAddScene: () => void;
    onToggleStats: () => void;
    onToggleBatchMode: () => void;
    onShowReplace: () => void;
    onShowFiveElements: () => void;
    onShowBackup: () => void;
    onShowImport: () => void;
    onShowTemplates: () => void;
    onShowContinuityCheck: () => void;
    onShowOutline: () => void; // 🆕 大纲视图
    onExportMarkdown: () => void;
    onExportText: () => void;
    onExportPDF: () => void;
    onExportHTML: () => void;
    onExportWord: () => void;
    onExportFountain: () => void;
    onExportFDX: () => void;
    isExtracting: boolean;
    batchMode: boolean;
}

const MODE_LABELS: Record<ScriptMode, string> = {
    movie: '电影剧本',
    tv_drama: '电视剧剧本',
    short_video: '短视频剧本',
    web_series: '网络剧剧本',
};

export function ScriptEditorToolbar({
    viewMode,
    onViewModeChange,
    scriptMode,
    onScriptModeChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onSave,
    onAIExtract,
    onAddScene,
    onToggleStats,
    onToggleBatchMode,
    onShowReplace,
    onShowFiveElements,
    onShowBackup,
    onShowImport,
    onShowTemplates,
    onShowContinuityCheck,
    onShowOutline, // 🆕
    onExportMarkdown,
    onExportText,
    onExportPDF,
    onExportHTML,
    onExportWord,
    onExportFountain,
    onExportFDX,
    isExtracting,
    batchMode,
}: ScriptEditorToolbarProps) {
    return (
        <div className="flex gap-2 flex-wrap">
            {/* 撤销/重做按钮 */}
            <Button
                variant="outline"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                title="撤销 (Ctrl+Z)"
            >
                <Undo2 className="w-4 h-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                title="重做 (Ctrl+Y)"
            >
                <Redo2 className="w-4 h-4" />
            </Button>

            {/* 视图模式切换 */}
            <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'edit' | 'preview')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit">编辑模式</TabsTrigger>
                    <TabsTrigger value="preview">预览模式</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* 剧本模式选择器 */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {MODE_LABELS[scriptMode]}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {(Object.keys(MODE_LABELS) as ScriptMode[]).map((mode) => (
                        <DropdownMenuItem
                            key={mode}
                            onClick={() => onScriptModeChange(mode)}
                        >
                            {MODE_LABELS[mode]}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* 🆕 大纲视图按钮 */}
            <Button onClick={onShowOutline} variant="outline" size="sm" className="gap-2">
                <List className="w-4 h-4" />
                大纲视图
            </Button>

            {/* 🆕 模板库按钮 */}
            <Button onClick={onShowTemplates} variant="outline" size="sm" className="gap-2">
                <Library className="w-4 h-4" />
                模板库
            </Button>

            {/* 🆕 导入剧本按钮 */}
            <Button onClick={onShowImport} variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                导入剧本
            </Button>

            {/* AI 提取按钮 */}
            <Button
                onClick={onAIExtract}
                disabled={isExtracting}
                size="sm"
            >
                <Sparkles className="w-4 h-4 mr-2" />
                {isExtracting ? 'AI 提取中...' : 'AI 提取剧本'}
            </Button>

            {/* 保存按钮 */}
            <Button onClick={onSave} variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                保存
            </Button>

            {/* 添加场景 */}
            <Button onClick={onAddScene} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                添加场景
            </Button>

            {/* 统计面板切换 */}
            <Button onClick={onToggleStats} variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                统计
            </Button>

            {/* 批量编辑 */}
            <Button
                onClick={onToggleBatchMode}
                variant={batchMode ? 'default' : 'outline'}
                size="sm"
            >
                <CheckSquare className="w-4 h-4 mr-2" />
                {batchMode ? '退出批量' : '批量编辑'}
            </Button>

            {/* 查找替换 */}
            <Button onClick={onShowReplace} variant="outline" size="sm">
                <Replace className="w-4 h-4 mr-2" />
                查找替换
            </Button>

            {/* 🆕 连贯性检查 */}
            <Button onClick={onShowContinuityCheck} variant="outline" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                连贯性检查
            </Button>

            {/* 五元素分析 */}
            <Button onClick={onShowFiveElements} variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                五元素分析
            </Button>

            {/* 备份管理 */}
            <Button onClick={onShowBackup} variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                备份管理
            </Button>

            {/* 导出菜单 */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        导出
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={onExportMarkdown}>
                        导出为 Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportText}>
                        导出为纯文本
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportPDF}>
                        导出为 PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportHTML}>
                        导出为 HTML
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportWord}>
                        导出为 Word (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportFountain} className="gap-2">
                        <FileText className="w-4 h-4" />
                        导出为 Fountain
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportFDX} className="gap-2">
                        <FileCode className="w-4 h-4" />
                        导出为 Final Draft (.fdx)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
