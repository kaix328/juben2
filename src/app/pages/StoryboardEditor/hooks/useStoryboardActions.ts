import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { optimizePrompt } from '../../../utils/volcApi';
import { exportAllPanelPrompts } from '../../../utils/prompts';
import { generateStoryboardImage } from '../../../utils/aiService';
import { RequestQueue } from '../../../utils/requestQueue';
import {
    exportVideoPromptsByPlatform,
    exportStoryboardToCSV,
    downloadCSV,
    generateFriendlyFilename,
    downloadText,
    type VideoPlatform
} from '../../../utils/exportUtils';
// v2.0: 导入增强的 PromptEngine
import { PromptEngine } from '../../../utils/promptEngine';
import type { Storyboard, StoryboardPanel, Project, AssetLibrary, Script } from '../../../types';
import type { ExportPlatform, PanelStatus } from '../types';

interface UseStoryboardActionsProps {
    storyboard: Storyboard | null;
    script: Script | null;
    project: Project | null;
    assets: AssetLibrary | null;
    onUpdateStoryboard: (storyboard: Storyboard) => Promise<boolean>;
    onUpdateAssets?: (assets: AssetLibrary) => Promise<boolean>;  // 🆕 用于自动保存资产
    updatePanelStatus?: (id: string, status: PanelStatus) => void;
}

export function useStoryboardActions({
    storyboard,
    script,
    project,
    assets,
    onUpdateStoryboard,
    onUpdateAssets,  // 🆕
    updatePanelStatus
}: UseStoryboardActionsProps) {

    // 初始化并发队列（🆕 增加超时和重试配置）
    const queue = useMemo(() => new RequestQueue({
        maxConcurrency: 3,
        timeout: 120000,  // 2分钟超时
        maxRetries: 1,    // 自动重试一次
        onTaskStatusChange: (task) => {
            updatePanelStatus?.(task.id, task.status as PanelStatus);
        },
        onTaskTimeout: (task) => {
            toast.warning(`分镜 ${task.id.substring(0, 8)} 生成超时，已自动取消`);
        },
        onTaskFailed: (task, error) => {
            console.error(`[Task ${task.id}] Failed:`, error);
        }
    }), [updatePanelStatus]);

    // v2.0: 批量重生成提示词（使用增强的 PromptEngine）
    const handleBatchRegeneratePrompts = useCallback(async (
        selectedIds: Set<string>,
        optimize: boolean,
        onProgress?: (current: number, total: number) => void,
        onComplete?: () => void,
        useEnhanced: boolean = true
    ) => {
        if (!storyboard || !project || !assets) return;

        const total = selectedIds.size;
        let current = 0;

        // v2.0: 创建增强的 PromptEngine
        const engine = useEnhanced ? new PromptEngine(project.directorStyle, {
            useProfessionalSkills: true,
            includeNegative: false,
            qualityTags: 'professional',
        }) : null;

        const tasks = storyboard.panels
            .filter(p => selectedIds.has(p.id))
            .map(panel => ({
                id: panel.id,
                execute: async () => {
                    // 🔒 如果已锁定，跳过更新
                    if (panel.isLocked) {
                        current++;
                        onProgress?.(current, total);
                        return panel; // 直接返回原面板
                    }

                    let finalPrompt = panel.aiPrompt;
                    if (optimize) {
                        if (useEnhanced && engine) {
                            // v2.0: 使用增强的 PromptEngine
                            const result = engine.forStoryboardImage(panel, assets.characters, assets.scenes);
                            finalPrompt = result.positive;
                        } else {
                            // v1.0: 使用原有的 AI 优化
                            finalPrompt = await optimizePrompt(
                                panel.description,
                                project.directorStyle?.artStyle || 'Cinematic',
                                'storyboard'
                            );
                        }
                    }
                    current++;
                    onProgress?.(current, total);
                    return { ...panel, aiPrompt: finalPrompt };
                }
            }));

        queue.addTasks(tasks);

        // 等待全量完成后再执行统一保存逻辑
        try {
            await queue.waitForBatch(selectedIds);

            const results = queue.getTasks()
                .filter(t => selectedIds.has(t.id) && t.status === 'completed')
                .map(t => t.result as StoryboardPanel);

            if (results.length > 0) {
                const updatedPanels = storyboard.panels.map(p => {
                    const found = results.find((r: StoryboardPanel) => r.id === p.id);
                    return found || p;
                });
                await onUpdateStoryboard({ ...storyboard, panels: updatedPanels });
                toast.success(`已完成 ${results.length} 个分镜的提示词重生成${useEnhanced ? '（专业增强版）' : ''}`);
            }
        } catch (err) {
            console.error('[BatchRegenerate] Error:', err);
            toast.error('提示词重生成过程中出现异常');
        } finally {
            onComplete?.();
        }

    }, [storyboard, project, assets, onUpdateStoryboard, queue]);

    // 🆕 辅助函数：计算风格哈希
    const computeStyleHash = useCallback((style?: Project['directorStyle']): string => {
        if (!style) return 'default';
        const str = JSON.stringify(style);
        // 简单哈希算法
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `style_${Math.abs(hash).toString(16).substring(0, 8)}`;
    }, []);

    // 生成单张预览图（🆕 修复：生成后自动保存 + 记录风格快照）
    const handleGenerateImage = useCallback(async (panel: StoryboardPanel) => {
        if (!assets || !project || !storyboard) return;

        toast.loading('正在生成预览图...', { id: `img-${panel.id}` });

        try {
            const imageUrl = await generateStoryboardImage(
                panel,
                assets.characters,
                assets.scenes,
                project.directorStyle,
                true // enableOptimization
            );

            // 🆕 计算风格哈希用于追溯
            const styleHash = computeStyleHash(project.directorStyle);

            // 🆕 自动保存到分镜 (使用 generatedImage 字段 + 风格快照)
            const updatedPanels = storyboard.panels.map(p =>
                p.id === panel.id ? {
                    ...p,
                    generatedImage: imageUrl,
                    appliedStyleHash: styleHash,  // 🆕 记录风格哈希
                    generatedAt: new Date().toISOString()  // 🆕 记录生成时间
                } : p
            );
            await onUpdateStoryboard({ ...storyboard, panels: updatedPanels });

            toast.success('预览图已生成', { id: `img-${panel.id}` });
            return imageUrl;
        } catch (error) {
            console.error('Failed to generate image:', error);
            toast.error('生成图片失败', { id: `img-${panel.id}` });
        }
    }, [assets, project, storyboard, onUpdateStoryboard, computeStyleHash]);

    // 复制分镜
    const handleCopyPanel = useCallback(async (panel: StoryboardPanel) => {
        if (!storyboard) return;
        const newPanel: StoryboardPanel = {
            ...panel,
            id: `p-${Date.now()}`,
            panelNumber: panel.panelNumber + 1
        };
        const index = storyboard.panels.findIndex(p => p.id === panel.id);
        const updatedPanels = [
            ...storyboard.panels.slice(0, index + 1),
            newPanel,
            ...storyboard.panels.slice(index + 1)
        ].map((p, i) => ({ ...p, panelNumber: i + 1 }));

        await onUpdateStoryboard({ ...storyboard, panels: updatedPanels });
        toast.success('分镜已复制');
    }, [storyboard, onUpdateStoryboard]);

    // 拆分分镜
    const handleSplitPanel = useCallback(async (panelId: string, count: number) => {
        if (!storyboard) return;
        const index = storyboard.panels.findIndex(p => p.id === panelId);
        if (index === -1) return;

        const panel = storyboard.panels[index];
        const newPanels: StoryboardPanel[] = [];
        for (let i = 0; i < count; i++) {
            newPanels.push({
                ...panel,
                id: `p-${Date.now()}-${i}`,
                panelNumber: panel.panelNumber + i,
                aiPrompt: '',
                generatedImage: undefined
            });
        }

        const updatedPanels = [
            ...storyboard.panels.slice(0, index),
            ...newPanels,
            ...storyboard.panels.slice(index + 1)
        ].map((p, i) => ({ ...p, panelNumber: i + 1 }));

        await onUpdateStoryboard({ ...storyboard, panels: updatedPanels });
        toast.success(`分镜已拆分为 ${count} 份`);
    }, [storyboard, onUpdateStoryboard]);

    // 批量删除
    const handleBatchDelete = useCallback(async (selectedIds: Set<string>) => {
        if (!storyboard) return;
        const updatedPanels = storyboard.panels.filter(p => !selectedIds.has(p.id))
            .map((p, i) => ({ ...p, panelNumber: i + 1 }));

        await onUpdateStoryboard({ ...storyboard, panels: updatedPanels });
        toast.success(`已删除 ${selectedIds.size} 个分镜`);
    }, [storyboard, onUpdateStoryboard]);

    // 批量应用参数
    const handleBatchApplyParams = useCallback(async (selectedIds: Set<string>, params: Partial<StoryboardPanel>) => {
        if (!storyboard) return;
        const updatedPanels = storyboard.panels.map(p => {
            if (selectedIds.has(p.id)) {
                return { ...p, ...params };
            }
            return p;
        });

        await onUpdateStoryboard({ ...storyboard, panels: updatedPanels });
        toast.success(`已为 ${selectedIds.size} 个分镜应用参数`);
    }, [storyboard, onUpdateStoryboard]);

    // 应用预设
    const handleApplyPreset = useCallback(async (panelId: string, params: Partial<StoryboardPanel>) => {
        if (!storyboard) return;
        const updatedPanels = storyboard.panels.map(p => {
            if (p.id === panelId) {
                return { ...p, ...params };
            }
            return p;
        });
        await onUpdateStoryboard({ ...storyboard, panels: updatedPanels });
    }, [storyboard, onUpdateStoryboard]);

    // 导出分镜（支持 JSON/Text 格式）
    const handleExportStoryboard = useCallback((format: string) => {
        if (!storyboard) return;

        let content: string;
        let filename: string;
        let mimeType: string;

        if (format === 'json') {
            content = JSON.stringify(storyboard, null, 2);
            filename = `storyboard_${Date.now()}.json`;
            mimeType = 'application/json';
        } else {
            // Text 格式
            const lines = storyboard.panels.map(p =>
                `#${p.panelNumber} | ${p.shot || '中景'} | ${p.duration || 3}秒\n` +
                `画面：${p.description || ''}\n` +
                `对白：${p.dialogue || ''}\n` +
                `提示词：${p.aiPrompt || ''}\n` +
                `---`
            );
            content = lines.join('\n\n');
            filename = `storyboard_${Date.now()}.txt`;
            mimeType = 'text/plain';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`已导出为 ${format.toUpperCase()} 格式`);
    }, [storyboard]);

    // 导出提示词
    const handleExportPrompts = useCallback((platform: ExportPlatform) => {
        if (!storyboard || !assets || !script || !project) return;

        const prompts = exportAllPanelPrompts(
            storyboard.panels,
            assets.characters,
            assets.scenes,
            project.directorStyle,
            platform
        );
        const blob = new Blob([prompts], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `storyboard_prompts_${platform}_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`已导出 ${platform} 格式提示词`);
    }, [storyboard, assets, script, project]);

    // PDF 导出（🆕 增强版本）
    const handleExportPDF = useCallback(async () => {
        toast.loading('正在准备PDF导出...', { id: 'pdf-export' });

        // 短暂延迟确保打印模板渲染完成
        await new Promise(resolve => setTimeout(resolve, 100));

        // 调用浏览器打印（使用CSS @media print 样式）
        window.print();

        // 打印完成后移除loading toast
        setTimeout(() => {
            toast.dismiss('pdf-export');
            toast.success('PDF导出对话框已打开，请选择"保存为PDF"');
        }, 500);
    }, []);

    // 复制提示词
    const handleCopyPrompt = useCallback((prompt: string, type: 'image' | 'video') => {
        navigator.clipboard.writeText(prompt);
        toast.success(`${type === 'image' ? '提示词' : '视频描述'}已复制到剪贴板`);
    }, []);

    // 一键生成全部预览图
    const handleGenerateAllImages = useCallback(async (
        selectedIds: Set<string>,
        onProgress?: (current: number, total: number) => void,
        onComplete?: () => void
    ) => {
        if (!storyboard || !assets || !project) return;

        const total = selectedIds.size;
        let current = 0;

        const tasks = storyboard.panels
            .filter(p => selectedIds.has(p.id))
            .map(panel => ({
                id: panel.id,
                execute: async () => {
                    const imageUrl = await generateStoryboardImage(
                        panel,
                        assets.characters,
                        assets.scenes,
                        project.directorStyle,
                        true
                    );
                    current++;
                    onProgress?.(current, total);
                    return { ...panel, generatedImage: imageUrl };
                }
            }));

        queue.addTasks(tasks);

        // 🆕 等待全量完成后再执行统一保存逻辑
        try {
            await queue.waitForBatch(selectedIds);

            const results = queue.getTasks()
                .filter(t => selectedIds.has(t.id) && t.status === 'completed')
                .map(t => t.result as StoryboardPanel);

            if (results.length > 0) {
                const updatedPanels = storyboard.panels.map(p => {
                    const found = results.find((r: StoryboardPanel) => r.id === p.id);
                    return found || p;
                });
                await onUpdateStoryboard({ ...storyboard, panels: updatedPanels });
                toast.success(`已完成 ${results.length} 张预览图生成`);
            }
        } catch (err) {
            console.error('[BatchGenerateImages] Error:', err);
            toast.error('批量生成过程中出现异常');
        } finally {
            onComplete?.();
        }
    }, [storyboard, assets, project, queue, onUpdateStoryboard]);

    // v2.0: 生成单张提示词（使用增强的 PromptEngine）
    const handleGeneratePrompts = useCallback(async (panel: StoryboardPanel, useEnhanced: boolean = true) => {
        if (!assets || !project || !storyboard) {
            toast.error('项目信息未加载');
            return;
        }

        toast.loading('正在生成提示词...', { id: `prompt-${panel.id}` });

        try {
            let optimizedPrompt: string;

            if (useEnhanced) {
                // v2.0: 使用增强的 PromptEngine（包含专业电影摄影参数）
                const engine = new PromptEngine(project.directorStyle, {
                    useProfessionalSkills: true,
                    includeNegative: false, // 图像提示词不包含负面提示词
                    qualityTags: 'professional',
                });

                const result = engine.forStoryboardImage(panel, assets.characters, assets.scenes);
                optimizedPrompt = result.positive;

                console.log('[v2.0 Enhanced] Generated prompt:', {
                    panelId: panel.id,
                    promptLength: optimizedPrompt.length,
                    metadata: result.metadata,
                });
            } else {
                // v1.0: 使用原有的 AI 优化方法
                optimizedPrompt = await optimizePrompt(
                    panel.description || '电影分镜',
                    project.directorStyle?.artStyle || 'Cinematic',
                    'storyboard'
                );
            }

            // 更新分镜
            const updatedPanels = storyboard.panels.map(p =>
                p.id === panel.id ? { ...p, aiPrompt: optimizedPrompt } : p
            );

            await onUpdateStoryboard({ ...storyboard, panels: updatedPanels });
            toast.success(useEnhanced ? '提示词已生成（专业增强版）' : '提示词已生成', { id: `prompt-${panel.id}` });
        } catch (error) {
            console.error('Failed to generate prompt:', error);
            toast.error('生成提示词失败', { id: `prompt-${panel.id}` });
        }
    }, [assets, project, storyboard, onUpdateStoryboard]);

    // 🆕 导出为 CSV（Excel 兼容）
    const handleExportCSV = useCallback(() => {
        if (!storyboard || !project) return;
        const csv = exportStoryboardToCSV(storyboard.panels, project.title);
        const filename = generateFriendlyFilename(project.title, '分镜表', 'csv');
        downloadCSV(csv, filename);
        toast.success('已导出 CSV 格式（可用Excel打开）');
    }, [storyboard, project]);

    // 🆕 导出视频提示词（分平台）
    const handleExportVideoPrompts = useCallback((platform: VideoPlatform) => {
        if (!storyboard || !project) return;
        const content = exportVideoPromptsByPlatform(storyboard.panels, platform, project.title);
        const filename = generateFriendlyFilename(project.title, `视频提示词_${platform}`, 'txt');
        downloadText(content, filename);
        toast.success(`已导出 ${platform.toUpperCase()} 格式视频提示词`);
    }, [storyboard, project]);

    // 🆕 反向同步：从分镜提取角色/场景到项目库
    const handleSyncToAssetLibrary = useCallback(async () => {
        if (!storyboard || !assets) {
            toast.error('分镜或项目库未加载');
            return { newCharacters: [], newScenes: [] };
        }

        const existingCharNames = new Set(assets.characters.map(c => c.name.toLowerCase()));
        const existingSceneNames = new Set(assets.scenes.map(s => s.name.toLowerCase()));

        const newCharacters: { name: string; description: string }[] = [];
        const newScenes: { name: string; description: string }[] = [];

        // 遍历所有分镜面板
        storyboard.panels.forEach(panel => {
            // 提取角色名称（从 characters 字段或对白）
            if (panel.characters) {
                panel.characters.forEach(charName => {
                    if (charName && !existingCharNames.has(charName.toLowerCase())) {
                        existingCharNames.add(charName.toLowerCase());
                        newCharacters.push({
                            name: charName,
                            description: `从分镜 ${panel.id.substring(0, 8)} 提取`
                        });
                    }
                });
            }
            // 从对白中提取角色
            if (panel.dialogue && typeof panel.dialogue === 'string') {
                const dialogueMatch = panel.dialogue.match(/^(.+?)[:：]/);
                if (dialogueMatch) {
                    const charName = dialogueMatch[1].trim();
                    if (charName && !existingCharNames.has(charName.toLowerCase())) {
                        existingCharNames.add(charName.toLowerCase());
                        newCharacters.push({
                            name: charName,
                            description: `从对白中提取`
                        });
                    }
                }
            }

            // 提取场景名称（从 sceneId 查找或从 description 中提取）
            let sceneName = '';
            if (panel.sceneId) {
                const existingScene = assets.scenes.find(s => s.id === panel.sceneId);
                if (!existingScene) {
                    // 场景ID存在但不在资产库中，用sceneId作为临时名称
                    sceneName = `场景_${panel.sceneId.substring(0, 8)}`;
                }
            }
            // 从description中尝试提取场景（如：INT. 办公室 - 日）
            if (!sceneName && panel.description) {
                const sceneMatch = panel.description.match(/^(INT\.|EXT\.|内|外)[^\-\n]*/i);
                if (sceneMatch) {
                    sceneName = sceneMatch[0].trim();
                }
            }
            if (sceneName && !existingSceneNames.has(sceneName.toLowerCase())) {
                existingSceneNames.add(sceneName.toLowerCase());
                newScenes.push({
                    name: sceneName,
                    description: panel.description?.substring(0, 100) || `从分镜 ${panel.id.substring(0, 8)} 提取`
                });
            }
        });

        if (newCharacters.length === 0 && newScenes.length === 0) {
            toast.info('未发现新的角色或场景');
            return { newCharacters: [], newScenes: [], saved: false };
        }

        // 🆕 自动添加到项目库（包含自动生成提示词）
        if (onUpdateAssets && assets) {
            // v2.0: 使用 PromptEngine 生成一致的初始提示词
            const engine = new PromptEngine(project?.directorStyle, {
                useProfessionalSkills: true,
                includeNegative: false
            });

            const updatedAssets: AssetLibrary = {
                ...assets,
                characters: [
                    ...assets.characters,
                    ...newCharacters.map((c, idx) => {
                        const tempChar = {
                            id: `char-sync-${Date.now()}-${idx}`,
                            name: c.name,
                            description: c.description,
                            appearance: '',
                            personality: '',
                            avatar: '',
                            tags: ['从分镜同步']
                        } as any;

                        // 使用引擎生成标准提示词
                        const fullBody = engine.forCharacterFullBody(tempChar);
                        const face = engine.forCharacterFace(tempChar);

                        return {
                            ...tempChar,
                            fullBodyPrompt: fullBody.positive,
                            facePrompt: face.positive,
                        };
                    })
                ],
                scenes: [
                    ...assets.scenes,
                    ...newScenes.map((s, idx) => {
                        const tempScene = {
                            id: `scene-sync-${Date.now()}-${idx}`,
                            name: s.name,
                            description: s.description,
                            location: s.name,
                            environment: '',
                            atmosphere: '',
                            image: '',
                            tags: ['从分镜同步']
                        } as any;

                        // 使用引擎生成标准提示词
                        const wide = engine.forSceneWide(tempScene);
                        const medium = engine.forSceneMedium(tempScene);
                        const closeup = engine.forSceneCloseup(tempScene);

                        return {
                            ...tempScene,
                            widePrompt: wide.positive,
                            mediumPrompt: medium.positive,
                            closeupPrompt: closeup.positive,
                        };
                    })
                ]
            };

            const saved = await onUpdateAssets(updatedAssets);
            if (saved) {
                toast.success(`已自动添加 ${newCharacters.length} 个角色，${newScenes.length} 个场景到项目库`);
                return { newCharacters, newScenes, saved: true };
            } else {
                toast.error('保存到项目库失败');
                return { newCharacters, newScenes, saved: false };
            }
        }

        // 没有 onUpdateAssets 回调时，仅返回提取结果
        return { newCharacters, newScenes, saved: false };
    }, [storyboard, assets, onUpdateAssets, project]);

    // v2.0: 生成视频提示词（使用增强的 PromptEngine）
    const handleGenerateVideoPrompt = useCallback((panel: StoryboardPanel, useEnhanced: boolean = true): string => {
        if (!assets || !project) {
            return panel.aiVideoPrompt || '';
        }

        if (useEnhanced) {
            // v2.0: 使用增强的 PromptEngine（包含专业视频生成参数）
            const engine = new PromptEngine(project.directorStyle, {
                useProfessionalSkills: true,
                includeNegative: false,
                qualityTags: 'professional',
            });

            const result = engine.forStoryboardVideo(panel, assets.characters);
            return result.positive;
        } else {
            // v1.0: 返回原有的视频提示词
            return panel.aiVideoPrompt || panel.description || '';
        }
    }, [assets, project]);

    // v2.0: 预览提示词（不保存，仅返回）
    const handlePreviewPrompt = useCallback((panel: StoryboardPanel, type: 'image' | 'video' = 'image'): {
        positive: string;
        negative: string;
        metadata?: any;
    } => {
        if (!assets || !project) {
            return { positive: '', negative: '' };
        }

        const engine = new PromptEngine(project.directorStyle, {
            useProfessionalSkills: true,
            includeNegative: true,
            qualityTags: 'professional',
        });

        if (type === 'image') {
            return engine.forStoryboardImage(panel, assets.characters, assets.scenes);
        } else {
            return engine.forStoryboardVideo(panel, assets.characters);
        }
    }, [assets, project]);

    // 🆕 一键优化功能
    const handleOptimizeIssues = useCallback(async (
        selectedIssues: any[]
    ): Promise<any[]> => {
        if (!storyboard?.panels) {
            return [];
        }

        console.log('[OptimizeIssues] 开始优化', selectedIssues.length, '个问题');

        const results: any[] = [];
        const optimizedPanels = new Map<string, StoryboardPanel>();
        const changeLog: string[] = [];
        
        // 第一步：收集所有需要优化的分镜
        for (const issue of selectedIssues) {
            try {
                const panel = storyboard.panels.find(p => p.id === issue.panelId);
                if (!panel) {
                    results.push({
                        success: false,
                        issueId: issue.id,
                        error: '未找到对应分镜',
                    });
                    continue;
                }

                // 获取已优化的版本或原始版本
                let optimizedPanel = optimizedPanels.get(panel.id) || { ...panel };
                let optimized = false;
                let changes: string[] = [];

                // 1. 时长问题优化
                if (issue.type === 'duration') {
                    if (issue.message.includes('过短')) {
                        const oldDuration = optimizedPanel.duration || 0;
                        optimizedPanel.duration = Math.max(oldDuration, 3);
                        optimized = true;
                        changes.push(`时长: ${oldDuration}s → ${optimizedPanel.duration}s`);
                    } else if (issue.message.includes('过长')) {
                        const oldDuration = optimizedPanel.duration || 0;
                        optimizedPanel.duration = Math.min(oldDuration, 10);
                        optimized = true;
                        changes.push(`时长: ${oldDuration}s → ${optimizedPanel.duration}s`);
                    } else if (issue.message.includes('对话时长不足')) {
                        // 根据对话长度计算合适的时长
                        const dialogue = optimizedPanel.dialogue || '';
                        const estimatedDuration = Math.ceil(dialogue.length / 4);
                        optimizedPanel.duration = Math.max(3, Math.min(15, estimatedDuration));
                        optimized = true;
                        changes.push(`调整时长以匹配对话: ${optimizedPanel.duration}s`);
                    }
                }

                // 2. 镜头问题优化
                if (issue.type === 'shot') {
                    if (issue.message.includes('缺少画面描述')) {
                        const characters = optimizedPanel.characters?.join('、') || '角色';
                        const shot = optimizedPanel.shot || '镜头';
                        optimizedPanel.description = `${shot}：${characters}在场景中`;
                        optimized = true;
                        changes.push('添加基础画面描述');
                    }
                    if (issue.message.includes('缺少景别')) {
                        optimizedPanel.shot = '中景';
                        optimized = true;
                        changes.push('设置默认景别: 中景');
                    }
                    if (issue.message.includes('缺少建立镜头')) {
                        optimizedPanel.shot = '全景';
                        optimizedPanel.notes = (optimizedPanel.notes || '') + ' [建立镜头]';
                        optimized = true;
                        changes.push('设置为建立镜头');
                    }
                }

                // 3. 角色问题优化
                if (issue.type === 'character') {
                    if (issue.message.includes('有对话但没有角色')) {
                        // 尝试从前一个分镜获取角色
                        const panelIndex = storyboard.panels.findIndex(p => p.id === panel.id);
                        if (panelIndex > 0) {
                            const prevPanel = storyboard.panels[panelIndex - 1];
                            if (prevPanel.characters && prevPanel.characters.length > 0) {
                                optimizedPanel.characters = [...prevPanel.characters];
                                optimized = true;
                                changes.push(`添加角色: ${prevPanel.characters.join('、')}`);
                            }
                        }
                    }
                    if (issue.message.includes('突然消失') || issue.message.includes('突然出现')) {
                        // 这类问题需要重新生成提示词以保持一致性
                        if (assets && project) {
                            const engine = new PromptEngine(project.directorStyle, {
                                useProfessionalSkills: true,
                            });
                            const result = engine.forStoryboardImage(optimizedPanel, assets.characters, assets.scenes);
                            optimizedPanel.aiPrompt = result.positive;
                            optimized = true;
                            changes.push('更新提示词以保持角色一致性');
                        }
                    }
                }

                // 4. 对话问题优化
                if (issue.type === 'dialogue') {
                    if (issue.message.includes('对话过长')) {
                        const dialogue = optimizedPanel.dialogue || '';
                        if (dialogue.length > 200) {
                            optimizedPanel.dialogue = dialogue.substring(0, 200) + '...';
                            optimizedPanel.notes = (optimizedPanel.notes || '') + ' [对话已截断，建议拆分分镜]';
                            optimized = true;
                            changes.push('截断过长对话');
                        }
                    }
                    if (issue.message.includes('缺少标点符号')) {
                        const dialogue = optimizedPanel.dialogue || '';
                        if (dialogue && !dialogue.match(/[。！？!?…]/)) {
                            optimizedPanel.dialogue = dialogue + '。';
                            optimized = true;
                            changes.push('添加标点符号');
                        }
                    }
                }

                // 5. 连贯性问题优化
                if (issue.type === 'continuity') {
                    if (issue.message.includes('连续') && issue.message.includes('相同景别')) {
                        // 改变景别
                        const shotSequence = ['大远景', '远景', '全景', '中景', '近景', '特写', '大特写'];
                        const currentIndex = shotSequence.indexOf(optimizedPanel.shot);
                        if (currentIndex > 0 && currentIndex < shotSequence.length - 1) {
                            optimizedPanel.shot = shotSequence[currentIndex + 1];
                            optimized = true;
                            changes.push(`调整景别: ${shotSequence[currentIndex]} → ${optimizedPanel.shot}`);
                        }
                    }
                    if (issue.message.includes('景别跳跃过大')) {
                        // 这类问题建议手动处理，但可以添加提示
                        optimizedPanel.notes = (optimizedPanel.notes || '') + ' [注意：景别跳跃较大]';
                        optimized = true;
                        changes.push('添加景别跳跃提示');
                    }
                }

                // 6. 提示词问题优化
                if (issue.type === 'prompt') {
                    if (assets && project) {
                        const engine = new PromptEngine(project.directorStyle, {
                            useProfessionalSkills: true,
                        });
                        const result = engine.forStoryboardImage(optimizedPanel, assets.characters, assets.scenes);
                        optimizedPanel.aiPrompt = result.positive;
                        optimized = true;
                        changes.push('重新生成提示词');
                    }
                }

                // 7. 逻辑问题优化
                if (issue.type === 'logic') {
                    if (issue.message.includes('编号不连续')) {
                        const panelIndex = storyboard.panels.findIndex(p => p.id === panel.id);
                        optimizedPanel.panelNumber = panelIndex + 1;
                        optimized = true;
                        changes.push(`修正编号: ${optimizedPanel.panelNumber}`);
                    }
                    // ID重复问题需要手动处理
                }

                if (optimized) {
                    optimizedPanels.set(panel.id, optimizedPanel);
                    const changeDesc = changes.join('; ');
                    changeLog.push(`分镜#${panel.panelNumber}: ${changeDesc}`);
                    results.push({
                        success: true,
                        issueId: issue.id,
                        panelId: panel.id,
                        changes: changeDesc,
                    });
                    console.log(`[OptimizeIssues] 优化分镜#${panel.panelNumber}:`, changeDesc);
                } else {
                    results.push({
                        success: false,
                        issueId: issue.id,
                        error: '无法自动优化此类问题',
                    });
                }
            } catch (error) {
                console.error('[OptimizeIssues] 优化失败:', error);
                results.push({
                    success: false,
                    issueId: issue.id,
                    error: error instanceof Error ? error.message : '优化失败',
                });
            }
        }

        // 第二步：统一更新所有优化后的分镜
        if (optimizedPanels.size > 0) {
            console.log('[OptimizeIssues] 应用优化到', optimizedPanels.size, '个分镜');
            const updatedStoryboard = {
                ...storyboard,
                panels: storyboard.panels.map(p =>
                    optimizedPanels.has(p.id) ? optimizedPanels.get(p.id)! : p
                ),
            };
            await onUpdateStoryboard(updatedStoryboard);
            console.log('[OptimizeIssues] 优化已保存');
        }

        // 显示优化结果
        const successCount = results.filter(r => r.success).length;
        if (successCount > 0) {
            toast.success(`成功优化 ${successCount} 个问题`, {
                description: changeLog.slice(0, 3).join('\n'),
                duration: 5000,
            });
        }
        if (successCount < results.length) {
            const failedCount = results.length - successCount;
            toast.warning(`${failedCount} 个问题无法自动优化，请手动处理`);
        }

        console.log('[OptimizeIssues] 优化完成:', {
            total: results.length,
            success: successCount,
            failed: results.length - successCount,
        });

        return results;
    }, [storyboard, assets, project, onUpdateStoryboard]);

    return {
        handleBatchRegeneratePrompts,
        handleGenerateAllImages,
        handleGenerateImage,
        handleCopyPanel,
        handleSplitPanel,
        handleBatchDelete,
        handleBatchApplyParams: (selectedIds: Set<string>, params: any) => handleBatchApplyParams(selectedIds, params),
        handleApplyPreset,
        handleExportStoryboard,
        handleExportPrompts,
        handleExportPDF,
        handleCopyPrompt,
        handleGeneratePrompts,
        handleExportCSV,
        handleExportVideoPrompts,
        handleSyncToAssetLibrary,
        // v2.0: 新增方法
        handleGenerateVideoPrompt,
        handlePreviewPrompt,
        handleOptimizeIssues, // 🆕 一键优化
        // 队列控制方法
        cancelAllTasks: () => queue.cancelAll(),
        retryFailedTasks: (ids?: Set<string>) => queue.retryFailed(ids),
        getQueueStats: () => queue.getStats(),
    };
}
