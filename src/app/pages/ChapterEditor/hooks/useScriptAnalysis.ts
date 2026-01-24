/**
 * 原文编辑智能助手 - 资产分析 Hook
 * 完全重写版本 - 2026-01-20
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { extractAssets } from '../../../utils/aiService';
import { assetStorage, generateId, projectStorage } from '../../../utils/storage';
import { AssetPreview } from '../components/AnalysisSidebar';

// ==================== 本地存储管理 ====================

const STORAGE_KEY_PREFIX = 'chapter-analysis-';

interface StoredAnalysis {
    assets: AssetPreview[];
    timestamp: number;
    version: number;
}

function saveToLocalStorage(chapterId: string, assets: AssetPreview[]): void {
    try {
        const key = `${STORAGE_KEY_PREFIX}${chapterId}`;
        const data: StoredAnalysis = {
            assets,
            timestamp: Date.now(),
            version: 1
        };
        localStorage.setItem(key, JSON.stringify(data));
        console.log('💾 [智能助手] 已保存分析结果:', assets.length, '个资产');
    } catch (error) {
        console.error('❌ [智能助手] 保存失败:', error);
    }
}

function loadFromLocalStorage(chapterId: string): AssetPreview[] | null {
    try {
        const key = `${STORAGE_KEY_PREFIX}${chapterId}`;
        const stored = localStorage.getItem(key);
        if (!stored) return null;

        const data: StoredAnalysis = JSON.parse(stored);
        console.log('📂 [智能助手] 已加载分析结果:', data.assets.length, '个资产');
        return data.assets;
    } catch (error) {
        console.error('❌ [智能助手] 加载失败:', error);
        return null;
    }
}

function clearLocalStorage(chapterId: string): void {
    try {
        const key = `${STORAGE_KEY_PREFIX}${chapterId}`;
        localStorage.removeItem(key);
        console.log('🗑️ [智能助手] 已清除分析结果');
    } catch (error) {
        console.error('❌ [智能助手] 清除失败:', error);
    }
}

// ==================== 资产格式化 ====================

/**
 * 将资产数据格式化为可读的描述文本
 * 注意：extractAssets 已经处理过数据，返回的是标准化后的对象
 */
function formatAssetDescription(asset: any, type: 'character' | 'scene' | 'prop'): string {
    if (!asset) return '暂无描述';

    console.log('🔍 [格式化] 资产数据:', type, JSON.stringify(asset).substring(0, 200));

    const parts: string[] = [];

    if (type === 'character') {
        // extractAssets 返回的角色对象结构：
        // { id, name, description, appearance, personality, standardAppearance, ... }
        
        // 描述（已经包含年龄、体型等信息）
        if (asset.description && typeof asset.description === 'string' && 
            asset.description !== '待进一步详细描述' && 
            asset.description !== '从剧本自动识别的角色' &&
            asset.description !== '从剧本自动识别的角色(提取失败回退)') {
            parts.push(asset.description);
        }
        
        // 外貌
        if (asset.appearance && typeof asset.appearance === 'string' && 
            asset.appearance !== '待进一步详细描述' && 
            asset.appearance !== '待设定') {
            parts.push(`外貌: ${asset.appearance}`);
        }
        
        // 性格
        if (asset.personality && asset.personality !== '待设定') {
            if (Array.isArray(asset.personality)) {
                parts.push(`性格: ${asset.personality.join('、')}`);
            } else if (typeof asset.personality === 'string') {
                parts.push(`性格: ${asset.personality}`);
            }
        }
        
        // 标准外貌（补充信息）
        if (asset.standardAppearance && typeof asset.standardAppearance === 'string' && 
            asset.standardAppearance !== '默认外貌') {
            parts.push(`特征: ${asset.standardAppearance}`);
        }
    } else if (type === 'scene') {
        // extractAssets 返回的场景对象结构：
        // { id, name, description, location, environment, ... }
        
        // 描述
        if (asset.description && typeof asset.description === 'string') {
            parts.push(asset.description);
        }
        
        // 位置
        if (asset.location && typeof asset.location === 'string' && asset.location !== asset.name) {
            parts.push(`位置: ${asset.location}`);
        }
        
        // 环境
        if (asset.environment && typeof asset.environment === 'string') {
            parts.push(`环境: ${asset.environment}`);
        }
    } else if (type === 'prop') {
        // extractAssets 返回的道具对象结构：
        // { id, name, description, category, ... }
        
        // 类别
        if (asset.category && typeof asset.category === 'string') {
            parts.push(`类别: ${asset.category}`);
        }
        
        // 描述
        if (asset.description && typeof asset.description === 'string') {
            parts.push(asset.description);
        }
    }

    const result = parts.length > 0 ? parts.join(' | ') : '暂无描述';
    console.log('✅ [格式化] 结果:', result.substring(0, 100));
    return result;
}

// ==================== 重复检测 ====================

/**
 * 检查资产是否已存在于项目库中
 */
function checkDuplicate(
    assetName: string,
    assetType: 'character' | 'scene' | 'prop',
    projectAssets: any
): { isDuplicate: boolean; existingAsset?: any } {
    if (!projectAssets) return { isDuplicate: false };

    const name = assetName.trim().toLowerCase();
    let list: any[] = [];

    if (assetType === 'character') {
        list = projectAssets.characters || [];
    } else if (assetType === 'scene') {
        list = projectAssets.scenes || [];
    } else if (assetType === 'prop') {
        list = projectAssets.props || [];
    }

    // 精确匹配
    const exactMatch = list.find(item => 
        item.name.trim().toLowerCase() === name
    );

    if (exactMatch) {
        return { isDuplicate: true, existingAsset: exactMatch };
    }

    // 模糊匹配（相似度 > 85%）
    const fuzzyMatch = list.find(item => {
        const itemName = item.name.trim().toLowerCase();
        const similarity = calculateSimilarity(name, itemName);
        return similarity > 0.85;
    });

    if (fuzzyMatch) {
        return { isDuplicate: true, existingAsset: fuzzyMatch };
    }

    return { isDuplicate: false };
}

/**
 * 计算字符串相似度（Levenshtein 距离）
 */
function calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len2; i++) matrix[i][0] = i;
    for (let j = 0; j <= len1; j++) matrix[0][j] = j;

    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2[i - 1] === str1[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
}

// ==================== 主 Hook ====================

export function useScriptAnalysis(projectId: string, chapterId: string, text: string) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [detectedAssets, setDetectedAssets] = useState<AssetPreview[]>([]);

    // 组件加载时恢复分析结果
    useEffect(() => {
        const loadSavedAnalysis = async () => {
            const savedAssets = loadFromLocalStorage(chapterId);
            if (!savedAssets || savedAssets.length === 0) return;

            console.log('📂 [恢复] 原始数据:', savedAssets);

            // 检查重复
            const projectAssets = await assetStorage.getByProjectId(projectId);
            const assetsWithDuplicateCheck = savedAssets.map(asset => {
                const { isDuplicate, existingAsset } = checkDuplicate(
                    asset.name,
                    asset.type,
                    projectAssets
                );
                
                // 重新格式化描述（防止旧数据格式问题）
                const description = asset.data 
                    ? formatAssetDescription(asset.data, asset.type)
                    : asset.description;
                
                console.log('🔄 [恢复] 资产:', asset.name, '描述:', description);
                
                return {
                    ...asset,
                    description,
                    isDuplicate,
                    existingAsset
                };
            });

            setDetectedAssets(assetsWithDuplicateCheck);

            const duplicateCount = assetsWithDuplicateCheck.filter(a => a.isDuplicate).length;
            if (duplicateCount > 0) {
                toast.info(`已恢复 ${savedAssets.length} 个分析结果（${duplicateCount} 个已存在）`);
            } else {
                toast.info(`已恢复 ${savedAssets.length} 个分析结果`);
            }
        };

        loadSavedAnalysis();
    }, [chapterId, projectId]);

    // 分析文本
    const handleAnalyze = useCallback(async () => {
        if (!text || text.length < 10) {
            toast.error('文本内容太少，无法分析');
            return;
        }

        setIsAnalyzing(true);
        console.log('🔍 [智能助手] 开始分析文本，长度:', text.length);

        try {
            // 获取项目配置
            const project = await projectStorage.getById(projectId);

            // 调用 AI 提取资产
            const result = await extractAssets(text, [], project?.directorStyle);

            console.log('📦 [智能助手] 提取结果:', {
                characters: result.characters.length,
                scenes: result.scenes.length,
                props: result.props.length
            });
            
            console.log('📋 [智能助手] 角色列表:', result.characters.map(c => c.name));
            console.log('📋 [智能助手] 场景列表:', result.scenes.map(s => s.name));
            console.log('📋 [智能助手] 道具列表:', result.props.map(p => p.name));

            // 获取项目库中的现有资产
            const projectAssets = await assetStorage.getByProjectId(projectId);

            // 转换为预览格式
            const previews: AssetPreview[] = [];

            // 处理角色
            console.log('🔄 [处理角色] 开始处理', result.characters.length, '个角色');
            for (const char of result.characters) {
                console.log('🔄 [处理角色] 当前角色:', char);
                const { isDuplicate, existingAsset } = checkDuplicate(char.name, 'character', projectAssets);
                const description = formatAssetDescription(char, 'character');
                console.log('📝 [角色] 名称:', char.name, '描述:', description);
                previews.push({
                    type: 'character',
                    name: char.name,
                    description,
                    isDuplicate,
                    existingAsset,
                    data: char
                });
            }

            // 处理场景
            console.log('🔄 [处理场景] 开始处理', result.scenes.length, '个场景');
            for (const scene of result.scenes) {
                console.log('🔄 [处理场景] 当前场景:', scene);
                const { isDuplicate, existingAsset } = checkDuplicate(scene.name, 'scene', projectAssets);
                previews.push({
                    type: 'scene',
                    name: scene.name,
                    description: formatAssetDescription(scene, 'scene'),
                    isDuplicate,
                    existingAsset,
                    data: scene
                });
            }

            // 处理道具
            console.log('🔄 [处理道具] 开始处理', result.props.length, '个道具');
            for (const prop of result.props) {
                console.log('🔄 [处理道具] 当前道具:', prop);
                const { isDuplicate, existingAsset } = checkDuplicate(prop.name, 'prop', projectAssets);
                previews.push({
                    type: 'prop',
                    name: prop.name,
                    description: formatAssetDescription(prop, 'prop'),
                    isDuplicate,
                    existingAsset,
                    data: prop
                });
            }

            console.log('✅ [智能助手] 转换完成:', previews.length, '个资产');

            setDetectedAssets(previews);
            saveToLocalStorage(chapterId, previews);

            // 统计并提示
            const duplicateCount = previews.filter(p => p.isDuplicate).length;
            const newCount = previews.length - duplicateCount;

            const counts = {
                characters: result.characters.length,
                scenes: result.scenes.length,
                props: result.props.length
            };

            const summary = [];
            if (counts.characters > 0) summary.push(`${counts.characters}个角色`);
            if (counts.scenes > 0) summary.push(`${counts.scenes}个场景`);
            if (counts.props > 0) summary.push(`${counts.props}个道具`);

            if (summary.length > 0) {
                let message = `识别到 ${summary.join('、')}`;
                if (duplicateCount > 0) {
                    message += `（${duplicateCount} 个已存在，${newCount} 个新资产）`;
                }
                toast.success(message);
            } else {
                toast.warning('未识别到资产');
            }
        } catch (error) {
            console.error('❌ [智能助手] 分析失败:', error);
            toast.error('分析失败: ' + (error as Error).message);
        } finally {
            setIsAnalyzing(false);
        }
    }, [text, projectId, chapterId]);

    // 添加单个资产到项目库
    const handleAddToLibrary = useCallback(async (asset: AssetPreview) => {
        if (asset.isDuplicate) {
            toast.warning(`"${asset.name}" 已存在于项目库中`);
            return;
        }

        if (asset.isAdded) {
            toast.info(`"${asset.name}" 已添加`);
            return;
        }

        try {
            const currentAssets = await assetStorage.getByProjectId(projectId);
            const baseAssets = currentAssets || {
                projectId,
                characters: [],
                scenes: [],
                props: [],
                costumes: []
            };

            const newItem = { ...(asset as any).data, id: generateId() };

            if (asset.type === 'character') {
                baseAssets.characters.push(newItem);
            } else if (asset.type === 'scene') {
                baseAssets.scenes.push(newItem);
            } else if (asset.type === 'prop') {
                baseAssets.props.push(newItem);
            }

            await assetStorage.save(baseAssets);
            toast.success(`已添加 ${asset.name}`);

            // 更新状态
            setDetectedAssets(prev => {
                const updated = prev.map(p =>
                    p.name === asset.name && p.type === asset.type
                        ? { ...p, isAdded: true }
                        : p
                );
                saveToLocalStorage(chapterId, updated);
                return updated;
            });
        } catch (error) {
            console.error('❌ [智能助手] 添加失败:', error);
            toast.error('添加失败');
        }
    }, [projectId, chapterId]);

    // 一键添加所有资产
    const handleAddAllToLibrary = useCallback(async () => {
        const unaddedAssets = detectedAssets.filter(asset => !asset.isAdded && !asset.isDuplicate);
        
        if (unaddedAssets.length === 0) {
            const duplicateCount = detectedAssets.filter(a => a.isDuplicate).length;
            if (duplicateCount > 0) {
                toast.info(`所有新资产已添加（${duplicateCount} 个重复已跳过）`);
            } else {
                toast.info('所有资产已添加');
            }
            return;
        }

        try {
            const currentAssets = await assetStorage.getByProjectId(projectId);
            const baseAssets = currentAssets || {
                projectId,
                characters: [],
                scenes: [],
                props: [],
                costumes: []
            };

            let addedCount = 0;

            for (const asset of unaddedAssets) {
                const newItem = { ...(asset as any).data, id: generateId() };

                if (asset.type === 'character') {
                    baseAssets.characters.push(newItem);
                    addedCount++;
                } else if (asset.type === 'scene') {
                    baseAssets.scenes.push(newItem);
                    addedCount++;
                } else if (asset.type === 'prop') {
                    baseAssets.props.push(newItem);
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                await assetStorage.save(baseAssets);
                
                const duplicateCount = detectedAssets.filter(a => a.isDuplicate).length;
                let message = `已添加 ${addedCount} 个资产`;
                if (duplicateCount > 0) {
                    message += `（跳过 ${duplicateCount} 个重复）`;
                }
                toast.success(message);

                // 更新状态
                setDetectedAssets(prev => {
                    const updated = prev.map(p => 
                        p.isDuplicate ? p : { ...p, isAdded: true }
                    );
                    saveToLocalStorage(chapterId, updated);
                    return updated;
                });
            }
        } catch (error) {
            console.error('❌ [智能助手] 批量添加失败:', error);
            toast.error('批量添加失败');
        }
    }, [projectId, chapterId, detectedAssets]);

    // 清除分析结果
    const handleClearAnalysis = useCallback(() => {
        console.log('🗑️ [清除] 清除章节分析结果:', chapterId);
        setDetectedAssets([]);
        clearLocalStorage(chapterId);
        toast.success('已清除分析结果');
    }, [chapterId]);

    return {
        isAnalyzing,
        detectedAssets,
        handleAnalyze,
        handleAddToLibrary,
        handleAddAllToLibrary,
        handleClearAnalysis
    };
}
