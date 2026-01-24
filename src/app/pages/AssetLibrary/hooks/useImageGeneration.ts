import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { callDoubaoImage } from '../../../utils/volcApi';
import { PromptEngine } from '../../../utils/promptEngine'; // v2.0
import { IMAGE_SIZES } from '../../../constants/imageSizes';
import type { AssetLibrary, Project } from '../../../types';

interface UseImageGenerationOptions {
    assets: AssetLibrary | null;
    project: Project | null;
    handleUpdateCharacter: (id: string, updates: any) => void;
    handleUpdateScene: (id: string, updates: any) => void;
    handleUpdateProp: (id: string, updates: any) => void;
    handleUpdateCostume: (id: string, updates: any) => void;
}

// 🆕 预览状态接口
interface PromptPreview {
    type: 'character-full' | 'character-face' | 'scene-wide' | 'scene-medium' | 'scene-closeup' | 'prop' | 'costume';
    id: string;
    originalPrompt: string;
    optimizedPrompt: string;
    negativePrompt: string;
}

// 🆕 批量任务接口
export interface BatchTask {
    id: string;
    type: 'character-full' | 'character-face' | 'scene-wide' | 'scene-medium' | 'scene-closeup' | 'prop' | 'costume';
    name: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
    error?: string;
}

export function useImageGeneration({
    assets,
    project,
    handleUpdateCharacter,
    handleUpdateScene,
    handleUpdateProp,
    handleUpdateCostume
}: UseImageGenerationOptions) {
    const [enablePromptOptimization, setEnablePromptOptimization] = useState(true);
    const [enablePromptPreview, setEnablePromptPreview] = useState(false); // 🆕 提示词预览开关
    const [promptPreview, setPromptPreview] = useState<PromptPreview | null>(null); // 🆕 预览数据
    const [isBatchGenerating, setIsBatchGenerating] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [batchTasks, setBatchTasks] = useState<BatchTask[]>([]); // 🆕 批量任务列表
    const [batchPaused, setBatchPaused] = useState(false); // 🆕 批量暂停状态
    const [batchCancelled, setBatchCancelled] = useState(false); // 🆕 批量取消状态

    const getImageGenerationErrorMessage = (error: unknown): string => {
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (errorMsg.includes('Missing API Key')) return '请先在设置页面配置API密钥';
        if (errorMsg.includes('Missing Image Endpoint ID')) return '请先在设置页面配置图片端点ID';
        if (errorMsg.includes('InvalidParameter')) return '参数错误,请检查提示词格式';
        if (errorMsg.includes('400')) return '请求格式错误,请重试或联系管理员';
        if (errorMsg.includes('401') || errorMsg.includes('403')) return 'API密钥无效或已过期,请检查配置';
        if (errorMsg.includes('429')) return 'API调用次数超限,请稍后重试';
        if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) return '服务器错误,请稍后重试';
        if (errorMsg.includes('timeout') || errorMsg.includes('network')) return '网络连接超时,请检查网络连接';

        return '生成失败,请检查网络连接和API配置';
    };

    // Helper to get engine instance
    const getEngine = useCallback(() => {
        return new PromptEngine(project?.directorStyle, {
            useProfessionalSkills: true,
            includeNegative: false,
            enableValidation: true, // 🆕 启用验证
            enableOptimization: true, // 🆕 启用优化
            maxTokens: 150, // 🆕 限制长度
        });
    }, [project?.directorStyle]);

    // 🆕 生成并可能预览提示词
    const generatePromptWithPreview = useCallback(async (
        type: PromptPreview['type'],
        id: string,
        originalPrompt: string,
        optimizeFunc: () => { positive: string; negative: string }
    ): Promise<{ positive: string; negative: string } | null> => {
        if (!enablePromptOptimization) {
            return { positive: originalPrompt, negative: project?.directorStyle?.negativePrompt || '' };
        }

        const result = optimizeFunc();

        // 如果启用预览，显示预览对话框
        if (enablePromptPreview) {
            return new Promise((resolve) => {
                setPromptPreview({
                    type,
                    id,
                    originalPrompt,
                    optimizedPrompt: result.positive,
                    negativePrompt: result.negative,
                });
                
                // 等待用户确认或取消
                // 实际的确认逻辑在组件中处理
                // 这里只是设置预览数据
                resolve(null); // 返回 null 表示等待用户确认
            });
        }

        return result;
    }, [enablePromptOptimization, enablePromptPreview, project?.directorStyle]);

    // 🆕 确认预览并生成
    const confirmPreviewAndGenerate = useCallback(async (editedPrompt: string) => {
        if (!promptPreview) return;

        const { type, id } = promptPreview;
        const negativePrompt = promptPreview.negativePrompt;

        // 清除预览状态
        setPromptPreview(null);

        // 根据类型调用相应的生成函数
        try {
            let imageUrl: string;
            
            switch (type) {
                case 'character-full':
                    toast.loading('正在生成图片...', { id: `gen-${id}` });
                    imageUrl = await callDoubaoImage(editedPrompt, IMAGE_SIZES.CHARACTER_FULL_BODY, negativePrompt);
                    handleUpdateCharacter(id, { fullBodyPreview: imageUrl, isGeneratingFullBody: false });
                    toast.success('全身图生成成功!', { id: `gen-${id}` });
                    break;
                    
                case 'character-face':
                    toast.loading('正在生成图片...', { id: `gen-${id}-face` });
                    imageUrl = await callDoubaoImage(editedPrompt, IMAGE_SIZES.CHARACTER_FACE, negativePrompt);
                    handleUpdateCharacter(id, { facePreview: imageUrl, isGeneratingFace: false });
                    toast.success('脸部图生成成功!', { id: `gen-${id}-face` });
                    break;
                    
                case 'scene-wide':
                    toast.loading('正在生成图片...', { id: `gen-${id}-wide` });
                    imageUrl = await callDoubaoImage(editedPrompt, IMAGE_SIZES.SCENE_WIDE, negativePrompt);
                    handleUpdateScene(id, { widePreview: imageUrl, isGeneratingWide: false });
                    toast.success('远景图生成成功!', { id: `gen-${id}-wide` });
                    break;
                    
                case 'scene-medium':
                    toast.loading('正在生成图片...', { id: `gen-${id}-medium` });
                    imageUrl = await callDoubaoImage(editedPrompt, IMAGE_SIZES.SCENE_MEDIUM, negativePrompt);
                    handleUpdateScene(id, { mediumPreview: imageUrl, isGeneratingMedium: false });
                    toast.success('中景图生成成功!', { id: `gen-${id}-medium` });
                    break;
                    
                case 'scene-closeup':
                    toast.loading('正在生成图片...', { id: `gen-${id}-closeup` });
                    imageUrl = await callDoubaoImage(editedPrompt, IMAGE_SIZES.SCENE_CLOSEUP, negativePrompt);
                    handleUpdateScene(id, { closeupPreview: imageUrl, isGeneratingCloseup: false });
                    toast.success('特写图生成成功!', { id: `gen-${id}-closeup` });
                    break;
                    
                case 'prop':
                    toast.loading('正在生成图片...', { id: `gen-${id}` });
                    imageUrl = await callDoubaoImage(editedPrompt, IMAGE_SIZES.PROP, negativePrompt);
                    handleUpdateProp(id, { preview: imageUrl, isGenerating: false });
                    toast.success('道具图生成成功!', { id: `gen-${id}` });
                    break;
                    
                case 'costume':
                    toast.loading('正在生成图片...', { id: `gen-${id}` });
                    imageUrl = await callDoubaoImage(editedPrompt, IMAGE_SIZES.COSTUME, negativePrompt);
                    handleUpdateCostume(id, { preview: imageUrl, isGenerating: false });
                    toast.success('服饰图生成成功!', { id: `gen-${id}` });
                    break;
            }
        } catch (error: unknown) {
            console.error('生成失败:', error);
            toast.error(getImageGenerationErrorMessage(error), { id: `gen-${id}` });
            
            // 重置生成状态
            if (type.startsWith('character')) {
                handleUpdateCharacter(id, { 
                    isGeneratingFullBody: false, 
                    isGeneratingFace: false 
                });
            } else if (type.startsWith('scene')) {
                handleUpdateScene(id, { 
                    isGeneratingWide: false, 
                    isGeneratingMedium: false, 
                    isGeneratingCloseup: false 
                });
            } else if (type === 'prop') {
                handleUpdateProp(id, { isGenerating: false });
            } else if (type === 'costume') {
                handleUpdateCostume(id, { isGenerating: false });
            }
        }
    }, [promptPreview, handleUpdateCharacter, handleUpdateScene, handleUpdateProp, handleUpdateCostume]);

    // 🆕 取消预览
    const cancelPreview = useCallback(() => {
        if (!promptPreview) return;

        const { type, id } = promptPreview;
        
        // 重置生成状态
        if (type.startsWith('character')) {
            handleUpdateCharacter(id, { 
                isGeneratingFullBody: false, 
                isGeneratingFace: false 
            });
        } else if (type.startsWith('scene')) {
            handleUpdateScene(id, { 
                isGeneratingWide: false, 
                isGeneratingMedium: false, 
                isGeneratingCloseup: false 
            });
        } else if (type === 'prop') {
            handleUpdateProp(id, { isGenerating: false });
        } else if (type === 'costume') {
            handleUpdateCostume(id, { isGenerating: false });
        }

        setPromptPreview(null);
    }, [promptPreview, handleUpdateCharacter, handleUpdateScene, handleUpdateProp, handleUpdateCostume]);

    const handleGenerateCharacterFullBody = async (characterId: string) => {
        const character = assets?.characters.find(c => c.id === characterId);
        if (!character || !character.fullBodyPrompt) {
            toast.error('请先填写AI提示词');
            return;
        }

        handleUpdateCharacter(characterId, { isGeneratingFullBody: true });

        try {
            let optimizedPrompt = character.fullBodyPrompt;
            let negativePrompt = project?.directorStyle?.negativePrompt || '';
            
            if (enablePromptOptimization) {
                try {
                    const engine = getEngine();
                    const result = engine.forCharacterFullBody(character, character.fullBodyPrompt);
                    
                    // 🆕 如果启用预览，显示预览对话框
                    if (enablePromptPreview) {
                        setPromptPreview({
                            type: 'character-full',
                            id: characterId,
                            originalPrompt: character.fullBodyPrompt,
                            optimizedPrompt: result.positive,
                            negativePrompt: result.negative,
                        });
                        return; // 等待用户确认
                    }
                    
                    optimizedPrompt = result.positive;
                    negativePrompt = result.negative;
                } catch (e) {
                    console.warn('Prompt optimization failed, using original', e);
                }
            }

            toast.loading('正在生成图片...', { id: `gen-${characterId}` });
            const imageUrl = await callDoubaoImage(optimizedPrompt, IMAGE_SIZES.CHARACTER_FULL_BODY, negativePrompt);
            handleUpdateCharacter(characterId, {
                fullBodyPreview: imageUrl,
                isGeneratingFullBody: false
            });
            toast.success('全身图生成成功!', { id: `gen-${characterId}` });
        } catch (error: unknown) {
            console.error('生成失败:', error);
            toast.error(getImageGenerationErrorMessage(error), { id: `gen-${characterId}` });
            handleUpdateCharacter(characterId, { isGeneratingFullBody: false });
        }
    };

    const handleGenerateCharacterFace = async (characterId: string) => {
        const character = assets?.characters.find(c => c.id === characterId);
        if (!character || !character.facePrompt) {
            toast.error('请先填写AI提示词');
            return;
        }

        handleUpdateCharacter(characterId, { isGeneratingFace: true });

        try {
            let optimizedPrompt = character.facePrompt;
            let negativePrompt = project?.directorStyle?.negativePrompt || '';
            
            if (enablePromptOptimization) {
                try {
                    const engine = getEngine();
                    const result = engine.forCharacterFace(character, character.facePrompt);
                    
                    // 🆕 如果启用预览，显示预览对话框
                    if (enablePromptPreview) {
                        setPromptPreview({
                            type: 'character-face',
                            id: characterId,
                            originalPrompt: character.facePrompt,
                            optimizedPrompt: result.positive,
                            negativePrompt: result.negative,
                        });
                        return; // 等待用户确认
                    }
                    
                    optimizedPrompt = result.positive;
                    negativePrompt = result.negative;
                } catch (e) {
                    console.warn('Prompt optimization failed, using original', e);
                }
            }

            toast.loading('正在生成图片...', { id: `gen-${characterId}-face` });
            const imageUrl = await callDoubaoImage(optimizedPrompt, IMAGE_SIZES.CHARACTER_FACE, negativePrompt);
            handleUpdateCharacter(characterId, {
                facePreview: imageUrl,
                isGeneratingFace: false
            });
            toast.success('脸部图生成成功!', { id: `gen-${characterId}-face` });
        } catch (error: unknown) {
            console.error('生成失败:', error);
            toast.error(getImageGenerationErrorMessage(error), { id: `gen-${characterId}-face` });
            handleUpdateCharacter(characterId, { isGeneratingFace: false });
        }
    };

    const handleGenerateSceneWide = async (sceneId: string) => {
        const scene = assets?.scenes.find(s => s.id === sceneId);
        if (!scene || !scene.widePrompt) {
            toast.error('请先填写AI提示词');
            return;
        }

        handleUpdateScene(sceneId, { isGeneratingWide: true });

        try {
            let optimizedPrompt = scene.widePrompt;
            let negativePrompt = project?.directorStyle?.negativePrompt || '';
            
            if (enablePromptOptimization) {
                try {
                    const engine = getEngine();
                    const result = engine.forSceneWide(scene, scene.widePrompt);
                    
                    // 🆕 如果启用预览，显示预览对话框
                    if (enablePromptPreview) {
                        setPromptPreview({
                            type: 'scene-wide',
                            id: sceneId,
                            originalPrompt: scene.widePrompt,
                            optimizedPrompt: result.positive,
                            negativePrompt: result.negative,
                        });
                        return; // 等待用户确认
                    }
                    
                    optimizedPrompt = result.positive;
                    negativePrompt = result.negative;
                } catch (e) {
                    console.warn('Prompt optimization failed, using original', e);
                }
            }

            toast.loading('正在生成图片...', { id: `gen-${sceneId}-wide` });
            const imageUrl = await callDoubaoImage(optimizedPrompt, IMAGE_SIZES.SCENE_WIDE, negativePrompt);
            handleUpdateScene(sceneId, {
                widePreview: imageUrl,
                isGeneratingWide: false
            });
            toast.success('远景图生成成功!', { id: `gen-${sceneId}-wide` });
        } catch (error: unknown) {
            console.error('生成失败:', error);
            toast.error(getImageGenerationErrorMessage(error), { id: `gen-${sceneId}-wide` });
            handleUpdateScene(sceneId, { isGeneratingWide: false });
        }
    };

    const handleGenerateSceneMedium = async (sceneId: string) => {
        const scene = assets?.scenes.find(s => s.id === sceneId);
        if (!scene || !scene.mediumPrompt) {
            toast.error('请先填写AI提示词');
            return;
        }

        handleUpdateScene(sceneId, { isGeneratingMedium: true });

        try {
            let optimizedPrompt = scene.mediumPrompt;
            let negativePrompt = project?.directorStyle?.negativePrompt || '';
            
            if (enablePromptOptimization) {
                try {
                    const engine = getEngine();
                    const result = engine.forSceneMedium(scene, scene.mediumPrompt);
                    
                    // 🆕 如果启用预览，显示预览对话框
                    if (enablePromptPreview) {
                        setPromptPreview({
                            type: 'scene-medium',
                            id: sceneId,
                            originalPrompt: scene.mediumPrompt,
                            optimizedPrompt: result.positive,
                            negativePrompt: result.negative,
                        });
                        return; // 等待用户确认
                    }
                    
                    optimizedPrompt = result.positive;
                    negativePrompt = result.negative;
                } catch (e) {
                    console.warn('Prompt optimization failed, using original', e);
                }
            }

            toast.loading('正在生成图片...', { id: `gen-${sceneId}-medium` });
            const imageUrl = await callDoubaoImage(optimizedPrompt, IMAGE_SIZES.SCENE_MEDIUM, negativePrompt);
            handleUpdateScene(sceneId, {
                mediumPreview: imageUrl,
                isGeneratingMedium: false
            });
            toast.success('中景图生成成功!', { id: `gen-${sceneId}-medium` });
        } catch (error: unknown) {
            console.error('生成失败:', error);
            toast.error(getImageGenerationErrorMessage(error), { id: `gen-${sceneId}-medium` });
            handleUpdateScene(sceneId, { isGeneratingMedium: false });
        }
    };

    const handleGenerateSceneCloseup = async (sceneId: string) => {
        const scene = assets?.scenes.find(s => s.id === sceneId);
        if (!scene || !scene.closeupPrompt) {
            toast.error('请先填写AI提示词');
            return;
        }

        handleUpdateScene(sceneId, { isGeneratingCloseup: true });

        try {
            let optimizedPrompt = scene.closeupPrompt;
            let negativePrompt = project?.directorStyle?.negativePrompt || '';
            
            if (enablePromptOptimization) {
                try {
                    const engine = getEngine();
                    const result = engine.forSceneCloseup(scene, scene.closeupPrompt);
                    
                    // 🆕 如果启用预览，显示预览对话框
                    if (enablePromptPreview) {
                        setPromptPreview({
                            type: 'scene-closeup',
                            id: sceneId,
                            originalPrompt: scene.closeupPrompt,
                            optimizedPrompt: result.positive,
                            negativePrompt: result.negative,
                        });
                        return; // 等待用户确认
                    }
                    
                    optimizedPrompt = result.positive;
                    negativePrompt = result.negative;
                } catch (e) {
                    console.warn('Prompt optimization failed, using original', e);
                }
            }

            toast.loading('正在生成图片...', { id: `gen-${sceneId}-closeup` });
            const imageUrl = await callDoubaoImage(optimizedPrompt, IMAGE_SIZES.SCENE_CLOSEUP, negativePrompt);
            handleUpdateScene(sceneId, {
                closeupPreview: imageUrl,
                isGeneratingCloseup: false
            });
            toast.success('特写图生成成功!', { id: `gen-${sceneId}-closeup` });
        } catch (error: unknown) {
            console.error('生成失败:', error);
            toast.error(getImageGenerationErrorMessage(error), { id: `gen-${sceneId}-closeup` });
            handleUpdateScene(sceneId, { isGeneratingCloseup: false });
        }
    };

    const handleGenerateProp = async (propId: string) => {
        const prop = assets?.props.find(p => p.id === propId);
        if (!prop || !prop.aiPrompt) {
            toast.error('请先填写AI提示词');
            return;
        }

        handleUpdateProp(propId, { isGenerating: true });

        try {
            let optimizedPrompt = prop.aiPrompt;
            let negativePrompt = project?.directorStyle?.negativePrompt || '';
            
            if (enablePromptOptimization) {
                try {
                    const engine = getEngine();
                    const result = engine.forProp(prop, prop.aiPrompt);
                    
                    // 🆕 如果启用预览，显示预览对话框
                    if (enablePromptPreview) {
                        setPromptPreview({
                            type: 'prop',
                            id: propId,
                            originalPrompt: prop.aiPrompt,
                            optimizedPrompt: result.positive,
                            negativePrompt: result.negative,
                        });
                        return; // 等待用户确认
                    }
                    
                    optimizedPrompt = result.positive;
                    negativePrompt = result.negative;
                } catch (e) {
                    console.warn('Prompt optimization failed, using original', e);
                }
            }

            toast.loading('正在生成图片...', { id: `gen-${propId}` });
            const imageUrl = await callDoubaoImage(optimizedPrompt, IMAGE_SIZES.PROP, negativePrompt);
            handleUpdateProp(propId, {
                preview: imageUrl,
                isGenerating: false
            });
            toast.success('道具图生成成功!', { id: `gen-${propId}` });
        } catch (error: unknown) {
            console.error('生成失败:', error);
            toast.error(getImageGenerationErrorMessage(error), { id: `gen-${propId}` });
            handleUpdateProp(propId, { isGenerating: false });
        }
    };

    const handleGenerateCostume = async (costumeId: string) => {
        const costume = assets?.costumes.find(c => c.id === costumeId);
        if (!costume || !costume.aiPrompt) {
            toast.error('请先填写AI提示词');
            return;
        }

        handleUpdateCostume(costumeId, { isGenerating: true });

        try {
            let optimizedPrompt = costume.aiPrompt;
            let negativePrompt = project?.directorStyle?.negativePrompt || '';
            
            if (enablePromptOptimization) {
                try {
                    const character = assets?.characters.find(c => c.id === costume.characterId);
                    const engine = getEngine();
                    const result = engine.forCostume(costume, character, costume.aiPrompt);
                    
                    // 🆕 如果启用预览，显示预览对话框
                    if (enablePromptPreview) {
                        setPromptPreview({
                            type: 'costume',
                            id: costumeId,
                            originalPrompt: costume.aiPrompt,
                            optimizedPrompt: result.positive,
                            negativePrompt: result.negative,
                        });
                        return; // 等待用户确认
                    }
                    
                    optimizedPrompt = result.positive;
                    negativePrompt = result.negative;
                } catch (e) {
                    console.warn('Prompt optimization failed, using original', e);
                }
            }

            toast.loading('正在生成图片...', { id: `gen-${costumeId}` });
            const imageUrl = await callDoubaoImage(optimizedPrompt, IMAGE_SIZES.COSTUME, negativePrompt);
            handleUpdateCostume(costumeId, {
                preview: imageUrl,
                isGenerating: false
            });
            toast.success('服饰图生成成功!', { id: `gen-${costumeId}` });
        } catch (error: unknown) {
            console.error('生成失败:', error);
            toast.error(getImageGenerationErrorMessage(error), { id: `gen-${costumeId}` });
            handleUpdateCostume(costumeId, { isGenerating: false });
        }
    };

    // 🆕 批量生成所有缺失图片的资产（增强版）
    const handleBatchGenerateAll = async () => {
        if (!assets) {
            toast.error('资产库未加载');
            return;
        }

        // 收集所有需要生成的任务
        const tasks: BatchTask[] = [];

        // 角色：全身图和脸部图
        assets.characters.forEach(char => {
            if (!char.fullBodyPreview && char.fullBodyPrompt) {
                tasks.push({ 
                    id: `${char.id}-full`, 
                    type: 'character-full', 
                    name: char.name,
                    status: 'pending'
                });
            }
            if (!char.facePreview && char.facePrompt) {
                tasks.push({ 
                    id: `${char.id}-face`, 
                    type: 'character-face', 
                    name: char.name,
                    status: 'pending'
                });
            }
        });

        // 场景：远中近景
        assets.scenes.forEach(scene => {
            if (!scene.widePreview && scene.widePrompt) {
                tasks.push({ 
                    id: `${scene.id}-wide`, 
                    type: 'scene-wide', 
                    name: scene.name,
                    status: 'pending'
                });
            }
            if (!scene.mediumPreview && scene.mediumPrompt) {
                tasks.push({ 
                    id: `${scene.id}-medium`, 
                    type: 'scene-medium', 
                    name: scene.name,
                    status: 'pending'
                });
            }
            if (!scene.closeupPreview && scene.closeupPrompt) {
                tasks.push({ 
                    id: `${scene.id}-closeup`, 
                    type: 'scene-closeup', 
                    name: scene.name,
                    status: 'pending'
                });
            }
        });

        // 道具
        assets.props.forEach(prop => {
            if (!prop.preview && prop.aiPrompt) {
                tasks.push({ 
                    id: prop.id, 
                    type: 'prop', 
                    name: prop.name,
                    status: 'pending'
                });
            }
        });

        // 服饰
        assets.costumes.forEach(costume => {
            if (!costume.preview && costume.aiPrompt) {
                tasks.push({ 
                    id: costume.id, 
                    type: 'costume', 
                    name: costume.name,
                    status: 'pending'
                });
            }
        });

        if (tasks.length === 0) {
            toast.info('所有资产都已生成图片，无需批量生成');
            return;
        }

        // 确认
        if (!confirm(`即将批量生成 ${tasks.length} 张图片，预计耗时 ${Math.ceil(tasks.length * 0.5)} 分钟。是否继续？`)) {
            return;
        }

        setIsBatchGenerating(true);
        setBatchTasks(tasks);
        setBatchProgress({ current: 0, total: tasks.length });

        for (let i = 0; i < tasks.length; i++) {
            // 检查是否暂停
            if (batchPaused) {
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (!batchPaused) {
                            clearInterval(checkInterval);
                            resolve(undefined);
                        }
                    }, 100);
                });
            }

            // 检查是否取消
            if (batchCancelled) {
                break;
            }

            const task = tasks[i];
            
            // 更新任务状态为处理中
            setBatchTasks(prev => prev.map(t => 
                t.id === task.id ? { ...t, status: 'processing' } : t
            ));
            
            setBatchProgress({ current: i + 1, total: tasks.length });

            try {
                // 根据类型调用相应的生成函数
                const [id, subType] = task.id.split('-');
                
                switch (task.type) {
                    case 'character-full':
                        await handleGenerateCharacterFullBody(id);
                        break;
                    case 'character-face':
                        await handleGenerateCharacterFace(id);
                        break;
                    case 'scene-wide':
                        await handleGenerateSceneWide(id);
                        break;
                    case 'scene-medium':
                        await handleGenerateSceneMedium(id);
                        break;
                    case 'scene-closeup':
                        await handleGenerateSceneCloseup(id);
                        break;
                    case 'prop':
                        await handleGenerateProp(id);
                        break;
                    case 'costume':
                        await handleGenerateCostume(id);
                        break;
                }
                
                // 更新任务状态为成功
                setBatchTasks(prev => prev.map(t => 
                    t.id === task.id ? { ...t, status: 'success' } : t
                ));
                
                // 间隔500ms避免API过载
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`批量生成失败: ${task.name}`, error);
                
                // 更新任务状态为失败
                setBatchTasks(prev => prev.map(t => 
                    t.id === task.id ? { 
                        ...t, 
                        status: 'failed',
                        error: error instanceof Error ? error.message : '未知错误'
                    } : t
                ));
            }
        }

        setIsBatchGenerating(false);
        setBatchProgress({ current: 0, total: 0 });

        const finalTasks = tasks;
        const successCount = finalTasks.filter(t => t.status === 'success').length;
        const failedCount = finalTasks.filter(t => t.status === 'failed').length;

        if (batchCancelled) {
            toast.info(`批量生成已取消：成功 ${successCount} 张，失败 ${failedCount} 张`);
        } else if (failedCount === 0) {
            toast.success(`批量生成完成！成功 ${successCount} 张`);
        } else {
            toast.warning(`批量生成完成：成功 ${successCount} 张，失败 ${failedCount} 张`);
        }

        // 重置状态
        setBatchPaused(false);
        setBatchCancelled(false);
    };

    return {
        enablePromptOptimization,
        setEnablePromptOptimization,
        enablePromptPreview,
        setEnablePromptPreview,
        promptPreview,
        confirmPreviewAndGenerate,
        cancelPreview,
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
    };
}
