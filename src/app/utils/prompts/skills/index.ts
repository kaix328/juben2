/**
 * Prompt Engine Skills Library
 * 提供用于加强 AI 提示词生成的专业技能函数
 */

import type { DirectorStyle } from '../../../types';

// ============ 常量定义 ============

const NEGATIVE_PROMPTS_MAP = {
    general: 'low quality, worst quality, blurry, out of focus, bad art, ugly, watermark, signature, text',
    character: 'deformed, bad anatomy, disfigured, poorly drawn face, mutation, extra limbs, bad proportions, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers',
    scene: 'cluttered, messy, poor composition, bad perspective, distorted, unrealistic lighting',
    storyboard: 'inconsistent style, bad framing, poor cinematography, amateur',
    prop: 'broken, damaged, low detail, pixelated',
    costume: 'ill-fitting, unrealistic, bad texture'
};

const FOCAL_LENGTH_MAP: Record<string, string> = {
    'ECU': '100mm macro lens',
    'CU': '85mm portrait lens',
    'MCU': '50mm standard lens',
    'MS': '35mm wide lens',
    'WS': '24mm wide angle lens',
    'EWS': '16mm ultra wide lens',
    '特写': '85mm', '近景': '50mm', '中景': '35mm', '全景': '24mm', '远景': '16mm'
};

const LIGHTING_MOOD_MAP: Record<string, string> = {
    'happy': 'bright high-key lighting, soft shadows',
    'sad': 'muted lighting, low contrast, overcast',
    'horror': 'dramatic low-key lighting, harsh shadows, chiaroscuro',
    'action': 'dynamic lighting, high contrast',
    'romantic': 'warm soft lighting, golden hour, diffuse focus',
    'mystery': 'volumetric lighting, fog, silhouettes'
};

// ============ 导出函数 ============

/**
 * 根据景别获取推荐焦距
 */
export function getFocalLengthByShot(shot: string): string {
    return FOCAL_LENGTH_MAP[shot] || '50mm lens';
}

/**
 * 根据氛围获取灯光描述
 */
export function getLightingByMood(mood: string): string {
    // 简单查找，默认返回 cinematic
    for (const key in LIGHTING_MOOD_MAP) {
        if (mood.toLowerCase().includes(key)) return LIGHTING_MOOD_MAP[key];
    }
    return 'cinematic professional lighting';
}

/**
 * 根据时间获取色温描述
 */
export function getColorTemperatureByTime(time: string): string {
    if (time.includes('晚') || time.includes('夜')) return 'cool blue tones, 6500k';
    if (time.includes('晨') || time.includes('昏')) return 'warm golden tones, 3200k';
    if (time.includes('午')) return 'neutral daylight, 5500k';
    return 'neutral lighting';
}

/**
 * 生成专业的视频生成参数 (Runway/Pika/Kling)
 */
export function generateVideoParams(params: {
    movement?: string;
    speed?: string;
    duration?: number;
    mood?: string;
    platform?: string;
}): string[] {
    const result: string[] = [];
    const { movement, speed, platform } = params;

    // 平台特定优化
    if (platform === 'runway') {
        if (movement) result.push(`camera ${movement}`);
        if (speed === 'slow') result.push('slow motion');
        else if (speed === 'fast') result.push('fast motion');
        result.push('high temporal consistency');
        result.push('smooth motion');
    } else if (platform === 'pika') {
        if (movement) result.push(`-camera ${movement}`);
        if (speed) result.push(`-motion ${speed === 'slow' ? 1 : 2}`);
        result.push('-fps 24');
    } else {
        // 通用
        if (movement) result.push(movement);
        if (speed) result.push(`${speed} motion`);
    }

    return result;
}

/**
 * 生成电影感参数
 */
export function generateCinematicParams(style?: DirectorStyle): string[] {
    const params: string[] = [];
    if (!style) return ['cinematic footage', 'movie look'];

    if (style.lightingStyle) params.push(style.lightingStyle);
    if (style.colorTone) params.push(`${style.colorTone} color grading`);

    return params;
}

/**
 * 生成负面提示词
 */
export function generateNegativePrompt(options: {
    type?: keyof typeof NEGATIVE_PROMPTS_MAP;
    platform?: string;
    style?: string;
} = {}): string {
    const base = NEGATIVE_PROMPTS_MAP[options.type || 'general'];
    const common = 'nsfw, nudity, text, watermark, logo';

    if (options.platform === 'runway') {
        return `${base}, ${common}, static, frozen`;
    }

    return `${base}, ${common}`;
}
