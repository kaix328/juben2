/**
 * 导演风格编辑器 Hooks
 * 从 DirectorStyleEditor.tsx 提取的状态管理逻辑
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { DirectorStyle, StyleApplicationSettings, StoryboardPanel, Storyboard } from '../../types';
import { useProjectStore } from '../../stores';
import { chapterStorage, storyboardStorage } from '../storage';
import { styleSettingsStorage } from '../localStorage';

// 默认风格应用设置
export const DEFAULT_STYLE_SETTINGS: StyleApplicationSettings = {
    mode: 'manual',
    autoApplyToNew: true,
    protectManualEdits: true,
    confirmBeforeApply: true,
    showPreview: true,
};

// 默认风格
export const DEFAULT_STYLE: DirectorStyle = {
    artStyle: '',
    colorTone: '',
    lightingStyle: '',
    cameraStyle: '',
    mood: '',
    customPrompt: '',
    negativePrompt: '',
    aspectRatio: '16:9',
    videoFrameRate: '24',
    motionIntensity: 'normal'
};

/**
 * 导演风格状态管理 Hook
 */
export function useDirectorStyle(projectId?: string) {
    const { currentProject, loadProject, updateProject } = useProjectStore();
    const isMountedRef = useRef(true);

    const [style, setStyle] = useState<DirectorStyle>(DEFAULT_STYLE);
    const [styleSettings, setStyleSettings] = useState<StyleApplicationSettings>(DEFAULT_STYLE_SETTINGS);

    // 安全的 toast 封装
    const safeToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        requestAnimationFrame(() => {
            if (isMountedRef.current) {
                if (type === 'success') {
                    toast.success(message);
                } else {
                    toast.error(message);
                }
            }
        });
    }, []);

    // 安全的 style 更新
    const safeUpdateStyle = useCallback(<K extends keyof DirectorStyle>(key: K, value: DirectorStyle[K]) => {
        if (isMountedRef.current) {
            setStyle(prev => ({ ...prev, [key]: value }));
        }
    }, []);

    // 安全的 styleSettings 更新（使用 localStorage 封装）
    const safeUpdateStyleSettings = useCallback((newSettings: StyleApplicationSettings) => {
        if (!isMountedRef.current) return;

        setStyleSettings(newSettings);

        requestAnimationFrame(() => {
            if (isMountedRef.current && projectId) {
                const success = styleSettingsStorage.set(projectId, newSettings);
                if (success) {
                    safeToast('应用设置已保存');
                }
            }
        });
    }, [projectId, safeToast]);

    // 重置风格
    const resetStyle = useCallback(() => {
        setStyle(DEFAULT_STYLE);
        safeToast('已重置所有风格设置');
    }, [safeToast]);

    // 加载项目和设置
    useEffect(() => {
        isMountedRef.current = true;

        if (projectId) {
            loadProject(projectId);

            const savedSettings = styleSettingsStorage.get(projectId);
            if (savedSettings && isMountedRef.current) {
                setStyleSettings(savedSettings);
            }
        }

        return () => {
            isMountedRef.current = false;
        };
    }, [projectId, loadProject]);

    // 当全局项目加载完成后，同步本地编辑状态
    useEffect(() => {
        if (currentProject?.directorStyle) {
            setStyle(currentProject.directorStyle);
        }
    }, [currentProject]);

    // 保存风格
    const handleSave = useCallback(async () => {
        if (!currentProject || !isMountedRef.current) return;

        const oldStyle = currentProject.directorStyle;
        const hasStyleChanged = JSON.stringify(oldStyle) !== JSON.stringify(style);

        const updatedProject = {
            ...currentProject,
            directorStyle: style,
            updatedAt: new Date().toISOString()
        };

        try {
            await updateProject(updatedProject);
            safeToast('导演风格已保存并同步至全局');

            if (hasStyleChanged && oldStyle) {
                setTimeout(() => {
                    if (isMountedRef.current) {
                        toast.info('💡 导演风格已更新，建议前往项目库点击"同步风格"按钮更新所有资源提示词', {
                            duration: 8000,
                            action: {
                                label: '前往项目库',
                                onClick: () => window.location.href = `/projects/${projectId}/assets`
                            }
                        });
                    }
                }, 1000);
            }
        } catch (error) {
            safeToast('保存失败', 'error');
        }
    }, [currentProject, style, updateProject, safeToast, projectId]);

    const [customPresets, setCustomPresets] = useState<any[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    // 加载自定义预设
    useEffect(() => {
        import('../directorStylePresets').then(({ directorStylePresets, DEFAULT_MASTER_PRESET }) => {
            const customs = directorStylePresets.getAll();
            // 注入内置大师预设
            const masterPreset = {
                id: 'builtin-master-01',
                name: '🎬 大师级电影质感 (Master Cinematic)',
                style: DEFAULT_MASTER_PRESET,
                createdAt: new Date().toISOString(),
            };
            setCustomPresets([masterPreset, ...customs]);
        });
    }, []);

    // 保存自定义预设
    const saveCustomPreset = useCallback(async (name: string) => {
        const { directorStylePresets } = await import('../directorStylePresets');
        const newPreset = directorStylePresets.save(name, style);
        setCustomPresets(prev => [newPreset, ...prev]);
        safeToast(`已保存预设: ${name}`);
    }, [style, safeToast]);

    // 删除自定义预设
    const deleteCustomPreset = useCallback(async (id: string) => {
        const { directorStylePresets } = await import('../directorStylePresets');
        directorStylePresets.delete(id);
        setCustomPresets(prev => prev.filter(p => p.id !== id));
        safeToast('预设已删除');
    }, [safeToast]);

    // 生成预览图
    const generatePreview = useCallback(async () => {
        if (!isMountedRef.current) return;
        setIsGeneratingPreview(true);
        setPreviewImage(null);

        try {
            // 动态导入 aiService 以避免循环依赖
            const { aiService } = await import('../../services/aiService');
            // 引入 PromptEngine
            const { PromptEngine } = await import('../promptEngine');

            // 使用 PromptEngine 生成预览提示词，确保与实际应用一致
            const engine = new PromptEngine(style, {
                useProfessionalSkills: true,
                includeNegative: true,
                qualityTags: 'professional'
            });

            // 创建一个通用的"测试场景"，旨在展示光影和构图
            // 使用一个相对中性的场景，让风格参数主导画面
            const previewScene = {
                id: 'preview-scene',
                name: 'Visual Style Preview',
                description: 'A representative scene showcasing the lighting, color grades, and composition style. A character standing in an atmospheric environment.',
                environment: 'atmospheric background',
                timeOfDay: 'dusk' as const, // 默认黄昏，容易出效果
                location: 'Generic Location', // 补全缺失字段
                image: '', // 补全缺失字段
                atmosphere: '' // 补全缺失字段
            };

            const resultPrompt = engine.forSceneWide(previewScene);
            const optimizedPrompt = resultPrompt.positive;

            const result = await aiService.image.generate({
                prompt: optimizedPrompt,
                negativePrompt: style.negativePrompt, // 显式传递负面提示词
                width: 2560,
                height: 1440,
            });

            if (isMountedRef.current && result.success && result.data) {
                setPreviewImage(result.data);
            }
        } catch (error) {
            console.error('Failed to generate preview', error);
            safeToast('生成预览失败，请稍后重试', 'error');
        } finally {
            if (isMountedRef.current) {
                setIsGeneratingPreview(false);
            }
        }
    }, [style, safeToast]);

    return {
        style,
        setStyle,
        styleSettings,
        currentProject,
        isMountedRef,
        safeToast,
        safeUpdateStyle,
        safeUpdateStyleSettings,
        resetStyle,
        handleSave,
        // New Features
        customPresets,
        saveCustomPreset,
        deleteCustomPreset,
        previewImage,
        isGeneratingPreview,
        generatePreview
    };
}

/**
 * 批量应用风格到分镜的 Hook
 */
export function useStyleBatchApply(
    projectId: string | undefined,
    style: DirectorStyle,
    handleSave: () => Promise<void>,
    isMountedRef: React.MutableRefObject<boolean>
) {
    const [isApplyingToAll, setIsApplyingToAll] = useState(false);

    const handleApplyStyleToAllPanels = useCallback(async () => {
        if (!projectId || !isMountedRef.current) return;

        await handleSave();

        const confirmed = window.confirm(
            '确定要将当前导演风格应用到项目中所有分镜的提示词吗？\n\n' +
            '这将为每个分镜重新生成优化后的AI提示词，可能需要一些时间。'
        );
        if (!confirmed) return;

        setIsApplyingToAll(true);
        const toastId = 'apply-style-to-all';
        toast.loading('正在加载项目分镜...', { id: toastId });

        try {
            const chapters = await chapterStorage.getByProjectId(projectId);
            if (!chapters || chapters.length === 0) {
                toast.warning('项目中没有章节', { id: toastId });
                setIsApplyingToAll(false);
                return;
            }

            let totalPanels = 0;
            let processedPanels = 0;
            const storyboards: Storyboard[] = [];

            for (const chapter of chapters) {
                const sb = await storyboardStorage.getByChapterId(chapter.id);
                if (sb && sb.panels && sb.panels.length > 0) {
                    storyboards.push(sb as Storyboard);
                    totalPanels += sb.panels.length;
                }
            }

            if (totalPanels === 0) {
                toast.warning('项目中没有分镜面板', { id: toastId });
                setIsApplyingToAll(false);
                return;
            }

            toast.loading(`正在更新 ${totalPanels} 个分镜的提示词...`, { id: toastId });

            // 加载资产库以用于上下文增强
            const { assetStorage } = await import('../storage');
            const assets = await assetStorage.getByProjectId(projectId);
            const characters = assets?.characters || [];
            const scenes = assets?.scenes || [];

            // 引入 PromptEngine
            const { PromptEngine } = await import('../promptEngine');
            const engine = new PromptEngine(style, {
                useProfessionalSkills: true,
                includeNegative: false
            });

            for (const storyboard of storyboards) {
                const updatedPanels = await Promise.all(
                    storyboard.panels.map(async (panel: StoryboardPanel) => {
                        // 🔒 如果已锁定，跳过更新
                        if (panel.isLocked) {
                            processedPanels++;
                            return panel;
                        }

                        try {
                            // v2.0: 使用 PromptEngine 生成提示词
                            const result = engine.forStoryboardImage(panel, characters, scenes);
                            const newPrompt = result.positive;

                            processedPanels++;
                            toast.loading(`已处理 ${processedPanels}/${totalPanels} 个分镜...`, { id: toastId });

                            return {
                                ...panel,
                                aiPrompt: newPrompt,
                                appliedStyleHash: `style_${Date.now().toString(16).substring(0, 8)}`,
                                generatedAt: new Date().toISOString()
                            };
                        } catch (error) {
                            console.error(`Failed to update panel ${panel.id}:`, error);
                            processedPanels++;
                            return panel;
                        }
                    })
                );

                await storyboardStorage.save({
                    ...storyboard,
                    panels: updatedPanels,
                    updatedAt: new Date().toISOString()
                });
            }

            toast.success(`已成功更新 ${processedPanels} 个分镜的提示词！`, { id: toastId });
        } catch (error) {
            console.error('Failed to apply style to all panels:', error);
            toast.error('应用风格时出错，请稍后重试', { id: toastId });
        } finally {
            setIsApplyingToAll(false);
        }
    }, [projectId, style, handleSave, isMountedRef]);

    return {
        isApplyingToAll,
        handleApplyStyleToAllPanels,
    };
}
