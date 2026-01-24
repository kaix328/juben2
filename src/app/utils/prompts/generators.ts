import type { DirectorStyle, Character, Scene, StoryboardPanel } from '../../types';
import { PromptEngine } from '../promptEngine';
import { DEFAULT_NEGATIVE_PROMPT } from './director-style-presets';


/**
 * 生成角色AI提示词
 */
export function generateCharacterPrompt(
    character: Character,
    directorStyle?: DirectorStyle
): string {
    const parts: string[] = [];

    // 基础描述
    if (character.name) {
        parts.push(character.name);
    }

    if (character.appearance) {
        parts.push(character.appearance);
    }

    // 🆕 详细属性（如有）
    const charAny = character as any;
    if (charAny.age) parts.push(`${charAny.age}岁`);
    if (charAny.gender) parts.push(charAny.gender);
    if (charAny.height) parts.push(`身高${charAny.height}`);
    if (charAny.bodyType) parts.push(charAny.bodyType);
    if (charAny.hairStyle) parts.push(charAny.hairStyle);
    if (charAny.hairColor) parts.push(`${charAny.hairColor}发色`);
    if (charAny.eyeColor) parts.push(`${charAny.eyeColor}眼睛`);
    if (charAny.clothing) parts.push(charAny.clothing);
    if (charAny.accessories) parts.push(charAny.accessories);

    // 🆕 中文化性格描述
    if (character.personality) {
        parts.push(`性格特征：${character.personality}`);
    }

    // 应用导演风格（🆕 中文化）
    if (directorStyle) {
        if (directorStyle.artStyle) {
            parts.push(`${directorStyle.artStyle}风格`);
        }
        if (directorStyle.colorTone) {
            parts.push(`色调：${directorStyle.colorTone}`);
        }
        if (directorStyle.lightingStyle) {
            parts.push(`光影：${directorStyle.lightingStyle}`);
        }
        if (directorStyle.customPrompt) {
            parts.push(directorStyle.customPrompt);
        }
    }

    // 添加质量标签（🆕 中文化）
    parts.push('高品质', '精细刻画', '专业插画');

    return parts.filter(p => p).join(', ');
}

/**
 * 生成场景AI提示词
 */
export function generateScenePrompt(
    scene: Scene,
    directorStyle?: DirectorStyle
): string {
    const parts: string[] = [];

    // 基础描述
    if (scene.location) {
        parts.push(scene.location);
    }

    if (scene.environment) {
        parts.push(scene.environment);
    }

    if (scene.description) {
        parts.push(scene.description);
    }

    // 🆕 天气和季节（如有）
    const sceneAny = scene as any;
    if (sceneAny.weather) {
        const weatherMap: Record<string, string> = {
            '晴': '晴空万里', '阴': '阴云密布', '雨': '细雨绵绵',
            '雪': '白雪皑皑', '雾': '雾气弥漫', '风': '狂风呼啸'
        };
        parts.push(weatherMap[sceneAny.weather] || sceneAny.weather);
    }
    if (sceneAny.season) {
        const seasonMap: Record<string, string> = {
            '春': '春暖花开', '夏': '炎炎夏日', '秋': '金秋时节', '冬': '寒冬腊月'
        };
        parts.push(seasonMap[sceneAny.season] || sceneAny.season);
    }

    // 应用导演风格（🆕 中文化）
    if (directorStyle) {
        if (directorStyle.artStyle) {
            parts.push(`${directorStyle.artStyle}风格`);
        }
        if (directorStyle.colorTone) {
            parts.push(directorStyle.colorTone);
        }
        if (directorStyle.lightingStyle) {
            parts.push(directorStyle.lightingStyle);
        }
        if (directorStyle.mood) {
            parts.push(`${directorStyle.mood}氛围`);
        }
        if (directorStyle.customPrompt) {
            parts.push(directorStyle.customPrompt);
        }
    }

    // 添加质量标签（🆕 中文化）
    parts.push('电影感', '精细环境', '高品质');

    return parts.filter(p => p).join(', ');
}

/**
 * 生成分镜AI绘画提示词（专业增强版 v3）
 * 优化结构：镜头语言 > 角色触发词 > 主体内容 > 导演风格 > 质量标签
 */

/**
 * 生成分镜AI绘画提示词（专业增强版 v3）
 * ⚠️ 已重构：底层调用统一的 PromptEngine
 */
export function generateStoryboardImagePrompt(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle
): string {
    // 实例化引擎
    const engine = new PromptEngine(directorStyle, {
        useProfessionalSkills: true,
        qualityTags: 'professional',
        includeNegative: true, // 让引擎生成负面提示词
        outputLanguage: 'zh' // 🆕 强制输出中文
    });

    // 生成高级提示词
    const advancedPrompt = engine.forStoryboardImage(panel, characters, scenes);

    // 拼接最终结果 (保持兼容性格式)
    let result = advancedPrompt.positive;

    // 画面比例
    const aspectRatio = directorStyle?.aspectRatio || '16:9';
    result += ` --ar ${aspectRatio}`;

    // 负面提示词
    if (advancedPrompt.negative) {
        result += ` --neg ${advancedPrompt.negative}`;
    }

    return result;
}

/**
 * 视频生成平台类型
 */
export type VideoPlatform = 'generic' | 'runway' | 'pika' | 'kling' | 'comfyui';

/**
 * 生成分镜AI视频提示词（专业增强版 - 支持多平台 + 上下文感知）
 * ⚠️ 已重构：底层调用统一的 PromptEngine
 */
export function generateStoryboardVideoPrompt(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle,
    platform: VideoPlatform | any = 'generic',
    prevPanel?: StoryboardPanel
): string {
    // 兼容旧调用方式
    const actualPrevPanel = typeof platform === 'object' ? platform : prevPanel;
    const actualPlatform = typeof platform === 'string' ? platform : 'generic';

    // 实例化引擎
    const engine = new PromptEngine(directorStyle, {
        useProfessionalSkills: true,
        targetPlatform: actualPlatform,
        includeNegative: true,
        // 🆕 智能语言选择：可灵/通用使用中文，海外模型使用英文
        outputLanguage: (actualPlatform === 'kling' || actualPlatform === 'generic' || actualPlatform === 'doubao') ? 'zh' : 'en'
    });

    // 生成高级提示词
    const advancedPrompt = engine.forStoryboardVideo(panel, characters, scenes, actualPrevPanel);

    // 格式化输出 (使用 PromptEngine 的静态辅助或者 formatting 逻辑)
    const rawResult = advancedPrompt.positive;
    let finalResult = PromptEngine.formatForPlatform(rawResult, actualPlatform);

    // 负面提示词处理
    if (advancedPrompt.negative) {
        if (actualPlatform === 'comfyui') {
            finalResult += `, negative_prompt: "${advancedPrompt.negative}"`;
        } else {
            // 其他平台通常不支持 --neg，但在通用模式下保留
            if (actualPlatform === 'generic' || actualPlatform === 'kling') {
                // 可灵不支持 --neg 吗? 保持原有逻辑，原有逻辑对于 kling 只是 #xxx。
                // 原有逻辑 line 775: else { result += ` --neg ...` }
                // 除非 formatForPlatform 已经处理了。
                // PromptEngine.formatForPlatform 对于 kling 只是加tag。没有加 negative。
                // 所以这里加上。
                finalResult += ` --neg ${advancedPrompt.negative}`;
            }
        }
    }

    return finalResult;
}

/**
 * 🆕 生成负面提示词
 */
export function generateNegativePrompt(
    directorStyle?: DirectorStyle
): string {
    if (directorStyle?.negativePrompt) {
        return directorStyle.negativePrompt;
    }
    return DEFAULT_NEGATIVE_PROMPT;
}

/**
 * 🆕 生成角色定义词（用于导出）
 */
export function generateCharacterDefinition(character: Character): string {
    const parts: string[] = [];

    // 触发词
    if (character.triggerWord) {
        parts.push(`[Trigger Word] ${character.triggerWord}`);
    }

    // 名字
    parts.push(`[Name] ${character.name}`);

    // 标准化外貌
    if (character.standardAppearance) {
        parts.push(`[Appearance] ${character.standardAppearance}`);
    } else if (character.appearance) {
        parts.push(`[Appearance] ${character.appearance}`);
    }

    // 性格（可选）
    if (character.personality) {
        parts.push(`[Personality] ${character.personality}`);
    }

    return parts.join('\n');
}

/**
 * 🆕 批量导出所有角色定义词
 */
export function exportAllCharacterDefinitions(characters: Character[]): string {
    return characters.map(char => {
        return `=== ${char.name} ===\n${generateCharacterDefinition(char)}`;
    }).join('\n\n');
}

/**
 * 🆕 导出目标平台类型
 */
export type ExportPlatform = 'generic' | 'midjourney' | 'comfyui' | 'runway' | 'pika';

/**
 * 🆕 平台特定参数
 */
const PLATFORM_PARAMS: Record<ExportPlatform, { suffix: string; format: string }> = {
    generic: { suffix: '', format: 'standard' },
    midjourney: { suffix: ' --ar 16:9 --style raw --v 6.1', format: 'midjourney' },
    comfyui: { suffix: '', format: 'comfyui_json' },
    runway: { suffix: ', high quality video, smooth motion', format: 'runway' },
    pika: { suffix: ', cinematic, detailed motion', format: 'pika' }
};

/**
 * 🆕 生成分镜提示词包（单个分镜）
 */
export function generatePanelPromptPack(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle,
    platform: ExportPlatform = 'generic'
): {
    imagePrompt: string;
    videoPrompt: string;
    negativePrompt: string;
    characterRefs: string[];
    metadata: {
        panelNumber: number;
        duration: number;
        transition: string;
        platform: string;
    };
} {
    const platformConfig = PLATFORM_PARAMS[platform];

    // 生成提示词
    let imagePrompt = generateStoryboardImagePrompt(panel, characters, scenes, directorStyle);
    let videoPrompt = generateStoryboardVideoPrompt(panel, characters, scenes, directorStyle, platform);

    // 添加平台特定参数
    if (platform === 'midjourney') {
        imagePrompt += platformConfig.suffix;
    } else if (platform === 'runway' || platform === 'pika') {
        videoPrompt += platformConfig.suffix;
    }

    // 收集相关角色定义
    const charRefs = (panel.characters || [])
        .map(name => characters.find(c => c.name === name))
        .filter((c): c is Character => c !== undefined)
        .map(c => generateCharacterDefinition(c));

    return {
        imagePrompt,
        videoPrompt,
        negativePrompt: generateNegativePrompt(directorStyle),
        characterRefs: charRefs,
        metadata: {
            panelNumber: panel.panelNumber,
            duration: panel.duration || 3,
            transition: panel.transition || '切至',
            platform: platform
        }
    };
}

/**
 * 🆕 批量导出所有分镜提示词包
 */
export function exportAllPanelPrompts(
    panels: StoryboardPanel[],
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle,
    platform: ExportPlatform = 'generic'
): string {
    const output: string[] = [];

    // 添加头部信息
    output.push(`# 分镜提示词导出`);
    output.push(`# 平台: ${platform}`);
    output.push(`# 导出时间: ${new Date().toISOString()}`);
    output.push(`# 总分镜数: ${panels.length}`);
    output.push('');

    // 导出负面提示词（通用）
    output.push('## 负面提示词 (Negative Prompt)');
    output.push(generateNegativePrompt(directorStyle));
    output.push('');

    // 导出角色定义
    output.push('## 角色定义 (Character Definitions)');
    output.push(exportAllCharacterDefinitions(characters));
    output.push('');

    // 导出每个分镜
    output.push('## 分镜提示词');
    panels.forEach((panel, index) => {
        const pack = generatePanelPromptPack(panel, characters, scenes, directorStyle, platform);

        output.push(`\n### 分镜 ${index + 1} (${pack.metadata.duration}秒)`);
        output.push(`**AI绘画提示词:**`);
        output.push(pack.imagePrompt);
        output.push('');
        output.push(`**AI视频提示词:**`);
        output.push(pack.videoPrompt);
        output.push('');
        if (pack.metadata.transition !== '切至') {
            output.push(`**转场:** ${pack.metadata.transition}`);
        }
        output.push('---');
    });

    return output.join('\n');
}
