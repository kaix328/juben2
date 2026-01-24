import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';

// Hooks
import { useAssetData, AssetType } from './hooks/useAssetData';
import { useImageGeneration } from './hooks/useImageGeneration';
import { useAssetUsage } from './hooks/useAssetUsage';
import { useRelationGraph } from '../../hooks/useRelationGraph';
import { useAutoBackup } from '../../hooks/useAutoBackup';
import { useAssetAnalytics } from '../../hooks/useAssetAnalytics';

// Components
import { AssetLibraryHeader } from './components/AssetLibraryHeader';
import { AssetStatsPanel } from './components/AssetStatsPanel';
import { ExtractDialog } from './components/ExtractDialog';
import { StyleApplicationDialog } from '../../components/StyleApplicationDialog';
import {
    CharacterTab,
    SceneTab,
    PropTab,
    CostumeTab,
    AssetStagingDialog
} from '../../components/asset-library';
import { RelationGraphDialog } from '../../components/RelationGraphDialog';
import { RelationPreviewDialog } from '../../components/asset-library/RelationPreviewDialog';
import { BackupManagerDialog } from '../../components/BackupManagerDialog';
import { AnalyticsDashboardDialog } from '../../components/AnalyticsDashboardDialog';
import { AssetAdviceDialog } from './components/AssetAdviceDialog';
import { PromptPreviewDialog } from '../../components/PromptPreviewDialog'; // 🆕
import { BatchGenerationDialog } from '../../components/BatchGenerationDialog'; // 🆕
import { AssetAdvisor, AssetAdvice } from '../../utils/ai/assetAdvisor';
import { promptService } from '../../services/aiService';
import { exportAssetAnalyticsCSV } from '../../utils/analytics/assetExport';

export function AssetLibrary() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. 数据管理 Hook
    const {
        project,
        assets,
        setAssets,
        isExtracting,
        isSyncing,
        styleSettings,
        setStyleSettings,
        handleSave,
        handleAIExtract,
        handleSyncDirectorStyle,
        handleUpdateCharacter,
        handleBatchUpdateCharacter,
        handleAddCharacter,
        handleDeleteCharacter,
        handleUpdateScene,
        handleAddScene,
        handleDeleteScene,
        handleUpdateProp,
        handleAddProp,
        handleDeleteProp,
        handleUpdateCostume,
        handleAddCostume,
        handleDeleteCostume,
        handleAddTag,
        handleRemoveTag,
        handleBatchDelete,
        handleReorderAssets,
        handleBatchDeduplicate,
        handleMergeAssets,
        pendingAssets,
        setPendingAssets,
        handleConfirmStaging,
    } = useAssetData({ projectId });

    // 2. 图片生成 Hook
    const {
        enablePromptOptimization,
        setEnablePromptOptimization,
        enablePromptPreview, // 🆕
        setEnablePromptPreview, // 🆕
        promptPreview, // 🆕
        confirmPreviewAndGenerate, // 🆕
        cancelPreview, // 🆕
        isBatchGenerating,
        batchProgress,
        batchTasks, // 🆕
        batchPaused, // 🆕
        setBatchPaused, // 🆕
        batchCancelled, // 🆕
        setBatchCancelled, // 🆕
        handleGenerateCharacterFullBody,
        handleGenerateCharacterFace,
        handleGenerateSceneWide,
        handleGenerateSceneMedium,
        handleGenerateSceneCloseup,
        handleGenerateProp,
        handleGenerateCostume,
        handleBatchGenerateAll
    } = useImageGeneration({
        assets,
        project,
        handleUpdateCharacter,
        handleUpdateScene,
        handleUpdateProp,
        handleUpdateCostume
    });

    // 3. 使用率追踪 Hook
    const {
        usageMap,
        getCharacterUsageLocations,
        getSceneUsageLocations,
        getPropUsageLocations,
        getCostumeUsageLocations
    } = useAssetUsage({ projectId, assets, setAssets });

    // 4. 关系图谱 Hook
    const {
        exportGraphData,
        analyzeRelations,
        batchAddRelations,
        addRelation,
        updateRelation,
        deleteRelation,
        clearRelations,
        loadRelations,
    } = useRelationGraph(projectId || '');

    // 5. 自动备份 Hook
    const {
        createBackup,
        getBackups,
        restoreBackup,
        deleteBackup,
        exportBackup,
        importBackup,
        getStorageUsage,
    } = useAutoBackup(projectId || '', assets);

    // 6. 数据分析 Hook
    const analytics = useAssetAnalytics(assets, usageMap);

    // UI 状态
    const [searchTerm, setSearchTerm] = useState('');
    const [showExtractDialog, setShowExtractDialog] = useState(false);
    const [showStyleDialog, setShowStyleDialog] = useState(false);
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
    const [selectedCostumeId, setSelectedCostumeId] = useState<string | null>(null);
    const [groupBy, setGroupBy] = useState<'none' | 'tags' | 'source'>('none');
    const importInputRef = useRef<HTMLInputElement>(null);

    // 高级功能对话框状态
    const [showRelationGraph, setShowRelationGraph] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showBackupManager, setShowBackupManager] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [previewRelations, setPreviewRelations] = useState<any[]>([]);
    const [advisorOpen, setAdvisorOpen] = useState(false);
    const [advice, setAdvice] = useState<AssetAdvice[]>([]);

    // 选项卡管理
    const getInitialTab = (): AssetType => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab') as AssetType | null;
        const validTabs: AssetType[] = ['character', 'scene', 'prop', 'costume'];
        return tabParam && validTabs.includes(tabParam) ? tabParam : 'character';
    };
    const [activeTab, setActiveTab] = useState<AssetType>(getInitialTab);

    const handleTabChange = (value: string) => {
        const validTabs: AssetType[] = ['character', 'scene', 'prop', 'costume'];
        const tab = validTabs.includes(value as AssetType) ? (value as AssetType) : 'character';
        setActiveTab(tab);
        const params = new URLSearchParams(location.search);
        params.set('tab', tab);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };

    // 统计数据计算
    const stats = assets ? {
        characters: {
            total: assets.characters.length,
            withImages: assets.characters.filter(c => c.fullBodyPreview || c.facePreview).length
        },
        scenes: {
            total: assets.scenes.length,
            withImages: assets.scenes.filter(s => s.widePreview || s.mediumPreview || s.closeupPreview).length
        },
        props: {
            total: assets.props.length,
            withImages: assets.props.filter(p => p.preview).length
        },
        costumes: {
            total: assets.costumes.length,
            withImages: assets.costumes.filter(c => c.preview).length
        },
        completionRate: (function () {
            const total = assets.characters.length + assets.scenes.length + assets.props.length + assets.costumes.length;
            if (total === 0) return 0;
            const withImages = assets.characters.filter(c => c.fullBodyPreview || c.facePreview).length +
                assets.scenes.filter(s => s.widePreview || s.mediumPreview || s.closeupPreview).length +
                assets.props.filter(p => p.preview).length +
                assets.costumes.filter(c => c.preview).length;
            return Math.round((withImages / total) * 100);
        })()
    } : null;

    // 导入导出处理
    const handleExport = () => {
        if (!assets) return;
        const dataStr = JSON.stringify(assets, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `项目库_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('导出成功');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                if (projectId) imported.projectId = projectId;
                setAssets(imported);
                toast.success('导入成功');
            } catch (error) {
                toast.error('导入失败，文件格式错误');
            }
        };
        reader.readAsText(file);
    };

    // 关系图谱处理函数
    const handleAutoAnalyzeRelations = useCallback(() => {
        if (!assets) return;
        setIsAnalyzing(true);
        setTimeout(() => {
            const results = analyzeRelations(
                assets.characters,
                assets.scenes,
                assets.props,
                assets.costumes
            );

            if (results.length === 0) {
                toast.info('未发现新的关系');
                setIsAnalyzing(false);
                return;
            }

            // 补充 Label 信息以便预览
            const enhancedResults = results.map(rel => {
                const getLabel = (id: string, type: string) => {
                    let item: any;
                    if (type === 'character') item = assets.characters.find(c => c.id === id);
                    else if (type === 'scene') item = assets.scenes.find(s => s.id === id);
                    else if (type === 'prop') item = assets.props.find(p => p.id === id);
                    else if (type === 'costume') item = assets.costumes.find(c => c.id === id);
                    return item ? item.name : id;
                };

                return {
                    ...rel,
                    fromLabel: getLabel(rel.fromId, rel.fromType),
                    toLabel: getLabel(rel.toId, rel.toType),
                };
            });

            setPreviewRelations(enhancedResults);
            setShowPreviewDialog(true);
            setIsAnalyzing(false);
        }, 100);
    }, [analyzeRelations, assets]);

    const handleConfirmAnalysis = async (selectedRelations: any[]) => {
        try {
            await batchAddRelations(selectedRelations.map(rel => ({
                fromId: rel.fromId,
                fromType: rel.fromType,
                toId: rel.toId,
                toType: rel.toType,
                relationType: rel.relationType,
                strength: rel.strength,
                description: rel.description,
            })));
            toast.success(`已添加 ${selectedRelations.length} 个新关系`);
        } catch (error) {
            toast.error('添加关系失败');
        }
    };

    const handleRefreshGraph = () => {
        setShowRelationGraph(false);
        setTimeout(() => setShowRelationGraph(true), 1000);
    };

    // AI 优化建议处理函数
    const handleShowAssetAdvisor = useCallback(() => {
        if (!assets || !analytics) {
            toast.error('资料库分析尚未就绪');
            return;
        }
        const generatedAdvice = AssetAdvisor.generateAdvice(assets, analytics);
        setAdvice(generatedAdvice);
        setAdvisorOpen(true);
    }, [assets, analytics]);

    const handleAIOptimizePrompt = useCallback(async (item: AssetAdvice) => {
        if (!item.affectedIds[0] || !item.metadata) return;

        const assetId = item.affectedIds[0];
        const { category, currentVal, assetName } = item.metadata;

        const toastId = toast.loading(`正在为 ${assetName} 优化提示词...`);

        try {
            const result = await promptService.optimize({
                description: currentVal,
                resourceType: category === 'characters' ? 'character' :
                    category === 'scenes' ? 'scene' :
                        category === 'props' ? 'prop' : 'costume'
            });

            if (result.success && result.data) {
                // 更新资产
                if (category === 'characters') {
                    await handleUpdateCharacter(assetId, {
                        fullBodyPrompt: result.data,
                        facePrompt: result.data
                    });
                } else if (category === 'scenes') {
                    await handleUpdateScene(assetId, {
                        widePrompt: result.data,
                        mediumPrompt: result.data,
                        closeupPrompt: result.data
                    });
                } else if (category === 'props') {
                    await handleUpdateProp(assetId, { aiPrompt: result.data });
                } else if (category === 'costumes') {
                    await handleUpdateCostume(assetId, { aiPrompt: result.data });
                }

                toast.success('提示词优化成功并已回填', { id: toastId });
            } else {
                toast.error(`优化失败: ${result.error}`, { id: toastId });
            }
        } catch (error) {
            console.error('Prompt optimization error:', error);
            toast.error('请求失败，请稍后重试', { id: toastId });
        }
    }, [handleUpdateCharacter, handleUpdateScene, handleUpdateProp, handleUpdateCostume]);

    const handleAcceptAdvice = useCallback((item: AssetAdvice) => {
        setAdvisorOpen(false);
        if (item.type === 'complete' && item.affectedIds.length > 0) {
            const id = item.affectedIds[0];
            setSearchTerm(id);
            toast.info(`已为您定位到：${item.title}`);
        } else if (item.type === 'merge' && item.affectedIds.length >= 2 && item.metadata?.category) {
            handleMergeAssets(item.metadata.category, item.affectedIds[0], item.affectedIds[1]);
        } else if (item.type === 'refine') {
            handleAIOptimizePrompt(item);
        } else if (item.type === 'cleanup' && item.affectedIds.length > 0) {
            setSearchTerm(item.affectedIds[0]);
            toast.info('已为您定位到闲置资产，您可以手动确认并删除');
        } else {
            toast.info('该建议项由于信息不足，请手动处理');
        }
    }, [handleMergeAssets, handleAIOptimizePrompt]);

    // 资产跳转定位逻辑（用于数据分析）
    const handleAssetJump = useCallback((id: string, type: AssetType) => {
        handleTabChange(type);

        if (type === 'character') setSelectedCharacterId(id);
        else if (type === 'scene') setSelectedSceneId(id);
        else if (type === 'prop') setSelectedPropId(id);
        else if (type === 'costume') setSelectedCostumeId(id);

        setShowAnalytics(false);
        toast.success(`已定位到资产`);
    }, []);

    // 加载已保存的关系图谱数据
    useEffect(() => {
        loadRelations();
    }, [loadRelations]);

    if (!projectId) return null;

    return (
        <div className="space-y-6 pb-20">
            <AssetLibraryHeader
                projectId={projectId}
                projectName={project?.title}
                isExtracting={isExtracting}
                isSyncing={isSyncing}
                isBatchGenerating={isBatchGenerating}
                onAIExtractClick={() => setShowExtractDialog(true)}
                onSyncStyle={() => {
                    if (styleSettings.confirmBeforeApply) {
                        setShowStyleDialog(true);
                    } else {
                        handleSyncDirectorStyle();
                    }
                }}
                onBatchGenerate={handleBatchGenerateAll}
                onSave={handleSave}
                onExport={handleExport}
                onImportClick={() => importInputRef.current?.click()}
                importInputRef={importInputRef as any}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                onShowRelationGraph={() => setShowRelationGraph(true)}
                onShowAnalytics={() => setShowAnalytics(true)}
                onShowBackupManager={() => setShowBackupManager(true)}
                onBatchDeduplicate={handleBatchDeduplicate}
                onShowAssetAdvisor={handleShowAssetAdvisor}
                enablePromptPreview={enablePromptPreview}
                onTogglePromptPreview={setEnablePromptPreview}
            />
            <input
                type="file"
                ref={importInputRef}
                onChange={handleImport}
                className="hidden"
                accept=".json"
            />

            <Card>
                <CardHeader>
                    <AssetStatsPanel stats={stats} />
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                            <TabsTrigger value="character">
                                角色 ({assets?.characters.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="scene">
                                场景 ({assets?.scenes.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="prop">
                                道具 ({assets?.props.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="costume">
                                服饰 ({assets?.costumes.length || 0})
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="character">
                                <CharacterTab
                                    assets={assets || { projectId, characters: [], scenes: [], props: [], costumes: [] }}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    selectedCharacterId={selectedCharacterId}
                                    setSelectedCharacterId={setSelectedCharacterId}
                                    handleAddCharacter={handleAddCharacter}
                                    handleUpdateCharacter={handleUpdateCharacter}
                                    handleBatchUpdateCharacter={handleBatchUpdateCharacter}
                                    handleDeleteCharacter={(id) => handleDeleteCharacter(id, usageMap.get(id) || 0)}
                                    handleAddTag={handleAddTag as any}
                                    handleRemoveTag={handleRemoveTag as any}
                                    getCharacterUsageLocations={getCharacterUsageLocations}
                                    usageMap={usageMap}
                                    handleGenerateCharacterFullBody={handleGenerateCharacterFullBody}
                                    handleGenerateCharacterFace={handleGenerateCharacterFace}
                                    projectId={projectId}
                                    project={project}
                                    onReorder={(start, end) => handleReorderAssets('character', start, end)}
                                    groupBy={groupBy}
                                />
                            </TabsContent>

                            <TabsContent value="scene">
                                <SceneTab
                                    assets={assets || { projectId, characters: [], scenes: [], props: [], costumes: [] }}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    selectedSceneId={selectedSceneId}
                                    setSelectedSceneId={setSelectedSceneId}
                                    handleAddScene={handleAddScene}
                                    handleUpdateScene={handleUpdateScene}
                                    handleDeleteScene={(id) => handleDeleteScene(id, usageMap.get(id) || 0)}
                                    handleAddTag={handleAddTag as any}
                                    handleRemoveTag={handleRemoveTag as any}
                                    handleGenerateSceneWide={handleGenerateSceneWide}
                                    handleGenerateSceneMedium={handleGenerateSceneMedium}
                                    handleGenerateSceneCloseup={handleGenerateSceneCloseup}
                                    onReorder={(start, end) => handleReorderAssets('scene', start, end)}
                                    getSceneUsageLocations={getSceneUsageLocations}
                                    usageMap={usageMap}
                                    groupBy={groupBy}
                                />
                            </TabsContent>

                            <TabsContent value="prop">
                                <PropTab
                                    assets={assets || { projectId, characters: [], scenes: [], props: [], costumes: [] }}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    selectedPropId={selectedPropId}
                                    setSelectedPropId={setSelectedPropId}
                                    handleAddProp={handleAddProp}
                                    handleUpdateProp={handleUpdateProp}
                                    handleDeleteProp={(id) => handleDeleteProp(id, usageMap.get(id) || 0)}
                                    handleAddTag={handleAddTag as any}
                                    handleRemoveTag={handleRemoveTag as any}
                                    handleBatchDelete={handleBatchDelete}
                                    handleGenerateProp={handleGenerateProp}
                                    onReorder={(start, end) => handleReorderAssets('prop', start, end)}
                                    getPropUsageLocations={getPropUsageLocations}
                                    usageMap={usageMap}
                                    groupBy={groupBy}
                                />
                            </TabsContent>

                            <TabsContent value="costume">
                                <CostumeTab
                                    assets={assets || { projectId, characters: [], scenes: [], props: [], costumes: [] }}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    selectedCostumeId={selectedCostumeId}
                                    setSelectedCostumeId={setSelectedCostumeId}
                                    handleAddCostume={handleAddCostume}
                                    handleUpdateCostume={handleUpdateCostume}
                                    handleDeleteCostume={(id) => handleDeleteCostume(id, usageMap.get(id) || 0)}
                                    handleAddTag={handleAddTag as any}
                                    handleRemoveTag={handleRemoveTag as any}
                                    handleBatchDelete={handleBatchDelete}
                                    handleGenerateCostume={handleGenerateCostume}
                                    onReorder={(start, end) => handleReorderAssets('costume', start, end)}
                                    getCostumeUsageLocations={getCostumeUsageLocations}
                                    usageMap={usageMap}
                                    groupBy={groupBy}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            <ExtractDialog
                open={showExtractDialog}
                onOpenChange={setShowExtractDialog}
                onExtract={handleAIExtract}
            />

            {project?.directorStyle && (
                <StyleApplicationDialog
                    isOpen={showStyleDialog}
                    onClose={() => setShowStyleDialog(false)}
                    onConfirm={handleSyncDirectorStyle}
                    directorStyle={project.directorStyle}
                    characters={assets?.characters || []}
                    scenes={assets?.scenes || []}
                    props={assets?.props || []}
                    costumes={assets?.costumes || []}
                    protectManualEdits={styleSettings.protectManualEdits}
                    showPreview={styleSettings.showPreview}
                />
            )}

            {/* 资产审核暂存区弹窗 */}
            <AssetStagingDialog
                open={!!pendingAssets}
                onOpenChange={(open: boolean) => !open && setPendingAssets(null)}
                pendingAssets={pendingAssets || []}
                existingAssets={useMemo(() => {
                    if (!assets) return [];
                    return [
                        ...assets.characters.map(c => ({ ...c, type: 'character' as const })),
                        ...assets.scenes.map(s => ({ ...s, type: 'scene' as const })),
                        ...assets.props.map(p => ({ ...p, type: 'prop' as const })),
                        ...assets.costumes.map(c => ({ ...c, type: 'costume' as const })),
                    ];
                }, [assets])}
                onConfirm={handleConfirmStaging}
            />

            {/* 关系图谱对话框 */}
            <RelationGraphDialog
                open={showRelationGraph}
                onOpenChange={setShowRelationGraph}
                {...exportGraphData(assets?.characters || [], assets?.scenes || [], assets?.props || [], assets?.costumes || [])}
                onNodeClick={(nodeId: string, nodeType: string) => {
                    const typeToTab: Record<string, AssetType> = {
                        'character': 'character',
                        'scene': 'scene',
                        'prop': 'prop',
                        'costume': 'costume'
                    };
                    const tab = typeToTab[nodeType];
                    if (tab) {
                        setActiveTab(tab);
                        if (nodeType === 'character') setSelectedCharacterId(nodeId);
                        else if (nodeType === 'scene') setSelectedSceneId(nodeId);
                        else if (nodeType === 'prop') setSelectedPropId(nodeId);
                        else if (nodeType === 'costume') setSelectedCostumeId(nodeId);
                        setShowRelationGraph(false);
                    }
                }}
                onAutoAnalyze={handleAutoAnalyzeRelations}
                onRefresh={handleRefreshGraph}
                isAnalyzing={isAnalyzing}
                onAddRelation={addRelation}
                onUpdateRelation={updateRelation}
                onDeleteRelation={deleteRelation}
                onClearRelations={clearRelations}
            />

            {/* 关系预览对话框 */}
            <RelationPreviewDialog
                open={showPreviewDialog}
                onOpenChange={setShowPreviewDialog}
                relations={previewRelations}
                onConfirm={handleConfirmAnalysis}
            />

            {/* 数据分析对话框 */}
            <AnalyticsDashboardDialog
                open={showAnalytics}
                onOpenChange={setShowAnalytics}
                analytics={analytics}
                onExportReport={() => {
                    if (analytics) {
                        exportAssetAnalyticsCSV(analytics);
                        toast.success('报表导出成功');
                    }
                }}
                onAssetClick={handleAssetJump}
            />

            {/* 备份管理对话框 */}
            <BackupManagerDialog
                open={showBackupManager}
                onOpenChange={setShowBackupManager}
                backups={getBackups()}
                onRestore={(key) => {
                    const data = restoreBackup(key);
                    if (data) {
                        toast.success('备份已恢复，页面将刷新');
                        setTimeout(() => window.location.reload(), 1000);
                    }
                }}
                onDelete={deleteBackup}
                onExport={exportBackup}
                onImport={async (file) => {
                    const data = await importBackup(file);
                    if (data) {
                        toast.success('备份已导入，页面将刷新');
                        setTimeout(() => window.location.reload(), 1000);
                    }
                }}
                onCreateBackup={createBackup}
                storageUsage={getStorageUsage()}
            />

            {/* AI 优化建议对话框 */}
            <AssetAdviceDialog
                open={advisorOpen}
                onOpenChange={setAdvisorOpen}
                advice={advice}
                onAccept={handleAcceptAdvice}
            />

            {/* 🆕 提示词预览对话框 */}
            <PromptPreviewDialog
                open={!!promptPreview}
                onOpenChange={(open) => !open && cancelPreview()}
                originalPrompt={promptPreview?.originalPrompt || ''}
                optimizedPrompt={promptPreview?.optimizedPrompt || ''}
                negativePrompt={promptPreview?.negativePrompt}
                platform="doubao"
                onConfirm={confirmPreviewAndGenerate}
                onCancel={cancelPreview}
            />

            {/* 🆕 批量生成进度对话框 */}
            <BatchGenerationDialog
                open={isBatchGenerating}
                tasks={batchTasks}
                currentIndex={batchProgress.current}
                isPaused={batchPaused}
                onPause={() => setBatchPaused(true)}
                onResume={() => setBatchPaused(false)}
                onCancel={() => setBatchCancelled(true)}
                onClose={() => {
                    // 批量生成完成后的清理逻辑已在 hook 中处理
                }}
            />
        </div>
    );
}
