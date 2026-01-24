// ScriptEditor 头部组件
import { CardHeader, CardTitle } from '../../../components/ui/card';
import { FilmIcon } from 'lucide-react';
import { ScriptEditorToolbar } from './ScriptEditorToolbar';
import type { ScriptMode } from '../../../utils/aiService';

interface ScriptEditorHeaderProps {
    chapterTitle: string;
    lastSaved: string | null;
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
    onExportMarkdown: () => void;
    onExportText: () => void;
    onExportPDF: () => void;
    onExportHTML: () => void;
    onExportWord: () => void;
    isExtracting: boolean;
    batchMode: boolean;
}

export function ScriptEditorHeader({
    chapterTitle,
    lastSaved,
    ...toolbarProps
}: ScriptEditorHeaderProps) {
    return (
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <FilmIcon className="w-5 h-5" />
                    {chapterTitle} - 剧本改写
                </CardTitle>
                <p className="text-gray-600 text-sm mt-1">
                    专业电影剧本格式
                    {lastSaved && (
                        <span className="ml-2 text-green-600">
                            (自动保存于 {lastSaved})
                        </span>
                    )}
                </p>
            </div>
            <ScriptEditorToolbar {...toolbarProps} />
        </CardHeader>
    );
}
