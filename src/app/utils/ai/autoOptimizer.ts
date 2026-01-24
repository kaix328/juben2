/**
 * AI自动优化模块
 * 根据质量检查问题自动修复分镜
 */
import type { StoryboardPanel } from '../../types';
import type { QualityIssue, IssueType } from './qualityChecker';

/**
 * 优化结果
 */
export interface OptimizationResult {
    success: boolean;
    panelId: string;
    panelNumber: number;
    issueType: IssueType;
    changes: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    message: string;
}

/**
 * 优化连贯性问题
 */
function optimizeContinuityIssue(
    panel: StoryboardPanel,
    issue: QualityIssue,
    allPanels: StoryboardPanel[]
): Partial<StoryboardPanel> | null {
    const changes: Partial<StoryboardPanel> = {};

    // 处理连续相同景别
    if (issue.message.includes('连续') && issue.message.includes('相同景别')) {
        const panelIndex = allPanels.findIndex(p => p.id === panel.id);
        if (panelIndex > 0) {
            const prevPanel = allPanels[panelIndex - 1];
            
            // 根据前一个分镜的景别，选择不同的景别
            const shotSequence = ['大远景', '远景', '全景', '中景', '近景', '特写', '大特写'];
            const currentIndex = shotSequence.indexOf(panel.shot);
            const prevIndex = shotSequence.indexOf(prevPanel.shot);
            
            if (currentIndex === prevIndex && currentIndex > 0) {
                // 选择相邻的不同景别
                const newShot = currentIndex < shotSequence.length - 1 
                    ? shotSequence[currentIndex + 1] 
                    : shotSequence[currentIndex - 1];
                changes.shot = newShot;
            }
        }
    }

    // 处理景别跳跃过大
    if (issue.message.includes('景别跳跃过大')) {
        const panelIndex = allPanels.findIndex(p => p.id === panel.id);
        if (panelIndex > 0) {
            const prevPanel = allPanels[panelIndex - 1];
            const shotSequence = ['大远景', '远景', '全景', '中景', '近景', '特写', '大特写'];
            const currentIndex = shotSequence.indexOf(panel.shot);
            const prevIndex = shotSequence.indexOf(prevPanel.shot);
            
            // 选择中间的景别
            const middleIndex = Math.floor((currentIndex + prevIndex) / 2);
            if (middleIndex !== currentIndex && middleIndex !== prevIndex) {
                changes.shot = shotSequence[middleIndex];
            }
        }
    }

    return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * 优化时长问题
 */
function optimizeDurationIssue(
    panel: StoryboardPanel,
    issue: QualityIssue
): Partial<StoryboardPanel> | null {
    const changes: Partial<StoryboardPanel> = {};

    // 处理时长过短
    if (issue.message.includes('时长过短')) {
        changes.duration = 3; // 设置为3秒
    }

    // 处理时长过长
    if (issue.message.includes('时长过长')) {
        changes.duration = 8; // 设置为8秒
    }

    // 处理对话时长不匹配
    if (issue.message.includes('对话时长不足')) {
        if (panel.dialogue) {
            // 根据对话长度计算合适的时长（每秒20字）
            const estimatedDuration = Math.ceil(panel.dialogue.length / 20);
            changes.duration = Math.max(3, Math.min(15, estimatedDuration));
        }
    }

    return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * 优化角色问题
 */
function optimizeCharacterIssue(
    panel: StoryboardPanel,
    issue: QualityIssue,
    allPanels: StoryboardPanel[]
): Partial<StoryboardPanel> | null {
    const changes: Partial<StoryboardPanel> = {};

    // 处理有对话但无角色
    if (issue.message.includes('有对话但没有角色')) {
        // 尝试从前一个分镜获取角色
        const panelIndex = allPanels.findIndex(p => p.id === panel.id);
        if (panelIndex > 0) {
            const prevPanel = allPanels[panelIndex - 1];
            if (prevPanel.characters && prevPanel.characters.length > 0) {
                changes.characters = [...prevPanel.characters];
            }
        }
    }

    // 处理角色突然消失
    if (issue.message.includes('突然消失')) {
        // 从消息中提取角色名
        const match = issue.message.match(/角色 "(.+?)" 突然消失/);
        if (match) {
            const characterName = match[1];
            const currentCharacters = panel.characters || [];
            if (!currentCharacters.includes(characterName)) {
                changes.characters = [...currentCharacters, characterName];
            }
        }
    }

    return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * 优化镜头问题
 */
function optimizeShotIssue(
    panel: StoryboardPanel,
    issue: QualityIssue
): Partial<StoryboardPanel> | null {
    const changes: Partial<StoryboardPanel> = {};

    // 处理缺少画面描述
    if (issue.message.includes('缺少画面描述')) {
        // 生成基础描述
        const characters = panel.characters?.join('、') || '角色';
        const shot = panel.shot || '镜头';
        changes.description = `${shot}：${characters}在场景中`;
    }

    // 处理缺少景别
    if (issue.message.includes('缺少景别')) {
        changes.shot = '中景'; // 默认使用中景
    }

    // 处理缺少建立镜头
    if (issue.message.includes('缺少建立镜头')) {
        changes.shot = '全景';
        changes.notes = (panel.notes || '') + ' [建立镜头]';
    }

    return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * 优化对话问题
 */
function optimizeDialogueIssue(
    panel: StoryboardPanel,
    issue: QualityIssue
): Partial<StoryboardPanel> | null {
    const changes: Partial<StoryboardPanel> = {};

    // 处理对话过长
    if (issue.message.includes('对话过长')) {
        if (panel.dialogue && panel.dialogue.length > 200) {
            // 截断对话并添加省略号
            changes.dialogue = panel.dialogue.substring(0, 200) + '...';
            changes.notes = (panel.notes || '') + ' [对话已截断，建议拆分分镜]';
        }
    }

    // 处理缺少标点符号
    if (issue.message.includes('缺少标点符号')) {
        if (panel.dialogue && !panel.dialogue.match(/[。！？!?…]/)) {
            changes.dialogue = panel.dialogue + '。';
        }
    }

    return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * 优化逻辑问题
 */
function optimizeLogicIssue(
    panel: StoryboardPanel,
    issue: QualityIssue,
    allPanels: StoryboardPanel[]
): Partial<StoryboardPanel> | null {
    const changes: Partial<StoryboardPanel> = {};

    // 处理分镜编号不连续
    if (issue.message.includes('编号不连续')) {
        const panelIndex = allPanels.findIndex(p => p.id === panel.id);
        changes.panelNumber = panelIndex + 1;
    }

    // ID重复问题需要在外部处理，这里不做修改

    return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * 自动优化单个问题
 */
export function optimizeIssue(
    issue: QualityIssue,
    panels: StoryboardPanel[]
): OptimizationResult {
    const panel = panels.find(p => p.id === issue.panelId);
    
    if (!panel) {
        return {
            success: false,
            panelId: issue.panelId,
            panelNumber: issue.panelNumber,
            issueType: issue.type,
            changes: [],
            message: '未找到对应的分镜'
        };
    }

    let optimizations: Partial<StoryboardPanel> | null = null;

    // 根据问题类型选择优化策略
    switch (issue.type) {
        case 'continuity':
            optimizations = optimizeContinuityIssue(panel, issue, panels);
            break;
        case 'duration':
            optimizations = optimizeDurationIssue(panel, issue);
            break;
        case 'character':
            optimizations = optimizeCharacterIssue(panel, issue, panels);
            break;
        case 'shot':
            optimizations = optimizeShotIssue(panel, issue);
            break;
        case 'dialogue':
            optimizations = optimizeDialogueIssue(panel, issue);
            break;
        case 'logic':
            optimizations = optimizeLogicIssue(panel, issue, panels);
            break;
    }

    if (!optimizations) {
        return {
            success: false,
            panelId: panel.id,
            panelNumber: panel.panelNumber,
            issueType: issue.type,
            changes: [],
            message: '该问题暂不支持自动优化，请手动修复'
        };
    }

    // 记录变更
    const changes = Object.entries(optimizations).map(([field, newValue]) => ({
        field,
        oldValue: (panel as any)[field],
        newValue
    }));

    return {
        success: true,
        panelId: panel.id,
        panelNumber: panel.panelNumber,
        issueType: issue.type,
        changes,
        message: '优化成功'
    };
}

/**
 * 批量优化问题
 */
export function optimizeIssues(
    issues: QualityIssue[],
    panels: StoryboardPanel[]
): {
    results: OptimizationResult[];
    optimizedPanels: StoryboardPanel[];
    summary: {
        total: number;
        success: number;
        failed: number;
    };
} {
    const results: OptimizationResult[] = [];
    const panelMap = new Map(panels.map(p => [p.id, { ...p }]));

    // 对每个问题进行优化
    issues.forEach(issue => {
        const result = optimizeIssue(issue, Array.from(panelMap.values()));
        results.push(result);

        // 如果优化成功，应用变更
        if (result.success) {
            const panel = panelMap.get(result.panelId);
            if (panel) {
                result.changes.forEach(change => {
                    (panel as any)[change.field] = change.newValue;
                });
            }
        }
    });

    const summary = {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
    };

    return {
        results,
        optimizedPanels: Array.from(panelMap.values()),
        summary
    };
}

/**
 * 获取可优化的问题列表
 */
export function getOptimizableIssues(issues: QualityIssue[]): QualityIssue[] {
    // 过滤出可以自动优化的问题
    return issues.filter(issue => {
        // ID重复问题需要手动处理
        if (issue.message.includes('ID 重复')) {
            return false;
        }
        
        // 其他大部分问题都可以尝试自动优化
        return true;
    });
}

/**
 * 预览优化效果
 */
export function previewOptimization(
    issue: QualityIssue,
    panels: StoryboardPanel[]
): {
    canOptimize: boolean;
    preview: string;
    changes: { field: string; oldValue: any; newValue: any }[];
} {
    const result = optimizeIssue(issue, panels);
    
    if (!result.success) {
        return {
            canOptimize: false,
            preview: result.message,
            changes: []
        };
    }

    const changeDescriptions = result.changes.map(change => {
        return `${change.field}: ${change.oldValue} → ${change.newValue}`;
    });

    return {
        canOptimize: true,
        preview: changeDescriptions.join('\n'),
        changes: result.changes
    };
}
