// ScriptEditor 主组件 - 重构版本（拆分后）
import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';

// 导入拆分后的组件
import { ScriptEditorHeader } from './components/ScriptEditorHeader';
import { ScriptEditorDialogs } from './components/ScriptEditorDialogs';
import { ScriptEditorSceneList } from './components/ScriptEditorSceneList';
import { StatsPanel } from './components/StatsPanel';
import { BatchEditPanel } from './components/BatchEditPanel';
import { EpisodeFilter } from './components/EpisodeFilter';
import { ExtractProgressIndicator } from './components/ExtractProgressIndicator';
import { CharacterStats } from './components/CharacterStats';
import { PageCounter } from './components/PageCounter';

// 导入 Hooks
import { useScriptData } from './hooks/useScriptData';
import { useScriptStats, getAllEpisodes, getFilteredScenes } from './hooks/useScriptStats';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// 🆕 移动端组件
import { useDevice } from '../../hooks/useDevice';
import { MobileScriptEditor } from './MobileIntegration';

// 导入工具函数
import { exportScriptToMarkdown, exportScriptToText, downloadText } from '../../utils/exportUtils';
import { exportScriptToPDF, exportScriptToHTML, downloadHTML } from '../../utils/pdfExport';
import { saveBackup } from '../../utils/scriptBackup';

// 导入类型
import type { ScriptScene } from './types';
import type { ScriptMode } from '../../utils/aiService';

const MODE_LABELS: Record<ScriptMode, string> = {
    movie: '电影剧本',
    tv_drama: '电视剧剧本',
    short_video: '短视频剧本',
    web_series: '网络剧剧本',
};

function getModeLabel(mode: ScriptMode): string {
    return MODE_LABELS[mode] || '电视剧剧本';
}

export function ScriptEditor() {
    const { chapterId, projectId } = useParams<{ chapterId: string; projectId: string }>();

    // ========== 状态管理 ==========

    // 剧本模式
    const [scriptMode, setScriptMode] = useState<ScriptMode>(() => {
        const saved = localStorage.getItem(`scriptMode_${chapterId}`);
        return (saved as ScriptMode) || 'tv_drama';
    });

    // UI 状态
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [selectedEpisode, setSelectedEpisode] = useState<number | 'all'>('all');
    const [showStats, setShowStats] = useState(true);
    const [batchMode, setBatchMode] = useState(false);
    const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set());
    // const [showBatchPanel, setShowBatchPanel] = useState(false);
    const [showCharacterStats, setShowCharacterStats] = useState(false);
    
    // 🆕 移动端状态
    const device = useDevice();
    const [showMobileAlert, setShowMobileAlert] = useState(true);

    // 对话框状态
    const [showReplaceDialog, setShowReplaceDialog] = useState(false);
    const [showFiveElementsDialog, setShowFiveElementsDialog] = useState(false);
    const [showBackupDialog, setShowBackupDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
    const [showContinuityDialog, setShowContinuityDialog] = useState(false);
    const [showOutlineDialog, setShowOutlineDialog] = useState(false); // 🆕
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');

    // ========== Hooks ==========

    // 数据管理
    const {
        chapter,
        script,
        isExtracting,
        extractProgress,
        lastSaved,
        canUndo,
        canRedo,
        handleAIExtract,
        handleSave,
        handleUpdateScene,
        handleAddScene,
        handleDeleteScene,
        handleAddDialogue,
        handleUpdateDialogue,
        handleDeleteDialogue,
        handleBatchUpdate,
        handleBatchDelete,
        handleUpdateScript,
        handleUpdateScenes,
        undo,
        redo,
        // 🆕 提取控制
        handlePauseExtract,
        handleResumeExtract,
        handleStopExtract,
        isPaused,
        // curExtractChunk,
        // totalExtractChunks,
    } = useScriptData({ chapterId, scriptMode });

    // 统计数据
    const stats = useScriptStats({ script });

    // 快捷键
    useKeyboardShortcuts({
        onSave: handleSave,
        onUndo: undo,
        onRedo: redo,
        onAddScene: handleAddScene,
        onToggleStats: () => setShowStats(prev => !prev),
        onToggleBatchMode: () => batchMode ? exitBatchMode() : setBatchMode(true),
        enabled: viewMode === 'edit',
    });

    // ========== 计算属性 ==========

    const episodes = useMemo(() => getAllEpisodes(script), [script]);
    const filteredScenes = useMemo(
        () => getFilteredScenes(script, selectedEpisode),
        [script, selectedEpisode]
    );

    // ========== 事件处理 ==========

    // 剧本模式切换
    const handleScriptModeChange = useCallback((mode: ScriptMode) => {
        setScriptMode(mode);
        if (chapterId) {
            localStorage.setItem(`scriptMode_${chapterId}`, mode);
        }
        toast.success(`已切换到${getModeLabel(mode)}模式`);
    }, [chapterId]);

    // 场景标题格式化
    const formatSceneHeading = useCallback((scene: ScriptScene) => {
        return `${scene.sceneNumber}. ${scene.sceneType}. ${scene.location} - ${scene.timeOfDay}`;
    }, []);

    // 批量选择
    const toggleSceneSelection = useCallback((sceneId: string) => {
        setSelectedScenes(prev => {
            const next = new Set(prev);
            if (next.has(sceneId)) {
                next.delete(sceneId);
            } else {
                next.add(sceneId);
            }
            return next;
        });
    }, []);

    const selectAllScenes = useCallback(() => {
        setSelectedScenes(new Set(filteredScenes.map(s => s.id)));
    }, [filteredScenes]);

    const clearSelection = useCallback(() => {
        setSelectedScenes(new Set());
    }, []);

    const handleBatchUpdateWithSelection = useCallback((updates: Partial<ScriptScene>) => {
        handleBatchUpdate(selectedScenes, updates);
    }, [handleBatchUpdate, selectedScenes]);

    const handleBatchDeleteWithSelection = useCallback(() => {
        handleBatchDelete(selectedScenes);
        clearSelection();
        setBatchMode(false);
        // setShowBatchPanel(false);
    }, [handleBatchDelete, selectedScenes, clearSelection]);

    const exitBatchMode = useCallback(() => {
        setBatchMode(false);
        clearSelection();
        // setShowBatchPanel(false);
    }, [clearSelection]);

    // 全局替换
    const handleGlobalReplace = useCallback(() => {
        if (!script || !findText.trim()) {
            toast.error('请输入要查找的文本');
            return;
        }

        let replaceCount = 0;
        const updatedScenes = script.scenes.map(scene => {
            let modified = false;
            const newScene = { ...scene };

            if (scene.characters) {
                newScene.characters = scene.characters.map(char => {
                    if (char === findText) {
                        modified = true;
                        replaceCount++;
                        return replaceText;
                    }
                    return char;
                });
            }

            newScene.dialogues = scene.dialogues.map(d => {
                if (d.character === findText) {
                    modified = true;
                    replaceCount++;
                    return { ...d, character: replaceText };
                }
                return d;
            });

            if (scene.action?.includes(findText)) {
                modified = true;
                const count = (scene.action.match(new RegExp(findText, 'g')) || []).length;
                replaceCount += count;
                newScene.action = scene.action.split(findText).join(replaceText);
            }

            return modified ? newScene : scene;
        });

        handleUpdateScenes(updatedScenes);
        toast.success(`已完成全剧替换，共计 ${replaceCount} 处`);
        setShowReplaceDialog(false);
        setFindText('');
        setReplaceText('');
    }, [script, findText, replaceText, handleUpdateScenes]);



    // 手动备份
    const handleManualBackup = useCallback(() => {
        if (!script || !chapterId) {
            toast.error('没有可备份的内容');
            return;
        }
        saveBackup(chapterId, script, 'manual', '手动备份');
        toast.success('备份已保存');
    }, [script, chapterId]);

    // 恢复备份
    const handleRestoreBackup = useCallback((restoredScript: any) => {
        handleUpdateScript(restoredScript);
        toast.success('备份已恢复');
    }, [handleUpdateScript]);

    // 场景拖拽排序
    const handleMoveScene = useCallback((dragIndex: number, hoverIndex: number) => {
        if (!script) return;

        const dragScene = filteredScenes[dragIndex];
        const newScenes = [...script.scenes];

        const actualDragIndex = newScenes.findIndex(s => s.id === dragScene.id);
        const actualHoverIndex = newScenes.findIndex(s => s.id === filteredScenes[hoverIndex].id);

        const [removed] = newScenes.splice(actualDragIndex, 1);
        newScenes.splice(actualHoverIndex, 0, removed);

        // 重新编号
        newScenes.forEach((scene, idx) => {
            scene.sceneNumber = idx + 1;
        });

        handleUpdateScenes(newScenes);
    }, [script, filteredScenes, handleUpdateScenes]);

    // 导出功能
    const handleExportMarkdown = useCallback(() => {
        if (!script || !chapter) return;
        const markdown = exportScriptToMarkdown(chapter, script);
        downloadText(markdown, `${chapter.title}_剧本.md`);
        toast.success('已导出为 Markdown');
    }, [script, chapter]);

    const handleExportText = useCallback(() => {
        if (!script || !chapter) return;
        const text = exportScriptToText(chapter, script);
        downloadText(text, `${chapter.title}_剧本.txt`);
        toast.success('已导出为纯文本');
    }, [script, chapter]);

    const handleExportPDF = useCallback(() => {
        if (!script || !chapter) return;
        exportScriptToPDF(chapter, script);
        toast.success('PDF 导出已开始');
    }, [script, chapter]);

    const handleExportHTML = useCallback(() => {
        if (!script || !chapter) return;
        const html = exportScriptToHTML(chapter, script);
        downloadHTML(html, `${chapter.title}_剧本.html`);
        toast.success('已导出为 HTML');
    }, [script, chapter]);

    const handleExportWord = useCallback(async () => {
        if (!script || !chapter) return;
        try {
            const { exportScriptToWord } = await import('../../utils/export/wordExport');
            await exportScriptToWord(script, chapter.title);
            toast.success('已导出为 Word');
        } catch (error) {
            console.error(error);
            toast.error('导出失败');
        }
    }, [script, chapter]);

    // 🆕 导出为 Fountain 格式
    const handleExportFountain = useCallback(async () => {
        if (!script || !chapter) return;
        try {
            const { scriptConverter, downloadScript } = await import('../../utils/scriptFormats');
            
            // 转换为 ParsedScript 格式
            const parsedScript = {
                title: chapter.title,
                author: '',
                elements: script.scenes.flatMap(scene => [
                    {
                        type: 'scene_heading' as const,
                        content: `${scene.sceneType}. ${scene.location} - ${scene.timeOfDay}`.toUpperCase()
                    },
                    ...(scene.action ? [{
                        type: 'action' as const,
                        content: scene.action
                    }] : []),
                    ...scene.dialogues.flatMap(d => [
                        {
                            type: 'character' as const,
                            content: d.character,
                            metadata: {
                                dialogue: [{
                                    type: d.parenthetical ? 'parenthetical' as const : 'dialogue' as const,
                                    content: d.parenthetical || d.lines
                                }]
                            }
                        }
                    ])
                ]),
                metadata: {}
            };

            downloadScript(parsedScript, { format: 'fountain' });
            toast.success('已导出为 Fountain 格式');
        } catch (error) {
            console.error(error);
            toast.error('导出失败');
        }
    }, [script, chapter]);

    // 🆕 导出为 Final Draft 格式
    const handleExportFDX = useCallback(async () => {
        if (!script || !chapter) return;
        try {
            const { scriptConverter, downloadScript } = await import('../../utils/scriptFormats');
            
            // 转换为 ParsedScript 格式
            const parsedScript = {
                title: chapter.title,
                author: '',
                elements: script.scenes.flatMap(scene => [
                    {
                        type: 'scene_heading' as const,
                        content: `${scene.sceneType}. ${scene.location} - ${scene.timeOfDay}`.toUpperCase()
                    },
                    ...(scene.action ? [{
                        type: 'action' as const,
                        content: scene.action
                    }] : []),
                    ...scene.dialogues.flatMap(d => [
                        {
                            type: 'character' as const,
                            content: d.character,
                            metadata: {
                                dialogue: [{
                                    type: d.parenthetical ? 'parenthetical' as const : 'dialogue' as const,
                                    content: d.parenthetical || d.lines
                                }]
                            }
                        }
                    ])
                ]),
                metadata: {}
            };

            downloadScript(parsedScript, { format: 'fdx' });
            toast.success('已导出为 Final Draft 格式');
        } catch (error) {
            console.error(error);
            toast.error('导出失败');
        }
    }, [script, chapter]);

    // 🆕 导入剧本
    const handleImportScript = useCallback((scenes: ScriptScene[]) => {
        if (scenes.length === 0) {
            toast.error('导入的剧本为空');
            return;
        }

        // 替换当前剧本
        handleUpdateScenes(scenes);
        toast.success(`成功导入 ${scenes.length} 个场景`);
    }, [handleUpdateScenes]);

    // 🆕 应用模板
    const handleSelectTemplate = useCallback((scenes: ScriptScene[]) => {
        if (scenes.length === 0) {
            toast.error('模板为空');
            return;
        }

        // 替换当前剧本
        handleUpdateScenes(scenes);
        toast.success(`已应用模板，共 ${scenes.length} 个场景`);
    }, [handleUpdateScenes]);

    // 🆕 跳转到场景
    const handleJumpToScene = useCallback((sceneNumber: number) => {
        // 滚动到指定场景
        const sceneElement = document.querySelector(`[data-scene-number="${sceneNumber}"]`);
        if (sceneElement) {
            sceneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // 高亮场景
            sceneElement.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => {
                sceneElement.classList.remove('ring-2', 'ring-blue-500');
            }, 2000);
        }
        toast.info(`已跳转到场景 ${sceneNumber}`);
    }, []);

    // 🆕 AI 批量润色
    const handleBatchPolish = useCallback(async (instruction: string) => {
        if (!script || selectedScenes.size === 0) return;

        toast.info(`开始批量优化 ${selectedScenes.size} 个场景...`);
        let processedCount = 0;

        try {
            // 动态导入避免循环依赖
            const { scriptRefiner } = await import('../../utils/ai/scriptRefiner');

            const updatedScenes = [...script.scenes];

            for (let i = 0; i < updatedScenes.length; i++) {
                const scene = updatedScenes[i];
                if (selectedScenes.has(scene.id)) {
                    // 构建简单的上下文
                    const context = {
                        projectId: chapter?.projectId || '',
                        chapterId: chapter?.id || '',
                        characters: scene.characters.map(name => ({
                            id: name,
                            name,
                            projectId: chapter?.projectId || '',
                            description: '',
                            appearance: '',
                            personality: '',
                            avatar: ''
                        })),
                    };

                    let newAction = scene.action;

                    // 仅演示优化动作描写
                    if (scene.action) {
                        newAction = await scriptRefiner.refine(
                            scene.action,
                            context,
                            { instruction: instruction === 'compact' ? '精简这段动作描写' : '润色这段动作描写' }
                        );
                    }

                    updatedScenes[i] = { ...scene, action: newAction };
                    processedCount++;

                    // 每完成一个就保存一次状态，或者仅更新 ref 以防中间断掉? 
                    // 这里简化为处理完后统一更新
                }
            }

            handleUpdateScenes(updatedScenes);
            toast.success(`已完成 ${processedCount} 个场景的优化`);
            setBatchMode(false);
            setSelectedScenes(new Set());
        } catch (error) {
            console.error(error);
            toast.error('批量优化部分失败');
        }
    }, [script, selectedScenes, chapter, handleUpdateScenes]);

    // ========== 渲染 ==========

    if (!chapter) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">加载中...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* 对话框集合 */}
            <ScriptEditorDialogs
                showReplaceDialog={showReplaceDialog}
                onReplaceDialogChange={setShowReplaceDialog}
                findText={findText}
                onFindTextChange={setFindText}
                replaceText={replaceText}
                onReplaceTextChange={setReplaceText}
                onGlobalReplace={handleGlobalReplace}
                showFiveElementsDialog={showFiveElementsDialog}
                onFiveElementsDialogChange={setShowFiveElementsDialog}
                projectId={projectId || ''}
                chapterId={chapterId || ''}
                script={script}
                chapterOriginalText={chapter.originalText || ''}
                onAnalysisComplete={() => toast.success('五元素分析已完成')}
                showBackupDialog={showBackupDialog}
                onBackupDialogChange={setShowBackupDialog}
                onRestoreBackup={handleRestoreBackup}
                showImportDialog={showImportDialog}
                onImportDialogChange={setShowImportDialog}
                onImportScript={handleImportScript}
                showTemplatesDialog={showTemplatesDialog}
                onTemplatesDialogChange={setShowTemplatesDialog}
                onSelectTemplate={handleSelectTemplate}
                showContinuityDialog={showContinuityDialog}
                onContinuityDialogChange={setShowContinuityDialog}
                onJumpToScene={handleJumpToScene}
                showOutlineDialog={showOutlineDialog}
                onOutlineDialogChange={setShowOutlineDialog}
                onUpdateScene={handleUpdateScene}
                onDeleteScene={handleDeleteScene}
                onAddScene={handleAddScene}
            />

            <Card className="mx-0 md:mx-auto">
                {/* 头部工具栏 */}
                <ScriptEditorHeader
                    chapterTitle={chapter.title}
                    lastSaved={lastSaved}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    scriptMode={scriptMode}
                    onScriptModeChange={handleScriptModeChange}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={undo}
                    onRedo={redo}
                    onSave={handleSave}
                    onAIExtract={handleAIExtract}
                    onAddScene={handleAddScene}
                    onToggleStats={() => setShowStats(!showStats)}
                    onToggleBatchMode={() => batchMode ? exitBatchMode() : setBatchMode(true)}
                    onShowReplace={() => setShowReplaceDialog(true)}
                    onShowFiveElements={() => setShowFiveElementsDialog(true)}
                    onShowBackup={() => setShowBackupDialog(true)}
                    onShowImport={() => setShowImportDialog(true)}
                    onShowTemplates={() => setShowTemplatesDialog(true)}
                    onShowContinuityCheck={() => setShowContinuityDialog(true)}
                    onShowOutline={() => setShowOutlineDialog(true)}
                    onExportMarkdown={handleExportMarkdown}
                    onExportText={handleExportText}
                    onExportPDF={handleExportPDF}
                    onExportHTML={handleExportHTML}
                    onExportWord={handleExportWord}
                    onExportFountain={handleExportFountain}
                    onExportFDX={handleExportFDX}
                    isExtracting={isExtracting}
                    batchMode={batchMode}
                />

                <CardContent className="space-y-4 md:space-y-6 px-4 md:px-0">
                    {/* AI 提取进度 */}
                    {(isExtracting || isPaused) && extractProgress && (
                        <ExtractProgressIndicator
                            progress={extractProgress}
                            isPaused={isPaused}
                            onPause={handlePauseExtract}
                            onResume={handleResumeExtract}
                            onStop={handleStopExtract}
                        />
                    )}

                    {/* 统计面板 */}
                    {showStats && stats && (
                        <StatsPanel
                            stats={stats}
                            onClose={() => setShowStats(false)}
                            onShowCharacterStats={() => setShowCharacterStats(true)}
                        />
                    )}

                    {/* 角色统计 */}
                    {showCharacterStats && script && (
                        <CharacterStats
                            script={script}
                            onClose={() => setShowCharacterStats(false)}
                        />
                    )}

                    {/* 集数筛选 */}
                    {episodes.length > 0 && (
                        <EpisodeFilter
                            episodes={episodes}
                            selectedEpisode={selectedEpisode}
                            onSelect={setSelectedEpisode}
                            getEpisodeDuration={(ep) => stats?.episodeDurations.get(ep) || '0秒'}
                        />
                    )}

                    {/* 批量编辑面板 */}
                    {batchMode && (
                        <BatchEditPanel
                            selectedCount={selectedScenes.size}
                            totalCount={filteredScenes.length}
                            onSelectAll={selectAllScenes}
                            onClearSelection={clearSelection}
                            onUpdate={handleBatchUpdateWithSelection}
                            onDelete={handleBatchDeleteWithSelection}
                            onBatchPolish={handleBatchPolish}
                            onClose={exitBatchMode}
                        />
                    )}

                    {/* 页数统计 */}
                    {script && <PageCounter script={script} />}

                    {/* 场景列表 */}
                    {/* 🆕 移动端适配 */}
                    {device.isMobile ? (
                        <MobileScriptEditor
                            scenes={filteredScenes}
                            onUpdateScene={(index, scene) => {
                                const targetScene = filteredScenes[index];
                                if (targetScene) handleUpdateScene(targetScene.id, scene);
                            }}
                            onDeleteScene={(index) => {
                                const targetScene = filteredScenes[index];
                                if (targetScene) handleDeleteScene(targetScene.id);
                            }}
                            showAlert={showMobileAlert}
                            onDismissAlert={() => setShowMobileAlert(false)}
                        />
                    ) : (
                        <ScriptEditorSceneList
                            scenes={filteredScenes}
                            viewMode={viewMode}
                            batchMode={batchMode}
                            selectedScenes={selectedScenes}
                            onToggleSelection={toggleSceneSelection}
                            onUpdateScene={handleUpdateScene}
                            onDeleteScene={handleDeleteScene}
                            onAddDialogue={handleAddDialogue}
                            onUpdateDialogue={handleUpdateDialogue}
                            onDeleteDialogue={handleDeleteDialogue}
                            onMoveScene={handleMoveScene}
                            formatSceneHeading={formatSceneHeading}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
