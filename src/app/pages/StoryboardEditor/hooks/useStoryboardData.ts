import { useState, useCallback, useMemo, useEffect } from 'react';
import { useStoryboard, useSaveStoryboard } from '../../../hooks/queries/useStoryboard';
import { useScript } from '../../../hooks/queries/useScript';
import { useProjectByChapter } from '../../../hooks/queries/useProject';
import { useAssetsByChapter, useSaveAssets } from '../../../hooks/queries/useAssets';
import { extractStoryboard } from '../../../utils/aiService';
import type { Script, Storyboard, Project, AssetLibrary, StoryboardPanel } from '../../../types';
import type { ExtractProgress } from '../../../types/extraction';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../../lib/queryClient';

interface UseStoryboardDataProps {
    chapterId: string | undefined;
}

export function useStoryboardData({ chapterId }: UseStoryboardDataProps) {
    const queryClient = useQueryClient();
    
    // 使用 React Query hooks 获取数据
    const { data: storyboardData, isLoading: isLoadingStoryboard } = useStoryboard(chapterId);
    const { data: scriptData, isLoading: isLoadingScript } = useScript(chapterId);
    const { data: projectData, isLoading: isLoadingProject } = useProjectByChapter(chapterId);
    const { data: assetsData, isLoading: isLoadingAssets } = useAssetsByChapter(chapterId);
    
    // Mutations
    const saveStoryboardMutation = useSaveStoryboard();
    const saveAssetsMutation = useSaveAssets();
    
    // 数据迁移逻辑：处理 script 数据
    const script = useMemo(() => {
        if (!scriptData) return null;
        const migratedScenes = scriptData.scenes.map(scene => ({
            ...scene,
            sceneType: scene.sceneType || 'INT' as const,
            dialogues: scene.dialogues || [],
            episodeNumber: scene.episodeNumber || 1,
        }));
        return { ...scriptData, scenes: migratedScenes };
    }, [scriptData]);
    
    const storyboard = storyboardData || null;
    const project = projectData || null;
    const assets = assetsData || null;
    
    // styleLastUpdated 基于 project 的 directorStyle
    const [styleLastUpdated, setStyleLastUpdated] = useState<number>(0);
    useEffect(() => {
        if (project?.directorStyle) {
            setStyleLastUpdated(Date.now());
        }
    }, [project?.directorStyle]);
    
    // 保存 storyboard - 使用 React Query mutation
    const handleSave = useCallback(async (updatedStoryboard: Storyboard) => {
        try {
            await saveStoryboardMutation.mutateAsync(updatedStoryboard);
            return true;
        } catch (error) {
            console.error('Failed to save storyboard:', error);
            return false;
        }
    }, [saveStoryboardMutation]);
    
    // 保存资产库 - 使用 React Query mutation
    const handleUpdateAssets = useCallback(async (updatedAssets: AssetLibrary) => {
        try {
            await saveAssetsMutation.mutateAsync(updatedAssets);
            return true;
        } catch (error) {
            console.error('Failed to save assets:', error);
            return false;
        }
    }, [saveAssetsMutation]);
    
    // setStoryboard - 用于乐观更新本地状态（在保存之前）
    const setStoryboard = useCallback((newStoryboard: Storyboard | null) => {
        if (newStoryboard && chapterId) {
            queryClient.setQueryData(
                queryKeys.storyboard.byChapter(chapterId),
                newStoryboard
            );
        }
    }, [chapterId, queryClient]);
    
    // 增删改查
    const handleUpdatePanel = useCallback(async (panelId: string, updates: Partial<StoryboardPanel>) => {
        if (!storyboard) return;
        const index = storyboard.panels.findIndex(p => p.id === panelId);
        if (index === -1) return;

        const updatedPanels = [...storyboard.panels];
        updatedPanels[index] = { ...updatedPanels[index], ...updates };
        await handleSave({ ...storyboard, panels: updatedPanels });
    }, [storyboard, handleSave]);

    const handleDeletePanel = useCallback(async (panelId: string) => {
        if (!storyboard) return;
        const updatedPanels = storyboard.panels.filter(p => p.id !== panelId);
        await handleSave({ ...storyboard, panels: updatedPanels });
        toast.success('分镜已删除');
    }, [storyboard, handleSave]);

    const handleAddPanel = useCallback(async (afterPanelId?: string) => {
        if (!storyboard) return;

        const newPanel: StoryboardPanel = {
            id: `p-${Date.now()}`,
            panelNumber: storyboard.panels.length + 1,
            sceneId: storyboard.panels[0]?.sceneId || '',
            episodeNumber: storyboard.panels[0]?.episodeNumber || 1,
            description: '',
            dialogue: '',
            aiPrompt: '',
            aiVideoPrompt: '',
            duration: 3,
            characters: [],
            props: [],
            shot: '中景',
            angle: '平视',
            cameraMovement: '静止',
            shotSize: 'MS',
            cameraAngle: 'EYE_LEVEL',
            movementType: 'STATIC',
            transition: '切至',
            soundEffects: [],
            music: '',
            notes: '',
            startFrame: '',
            endFrame: '',
            motionSpeed: 'normal',
            environmentMotion: '',
            characterActions: [],
            composition: '',
            shotIntent: '',
            focusPoint: '',
            lighting: { mood: '' },
        };

        let updatedPanels: StoryboardPanel[];
        if (afterPanelId) {
            const index = storyboard.panels.findIndex(p => p.id === afterPanelId);
            updatedPanels = [
                ...storyboard.panels.slice(0, index + 1),
                newPanel,
                ...storyboard.panels.slice(index + 1)
            ];
        } else {
            updatedPanels = [...storyboard.panels, newPanel];
        }

        // 重新编号
        const renumbered = updatedPanels.map((p, i) => ({ ...p, panelNumber: i + 1 }));
        await handleSave({ ...storyboard, panels: renumbered });
    }, [storyboard, handleSave]);

    // 🆕 应用场景模板（批量添加多个分镜）
    const handleApplyTemplate = useCallback(async (templatePanels: Partial<StoryboardPanel>[]) => {
        if (!storyboard) return;

        const baseNumber = storyboard.panels.length;
        const baseSceneId = storyboard.panels[0]?.sceneId || '';
        const baseEpisode = storyboard.panels[0]?.episodeNumber || 1;

        const newPanels: StoryboardPanel[] = templatePanels.map((tp, idx) => ({
            id: `p-${Date.now()}-${idx}`,
            panelNumber: baseNumber + idx + 1,
            sceneId: baseSceneId,
            episodeNumber: baseEpisode,
            description: tp.description || '',
            dialogue: tp.dialogue || '',
            aiPrompt: '',
            aiVideoPrompt: '',
            duration: tp.duration || 3,
            characters: tp.characters || [],
            props: tp.props || [],
            shot: tp.shot || '中景',
            angle: tp.angle || '平视',
            cameraMovement: tp.cameraMovement || '静止',
            shotSize: tp.shotSize || 'MS' as any,
            cameraAngle: tp.cameraAngle || 'EYE_LEVEL' as any,
            movementType: tp.movementType || 'STATIC' as any,
            transition: tp.transition || '切至',
            soundEffects: tp.soundEffects || [],
            music: tp.music || '',
            notes: tp.notes || '',
            startFrame: tp.startFrame || '',
            endFrame: tp.endFrame || '',
            motionSpeed: tp.motionSpeed || 'normal',
            environmentMotion: tp.environmentMotion || '',
            characterActions: tp.characterActions || [],
            composition: tp.composition || '',
            shotIntent: tp.shotIntent || '',
            focusPoint: tp.focusPoint || '',
            lighting: tp.lighting || { mood: '' },
        }));

        const updatedPanels = [...storyboard.panels, ...newPanels];
        const renumbered = updatedPanels.map((p, i) => ({ ...p, panelNumber: i + 1 }));
        await handleSave({ ...storyboard, panels: renumbered });
    }, [storyboard, handleSave]);

    const movePanel = useCallback(async (dragIndex: number, hoverIndex: number) => {
        if (!storyboard) return;
        const newPanels = [...storyboard.panels];
        const dragPanel = newPanels[dragIndex];
        newPanels.splice(dragIndex, 1);
        newPanels.splice(hoverIndex, 0, dragPanel);

        const renumbered = newPanels.map((p: StoryboardPanel, i: number) => ({ ...p, panelNumber: i + 1 }));
        await handleSave({ ...storyboard, panels: renumbered });
    }, [storyboard, handleSave]);

    // 版本管理
    const [versions, setVersions] = useState<any[]>([]);
    const loadVersions = useCallback(async () => {
        if (!chapterId) return;
        const { versionStorage } = await import('../../../utils/storage');
        const vData = await versionStorage.getAll();
        // 过滤当前章节的版本（假设版本存了 chapterId）
        setVersions(vData.filter((v: any) => v.chapterId === chapterId));
    }, [chapterId]);

    // 🆕 保存当前版本
    const handleSaveVersion = useCallback(async (versionName?: string) => {
        if (!storyboard || !chapterId) return;
        try {
            const { versionStorage, generateId } = await import('../../../utils/storage');
            const version = {
                id: generateId(),
                chapterId,
                name: versionName || `版本 ${new Date().toLocaleString('zh-CN')}`,
                data: storyboard,
                createdAt: new Date().toISOString(),
            };
            await versionStorage.save(version as any);
            await loadVersions();
            toast.success('版本已保存');
        } catch (error) {
            console.error('Failed to save version:', error);
            toast.error('保存版本失败');
        }
    }, [storyboard, chapterId, loadVersions]);

    const handleRestoreVersion = useCallback(async (versionId: string) => {
        try {
            const { versionStorage } = await import('../../../utils/storage');
            const version = await versionStorage.getById(versionId);
            if (version && version.data) {
                // 如果版本数据是 Storyboard 类型，则直接保存
                await handleSave(version.data as unknown as Storyboard);
                toast.success('版本已恢复');
            }
        } catch (error) {
            toast.error('恢复失败');
        }
    }, [handleSave]);

    const handleDeleteVersion = useCallback(async (versionId: string) => {
        try {
            const { versionStorage } = await import('../../../utils/storage');
            await versionStorage.delete(versionId);
            await loadVersions();
            toast.success('版本记录已删除');
        } catch (error) {
            toast.error('删除记录失败');
        }
    }, [loadVersions]);

    // AI 提取分镜
    const handleAIExtractByEpisode = useCallback(async (
        episodeNumber: number | 'all',
        densityMode: 'compact' | 'standard' | 'detailed',
        onStart: () => void,
        onEnd: () => void,
        onProgress?: (progress: ExtractProgress) => void
    ) => {
        if (!script || !chapterId) return;

        onStart();
        try {
            // 准备上下文数据
            const scenesToExtract = episodeNumber === 'all'
                ? script.scenes
                : script.scenes.filter(s => s.episodeNumber === episodeNumber);

            const panelResults = await extractStoryboard(
                scenesToExtract,
                assets?.characters || [],
                assets?.scenes || [],
                densityMode,
                project?.directorStyle,
                onProgress
            );

            if (panelResults) {
                // 如果当前没有分镜对象（新章节），创建一个默认对象
                let baseStoryboard = storyboard;
                if (!baseStoryboard) {
                    baseStoryboard = {
                        id: `sb-${chapterId}`,
                        chapterId: chapterId!,
                        panels: [],
                        updatedAt: new Date().toISOString()
                    };
                }

                // 合并逻辑：将新生成的集数分镜合并到原有分镜中
                let updatedPanels: StoryboardPanel[];
                if (episodeNumber === 'all') {
                    updatedPanels = panelResults;
                } else {
                    // 移除旧的该集分镜，加入新的
                    const otherPanels = (baseStoryboard.panels || []).filter(p => p.episodeNumber !== episodeNumber);
                    updatedPanels = [...otherPanels, ...panelResults].sort((a: StoryboardPanel, b: StoryboardPanel) => {
                        if (a.episodeNumber !== b.episodeNumber) {
                            return (a.episodeNumber || 1) - (b.episodeNumber || 1);
                        }
                        return a.panelNumber - b.panelNumber;
                    });
                }

                // 重新编号
                const renumbered = updatedPanels.map((p: StoryboardPanel, i: number) => ({ ...p, panelNumber: i + 1 }));
                const finalStoryboard: Storyboard = {
                    ...baseStoryboard,
                    panels: renumbered,
                    updatedAt: new Date().toISOString()
                };

                await handleSave(finalStoryboard);
                toast.success(episodeNumber === 'all' ? '全集分镜提取成功' : `第 ${episodeNumber} 集分镜提取成功`, {
                    description: `共生成 ${renumbered.length} 个分镜`
                });
            }
        } catch (error: any) {
            console.error('AI Extraction failed:', error);
            const errorMessage = error?.message || '分镜提取失败';
            const errorLines = errorMessage.split('\n');
            toast.error(errorLines[0], {
                description: errorLines[1] || '请稍后重试',
                duration: 5000
            });
        } finally {
            onEnd();
        }
    }, [script, chapterId, project, assets, storyboard, handleSave]);

    // 刷新数据 - 使 React Query 缓存失效
    const refreshData = useCallback(() => {
        if (chapterId) {
            queryClient.invalidateQueries({
                queryKey: queryKeys.storyboard.byChapter(chapterId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.script.byChapter(chapterId),
            });
            queryClient.invalidateQueries({
                queryKey: ['project', 'byChapter', chapterId],
            });
            queryClient.invalidateQueries({
                queryKey: ['assets', 'byChapter', chapterId],
            });
        }
    }, [chapterId, queryClient]);

    return {
        script,
        setScript: () => {}, // 不再需要手动设置，由 React Query 管理
        storyboard,
        setStoryboard,
        project,
        assets,
        styleLastUpdated,
        handleSave,
        handleUpdateAssets,
        handleAIExtractByEpisode,
        handleAddPanel,
        handleApplyTemplate,
        handleDeletePanel,
        handleUpdatePanel,
        movePanel,
        versions,
        loadVersions,
        handleSaveVersion,
        handleRestoreVersion,
        handleDeleteVersion,
        refreshData,
    };
}
