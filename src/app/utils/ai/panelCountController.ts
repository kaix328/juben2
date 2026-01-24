/**
 * 分镜数量控制模块
 * 智能调整分镜数量到目标范围
 */
import type { StoryboardPanel, ScriptScene } from '../../types';
import { generateId } from '../storage';

/**
 * 分镜相似度评分（用于合并决策）
 */
function calculateSimilarity(panel1: StoryboardPanel, panel2: StoryboardPanel): number {
    let score = 0;

    // 相同景别 +30分
    if (panel1.shot === panel2.shot) score += 30;

    // 相同角度 +20分
    if (panel1.angle === panel2.angle) score += 20;

    // 相同场景 +20分
    if (panel1.sceneId === panel2.sceneId) score += 20;

    // 相同角色 +15分
    const chars1 = new Set(panel1.characters || []);
    const chars2 = new Set(panel2.characters || []);
    const commonChars = [...chars1].filter(c => chars2.has(c));
    if (commonChars.length > 0) score += 15;

    // 连续对话 +15分
    if (panel1.dialogue && panel2.dialogue && !panel1.dialogue.endsWith('。')) {
        score += 15;
    }

    return score;
}

/**
 * 判断分镜是否为关键分镜（不应被合并）
 */
function isKeyPanel(panel: StoryboardPanel, allPanels: StoryboardPanel[]): boolean {
    // 建立镜头（远景/全景）
    if (panel.shot === '远景' || panel.shot === '全景' || panel.shot === '大远景') {
        return true;
    }

    // 包含重要备注
    if (panel.notes?.includes('建立') || panel.notes?.includes('转场') || panel.notes?.includes('关键')) {
        return true;
    }

    // 情绪转折点（特写镜头）
    if (panel.shot === '特写' || panel.shot === '大特写') {
        return true;
    }

    // 场景的第一个分镜
    const sceneFirstPanel = allPanels.find(p => p.sceneId === panel.sceneId);
    if (sceneFirstPanel?.id === panel.id) {
        return true;
    }

    return false;
}

/**
 * 合并两个分镜
 */
function mergeTwoPanels(panel1: StoryboardPanel, panel2: StoryboardPanel): StoryboardPanel {
    return {
        ...panel1,
        description: `${panel1.description}；${panel2.description}`,
        dialogue: panel1.dialogue && panel2.dialogue
            ? `${panel1.dialogue} ${panel2.dialogue}`
            : panel1.dialogue || panel2.dialogue,
        duration: (panel1.duration || 0) + (panel2.duration || 0),
        characters: [...new Set([...(panel1.characters || []), ...(panel2.characters || [])])],
        props: [...new Set([...(panel1.props || []), ...(panel2.props || [])])],
        soundEffects: [...new Set([...(panel1.soundEffects || []), ...(panel2.soundEffects || [])])],
        characterActions: [...(panel1.characterActions || []), ...(panel2.characterActions || [])],
        notes: panel1.notes && panel2.notes
            ? `${panel1.notes}；${panel2.notes}`
            : panel1.notes || panel2.notes || '',
        // 保留第一个分镜的视觉参数
        shot: panel1.shot,
        angle: panel1.angle,
        cameraMovement: panel1.cameraMovement,
    };
}

/**
 * 智能合并分镜（优先合并相似镜头）
 */
export function mergePanels(panels: StoryboardPanel[], targetCount: number): StoryboardPanel[] {
    if (panels.length <= targetCount) return panels;

    const result = [...panels];
    const mergeCount = panels.length - targetCount;

    console.log(`[mergePanels] 需要合并 ${mergeCount} 个分镜（${panels.length} → ${targetCount}）`);

    for (let i = 0; i < mergeCount; i++) {
        // 找出最适合合并的分镜对
        let bestPairIndex = -1;
        let bestScore = -1;

        for (let j = 0; j < result.length - 1; j++) {
            const panel1 = result[j];
            const panel2 = result[j + 1];

            // 跳过关键分镜
            if (isKeyPanel(panel1, result) || isKeyPanel(panel2, result)) {
                continue;
            }

            const similarity = calculateSimilarity(panel1, panel2);
            if (similarity > bestScore) {
                bestScore = similarity;
                bestPairIndex = j;
            }
        }

        // 如果找不到合适的分镜对，合并最后两个非关键分镜
        if (bestPairIndex === -1) {
            for (let j = result.length - 2; j >= 0; j--) {
                if (!isKeyPanel(result[j], result) && !isKeyPanel(result[j + 1], result)) {
                    bestPairIndex = j;
                    break;
                }
            }
        }

        // 如果还是找不到，强制合并最后两个
        if (bestPairIndex === -1) {
            bestPairIndex = result.length - 2;
        }

        // 执行合并
        const merged = mergeTwoPanels(result[bestPairIndex], result[bestPairIndex + 1]);
        result.splice(bestPairIndex, 2, merged);

        console.log(`[mergePanels] 第 ${i + 1}/${mergeCount} 次合并，相似度: ${bestScore}`);
    }

    // 重新编号
    return result.map((panel, index) => ({
        ...panel,
        panelNumber: index + 1
    }));
}

/**
 * 判断分镜是否可拆分
 */
function isSplittable(panel: StoryboardPanel): boolean {
    // 长对话（超过50字）
    if (panel.dialogue && panel.dialogue.length > 50) {
        return true;
    }

    // 长描述（超过100字）
    if (panel.description && panel.description.length > 100) {
        return true;
    }

    // 长时长（超过6秒）
    if (panel.duration && panel.duration > 6) {
        return true;
    }

    // 多个角色动作
    if (panel.characterActions && panel.characterActions.length > 2) {
        return true;
    }

    return false;
}

/**
 * 拆分一个分镜为两个
 */
function splitOnePanel(panel: StoryboardPanel): StoryboardPanel[] {
    const duration1 = Math.ceil((panel.duration || 3) / 2);
    const duration2 = (panel.duration || 3) - duration1;

    // 如果有长对话，按句子拆分
    if (panel.dialogue && panel.dialogue.length > 50) {
        const sentences = panel.dialogue.match(/[^。！？!?]+[。！？!?]+/g) || [panel.dialogue];
        const mid = Math.ceil(sentences.length / 2);
        const dialogue1 = sentences.slice(0, mid).join('');
        const dialogue2 = sentences.slice(mid).join('');

        return [
            {
                ...panel,
                id: generateId(),
                dialogue: dialogue1,
                duration: duration1,
                notes: `${panel.notes || ''} [拆分1/2]`.trim()
            },
            {
                ...panel,
                id: generateId(),
                dialogue: dialogue2,
                duration: duration2,
                shot: panel.shot === '中景' ? '近景' : panel.shot, // 第二个镜头拉近
                notes: `${panel.notes || ''} [拆分2/2]`.trim()
            }
        ];
    }

    // 如果有长描述，按内容拆分
    if (panel.description && panel.description.length > 100) {
        const mid = Math.floor(panel.description.length / 2);
        const splitPoint = panel.description.indexOf('，', mid) ||
            panel.description.indexOf('。', mid) ||
            mid;

        const desc1 = panel.description.substring(0, splitPoint);
        const desc2 = panel.description.substring(splitPoint);

        return [
            {
                ...panel,
                id: generateId(),
                description: desc1,
                duration: duration1,
                notes: `${panel.notes || ''} [拆分1/2]`.trim()
            },
            {
                ...panel,
                id: generateId(),
                description: desc2,
                duration: duration2,
                cameraMovement: '推', // 第二个镜头推进
                notes: `${panel.notes || ''} [拆分2/2]`.trim()
            }
        ];
    }

    // 如果有多个角色动作，按动作拆分
    if (panel.characterActions && panel.characterActions.length > 2) {
        const mid = Math.ceil(panel.characterActions.length / 2);
        const actions1 = panel.characterActions.slice(0, mid);
        const actions2 = panel.characterActions.slice(mid);

        return [
            {
                ...panel,
                id: generateId(),
                characterActions: actions1,
                duration: duration1,
                notes: `${panel.notes || ''} [拆分1/2]`.trim()
            },
            {
                ...panel,
                id: generateId(),
                characterActions: actions2,
                duration: duration2,
                notes: `${panel.notes || ''} [拆分2/2]`.trim()
            }
        ];
    }

    // 默认拆分：简单复制并调整景别
    return [
        {
            ...panel,
            id: generateId(),
            description: panel.description || '画面描述待补充', // ⚠️ 确保描述不为空
            duration: duration1,
            notes: `${panel.notes || ''} [拆分1/2]`.trim()
        },
        {
            ...panel,
            id: generateId(),
            description: panel.description || '画面描述待补充', // ⚠️ 确保描述不为空
            duration: duration2,
            shot: panel.shot === '远景' ? '全景' :
                panel.shot === '全景' ? '中景' :
                    panel.shot === '中景' ? '近景' : '特写',
            notes: `${panel.notes || ''} [拆分2/2]`.trim()
        }
    ];
}

/**
 * 智能拆分分镜（优先拆分长镜头）
 */
export function splitPanels(panels: StoryboardPanel[], targetCount: number): StoryboardPanel[] {
    if (panels.length >= targetCount) return panels;

    const result = [...panels];
    const splitCount = targetCount - panels.length;

    console.log(`[splitPanels] 需要拆分 ${splitCount} 个分镜（${panels.length} → ${targetCount}）`);

    for (let i = 0; i < splitCount; i++) {
        // 找出最适合拆分的分镜
        let bestIndex = -1;
        let bestScore = -1;

        for (let j = 0; j < result.length; j++) {
            const panel = result[j];

            if (!isSplittable(panel)) continue;

            // 计算拆分优先级
            let score = 0;
            if (panel.dialogue && panel.dialogue.length > 50) score += panel.dialogue.length;
            if (panel.description && panel.description.length > 100) score += panel.description.length / 2;
            if (panel.duration && panel.duration > 6) score += panel.duration * 10;
            if (panel.characterActions && panel.characterActions.length > 2) score += panel.characterActions.length * 20;

            if (score > bestScore) {
                bestScore = score;
                bestIndex = j;
            }
        }

        // 如果找不到可拆分的分镜，拆分最长的分镜
        if (bestIndex === -1) {
            bestIndex = result.reduce((maxIdx, panel, idx, arr) =>
                (panel.duration || 0) > (arr[maxIdx].duration || 0) ? idx : maxIdx
                , 0);
        }

        // 执行拆分
        const splitResult = splitOnePanel(result[bestIndex]);
        result.splice(bestIndex, 1, ...splitResult);

        console.log(`[splitPanels] 第 ${i + 1}/${splitCount} 次拆分，优先级: ${bestScore}`);
    }

    // 重新编号
    return result.map((panel, index) => ({
        ...panel,
        panelNumber: index + 1
    }));
}

/**
 * 智能调整分镜数量到目标范围
 */
export function adjustPanelCount(
    panels: StoryboardPanel[],
    targetMin: number,
    targetMax: number
): StoryboardPanel[] {
    const current = panels.length;

    console.log(`[adjustPanelCount] 当前: ${current}, 目标: ${targetMin}-${targetMax}`);

    // 数量合适，直接返回
    if (current >= targetMin && current <= targetMax) {
        console.log(`[adjustPanelCount] 数量在目标范围内，无需调整`);
        return panels;
    }

    // 数量过多，智能合并
    if (current > targetMax) {
        console.log(`[adjustPanelCount] 数量过多，执行合并`);
        return mergePanels(panels, targetMax);
    }

    // 数量过少，智能拆分
    if (current < targetMin) {
        console.log(`[adjustPanelCount] 数量过少，执行拆分`);
        return splitPanels(panels, targetMin);
    }

    return panels;
}

/**
 * 计算目标数量范围（允许20%误差）
 */
export function calculateTargetRange(estimatedCount: number): { min: number; max: number } {
    const tolerance = 0.20; // 20% 误差
    const min = Math.floor(estimatedCount * (1 - tolerance));
    const max = Math.ceil(estimatedCount * (1 + tolerance));

    return { min, max };
}
