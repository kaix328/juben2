/**
 * 多语言提示词导出器
 * 支持导出为 Midjourney、ComfyUI、Runway、Pika 等格式
 */

import type { StoryboardPanel, Character, Scene, DirectorStyle } from '../types';

export type PromptExportFormat = 'midjourney' | 'comfyui' | 'runway' | 'pika' | 'generic';

interface PromptExportOptions {
    format: PromptExportFormat;
    panels: StoryboardPanel[];
    characters: Character[];
    scenes: Scene[];
    directorStyle?: DirectorStyle;
    includeNegative: boolean;
}

interface ExportedPrompt {
    panelNumber: number;
    imagePrompt: string;
    videoPrompt?: string;
    negativePrompt?: string;
}

/**
 * 导出提示词为指定格式
 */
export function exportPrompts(options: PromptExportOptions): ExportedPrompt[] {
    const { format, panels, characters, scenes, directorStyle, includeNegative } = options;

    return panels.map(panel => {
        const basePrompt = buildBasePrompt(panel, characters, scenes, directorStyle);

        switch (format) {
            case 'midjourney':
                return formatMidjourney(panel, basePrompt, directorStyle, includeNegative);
            case 'comfyui':
                return formatComfyUI(panel, basePrompt, directorStyle, includeNegative);
            case 'runway':
                return formatRunway(panel, basePrompt, directorStyle);
            case 'pika':
                return formatPika(panel, basePrompt, directorStyle);
            default:
                return formatGeneric(panel, basePrompt, directorStyle, includeNegative);
        }
    });
}

/**
 * 构建基础提示词
 */
function buildBasePrompt(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle
): string {
    const parts: string[] = [];

    // 景别
    if (panel.shot) {
        parts.push(translateShot(panel.shot));
    }

    // 角度
    if (panel.angle) {
        parts.push(translateAngle(panel.angle));
    }

    // 场景描述
    if (panel.description) {
        parts.push(panel.description);
    }

    // 角色
    if (panel.characters && panel.characters.length > 0) {
        const charDescs = panel.characters.map(name => {
            const char = characters.find(c => c.name === name);
            if (char?.triggerWord) {
                return `${char.triggerWord} ${name}`;
            }
            if (char?.appearance) {
                return `${name}, ${char.appearance}`;
            }
            return name;
        });
        parts.push(charDescs.join(', '));
    }

    // 场景
    const scene = scenes.find(s => s.id === panel.sceneId);
    if (scene) {
        if (scene.location) parts.push(scene.location);
        if (scene.environment) parts.push(scene.environment);
    }

    // 导演风格
    if (directorStyle) {
        if (directorStyle.artStyle) parts.push(`${directorStyle.artStyle} style`);
        if (directorStyle.colorTone) parts.push(directorStyle.colorTone);
        if (directorStyle.lightingStyle) parts.push(`${directorStyle.lightingStyle} lighting`);
        if (directorStyle.mood) parts.push(`${directorStyle.mood} mood`);
        if (directorStyle.customPrompt) parts.push(directorStyle.customPrompt);
    }

    return parts.filter(p => p).join(', ');
}

/**
 * Midjourney 格式
 */
function formatMidjourney(
    panel: StoryboardPanel,
    basePrompt: string,
    directorStyle?: DirectorStyle,
    includeNegative: boolean = true
): ExportedPrompt {
    let imagePrompt = basePrompt;

    // 添加质量标签
    imagePrompt += ', high quality, detailed, professional';

    // 画面比例
    const aspectRatio = directorStyle?.aspectRatio || '16:9';
    imagePrompt += ` --ar ${aspectRatio}`;

    // 风格参数
    imagePrompt += ' --style raw --v 6.1';

    // 负面提示词
    let negativePrompt: string | undefined;
    if (includeNegative) {
        negativePrompt = directorStyle?.negativePrompt ||
            'deformed, distorted, bad anatomy, extra fingers, missing limbs, blurry, lowres, watermark, text';
        imagePrompt += ` --no ${negativePrompt}`;
    }

    return {
        panelNumber: panel.panelNumber,
        imagePrompt,
        negativePrompt
    };
}

/**
 * ComfyUI JSON 格式
 */
function formatComfyUI(
    panel: StoryboardPanel,
    basePrompt: string,
    directorStyle?: DirectorStyle,
    includeNegative: boolean = true
): ExportedPrompt {
    const positivePrompt = `${basePrompt}, masterpiece, best quality, highly detailed`;

    const negativePrompt = includeNegative
        ? (directorStyle?.negativePrompt ||
            'worst quality, low quality, normal quality, lowres, blurry, text, watermark, deformed, bad anatomy')
        : undefined;

    // ComfyUI 格式的 JSON 风格输出
    const imagePrompt = JSON.stringify({
        positive: positivePrompt,
        negative: negativePrompt || '',
        width: getResolution(directorStyle?.aspectRatio).width,
        height: getResolution(directorStyle?.aspectRatio).height,
        steps: 30,
        cfg_scale: 7.5,
        sampler: 'euler_ancestral'
    }, null, 2);

    return {
        panelNumber: panel.panelNumber,
        imagePrompt,
        negativePrompt
    };
}

/**
 * Runway 格式（视频优先）
 */
function formatRunway(
    panel: StoryboardPanel,
    basePrompt: string,
    directorStyle?: DirectorStyle
): ExportedPrompt {
    const videoParts: string[] = [basePrompt];

    // 运动描述
    if (panel.cameraMovement) {
        videoParts.push(`camera ${translateMovement(panel.cameraMovement)}`);
    }

    // 时长
    if (panel.duration) {
        videoParts.push(`${panel.duration} seconds`);
    }

    // 起止帧
    if (panel.startFrame && panel.endFrame) {
        videoParts.push(`from "${panel.startFrame}" to "${panel.endFrame}"`);
    }

    const videoPrompt = videoParts.join(', ');
    const imagePrompt = `${basePrompt}, cinematic still, high quality`;

    return {
        panelNumber: panel.panelNumber,
        imagePrompt,
        videoPrompt
    };
}

/**
 * Pika 格式（视频优先）
 */
function formatPika(
    panel: StoryboardPanel,
    basePrompt: string,
    directorStyle?: DirectorStyle
): ExportedPrompt {
    const videoParts: string[] = [basePrompt];

    // 运动
    if (panel.cameraMovement) {
        videoParts.push(translateMovement(panel.cameraMovement));
    }

    // 速度
    if (panel.motionSpeed) {
        const speedMap: Record<string, string> = {
            'slow': 'slow motion',
            'normal': 'normal speed',
            'fast': 'fast motion',
            'timelapse': 'timelapse'
        };
        videoParts.push(speedMap[panel.motionSpeed] || '');
    }

    const videoPrompt = videoParts.filter(p => p).join(', ') + ', smooth motion, cinematic';
    const imagePrompt = `${basePrompt}, detailed, professional photography`;

    return {
        panelNumber: panel.panelNumber,
        imagePrompt,
        videoPrompt
    };
}

/**
 * 通用格式
 */
function formatGeneric(
    panel: StoryboardPanel,
    basePrompt: string,
    directorStyle?: DirectorStyle,
    includeNegative: boolean = true
): ExportedPrompt {
    const imagePrompt = `${basePrompt}, high quality, detailed`;
    const negativePrompt = includeNegative
        ? (directorStyle?.negativePrompt || 'low quality, blurry, deformed')
        : undefined;

    return {
        panelNumber: panel.panelNumber,
        imagePrompt,
        negativePrompt
    };
}

// 翻译函数
function translateShot(shot: string): string {
    const map: Record<string, string> = {
        '特写': 'close-up shot',
        '中景': 'medium shot',
        '远景': 'wide shot',
        '大特写': 'extreme close-up',
        '全景': 'full shot',
        '过肩': 'over-the-shoulder shot',
        '主观': 'POV shot'
    };
    return map[shot] || shot;
}

function translateAngle(angle: string): string {
    const map: Record<string, string> = {
        '平视': 'eye level',
        '俯视': 'high angle',
        '仰视': 'low angle',
        '侧面': 'side view',
        '鸟瞰': "bird's eye view"
    };
    return map[angle] || angle;
}

function translateMovement(movement: string): string {
    const map: Record<string, string> = {
        '静止': 'static',
        '推': 'dolly in',
        '拉': 'dolly out',
        '摇': 'pan',
        '移': 'tracking',
        '跟': 'follow',
        '升降': 'crane',
        '环绕': 'orbit'
    };
    return map[movement] || movement;
}

function getResolution(aspectRatio?: string): { width: number; height: number } {
    const resolutions: Record<string, { width: number; height: number }> = {
        '16:9': { width: 1920, height: 1080 },
        '4:3': { width: 1440, height: 1080 },
        '1:1': { width: 1080, height: 1080 },
        '9:16': { width: 1080, height: 1920 },
        '21:9': { width: 2560, height: 1080 }
    };
    return resolutions[aspectRatio || '16:9'] || resolutions['16:9'];
}

/**
 * 导出为文本文件
 */
export function exportPromptsToText(
    options: PromptExportOptions,
    projectName: string
): string {
    const prompts = exportPrompts(options);
    const lines: string[] = [];

    lines.push(`# ${projectName} - 提示词导出`);
    lines.push(`# 格式: ${options.format.toUpperCase()}`);
    lines.push(`# 导出时间: ${new Date().toLocaleString()}`);
    lines.push(`# 共 ${prompts.length} 个分镜`);
    lines.push('');

    if (options.includeNegative && prompts[0]?.negativePrompt) {
        lines.push('## 通用负面提示词');
        lines.push(prompts[0].negativePrompt);
        lines.push('');
    }

    lines.push('## 分镜提示词');
    prompts.forEach(p => {
        lines.push(`### 分镜 ${p.panelNumber}`);
        lines.push('**图像提示词:**');
        lines.push(p.imagePrompt);
        if (p.videoPrompt) {
            lines.push('');
            lines.push('**视频提示词:**');
            lines.push(p.videoPrompt);
        }
        lines.push('---');
    });

    return lines.join('\n');
}

/**
 * 下载提示词文件
 */
export function downloadPrompts(
    options: PromptExportOptions,
    projectName: string
): void {
    const content = options.format === 'comfyui'
        ? JSON.stringify(exportPrompts(options), null, 2)
        : exportPromptsToText(options, projectName);

    const extension = options.format === 'comfyui' ? 'json' : 'txt';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_prompts_${options.format}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
