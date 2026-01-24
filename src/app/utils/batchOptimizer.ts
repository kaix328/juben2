/**
 * 批量优化工具
 * 提供一站式的分镜批量优化功能
 */

import type { StoryboardPanel, Character, Scene, DirectorStyle } from '../types';
import { validateAllPanels, getValidationSummary } from './promptValidator';
import { optimizeAllPrompts, smartOptimize, getOptimizationStats, type OptimizeConfig } from './promptOptimizer';
import { batchGenerateFromTemplate, selectTemplateAuto } from './promptTemplates';
import { performQualityCheck } from './ai/qualityChecker';

/**
 * 批量优化配置
 */
export interface BatchOptimizeConfig {
    // 验证选项
    validate?: boolean;
    
    // 优化选项
    optimize?: boolean;
    optimizeConfig?: OptimizeConfig;
    
    // 模板选项
    useTemplate?: boolean;
    templateName?: string;
    
    // 质量检查选项
    qualityCheck?: boolean;
    
    // 自动修复选项
    autoFix?: boolean;
}

/**
 * 批量优化结果
 */
export interface BatchOptimizeResult {
    success: boolean;
    optimizedPanels: StoryboardPanel[];
    validation?: ReturnType<typeof validateAllPanels>;
    optimization?: ReturnType<typeof getOptimizationStats>;
    qualityReport?: ReturnType<typeof performQualityCheck>;
    summary: string;
    warnings: string[];
    errors: string[];
}

/**
 * 批量优化分镜
 */
export async function batchOptimizePanels(
    panels: StoryboardPanel[],
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle,
    config: BatchOptimizeConfig = {}
): Promise<BatchOptimizeResult> {
    const {
        validate = true,
        optimize = true,
        useTemplate = false,
        templateName,
        qualityCheck = true,
        autoFix = false
    } = config;
    
    console.log('[Batch Optimize] 开始批量优化...');
    console.log(`[Batch Optimize] 配置: 验证=${validate}, 优化=${optimize}, 模板=${useTemplate}, 质量检查=${qualityCheck}`);
    
    const warnings: string[] = [];
    const errors: string[] = [];
    let currentPanels = [...panels];
    
    // 1. 初始验证
    let validationResult;
    if (validate) {
        console.log('[Batch Optimize] 步骤 1/5: 初始验证...');
        validationResult = validateAllPanels(currentPanels, characters, scenes);
        console.log(`[Batch Optimize] 验证完成: 评分 ${validationResult.totalScore}/100`);
        
        if (validationResult.totalScore < 50) {
            warnings.push(`提示词质量较低（${validationResult.totalScore}/100），建议检查`);
        }
        
        if (validationResult.summary.errorCount > 0) {
            errors.push(`发现 ${validationResult.summary.errorCount} 个严重错误`);
        }
    }
    
    // 2. 使用模板重新生成（如果启用）
    if (useTemplate) {
        console.log('[Batch Optimize] 步骤 2/5: 使用模板重新生成提示词...');
        currentPanels = batchGenerateFromTemplate(currentPanels, characters, scenes, templateName);
        console.log('[Batch Optimize] 模板应用完成');
    } else {
        console.log('[Batch Optimize] 步骤 2/5: 跳过模板生成');
    }
    
    // 3. 优化提示词
    let optimizationStats;
    if (optimize) {
        console.log('[Batch Optimize] 步骤 3/5: 优化提示词...');
        const originalPanels = [...currentPanels];
        currentPanels = config.optimizeConfig 
            ? optimizeAllPrompts(currentPanels, config.optimizeConfig)
            : smartOptimize(currentPanels, config.optimizeConfig);
        
        optimizationStats = getOptimizationStats(originalPanels, currentPanels);
        console.log(`[Batch Optimize] 优化完成: 节省 ${optimizationStats.savedCharacters} 字符 (${optimizationStats.savedPercentage}%)`);
        
        if (optimizationStats.savedPercentage > 30) {
            warnings.push(`提示词被大幅压缩（${optimizationStats.savedPercentage}%），请检查是否保留了关键信息`);
        }
    } else {
        console.log('[Batch Optimize] 步骤 3/5: 跳过优化');
    }
    
    // 4. 自动修复（如果启用）
    if (autoFix && validationResult) {
        console.log('[Batch Optimize] 步骤 4/5: 自动修复问题...');
        currentPanels = autoFixIssues(currentPanels, validationResult, characters, scenes);
        console.log('[Batch Optimize] 自动修复完成');
    } else {
        console.log('[Batch Optimize] 步骤 4/5: 跳过自动修复');
    }
    
    // 5. 质量检查
    let qualityReport;
    if (qualityCheck) {
        console.log('[Batch Optimize] 步骤 5/5: 质量检查...');
        qualityReport = performQualityCheck(currentPanels);
        console.log(`[Batch Optimize] 质量检查完成: 评分 ${qualityReport.summary.qualityScore}/100`);
        
        if (qualityReport.summary.errorCount > 0) {
            errors.push(`质量检查发现 ${qualityReport.summary.errorCount} 个错误`);
        }
        
        if (qualityReport.summary.warningCount > 5) {
            warnings.push(`质量检查发现 ${qualityReport.summary.warningCount} 个警告`);
        }
    } else {
        console.log('[Batch Optimize] 步骤 5/5: 跳过质量检查');
    }
    
    // 生成摘要
    const summary = generateSummary(
        panels.length,
        validationResult,
        optimizationStats,
        qualityReport
    );
    
    console.log('[Batch Optimize] 批量优化完成');
    console.log(summary);
    
    return {
        success: errors.length === 0,
        optimizedPanels: currentPanels,
        validation: validationResult,
        optimization: optimizationStats,
        qualityReport,
        summary,
        warnings,
        errors
    };
}

/**
 * 自动修复常见问题
 */
function autoFixIssues(
    panels: StoryboardPanel[],
    validationResult: ReturnType<typeof validateAllPanels>,
    characters: Character[],
    scenes: Scene[]
): StoryboardPanel[] {
    console.log('[Auto Fix] 开始自动修复...');
    let fixedCount = 0;
    
    const fixedPanels = panels.map(panel => {
        const validation = validationResult.results.get(panel.id);
        if (!validation || validation.valid) return panel;
        
        const fixed = { ...panel };
        let panelFixed = false;
        
        validation.issues.forEach(issue => {
            switch (issue.field) {
                case 'description':
                    if (!fixed.description || fixed.description.trim() === '') {
                        fixed.description = `${fixed.shot || '中景'}，${panel.characters?.join('、') || '场景'}`;
                        panelFixed = true;
                    }
                    break;
                
                case 'shot':
                    if (!fixed.shot || fixed.shot.trim() === '') {
                        fixed.shot = '中景';
                        panelFixed = true;
                    }
                    break;
                
                case 'angle':
                    if (!fixed.angle || fixed.angle.trim() === '') {
                        fixed.angle = '平视';
                        panelFixed = true;
                    }
                    break;
                
                case 'duration':
                    if (!fixed.duration || fixed.duration <= 0) {
                        fixed.duration = 3;
                        panelFixed = true;
                    }
                    break;
                
                case 'startFrame':
                    if (!fixed.startFrame || fixed.startFrame.trim() === '') {
                        const chars = fixed.characters?.join('、') || '主体';
                        fixed.startFrame = `${chars}处于画面中心`;
                        panelFixed = true;
                    }
                    break;
                
                case 'endFrame':
                    if (!fixed.endFrame || fixed.endFrame.trim() === '') {
                        const chars = fixed.characters?.join('、') || '主体';
                        fixed.endFrame = `${chars}保持稳定`;
                        panelFixed = true;
                    }
                    break;
            }
        });
        
        if (panelFixed) {
            fixedCount++;
        }
        
        return fixed;
    });
    
    console.log(`[Auto Fix] 修复完成: ${fixedCount} 个分镜被修复`);
    return fixedPanels;
}

/**
 * 生成优化摘要
 */
function generateSummary(
    totalPanels: number,
    validation?: ReturnType<typeof validateAllPanels>,
    optimization?: ReturnType<typeof getOptimizationStats>,
    qualityReport?: ReturnType<typeof performQualityCheck>
): string {
    const lines: string[] = [];
    
    lines.push('=== 批量优化摘要 ===');
    lines.push(`总分镜数: ${totalPanels}`);
    lines.push('');
    
    if (validation) {
        lines.push('【提示词验证】');
        lines.push(`- 评分: ${validation.totalScore}/100`);
        lines.push(`- 有效: ${validation.validCount}, 需优化: ${validation.invalidCount}`);
        lines.push(`- 问题: 错误 ${validation.summary.errorCount}, 警告 ${validation.summary.warningCount}, 提示 ${validation.summary.infoCount}`);
        lines.push('');
    }
    
    if (optimization) {
        lines.push('【提示词优化】');
        lines.push(`- 优化数量: ${optimization.optimizedCount}/${totalPanels}`);
        lines.push(`- 原始长度: ${optimization.totalOriginalLength} 字符`);
        lines.push(`- 优化后: ${optimization.totalOptimizedLength} 字符`);
        lines.push(`- 节省: ${optimization.savedCharacters} 字符 (${optimization.savedPercentage}%)`);
        lines.push('');
    }
    
    if (qualityReport) {
        lines.push('【质量检查】');
        lines.push(`- 质量评分: ${qualityReport.summary.qualityScore}/100`);
        lines.push(`- 问题: 错误 ${qualityReport.summary.errorCount}, 警告 ${qualityReport.summary.warningCount}, 提示 ${qualityReport.summary.infoCount}`);
        lines.push('');
    }
    
    lines.push('===================');
    
    return lines.join('\n');
}

/**
 * 快速优化（使用默认配置）
 */
export async function quickOptimize(
    panels: StoryboardPanel[],
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle
): Promise<BatchOptimizeResult> {
    return batchOptimizePanels(panels, characters, scenes, directorStyle, {
        validate: true,
        optimize: true,
        qualityCheck: true,
        autoFix: true
    });
}

/**
 * 深度优化（包含模板重新生成）
 */
export async function deepOptimize(
    panels: StoryboardPanel[],
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle
): Promise<BatchOptimizeResult> {
    return batchOptimizePanels(panels, characters, scenes, directorStyle, {
        validate: true,
        optimize: true,
        useTemplate: true,
        qualityCheck: true,
        autoFix: true,
        optimizeConfig: {
            maxLength: 200,
            removeQualityTags: true
        }
    });
}

/**
 * 仅验证（不修改）
 */
export async function validateOnly(
    panels: StoryboardPanel[],
    characters: Character[],
    scenes: Scene[]
): Promise<BatchOptimizeResult> {
    return batchOptimizePanels(panels, characters, scenes, undefined, {
        validate: true,
        optimize: false,
        qualityCheck: true,
        autoFix: false
    });
}
