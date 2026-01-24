import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    assetStorage,
    projectStorage,
    chapterStorage,
    scriptStorage,
    generateId
} from '../../../utils/storage';
import { styleSettingsStorage } from '../../../utils/localStorage';
import { extractAssets } from '../../../utils/aiService';
import { canSafelyDeleteAsset } from '../../../utils/assetTracker';
import { PromptEngine } from '../../../utils/promptEngine';
import { calculateSimilarity } from '../../../utils/stringSimilarity';
import { storyboardStorage } from '../../../utils/storage';
import { errorHandler } from '../../../services/errorHandler';
import type {
    AssetLibrary,
    Project,
    Character,
    Scene,
    Prop,
    Costume,
    StyleApplicationSettings,
} from '../../../types';

export type AssetType = 'character' | 'scene' | 'prop' | 'costume';

interface UseAssetDataOptions {
    projectId: string | undefined;
}



export function useAssetData({ projectId }: UseAssetDataOptions) {
    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<AssetLibrary | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingAssets, setPendingAssets] = useState<any[] | null>(null);
    const [styleSettings, setStyleSettings] = useState<StyleApplicationSettings>({
        mode: 'manual',
        autoApplyToNew: true,
        protectManualEdits: true,
        confirmBeforeApply: true,
        showPreview: true,
    });

    // 加载数据
    const loadAssets = useCallback(async () => {
        if (!projectId) return;
        try {
            const assetsData = await assetStorage.getByProjectId(projectId);
            setAssets(assetsData || {
                projectId: projectId,
                characters: [],
                scenes: [],
                props: [],
                costumes: [],
            });
        } catch (error) {
            console.error('Failed to load assets:', error);
            toast.error('资源库加载失败，请刷新页面');
        }
    }, [projectId]);

    const loadProject = useCallback(async () => {
        if (!projectId) return;
        try {
            const proj = await projectStorage.getById(projectId);
            setProject(proj || null);
        } catch (error) {
            console.error('Failed to load project:', error);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            loadAssets();
            loadProject();
            // 使用统一的存储工具读取配置
            // key 格式保持一致: styleSettings_{projectId}
            const savedSettings = styleSettingsStorage.get(projectId);
            if (savedSettings) {
                setStyleSettings(savedSettings);
            }
        }
    }, [projectId, loadAssets, loadProject]);

    // 保存
    const handleSave = useCallback(async () => {
        if (!assets) return;
        try {
            await assetStorage.save(assets);
            toast.success('项目库已保存');
        } catch (error) {
            console.error('Failed to save assets:', error);
            toast.error('保存失败，请检查存储空间');
        }
    }, [assets]);

    // AI 提取
    const handleAIExtract = useCallback(async () => {
        if (!projectId) return;

        const chapters = await chapterStorage.getByProjectId(projectId);
        const allOriginalText = chapters.map(c => c.originalText).join('\n\n');

        if (!allOriginalText) {
            toast.error('请先在章节中添加内容');
            return;
        }

        const allScenes = [];
        for (const chapter of chapters) {
            const script = await scriptStorage.getByChapterId(chapter.id);
            if (script) {
                allScenes.push(...script.scenes.map(scene => ({
                    ...scene,
                    sceneType: scene.sceneType || 'INT' as const,
                    dialogues: scene.dialogues || [],
                    transition: scene.transition,
                })));
            }
        }

        setIsExtracting(true);
        try {
            const extracted = await extractAssets(allOriginalText, allScenes, project?.directorStyle);

            // 🆕 不再直接保存，而是转换格式并存入暂存区
            const flattenedExtracted = [
                ...extracted.characters.map(c => ({ ...c, type: 'character' })),
                ...extracted.scenes.map(s => ({ ...s, type: 'scene' })),
                ...extracted.props.map(p => ({ ...p, type: 'prop' })),
                ...extracted.costumes.map(c => ({ ...c, type: 'costume' })),
            ];

            setPendingAssets(flattenedExtracted);
            toast.info(`提取完成，发现 ${flattenedExtracted.length} 项资产待审核`);
        } catch (error) {
            console.error('AI extract failed:', error);
            toast.error('提取失败，请重试');
        } finally {
            setIsExtracting(false);
        }
    }, [projectId, project, assets]);

    /**
     * 🆕 处理暂存审核后的最终确认入库
     */
    const handleConfirmStaging = useCallback(async (stagedAssets: any[]) => {
        if (!assets || !projectId) return;

        try {
            const updatedAssets = { ...assets };

            stagedAssets.forEach(staged => {
                if (staged.action === 'ignore') return;

                const categoryKey = staged.type === 'character' ? 'characters' :
                    staged.type === 'scene' ? 'scenes' :
                        staged.type === 'prop' ? 'props' : 'costumes';

                const list = [...(updatedAssets[categoryKey] as any[])];

                if (staged.action === 'add') {
                    const newAsset = {
                        ...staged,
                        aliases: [],
                        action: undefined,
                        mergeWithId: undefined,
                        similarityScore: undefined,
                        matchReason: undefined
                    };
                    
                    // 🆕 如果是角色且没有触发词，自动生成
                    if (staged.type === 'character' && !newAsset.triggerWord) {
                        newAsset.triggerWord = PromptEngine.generateTriggerWord(newAsset.name, newAsset.id);
                    }
                    
                    list.push(newAsset);
                } else if (staged.action === 'merge' && staged.mergeWithId) {
                    const idx = list.findIndex(item => item.id === staged.mergeWithId);
                    if (idx !== -1) {
                        const existing = list[idx];
                        const merged = { ...existing };

                        // 记录别名
                        const currentAliases = existing.aliases || [];
                        if (staged.name !== existing.name && !currentAliases.includes(staged.name)) {
                            merged.aliases = [...currentAliases, staged.name];
                        }

                        // 决定哪些字段要更新
                        const fieldsToUpdate = ['description', 'appearance', 'personality', 'environment', 'location', 'category', 'aiPrompt'];
                        fieldsToUpdate.forEach(field => {
                            if (staged[field]) merged[field] = staged[field];
                        });

                        list[idx] = merged;
                    }
                }

                (updatedAssets as any)[categoryKey] = list;
            });

            await assetStorage.save(updatedAssets);
            setAssets(updatedAssets);
            setPendingAssets(null);
            toast.success('资产库已根据审核结果更新');
        } catch (error) {
            console.error('Confirm staging failed:', error);
            toast.error('保存入库失败，请重试');
        }
    }, [assets, projectId]);

    // 🆕 资产库全量一键合并
    const handleMergeAssets = useCallback(async (category: keyof AssetLibrary, masterId: string, duplicateId: string) => {
        if (!assets || !projectId) return;

        const updatedAssets = JSON.parse(JSON.stringify(assets)) as AssetLibrary;
        const list = updatedAssets[category] as any[];
        const master = list.find(a => a.id === masterId);
        const duplicate = list.find(a => a.id === duplicateId);

        if (!master || !duplicate) {
            toast.error('找不到要合并的资产');
            return;
        }

        console.log(`[AssetData] 合并资产: ${duplicate.name} -> ${master.name}`);

        // 1. 合并属性
        const fields = ['description', 'appearance', 'personality', 'environment', 'location', 'category', 'aiPrompt'];
        fields.forEach(f => {
            if (!master[f] && duplicate[f]) master[f] = duplicate[f];
        });

        // 2. 合并别名
        const currentAliases = master.aliases || [];
        if (duplicate.name !== master.name && !currentAliases.includes(duplicate.name)) {
            currentAliases.push(duplicate.name);
        }
        if (duplicate.aliases) {
            duplicate.aliases.forEach((a: string) => {
                if (a !== master.name && !currentAliases.includes(a)) {
                    currentAliases.push(a);
                }
            });
        }
        master.aliases = currentAliases;

        // 3. 从列表中移除重复项
        updatedAssets[category] = list.filter(a => a.id !== duplicateId) as any;

        try {
            // 4. 保存资产
            await assetStorage.save(updatedAssets);
            setAssets(updatedAssets);

            // 5. 修复分镜引用
            if (duplicate.name && master.name && duplicate.name !== master.name) {
                const renameMap = { [duplicate.name]: master.name };
                await fixStoryboardReferences(projectId, renameMap);
            }

            toast.success(`合并成功：${duplicate.name} 已并入 ${master.name}`);
        } catch (error) {
            console.error('[AssetData] 合并失败:', error);
            toast.error('合并操作失败');
        }
    }, [assets, projectId, setAssets]);

    const handleBatchDeduplicate = useCallback(async () => {
        console.log('[useAssetData] handleBatchDeduplicate called', { hasAssets: !!assets, projectId });

        if (!assets || !projectId) {
            console.warn('[useAssetData] handleBatchDeduplicate cancelled: missing assets or projectId');
            toast.error('资料库尚未加载完成，请稍后按 F5 刷新重试');
            return;
        }

        try {
            setIsSyncing(true);
            console.log('[useAssetData] Invoking performBatchDeduplicate...');
            const { updatedAssets, fixCount } = await performBatchDeduplicate(assets, projectId, (msg) => {
                console.log('[useAssetData] Progress:', msg);
                toast.info(msg);
            });

            console.log('[useAssetData] performBatchDeduplicate completed, fixCount:', fixCount);

            if (fixCount === 0) {
                toast.success('未发现需要合并的重复资产');
            } else {
                console.log('[useAssetData] Saving updated assets...');
                await assetStorage.save(updatedAssets);
                setAssets(updatedAssets);
                toast.success(`一键整合完成！共合并了 ${fixCount} 组重复资产，并同步修复了分镜引用。`);
            }
        } catch (error) {
            console.error('[useAssetData] Batch deduplicate failed CRITICAL:', error);
            errorHandler.handle(error as Error, { context: { component: 'useAssetData', action: 'handleBatchDeduplicate' } });
            toast.error('资料整合过程中发生严重错误，请检查控制台');
        } finally {
            setIsSyncing(false);
        }
    }, [assets, projectId]);

    // 同步导演风格
    const handleSyncDirectorStyle = useCallback(async () => {
        console.log('[风格同步] 开始同步，project:', project?.id, 'directorStyle:', project?.directorStyle ? '已设置' : '未设置', 'assets:', assets ? '已加载' : '未加载');

        if (!project?.directorStyle) {
            console.warn('[风格同步] 失败：项目未设定导演风格');
            toast.error('当前项目未设定导演风格，请先在"导演风格"页面设置风格');
            return;
        }
        if (!assets) {
            console.warn('[风格同步] 失败：资产未加载');
            toast.error('资产库未加载，请稍后重试');
            return;
        }

        try {
            setIsSyncing(true);
            const updatedCharacters = assets.characters.map(char => {
                if (!char.triggerWord) {
                    return {
                        ...char,
                        triggerWord: PromptEngine.generateTriggerWord(char.name, char.id)
                    };
                }
                return char;
            });

            const updatedAssetsPreSync = { ...assets, characters: updatedCharacters };
            const {
                batchApplyStyleToCharacters,
                batchApplyStyleToScenes,
                batchApplyStyleToProps,
                batchApplyStyleToCostumes
            } = await import('../../../utils/promptOptimizer');

            const syncedAssets: AssetLibrary = {
                ...updatedAssetsPreSync,
                characters: batchApplyStyleToCharacters(updatedAssetsPreSync.characters, project.directorStyle),
                scenes: batchApplyStyleToScenes(assets.scenes, project.directorStyle),
                props: batchApplyStyleToProps(assets.props, project.directorStyle),
                costumes: batchApplyStyleToCostumes(assets.costumes, updatedAssetsPreSync.characters, project.directorStyle)
            };

            await assetStorage.save(syncedAssets);
            setAssets(syncedAssets);
            toast.success('全库提示词已同步至最新导演风格，并已自动完善角色特征字段！');
        } catch (error) {
            console.error('Sync director style failed:', error);
            toast.error('同步失败');
        } finally {
            setIsSyncing(false);
        }
    }, [project, assets]);

    // CRUD 操作
    const handleUpdateCharacter = useCallback((id: string, updates: Partial<Character>) => {
        setAssets(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                characters: prev.characters.map(c => {
                    if (c.id === id) {
                        const updatedChar = { ...c, ...updates };
                        // 🆕 如果名称改变且没有手动设置触发词，自动更新触发词
                        if (updates.name && updates.name !== c.name && !updates.triggerWord) {
                            updatedChar.triggerWord = PromptEngine.generateTriggerWord(updates.name, c.id);
                        }
                        // 🆕 如果角色没有触发词，自动生成
                        if (!updatedChar.triggerWord) {
                            updatedChar.triggerWord = PromptEngine.generateTriggerWord(updatedChar.name, c.id);
                        }
                        return updatedChar;
                    }
                    return c;
                })
            };
        });
    }, []);

    const handleBatchUpdateCharacter = useCallback((updates: Record<string, Partial<Character>>) => {
        setAssets(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                characters: prev.characters.map(c => updates[c.id] ? { ...c, ...updates[c.id] } : c)
            };
        });
    }, []);

    const handleAddCharacter = useCallback(() => {
        const newId = generateId();
        const newCharacter: Character = {
            id: newId,
            name: '新角色',
            description: '',
            appearance: '',
            personality: '',
            avatar: '',
            fullBodyPreview: '',
            facePreview: '',
            fullBodyPrompt: '',
            facePrompt: '',
            isGeneratingFullBody: false,
            isGeneratingFace: false,
            tags: [],
            createdAt: new Date().toISOString(),
            usageCount: 0,
            aliases: [],
            // 🆕 自动生成触发词
            triggerWord: PromptEngine.generateTriggerWord('新角色', newId),
        };
        setAssets(prev => prev ? { ...prev, characters: [...prev.characters, newCharacter] } : prev);
    }, []);

    const handleDeleteCharacter = useCallback((id: string, usageCount: number) => {
        const { warning } = canSafelyDeleteAsset(id, 'character', usageCount);
        if (warning && !confirm(warning + '\n\n确定要删除吗？')) return;
        setAssets(prev => prev ? { ...prev, characters: prev.characters.filter(c => c.id !== id) } : prev);
    }, []);

    const handleUpdateScene = useCallback((id: string, updates: Partial<Scene>) => {
        setAssets(prev => prev ? { ...prev, scenes: prev.scenes.map(s => s.id === id ? { ...s, ...updates } : s) } : prev);
    }, []);

    const handleAddScene = useCallback(() => {
        const newScene: Scene = {
            id: generateId(),
            name: '新场景',
            description: '',
            location: '',
            environment: '',
            image: '',
            widePrompt: '',
            mediumPrompt: '',
            closeupPrompt: '',
            widePreview: '',
            mediumPreview: '',
            closeupPreview: '',
            isGeneratingWide: false,
            isGeneratingMedium: false,
            isGeneratingCloseup: false,
            tags: [],
            createdAt: new Date().toISOString(),
            usageCount: 0,
            aliases: [],
        };
        setAssets(prev => prev ? { ...prev, scenes: [...prev.scenes, newScene] } : prev);
    }, []);

    const handleDeleteScene = useCallback((id: string, usageCount: number) => {
        const { warning } = canSafelyDeleteAsset(id, 'scene', usageCount);
        if (warning && !confirm(warning + '\n\n确定要删除吗？')) return;
        setAssets(prev => prev ? { ...prev, scenes: prev.scenes.filter(s => s.id !== id) } : prev);
    }, []);

    const handleUpdateProp = useCallback((id: string, updates: Partial<Prop>) => {
        setAssets(prev => prev ? { ...prev, props: prev.props.map(p => p.id === id ? { ...p, ...updates } : p) } : prev);
    }, []);

    const handleAddProp = useCallback(() => {
        const newProp: Prop = {
            id: generateId(),
            name: '新道具',
            description: '',
            category: '',
            image: '',
            aiPrompt: '',
            preview: '',
            isGenerating: false,
            tags: [],
            createdAt: new Date().toISOString(),
            usageCount: 0,
            aliases: [],
        };
        setAssets(prev => prev ? { ...prev, props: [...prev.props, newProp] } : prev);
    }, []);

    const handleDeleteProp = useCallback((id: string, usageCount: number) => {
        const { warning } = canSafelyDeleteAsset(id, 'prop', usageCount);
        if (warning && !confirm(warning + '\n\n确定要删除吗？')) return;
        setAssets(prev => prev ? { ...prev, props: prev.props.filter(p => p.id !== id) } : prev);
    }, []);

    const handleUpdateCostume = useCallback((id: string, updates: Partial<Costume>) => {
        setAssets(prev => prev ? { ...prev, costumes: prev.costumes.map(c => c.id === id ? { ...c, ...updates } : c) } : prev);
    }, []);

    const handleAddCostume = useCallback(() => {
        if (!assets || assets.characters.length === 0) {
            toast.error('请先添加角色');
            return;
        }
        const newCostume: Costume = {
            id: generateId(),
            characterId: assets.characters[0].id,
            name: '新服饰',
            description: '',
            style: '',
            image: '',
            aiPrompt: '',
            preview: '',
            isGenerating: false,
            tags: [],
            createdAt: new Date().toISOString(),
            usageCount: 0,
            aliases: [],
        };
        setAssets(prev => prev ? { ...prev, costumes: [...prev.costumes, newCostume] } : prev);
    }, [assets]);

    const handleDeleteCostume = useCallback((id: string, usageCount: number) => {
        const { warning } = canSafelyDeleteAsset(id, 'costume', usageCount);
        if (warning && !confirm(warning + '\n\n确定要删除吗？')) return;
        setAssets(prev => prev ? { ...prev, costumes: prev.costumes.filter(c => c.id !== id) } : prev);
    }, []);

    const handleAddTag = useCallback((itemId: string, itemType: AssetType, tag: string) => {
        if (!tag.trim()) return;

        setAssets(prev => {
            if (!prev) return prev;
            const items = prev[itemType === 'character' ? 'characters' :
                itemType === 'scene' ? 'scenes' :
                    itemType === 'prop' ? 'props' : 'costumes'] as any[];
            return {
                ...prev,
                [itemType === 'character' ? 'characters' :
                    itemType === 'scene' ? 'scenes' :
                        itemType === 'prop' ? 'props' : 'costumes']: items.map(item => {
                            if (item.id === itemId) {
                                const currentTags = item.tags || [];
                                if (!currentTags.includes(tag.trim())) {
                                    return { ...item, tags: [...currentTags, tag.trim()] };
                                }
                            }
                            return item;
                        })
            };
        });
    }, []);

    const handleRemoveTag = useCallback((itemId: string, itemType: AssetType, tag: string) => {
        setAssets(prev => {
            if (!prev) return prev;
            const items = prev[itemType === 'character' ? 'characters' :
                itemType === 'scene' ? 'scenes' :
                    itemType === 'prop' ? 'props' : 'costumes'] as any[];
            return {
                ...prev,
                [itemType === 'character' ? 'characters' :
                    itemType === 'scene' ? 'scenes' :
                        itemType === 'prop' ? 'props' : 'costumes']: items.map(item => {
                            if (item.id === itemId) {
                                const currentTags = item.tags || [];
                                return { ...item, tags: currentTags.filter((t: string) => t !== tag) };
                            }
                            return item;
                        })
            };
        });
    }, []);

    const handleBatchDelete = useCallback((selectedItems: string[]) => {
        if (!assets || selectedItems.length === 0) return;
        if (!confirm(`确定要删除选中的 ${selectedItems.length} 个项目吗？`)) return;

        setAssets(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                characters: prev.characters.filter(c => !selectedItems.includes(c.id)),
                scenes: prev.scenes.filter(s => !selectedItems.includes(s.id)),
                props: prev.props.filter(p => !selectedItems.includes(p.id)),
                costumes: prev.costumes.filter(c => !selectedItems.includes(c.id)),
            };
        });
        toast.success('批量删除成功');
    }, [assets]);

    // 🆕 排序操作
    const handleReorderAssets = useCallback((itemType: AssetType, startIndex: number, endIndex: number) => {
        setAssets(prev => {
            if (!prev) return prev;
            const listKey = itemType === 'character' ? 'characters' :
                itemType === 'scene' ? 'scenes' :
                    itemType === 'prop' ? 'props' : 'costumes';

            const newList = [...(prev[listKey] as any[])];
            const [removed] = newList.splice(startIndex, 1);
            newList.splice(endIndex, 0, removed);

            return {
                ...prev,
                [listKey]: newList
            };
        });
    }, []);

    return {
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
        handleBatchUpdateCharacter,
        loadAssets,
        loadProject,
        pendingAssets,
        setPendingAssets,
        handleConfirmStaging,
    };
}

// 内部辅助：执行批量去重逻辑
async function performBatchDeduplicate(
    assets: AssetLibrary,
    projectId: string,
    onProgress?: (msg: string) => void
): Promise<{ updatedAssets: AssetLibrary; fixCount: number }> {
    console.log('[一键整理] 开始全库扫描...', {
        characterCount: assets.characters.length,
        sceneCount: assets.scenes.length,
        propCount: assets.props.length,
        costumeCount: assets.costumes.length
    });

    const updatedAssets = JSON.parse(JSON.stringify(assets)) as AssetLibrary;
    const renameMap: Record<string, string> = {}; // 旧名 -> 新名
    let fixCount = 0;

    const categories: { key: keyof AssetLibrary; label: string }[] = [
        { key: 'characters', label: '角色' },
        { key: 'scenes', label: '场景' },
        { key: 'props', label: '道具' },
        { key: 'costumes', label: '服饰' }
    ];

    for (const { key, label } of categories) {
        const list = (updatedAssets[key] as any[]) || [];
        if (list.length < 2) continue;

        console.log(`[一键整理] 正在扫描${label}类目 (${list.length} 个项目)...`);
        const mergedIndices = new Set<number>();
        const newList: any[] = [];

        for (let i = 0; i < list.length; i++) {
            if (mergedIndices.has(i)) continue;

            const master = list[i];
            const duplicates: any[] = [];

            for (let j = i + 1; j < list.length; j++) {
                if (mergedIndices.has(j)) continue;

                const compare = list[j];
                const masterName = master.name || '未命名资产';
                const compareName = compare.name || '未命名资产';

                let score = 0;
                try {
                    score = calculateSimilarity(masterName, compareName);
                } catch (err) {
                    console.warn(`[一键整理] 相似度计算失败: ${masterName} vs ${compareName}`, err);
                }

                if (score >= 0.85) {
                    console.log(`[一键整理] 发现重复${label}: [${masterName}] <-> [${compareName}], 相似度: ${score.toFixed(2)}`);
                    duplicates.push(compare);
                    mergedIndices.add(j);
                    if (compare.name && master.name && compare.name !== master.name) {
                        renameMap[compare.name] = master.name;
                    }
                }
            }

            // 执行合并
            if (duplicates.length > 0) {
                const currentAliases = master.aliases || [];
                duplicates.forEach(dup => {
                    // 合并别名
                    if (dup.name !== master.name && !currentAliases.includes(dup.name)) {
                        currentAliases.push(dup.name);
                    }
                    if (dup.aliases) {
                        dup.aliases.forEach((a: string) => {
                            if (a !== master.name && !currentAliases.includes(a)) {
                                currentAliases.push(a);
                            }
                        });
                    }
                    // 补充缺失字段
                    const fields = ['description', 'appearance', 'personality', 'environment', 'location', 'category', 'aiPrompt'];
                    fields.forEach(f => {
                        if (!master[f] && dup[f]) (master as any)[f] = (dup as any)[f];
                    });
                });
                master.aliases = currentAliases;
                fixCount += duplicates.length;
            }
            newList.push(master);
        }
        (updatedAssets as any)[key] = newList;
    }

    // 全局引用修复
    if (Object.keys(renameMap).length > 0) {
        await fixStoryboardReferences(projectId, renameMap, onProgress);
    }

    console.log(`[一键整理] 扫描完成。共合并了 ${fixCount} 个重复项。`);
    return { updatedAssets, fixCount };
}

/**
 * 修复分镜中的重命名引用
 */
async function fixStoryboardReferences(
    projectId: string,
    renameMap: Record<string, string>,
    onProgress?: (msg: string) => void
) {
    console.log(`[引用修复] 准备修复 ${Object.keys(renameMap).length} 个重命名引用...`);
    onProgress?.(`正在修复分镜引用...`);
    try {
        const chapters = await chapterStorage.getByProjectId(projectId);
        for (const chapter of chapters) {
            const storyboard = await storyboardStorage.getByChapterId(chapter.id);
            if (storyboard && storyboard.panels) {
                let changed = false;
                const updatedPanels = storyboard.panels.map(panel => {
                    let panelChanged = false;

                    // 1. 角色列表修复
                    const newChars = (panel.characters || []).map(c => {
                        if (renameMap[c]) { panelChanged = true; return renameMap[c]; }
                        return c;
                    });

                    // 2. 道具列表修复
                    const newProps = (panel.props || []).map(p => {
                        if (renameMap[p]) { panelChanged = true; return renameMap[p]; }
                        return p;
                    });

                    // 3. 角色动作修复
                    const newActions = (panel.characterActions || []).map(a => {
                        let actionText = a;
                        Object.entries(renameMap).forEach(([oldN, newN]) => {
                            if (actionText.startsWith(`${oldN}:`)) {
                                actionText = actionText.replace(`${oldN}:`, `${newN}:`);
                                panelChanged = true;
                            }
                        });
                        return actionText;
                    });

                    if (panelChanged) {
                        changed = true;
                        return { ...panel, characters: newChars, props: newProps, characterActions: newActions };
                    }
                    return panel;
                });

                if (changed) {
                    console.log(`[引用修复] 修复分镜引用: ${chapter.title}`);
                    await storyboardStorage.save({ ...storyboard, panels: updatedPanels });
                }
            }
        }
    } catch (error) {
        console.error('[引用修复] 失败:', error);
        throw error;
    }
}
