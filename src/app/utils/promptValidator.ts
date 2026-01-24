/**
 * 提示词验证器
 * 检查分镜提示词的完整性、准确性和质量
 */

import type { StoryboardPanel, Character, Scene } from '../types';

export interface PromptValidationResult {
    valid: boolean;
    score: number; // 0-100
    issues: ValidationIssue[];
    suggestions: string[];
}

export interface ValidationIssue {
    type: 'missing' | 'incomplete' | 'toolong' | 'inconsistent';
    severity: 'error' | 'warning' | 'info';
    message: string;
    field?: string;
}

/**
 * 验证单个分镜的提示词质量
 */
export function validatePrompt(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[]
): PromptValidationResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. 检查绘画提示词
    if (!panel.aiPrompt || panel.aiPrompt.trim() === '') {
        issues.push({
            type: 'missing',
            severity: 'error',
            message: '缺少绘画提示词',
            field: 'aiPrompt'
        });
        suggestions.push('点击"刷新提示词"按钮生成提示词');
        score -= 30;
    } else {
        // 检查长度
        const length = panel.aiPrompt.length;
        if (length < 40) {
            issues.push({
                type: 'incomplete',
                severity: 'warning',
                message: `提示词过短（${length}字）`,
                field: 'aiPrompt'
            });
            suggestions.push('添加更多场景、氛围和细节描述');
            score -= 15;
        } else if (length > 300) {
            issues.push({
                type: 'toolong',
                severity: 'warning',
                message: `提示词过长（${length}字）`,
                field: 'aiPrompt'
            });
            suggestions.push('精简次要信息，保留核心描述');
            score -= 10;
        }

        // 检查角色信息
        if (panel.characters && panel.characters.length > 0) {
            const prompt = panel.aiPrompt.toLowerCase();
            const missingChars = panel.characters.filter(
                name => !prompt.includes(name.toLowerCase())
            );
            if (missingChars.length > 0) {
                issues.push({
                    type: 'incomplete',
                    severity: 'warning',
                    message: `缺少角色: ${missingChars.join('、')}`,
                    field: 'aiPrompt'
                });
                suggestions.push('在提示词中添加角色名称和触发词');
                score -= 10;
            }
        }

        // 检查景别信息
        if (panel.shot && !panel.aiPrompt.includes(panel.shot)) {
            issues.push({
                type: 'incomplete',
                severity: 'info',
                message: '提示词中缺少景别信息',
                field: 'aiPrompt'
            });
            suggestions.push(`添加景别描述: ${panel.shot}`);
            score -= 5;
        }

        // 检查场景信息
        const scene = scenes.find(s => s.id === panel.sceneId);
        if (scene && scene.location) {
            const prompt = panel.aiPrompt.toLowerCase();
            if (!prompt.includes(scene.location.toLowerCase())) {
                issues.push({
                    type: 'incomplete',
                    severity: 'info',
                    message: '提示词中缺少场景地点',
                    field: 'aiPrompt'
                });
                suggestions.push(`添加场景地点: ${scene.location}`);
                score -= 5;
            }
        }
    }

    // 2. 检查视频提示词
    if (!panel.aiVideoPrompt || panel.aiVideoPrompt.trim() === '') {
        if ((panel.duration || 0) >= 3) {
            issues.push({
                type: 'missing',
                severity: 'warning',
                message: '缺少视频提示词',
                field: 'aiVideoPrompt'
            });
            suggestions.push('为视频生成添加视频提示词');
            score -= 10;
        }
    }

    // 3. 检查关键字段
    const requiredFields: Array<{ field: keyof StoryboardPanel; name: string }> = [
        { field: 'description', name: '画面描述' },
        { field: 'shot', name: '景别' },
        { field: 'angle', name: '角度' },
        { field: 'duration', name: '时长' }
    ];

    requiredFields.forEach(({ field, name }) => {
        const value = panel[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            issues.push({
                type: 'missing',
                severity: 'error',
                message: `缺少${name}`,
                field: field as string
            });
            score -= 15;
        }
    });

    // 4. 检查视频必需字段
    if ((panel.duration || 0) >= 3) {
        if (!panel.startFrame || panel.startFrame.trim() === '') {
            issues.push({
                type: 'missing',
                severity: 'warning',
                message: '缺少起始帧描述',
                field: 'startFrame'
            });
            suggestions.push('添加起始帧画面描述');
            score -= 5;
        }
        if (!panel.endFrame || panel.endFrame.trim() === '') {
            issues.push({
                type: 'missing',
                severity: 'warning',
                message: '缺少结束帧描述',
                field: 'endFrame'
            });
            suggestions.push('添加结束帧画面描述');
            score -= 5;
        }
    }

    // 5. 检查角色动作
    if (panel.characters && panel.characters.length > 0 && (panel.duration || 0) >= 3) {
        if (!panel.characterActions || panel.characterActions.length === 0) {
            issues.push({
                type: 'incomplete',
                severity: 'info',
                message: '缺少角色动作描述',
                field: 'characterActions'
            });
            suggestions.push('添加角色的具体动作');
            score -= 3;
        }
    }

    // 6. 检查环境动态
    if ((panel.duration || 0) >= 3) {
        if (!panel.environmentMotion || panel.environmentMotion.trim() === '') {
            issues.push({
                type: 'incomplete',
                severity: 'info',
                message: '缺少环境动态描述',
                field: 'environmentMotion'
            });
            suggestions.push('添加环境的动态变化（如：风吹树叶）');
            score -= 3;
        }
    }

    return {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        score: Math.max(0, score),
        issues,
        suggestions
    };
}

/**
 * 批量验证所有分镜
 */
export function validateAllPanels(
    panels: StoryboardPanel[],
    characters: Character[],
    scenes: Scene[]
): {
    totalScore: number;
    validCount: number;
    invalidCount: number;
    results: Map<string, PromptValidationResult>;
    summary: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
        topIssues: ValidationIssue[];
    };
} {
    const results = new Map<string, PromptValidationResult>();
    let totalScore = 0;
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    const allIssues: ValidationIssue[] = [];

    panels.forEach(panel => {
        const result = validatePrompt(panel, characters, scenes);
        results.set(panel.id, result);
        totalScore += result.score;
        if (result.valid) validCount++;

        result.issues.forEach(issue => {
            if (issue.severity === 'error') errorCount++;
            else if (issue.severity === 'warning') warningCount++;
            else infoCount++;
            allIssues.push(issue);
        });
    });

    // 获取最严重的问题
    const topIssues = allIssues
        .sort((a, b) => {
            const severityOrder = { error: 3, warning: 2, info: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        })
        .slice(0, 5);

    return {
        totalScore: panels.length > 0 ? Math.round(totalScore / panels.length) : 0,
        validCount,
        invalidCount: panels.length - validCount,
        results,
        summary: {
            errorCount,
            warningCount,
            infoCount,
            topIssues
        }
    };
}

/**
 * 获取验证报告摘要
 */
export function getValidationSummary(
    validationResult: ReturnType<typeof validateAllPanels>
): string {
    const { totalScore, validCount, invalidCount, summary } = validationResult;
    
    let report = `提示词质量评分: ${totalScore}/100\n`;
    report += `有效分镜: ${validCount}, 需要优化: ${invalidCount}\n`;
    report += `问题统计: 错误 ${summary.errorCount}, 警告 ${summary.warningCount}, 提示 ${summary.infoCount}\n`;
    
    if (summary.topIssues.length > 0) {
        report += `\n主要问题:\n`;
        summary.topIssues.forEach((issue, index) => {
            report += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}\n`;
        });
    }
    
    return report;
}
