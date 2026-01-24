/**
 * 平台特定优化规则
 * 针对不同 AI 平台的提示词格式和参数优化
 */

// ============ Midjourney 优化 ============

export const MIDJOURNEY_OPTIMIZATION = {
  version: 'v6.1',
  defaultParams: {
    aspectRatio: '16:9',
    style: 'raw',
    quality: '2',
    chaos: '0',
  },
  rules: {
    // 提示词规则
    maxLength: 4000,
    preferEnglish: true,
    useCommas: true,
    avoidNegativeWords: false, // v6+ 支持 --no
    
    // 权重语法
    weightSyntax: '::',
    weightRange: [0.5, 2],
    
    // 参数格式
    paramPrefix: '--',
    
    // 推荐结构
    structure: [
      'subject',
      'action/pose',
      'environment/background',
      'lighting',
      'style',
      'quality tags',
      'parameters',
    ],
  },
  qualityTags: [
    'professional photography',
    'high detail',
    'sharp focus',
    '8k resolution',
    'award winning',
  ],
  styleModifiers: {
    cinematic: 'cinematic lighting, film grain, anamorphic lens',
    realistic: 'photorealistic, ultra detailed, natural lighting',
    artistic: 'artistic, creative, unique perspective',
    dramatic: 'dramatic lighting, high contrast, moody atmosphere',
  },
  formatPrompt: (prompt: string, params?: Record<string, any>): string => {
    let formatted = prompt;
    
    // 添加参数
    if (params?.aspectRatio) {
      formatted += ` --ar ${params.aspectRatio}`;
    }
    if (params?.style) {
      formatted += ` --style ${params.style}`;
    }
    formatted += ` --v ${params?.version || '6.1'}`;
    
    // 负面提示词
    if (params?.negativePrompt) {
      formatted += ` --no ${params.negativePrompt}`;
    }
    
    return formatted;
  },
};

// ============ Stable Diffusion 优化 ============

export const STABLE_DIFFUSION_OPTIMIZATION = {
  models: {
    sdxl: 'Stable Diffusion XL',
    sd15: 'Stable Diffusion 1.5',
    sd21: 'Stable Diffusion 2.1',
  },
  defaultParams: {
    steps: 30,
    cfgScale: 7.5,
    sampler: 'DPM++ 2M Karras',
    width: 1024,
    height: 1024,
  },
  rules: {
    // 提示词规则
    maxLength: 75, // 每个 token 限制
    useParentheses: true, // (word) 增加权重
    useBrackets: true, // [word] 减少权重
    
    // 权重语法
    weightSyntax: '(word:1.2)',
    weightRange: [0.5, 1.5],
    
    // 推荐结构
    structure: [
      'main subject',
      'details',
      'environment',
      'lighting',
      'style',
      'quality tags',
    ],
  },
  qualityTags: {
    positive: [
      'masterpiece',
      'best quality',
      'ultra detailed',
      'high resolution',
      '8k',
      'professional',
    ],
    negative: [
      'worst quality',
      'low quality',
      'normal quality',
      'lowres',
      'bad anatomy',
      'bad hands',
      'text',
      'error',
      'missing fingers',
      'extra digit',
      'fewer digits',
      'cropped',
      'worst quality',
      'jpeg artifacts',
      'signature',
      'watermark',
      'username',
      'blurry',
    ],
  },
  embeddings: {
    negative: ['EasyNegative', 'bad-hands-5', 'ng_deepnegative_v1_75t'],
  },
  formatPrompt: (prompt: string, params?: Record<string, any>): string => {
    let formatted = prompt;
    
    // 添加质量标签
    if (params?.addQuality !== false) {
      formatted = STABLE_DIFFUSION_OPTIMIZATION.qualityTags.positive.join(', ') + ', ' + formatted;
    }
    
    // 添加 embeddings
    if (params?.useEmbeddings) {
      formatted += ', ' + STABLE_DIFFUSION_OPTIMIZATION.embeddings.negative.join(', ');
    }
    
    return formatted;
  },
};

// ============ Runway 优化 ============

export const RUNWAY_OPTIMIZATION = {
  models: {
    gen3: 'Gen-3 Alpha',
    gen2: 'Gen-2',
  },
  defaultParams: {
    duration: 5,
    fps: 24,
    resolution: '1280x768',
  },
  rules: {
    // 提示词规则
    maxLength: 500,
    preferNaturalLanguage: true,
    describeMotion: true,
    
    // 推荐结构
    structure: [
      'scene description',
      'camera movement',
      'subject action',
      'lighting',
      'style',
      'duration',
    ],
  },
  cameraKeywords: [
    'camera:',
    'dolly in',
    'dolly out',
    'pan left',
    'pan right',
    'tilt up',
    'tilt down',
    'orbit',
    'static',
  ],
  motionKeywords: [
    'motion:',
    'slow',
    'fast',
    'smooth',
    'dynamic',
  ],
  formatPrompt: (prompt: string, params?: Record<string, any>): string => {
    let formatted = prompt;
    
    // 添加相机运动
    if (params?.cameraMovement) {
      formatted = `camera: ${params.cameraMovement}, ` + formatted;
    }
    
    // 添加运动描述
    if (params?.motion) {
      formatted += `, motion: ${params.motion}`;
    }
    
    // 添加时长
    if (params?.duration) {
      formatted += `, duration: ${params.duration}s`;
    }
    
    return formatted;
  },
};

// ============ Pika 优化 ============

export const PIKA_OPTIMIZATION = {
  defaultParams: {
    duration: 3,
    fps: 24,
    motion: 1, // 0-4
  },
  rules: {
    // 提示词规则
    maxLength: 400,
    preferSimple: true,
    focusOnAction: true,
    
    // 推荐结构
    structure: ['subject', 'action', 'environment', 'style'],
  },
  motionLevels: {
    0: 'no motion, static',
    1: 'subtle motion, gentle',
    2: 'moderate motion, natural',
    3: 'dynamic motion, energetic',
    4: 'extreme motion, chaotic',
  },
  formatPrompt: (prompt: string, params?: Record<string, any>): string => {
    let formatted = prompt;
    
    // Pika 使用简单的自然语言
    // 添加运动描述
    if (params?.motion !== undefined) {
      const motionDesc = PIKA_OPTIMIZATION.motionLevels[params.motion as keyof typeof PIKA_OPTIMIZATION.motionLevels];
      formatted += `, ${motionDesc}`;
    }
    
    return formatted;
  },
};

// ============ Sora 优化 (OpenAI) ============

export const SORA_OPTIMIZATION = {
  defaultParams: {
    duration: 10,
    resolution: '1920x1080',
  },
  rules: {
    // 提示词规则
    maxLength: 1000,
    preferDetailedDescription: true,
    useCinematicLanguage: true,
    
    // 推荐结构
    structure: [
      'opening shot description',
      'camera movement',
      'subject action',
      'environment details',
      'lighting and atmosphere',
      'style and mood',
      'ending description',
    ],
  },
  cinematicPhrases: [
    'The camera',
    'slowly pushes in',
    'reveals',
    'follows',
    'captures',
    'frames',
    'Natural lighting',
    'Cinematic',
    'Film grain',
  ],
  formatPrompt: (prompt: string, params?: Record<string, any>): string => {
    let formatted = prompt;
    
    // Sora 喜欢详细的电影化描述
    if (!formatted.toLowerCase().includes('camera')) {
      formatted = 'The camera ' + formatted;
    }
    
    // 添加电影感描述
    if (params?.addCinematic !== false) {
      formatted += '. Natural lighting, cinematic composition, film grain texture.';
    }
    
    return formatted;
  },
};

// ============ Kling 优化 (快手) ============

export const KLING_OPTIMIZATION = {
  defaultParams: {
    duration: 5,
    resolution: '1280x720',
  },
  rules: {
    // 提示词规则
    maxLength: 500,
    supportChinese: true,
    preferChinese: true,
    
    // 推荐结构
    structure: ['主体描述', '动作描述', '环境描述', '风格描述'],
  },
  formatPrompt: (prompt: string, params?: Record<string, any>): string => {
    // Kling 支持中文，优先使用中文
    return prompt;
  },
};

// ============ nanobananaPro 优化 ============

export const NANOBANANA_PRO_OPTIMIZATION = {
  defaultParams: {
    quality: 'ultra',
    resolution: '2048x2048',
    steps: 40,
  },
  rules: {
    // 提示词规则
    maxLength: 2000,
    preferEnglish: true,
    detailedDescription: true,
    
    // 推荐结构
    structure: [
      'main subject',
      'detailed features',
      'environment',
      'lighting and atmosphere',
      'style and mood',
      'quality tags',
    ],
  },
  qualityTags: [
    'ultra high quality',
    'extremely detailed',
    'perfect composition',
    'studio lighting',
    'professional grade',
    '4K HDR',
    'sharp focus',
    'intricate details',
  ],
  formatPrompt: (prompt: string, params?: Record<string, any>): string => {
    let formatted = prompt;
    
    // 添加质量标签
    if (params?.addQuality !== false) {
      formatted += ', ' + NANOBANANA_PRO_OPTIMIZATION.qualityTags.slice(0, 4).join(', ');
    }
    
    return formatted;
  },
};

// ============ 辅助函数 ============

/**
 * 根据平台优化提示词
 */
export function optimizePromptForPlatform(
  prompt: string,
  platform: string,
  params?: Record<string, any>
): string {
  switch (platform.toLowerCase()) {
    case 'midjourney':
      return MIDJOURNEY_OPTIMIZATION.formatPrompt(prompt, params);
    case 'stable-diffusion':
    case 'sd':
      return STABLE_DIFFUSION_OPTIMIZATION.formatPrompt(prompt, params);
    case 'nanobanana-pro':
    case 'nanobananapro':
      return NANOBANANA_PRO_OPTIMIZATION.formatPrompt(prompt, params);
    case 'runway':
      return RUNWAY_OPTIMIZATION.formatPrompt(prompt, params);
    case 'pika':
      return PIKA_OPTIMIZATION.formatPrompt(prompt, params);
    case 'sora':
      return SORA_OPTIMIZATION.formatPrompt(prompt, params);
    case 'kling':
      return KLING_OPTIMIZATION.formatPrompt(prompt, params);
    default:
      return prompt;
  }
}

/**
 * 获取平台推荐参数
 */
export function getPlatformDefaultParams(platform: string): Record<string, any> {
  switch (platform.toLowerCase()) {
    case 'midjourney':
      return MIDJOURNEY_OPTIMIZATION.defaultParams;
    case 'stable-diffusion':
    case 'sd':
      return STABLE_DIFFUSION_OPTIMIZATION.defaultParams;
    case 'nanobanana-pro':
    case 'nanobananapro':
      return NANOBANANA_PRO_OPTIMIZATION.defaultParams;
    case 'runway':
      return RUNWAY_OPTIMIZATION.defaultParams;
    case 'pika':
      return PIKA_OPTIMIZATION.defaultParams;
    case 'sora':
      return SORA_OPTIMIZATION.defaultParams;
    case 'kling':
      return KLING_OPTIMIZATION.defaultParams;
    default:
      return {};
  }
}

/**
 * 检查提示词是否符合平台规则
 */
export function validatePromptForPlatform(prompt: string, platform: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let valid = true;

  switch (platform.toLowerCase()) {
    case 'midjourney':
      if (prompt.length > MIDJOURNEY_OPTIMIZATION.rules.maxLength) {
        warnings.push(`提示词过长，建议不超过 ${MIDJOURNEY_OPTIMIZATION.rules.maxLength} 字符`);
        valid = false;
      }
      break;
    case 'stable-diffusion':
      if (prompt.split(',').length > 75) {
        warnings.push('提示词标签过多，建议不超过 75 个');
      }
      break;
    case 'nanobanana-pro':
    case 'nanobananapro':
      if (prompt.length > NANOBANANA_PRO_OPTIMIZATION.rules.maxLength) {
        warnings.push(`提示词过长，建议不超过 ${NANOBANANA_PRO_OPTIMIZATION.rules.maxLength} 字符`);
      }
      break;
    case 'runway':
      if (prompt.length > RUNWAY_OPTIMIZATION.rules.maxLength) {
        warnings.push(`提示词过长，建议不超过 ${RUNWAY_OPTIMIZATION.rules.maxLength} 字符`);
      }
      if (!prompt.toLowerCase().includes('camera')) {
        warnings.push('建议添加相机运动描述');
      }
      break;
  }

  return { valid, warnings };
}

export default {
  MIDJOURNEY_OPTIMIZATION,
  STABLE_DIFFUSION_OPTIMIZATION,
  NANOBANANA_PRO_OPTIMIZATION,
  RUNWAY_OPTIMIZATION,
  PIKA_OPTIMIZATION,
  SORA_OPTIMIZATION,
  KLING_OPTIMIZATION,
  optimizePromptForPlatform,
  getPlatformDefaultParams,
  validatePromptForPlatform,
};
