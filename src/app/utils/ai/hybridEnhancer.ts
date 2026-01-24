/**
 * 混合智能增强模块
 * 结合规则引擎与 AI 模型，对分镜进行细节补充
 */
import { StoryboardPanel } from '../../types';
import { callDeepSeek, parseJSON } from '../volcApi';
import { devLog } from './utils';
import { createProgress, ProgressCallback } from '../../types/extraction';

// 需要增强的阙值配置
const ENHANCEMENT_CONFIG = {
    minActions: 1,      // 至少要有1个动作
    minProps: 0,        // 道具不做强制要求
    checkDescriptionLen: 10 // 描述过短可能需要增强
};

/**
 * 评估分镜质量，决定是否需要 AI 增强
 */
export function evaluatePanelQuality(panel: StoryboardPanel): { needsEnhancement: boolean; reason: string } {
    const reasons: string[] = [];

    // 1. 检查动作描述
    if ((!panel.characterActions || panel.characterActions.length === 0) &&
        panel.description.length > 20 &&
        !panel.dialogue) {
        // 有较长描述但无动作提取，且不是纯对话
        reasons.push('动作缺失');
    }

    // 2. 检查画面细节 (使用 any 访问可能缺失的 atmosphere)
    const atmosphere = (panel as any).atmosphere || '';
    if ((!panel.lighting?.mood || panel.lighting.mood === '自然光影') &&
        ['TENSE', 'HORROR', 'MYSTERY'].some(m => atmosphere.toUpperCase().includes(m))) {
        reasons.push('氛围光影缺失');
    }

    // 3. 检查构图
    if ((!panel.composition || panel.composition === '三分法构图') &&
        ['IMPORTANT', 'KEY'].some(k => (panel.shotIntent || '').toUpperCase().includes(k))) {
        reasons.push('关键镜头构图平庸');
    }

    // 4. 检查描述长度
    if (panel.description.length < ENHANCEMENT_CONFIG.checkDescriptionLen && !panel.dialogue) {
        reasons.push('描述过短');
    }

    if (reasons.length > 0) {
        return { needsEnhancement: true, reason: reasons.join(',') };
    }

    return { needsEnhancement: false, reason: '' };
}

/**
 * 批量增强分镜
 */
export async function enhancePanelsWithHybridAI(
    panels: StoryboardPanel[],
    onProgress?: ProgressCallback
): Promise<StoryboardPanel[]> {
    // 1. 筛选需要增强的分镜
    const candidates = panels.map((p, index) => ({ panel: p, index, ...evaluatePanelQuality(p) }))
        .filter(c => c.needsEnhancement);

    if (candidates.length === 0) {
        devLog('[Hybrid] 没有发现需要增强的分镜');
        return panels;
    }

    devLog(`[Hybrid] 发现 ${candidates.length} 个分镜需要增强`, candidates.map(c => `#${c.panel.panelNumber}: ${c.reason}`));

    onProgress?.(createProgress('processing', 0, candidates.length, `正在进行混合智能增强 (${candidates.length}个)...`));

    // 2. 构建 Prompt
    // 为避免 Token 过多，分批处理，每批 5 个
    const BATCH_SIZE = 5;
    const enhancedPanels = [...panels];

    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);
        const batchPrompt = batch.map((c) => `
分镜ID: ${c.index}
当前描述: ${c.panel.description}
缺失内容: ${c.reason}
`).join('\n---\n');

        const prompt = `你是资深分镜师。请根据缺失内容提示，补充以下分镜的细节。
返回纯 JSON 数组，格式：[{"index": 原索引, "characterActions": ["动作1"], "lighting": {"mood": "光影氛围", "keyLight": "主光"}, "composition": "构图", "description": "优化后的通过描述"}]

待补充分镜：
${batchPrompt}`;

        try {
            const result = await callDeepSeek([{ role: 'user', content: prompt }], 0.5, 4096);
            const enhancements = parseJSON(result);

            if (Array.isArray(enhancements)) {
                enhancements.forEach((e: any) => {
                    const originalIndex = e.index;
                    if (originalIndex !== undefined && enhancedPanels[originalIndex]) {
                        const target = enhancedPanels[originalIndex];

                        // 合并属性
                        if (e.characterActions && Array.isArray(e.characterActions)) {
                            target.characterActions = [...(target.characterActions || []), ...e.characterActions];
                        }
                        if (e.lighting) {
                            target.lighting = { ...target.lighting, ...e.lighting };
                        }
                        if (e.composition) {
                            target.composition = e.composition;
                        }
                        if (e.description && e.description.length > target.description.length) {
                            // 如果 AI 扩展了描述，追加详细信息
                            // 只有当 AI 描述明显更丰富时才替换或追加
                            target.description = e.description;
                        }

                        devLog(`[Hybrid] 增强了分镜 #${target.panelNumber}: ${JSON.stringify(e)}`);
                    }
                });
            }
        } catch (err) {
            console.error('[Hybrid] 增强批次失败:', err);
        }

        onProgress?.(createProgress('processing', Math.min(i + BATCH_SIZE, candidates.length), candidates.length, '正在应用智能细节...'));
    }

    return enhancedPanels;
}
