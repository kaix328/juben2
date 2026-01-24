/**
 * 提示词优化器
 * - 压缩过长提示词
 * - 按优先级保留关键信息
 * - 平台适配
 * - 语言转换
 */

import type { StoryboardPanel, Character, Scene, DirectorStyle } from '../types';

/**
 * 提示词优化配置
 */
export interface OptimizeConfig {
    maxLength?: number;        // 最大长度
    platform?: 'generic' | 'kling' | 'runway' | 'pika' | 'midjourney' | 'doubao';
    language?: 'zh' | 'en' | 'mixed';
    prioritizeCharacters?: boolean;  // 优先保留角色信息
    prioritizeScene?: boolean;       // 优先保留场景信息
    removeQualityTags?: boolean;     // 移除质量标签以节省空间
}

/**
 * 优化单个提示词
 */
export function optimizePrompt(
    prompt: string,
    panel: StoryboardPanel,
    config: OptimizeConfig = {}
): string {
    const {
        maxLength = 200,
        platform = 'generic',
        language = 'mixed',
        prioritizeCharacters = true,
        prioritizeScene = true,
        removeQualityTags = false
    } = config;

    if (!prompt || prompt.trim() === '') {
        return prompt;
    }

    // 1. 分割提示词
    const parts = prompt.split(/[,，]/).map(p => p.trim()).filter(p => p);

    // 2. 移除质量标签（如果需要）
    let filteredParts = parts;
    if (removeQualityTags) {
        const qualityKeywords = ['高质量', '8k', '4k', 'high quality', 'masterpiece', 'best quality', 
                                 'ultra detailed', 'professional', 'cinematic', '专业', '精细'];
        filteredParts = parts.filter(part => {
            const lower = part.toLowerCase();
            return !qualityKeywords.some(keyword => lower.includes(keyword.toLowerCase()));
        });
    }

    // 3. 按优先级排序
    const prioritized = prioritizeParts(filteredParts, panel, {
        prioritizeCharacters,
        prioritizeScene
    });

    // 4. 截取到目标长度
    let optimized = '';
    for (const part of prioritized) {
        const separator = language === 'zh' ? '，' : ', ';
        const newLength = optimized.length + part.length + separator.length;
        if (newLength > maxLength) break;
        optimized += (optimized ? separator : '') + part;
    }

    // 5. 平台适配
    optimized = adaptForPlatform(optimized, platform);

    // 6. 语言适配
    if (language === 'zh') {
        optimized = convertToChineseOnly(optimized);
    } else if (language === 'en') {
        optimized = convertToEnglishOnly(optimized);
    }

    return optimized;
}

/**
 * 按优先级排序提示词部分
 */
function prioritizeParts(
    parts: string[],
    panel: StoryboardPanel,
    options: { prioritizeCharacters: boolean; prioritizeScene: boolean }
): string[] {
    const scored = parts.map(part => {
        let score = 0;
        const lower = part.toLowerCase();

        // 角色相关（最高优先级）
        if (options.prioritizeCharacters && panel.characters) {
            panel.characters.forEach(char => {
                if (lower.includes(char.toLowerCase())) {
                    score += 100;
                }
            });
            if (lower.includes('char_')) score += 90; // 触发词
        }

        // 场景相关
        if (options.prioritizeScene) {
            if (lower.includes('场景') || lower.includes('环境') || lower.includes('scene')) score += 80;
            if (lower.includes('办公室') || lower.includes('街道') || lower.includes('室内') || lower.includes('室外')) score += 75;
        }

        // 景别和角度（重要）
        if (panel.shot && lower.includes(panel.shot.toLowerCase())) score += 70;
        if (lower.includes('景') || lower.includes('shot')) score += 65;
        if (panel.angle && lower.includes(panel.angle.toLowerCase())) score += 60;
        if (lower.includes('视') || lower.includes('angle')) score += 55;

        // 时间和天气
        if (lower.includes('白天') || lower.includes('夜晚') || lower.includes('黄昏') || 
            lower.includes('day') || lower.includes('night')) score += 50;
        if (lower.includes('晴') || lower.includes('雨') || lower.includes('雪') || 
            lower.includes('sunny') || lower.includes('rain')) score += 45;

        // 动作和情绪
        if (lower.includes('动作') || lower.includes('表情') || lower.includes('action') || lower.includes('emotion')) score += 40;
        if (lower.includes('氛围') || lower.includes('情绪') || lower.includes('mood') || lower.includes('atmosphere')) score += 35;

        // 技术参数
        if (lower.includes('mm') || lower.includes('f/')) score += 30;
        if (lower.includes('镜头') || lower.includes('lens')) score += 25;

        // 风格和质量标签（最低优先级）
        if (lower.includes('风格') || lower.includes('style')) score += 20;
        if (lower.includes('质量') || lower.includes('quality')) score += 10;
        if (lower.includes('8k') || lower.includes('4k') || lower.includes('高清')) score += 5;

        return { part, score };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .map(item => item.part);
}

/**
 * 平台适配
 */
function adaptForPlatform(prompt: string, platform: string): string {
    switch (platform) {
        case 'kling':
            // 可灵：简洁中文，添加标签
            return prompt + ' #视频生成 #电影感';
        
        case 'runway':
            // Runway：结构化英文，添加质量参数
            return prompt + ', cinematic video, 4K quality, smooth motion';
        
        case 'pika':
            // Pika：自然语言，添加运动描述
            return prompt + ', detailed motion, high quality';
        
        case 'midjourney':
            // Midjourney：添加参数
            return prompt + ' --ar 16:9 --style raw --v 6';
        
        case 'doubao':
            // 豆包：中文优化
            return prompt + '，高质量视频';
        
        default:
            return prompt;
    }
}

/**
 * 转换为纯中文
 */
function convertToChineseOnly(prompt: string): string {
    // 移除英文部分（保留触发词和技术参数）
    return prompt
        .split(/[,，]/)
        .map(p => p.trim())
        .filter(p => {
            // 保留触发词
            if (p.startsWith('char_')) return true;
            // 保留技术参数（如：50mm, f/2.8）
            if (/\d+mm|f\/\d/.test(p)) return true;
            // 保留中文部分
            return /[\u4e00-\u9fa5]/.test(p);
        })
        .join('，');
}

/**
 * 转换为纯英文
 */
function convertToEnglishOnly(prompt: string): string {
    // 移除中文部分（保留触发词）
    return prompt
        .split(/[,，]/)
        .map(p => p.trim())
        .filter(p => {
            // 保留触发词
            if (p.startsWith('char_')) return true;
            // 保留英文部分
            return /[a-zA-Z]/.test(p);
        })
        .join(', ');
}

/**
 * 批量优化所有分镜的提示词
 */
export function optimizeAllPrompts(
    panels: StoryboardPanel[],
    config: OptimizeConfig = {}
): StoryboardPanel[] {
    console.log(`[Prompt Optimizer] 开始优化 ${panels.length} 个分镜的提示词...`);
    
    let optimizedCount = 0;
    let totalSaved = 0;
    
    const optimizedPanels = panels.map(panel => {
        const originalImageLength = panel.aiPrompt?.length || 0;
        const originalVideoLength = panel.aiVideoPrompt?.length || 0;
        
        const optimizedImagePrompt = panel.aiPrompt 
            ? optimizePrompt(panel.aiPrompt, panel, config)
            : panel.aiPrompt;
        
        const optimizedVideoPrompt = panel.aiVideoPrompt
            ? optimizePrompt(panel.aiVideoPrompt, panel, { ...config, maxLength: 250 })
            : panel.aiVideoPrompt;
        
        const newImageLength = optimizedImagePrompt?.length || 0;
        const newVideoLength = optimizedVideoPrompt?.length || 0;
        
        const saved = (originalImageLength - newImageLength) + (originalVideoLength - newVideoLength);
        if (saved > 0) {
            optimizedCount++;
            totalSaved += saved;
        }
        
        return {
            ...panel,
            aiPrompt: optimizedImagePrompt,
            aiVideoPrompt: optimizedVideoPrompt
        };
    });
    
    console.log(`[Prompt Optimizer] 优化完成: ${optimizedCount}/${panels.length} 个分镜被优化`);
    console.log(`[Prompt Optimizer] 总共节省: ${totalSaved} 字符`);
    
    return optimizedPanels;
}

/**
 * 智能优化：根据提示词长度自动决定是否需要优化
 */
export function smartOptimize(
    panels: StoryboardPanel[],
    config: OptimizeConfig = {}
): StoryboardPanel[] {
    const needsOptimization = panels.filter(panel => {
        const imageLength = panel.aiPrompt?.length || 0;
        const videoLength = panel.aiVideoPrompt?.length || 0;
        return imageLength > 250 || videoLength > 300;
    });
    
    if (needsOptimization.length === 0) {
        console.log('[Prompt Optimizer] 所有提示词长度合适，无需优化');
        return panels;
    }
    
    console.log(`[Prompt Optimizer] 发现 ${needsOptimization.length} 个分镜需要优化`);
    return optimizeAllPrompts(panels, config);
}

/**
 * 获取优化统计
 */
export function getOptimizationStats(
    originalPanels: StoryboardPanel[],
    optimizedPanels: StoryboardPanel[]
): {
    totalOriginalLength: number;
    totalOptimizedLength: number;
    savedCharacters: number;
    savedPercentage: number;
    optimizedCount: number;
} {
    let totalOriginalLength = 0;
    let totalOptimizedLength = 0;
    let optimizedCount = 0;
    
    originalPanels.forEach((panel, index) => {
        const originalLength = (panel.aiPrompt?.length || 0) + (panel.aiVideoPrompt?.length || 0);
        const optimizedLength = (optimizedPanels[index].aiPrompt?.length || 0) + 
                                (optimizedPanels[index].aiVideoPrompt?.length || 0);
        
        totalOriginalLength += originalLength;
        totalOptimizedLength += optimizedLength;
        
        if (optimizedLength < originalLength) {
            optimizedCount++;
        }
    });
    
    const savedCharacters = totalOriginalLength - totalOptimizedLength;
    const savedPercentage = totalOriginalLength > 0 
        ? Math.round((savedCharacters / totalOriginalLength) * 100)
        : 0;
    
    return {
        totalOriginalLength,
        totalOptimizedLength,
        savedCharacters,
        savedPercentage,
        optimizedCount
    };
}
