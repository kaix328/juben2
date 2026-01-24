import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { chapterStorage } from '../../utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { AnalysisSidebar } from './components/AnalysisSidebar';
import { useScriptAnalysis } from './hooks/useScriptAnalysis';
import { cn } from '../../utils/classnames';
import { FloatingRewriteToolbar } from '../../components/FloatingRewriteToolbar';

import { MonacoScriptEditor } from '../../components/editor/MonacoScriptEditor';
import { DiffConfirmDialog } from '../../components/DiffConfirmDialog';
import { scriptRefiner } from '../../utils/ai/scriptRefiner';

export function ChapterEditor() {
    const { chapterId, projectId } = useParams<{ chapterId: string; projectId: string }>();

    // Data
    const chapter = useLiveQuery(
        () => (chapterId ? chapterStorage.getById(chapterId) : undefined),
        [chapterId]
    );

    const [originalText, setOriginalText] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);

    // Rewrite State
    const [toolbarVisible, setToolbarVisible] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    const [selectionState, setSelectionState] = useState({ text: '', start: 0, end: 0 });
    const [isRewriting, setIsRewriting] = useState(false);

    // Sync state
    useEffect(() => {
        if (chapter && originalText === '') {
            setOriginalText(chapter.originalText || '');
        }
    }, [chapter]);

    // Save handler
    const handleSave = async () => {
        if (!chapter) return;
        const updated = { ...chapter, originalText };
        await chapterStorage.save(updated);
        toast.success('原文已保存');
    };

    // Text Selection Handler (Adapted for Monaco)
    const handleSelect = (selection: { text: string; start: number; end: number; rect?: { top: number; left: number } }) => {
        // Only update if we have a valid text selection
        if (selection.text && selection.text.length > 0) {
            setSelectionState({
                text: selection.text,
                start: selection.start,
                end: selection.end
            });

            // Update toolbar position based on Monaco coordinates
            if (selection.rect) {
                setToolbarPosition({
                    top: selection.rect.top - 40, // Offset upwards
                    left: selection.rect.left
                });
                setToolbarVisible(true);
            }
        }
        // Note: Do NOT clear selectionState here if selection is empty.
        // Monaco fires empty selection on blur/click away, but we want to remember the last selection
        // so we can apply the rewrite to it.
        else {
            setToolbarVisible(false);
        }
    };
    // Removed handleMouseUp (handled by Monaco onSelectionChange)

    // Diff State
    const [diffState, setDiffState] = useState<string | null>(null);
    const [currentRewriteMode, setCurrentRewriteMode] = useState('');

    // AI Rewrite Handler
    const handleRewrite = async (options: { mode: string; styleId?: string; instruction?: string }) => {
        if (!chapterId || !projectId) return;
        setIsRewriting(true);
        setCurrentRewriteMode(options.mode === 'tone' ? '风格转换' : options.mode);

        try {
            // 构造上下文 (增强版)
            const context = {
                projectId,
                chapterId,
                previousText: originalText.substring(Math.max(0, selectionState.start - 500), selectionState.start),
                summary: (chapter as any)?.summary,
                // 🆕 自动注入角色信息
                characters: detectedAssets
                    ?.filter(a => a.type === 'character')
                    .map(a => a.data)
            };

            // 调用 AI
            const result = await scriptRefiner.refine(
                selectionState.text,
                context,
                { ...options, mode: options.mode as any }
            );

            if (result) {
                // 不直接应用，而是显示 Diff 弹窗
                setDiffState(result);
                toast.info('请确认改写结果');
            }
        } catch (error) {
            toast.error('改写请求出错');
        } finally {
            setIsRewriting(false);
        }
    };

    // 二次微调 Handler
    const handleChatRefine = async (instruction: string) => {
        if (!diffState || !selectionState.text || !projectId || !chapterId) return;

        try {
            const context = {
                projectId,
                chapterId,
                previousText: originalText.substring(Math.max(0, selectionState.start - 500), selectionState.start),
                summary: (chapter as any)?.summary,
                characters: detectedAssets?.filter(a => a.type === 'character').map(a => a.data)
            };

            // 使用当前 diffState (上一次改写结果) 作为基准进行调整
            const result = await scriptRefiner.refine(
                diffState,
                context,
                {
                    mode: 'refine',
                    instruction: instruction
                }
            );

            if (result) {
                setDiffState(result);
                toast.success('已根据指令调整');
            }
        } catch (error) {
            console.error(error);
            toast.error('请求出错');
        }
    };

    // 确认应用改写
    // 确认应用改写
    const handleApplyRewrite = () => {
        if (!diffState) {
            toast.error('改写内容为空');
            return;
        }

        // Validate selection range
        if (selectionState.start < 0 || selectionState.end > originalText.length || selectionState.start > selectionState.end) {
            console.error('Invalid selection state:', selectionState);
            toast.error('选区无效，请重新选择');
            return;
        }

        const newText =
            originalText.substring(0, selectionState.start) +
            diffState +
            originalText.substring(selectionState.end);

        console.log('[ApplyRewrite]', {
            start: selectionState.start,
            end: selectionState.end,
            oldLen: originalText.length,
            newLen: newText.length
        });

        setOriginalText(newText);
        setToolbarVisible(false);
        setDiffState(null);
        toast.success('AI 改写已应用');
    };

    // AI Analysis Hook
    const {
        isAnalyzing,
        detectedAssets,
        handleAnalyze,
        handleAddToLibrary,
        handleAddAllToLibrary,
        handleClearAnalysis
    } = useScriptAnalysis(projectId || '', chapterId || '', originalText);

    if (!chapter) {
        return <div className="text-center py-20">章节不存在</div>;
    }

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            {/* Main Editor Area */}
            <div className={cn("flex-1 flex flex-col transition-all duration-300", showSidebar ? "mr-0" : "mr-0")}>
                <Card className="flex-1 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                        <div>
                            <CardTitle className="text-lg">{chapter.title}</CardTitle>
                            <p className="text-gray-500 text-xs mt-1">在此编辑章节原文，选中文字即可使用 AI 改写</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setShowSidebar(!showSidebar)} variant="ghost" size="icon">
                                {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                            </Button>
                            <Button onClick={handleSave} className="gap-2">
                                <Save className="w-4 h-4" />
                                保存
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <MonacoScriptEditor
                            value={originalText}
                            onChange={setOriginalText}
                            onSelectionChange={handleSelect}
                            className="bg-gray-50/30"
                        />
                        {/* Old textarea removed */}
                    </CardContent>
                </Card>
            </div>


            {/* Smart Sidebar */}
            {showSidebar && (
                <div className="w-80 flex-shrink-0 flex flex-col animate-in slide-in-from-right-10 duration-300">
                    <AnalysisSidebar
                        isAnalyzing={isAnalyzing}
                        detectedAssets={detectedAssets}
                        onAnalyze={handleAnalyze}
                        onAddToLibrary={handleAddToLibrary}
                        onAddAllToLibrary={handleAddAllToLibrary}
                        onClearAnalysis={handleClearAnalysis}
                    />
                </div>
            )}

            {/* 悬浮改写工具栏 */}
            <FloatingRewriteToolbar
                visible={toolbarVisible}
                position={toolbarPosition}
                selectedText={selectionState.text}
                isLoading={isRewriting}
                onClose={() => setToolbarVisible(false)}
                onRewrite={handleRewrite}
            />

            {/* 🆕 Diff 确认弹窗 */}
            <DiffConfirmDialog
                open={!!diffState}
                onClose={() => setDiffState(null)}
                original={selectionState.text}
                modified={diffState || ''}
                mode={currentRewriteMode}
                onApply={handleApplyRewrite}
                onRefine={handleChatRefine}
            />
        </div>
    );
}




