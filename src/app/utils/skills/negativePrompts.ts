/**
 * 负面提示词专业库
 * 用于提高生成质量，避免常见问题
 */

// ============ 通用负面提示词 ============

export const GENERAL_NEGATIVE = {
  quality: [
    'low quality',
    'worst quality',
    'normal quality',
    'lowres',
    'low resolution',
    'blurry',
    'out of focus',
    'soft focus',
    'bad art',
    'ugly',
    'amateur',
    'unprofessional',
  ],
  artifacts: [
    'watermark',
    'signature',
    'text',
    'logo',
    'username',
    'artist name',
    'copyright',
    'jpeg artifacts',
    'compression artifacts',
    'noise',
    'grain (if not wanted)',
  ],
  technical: [
    'overexposed',
    'underexposed',
    'bad lighting',
    'harsh shadows',
    'flat lighting',
    'poor composition',
    'bad framing',
    'cropped',
    'cut off',
  ],
};

// ============ 角色负面提示词 ============

export const CHARACTER_NEGATIVE = {
  anatomy: [
    'bad anatomy',
    'deformed',
    'disfigured',
    'mutation',
    'mutated',
    'poorly drawn face',
    'poorly drawn hands',
    'poorly drawn feet',
    'bad proportions',
    'gross proportions',
    'malformed limbs',
  ],
  limbs: [
    'extra limbs',
    'extra arms',
    'extra legs',
    'extra fingers',
    'extra hands',
    'missing limbs',
    'missing arms',
    'missing legs',
    'missing fingers',
    'fused fingers',
    'too many fingers',
    'long neck',
    'long body',
  ],
  face: [
    'bad face',
    'ugly face',
    'deformed face',
    'disfigured face',
    'poorly drawn eyes',
    'cross-eyed',
    'asymmetric eyes',
    'bad teeth',
    'missing teeth',
    'bad mouth',
    'bad nose',
    'bad ears',
  ],
  body: [
    'bad body',
    'deformed body',
    'twisted body',
    'contorted',
    'bad posture',
    'unnatural pose',
    'stiff pose',
  ],
  skin: [
    'bad skin',
    'skin blemishes',
    'skin spots',
    'acnes',
    'skin imperfections',
    'pale skin (if not wanted)',
  ],
};

// ============ 场景负面提示词 ============

export const SCENE_NEGATIVE = {
  composition: [
    'cluttered',
    'messy',
    'chaotic',
    'disorganized',
    'poor composition',
    'bad perspective',
    'distorted perspective',
    'unrealistic perspective',
    'flat',
    'boring',
  ],
  lighting: [
    'bad lighting',
    'unrealistic lighting',
    'harsh lighting',
    'flat lighting',
    'overlit',
    'underlit',
    'inconsistent lighting',
  ],
  environment: [
    'empty',
    'barren',
    'lifeless',
    'sterile',
    'artificial',
    'fake',
    'unrealistic',
    'low detail',
    'lack of detail',
  ],
  technical: [
    'tiling',
    'repetitive',
    'pattern artifacts',
    'seams',
    'visible edges',
  ],
};

// ============ 分镜负面提示词 ============

export const STORYBOARD_NEGATIVE = {
  cinematography: [
    'bad cinematography',
    'amateur cinematography',
    'poor framing',
    'bad composition',
    'inconsistent style',
    'mismatched lighting',
    'wrong aspect ratio',
  ],
  technical: [
    'motion blur (if not wanted)',
    'camera shake (if not wanted)',
    'rolling shutter',
    'lens distortion (if not wanted)',
    'chromatic aberration (if not wanted)',
  ],
  continuity: [
    'continuity error',
    'inconsistent',
    'mismatched',
    'different style',
    'style break',
  ],
};

// ============ 道具负面提示词 ============

export const PROP_NEGATIVE = {
  quality: [
    'broken',
    'damaged',
    'worn',
    'dirty (if not wanted)',
    'rusty (if not wanted)',
    'old (if not wanted)',
  ],
  technical: [
    'low detail',
    'pixelated',
    'low poly',
    'simple',
    'basic',
    'generic',
  ],
  presentation: [
    'bad angle',
    'poor lighting',
    'cluttered background',
    'distracting elements',
  ],
};

// ============ 服饰负面提示词 ============

export const COSTUME_NEGATIVE = {
  fit: [
    'ill-fitting',
    'too tight',
    'too loose',
    'wrinkled',
    'messy',
  ],
  quality: [
    'cheap',
    'low quality fabric',
    'bad texture',
    'unrealistic material',
    'plastic-looking',
  ],
  style: [
    'mismatched',
    'clashing colors',
    'unflattering',
    'outdated (if not wanted)',
  ],
};

// ============ 平台特定负面提示词 ============

export const PLATFORM_SPECIFIC_NEGATIVE = {
  midjourney: [
    // Midjourney 常见问题
    'multiple subjects (if not wanted)',
    'split image',
    'collage',
    'grid',
    'text',
    'words',
    'letters',
  ],
  stableDiffusion: [
    // Stable Diffusion 常见问题
    'duplicate',
    'morbid',
    'mutilated',
    'tranny',
    'trans',
    'trannsexual',
    'hermaphrodite',
    'out of frame',
    'extra fingers',
    'mutated hands',
    'poorly drawn hands',
    'poorly drawn face',
    'mutation',
    'deformed',
    'ugly',
    'blurry',
    'bad anatomy',
    'bad proportions',
    'extra limbs',
    'cloned face',
    'disfigured',
    'gross proportions',
    'malformed limbs',
    'missing arms',
    'missing legs',
    'extra arms',
    'extra legs',
    'fused fingers',
    'too many fingers',
    'long neck',
  ],
  runway: [
    // Runway 视频常见问题
    'flickering',
    'jittering',
    'unstable',
    'morphing (if not wanted)',
    'warping',
    'distortion',
  ],
  pika: [
    // Pika 视频常见问题
    'static',
    'frozen',
    'no movement',
    'stuttering',
    'frame drops',
  ],
};

// ============ 风格特定负面提示词 ============

export const STYLE_SPECIFIC_NEGATIVE = {
  realistic: [
    'cartoon',
    'anime',
    'illustration',
    'painting',
    'drawing',
    'sketch',
    '3d render',
    'cgi',
    'unrealistic',
    'stylized',
  ],
  anime: [
    'realistic',
    'photo',
    'photograph',
    '3d',
    'western',
    'ugly',
    'bad art',
  ],
  cinematic: [
    'amateur',
    'home video',
    'phone camera',
    'security camera',
    'webcam',
    'low budget',
  ],
  artistic: [
    'photorealistic',
    'realistic',
    'boring',
    'plain',
    'simple',
  ],
};

// ============ 辅助函数 ============

/**
 * 根据资源类型获取负面提示词
 */
export function getNegativePromptByType(
  type: 'character' | 'scene' | 'storyboard' | 'prop' | 'costume' | 'general'
): string {
  const negatives: string[] = [...GENERAL_NEGATIVE.quality, ...GENERAL_NEGATIVE.artifacts];

  switch (type) {
    case 'character':
      negatives.push(
        ...CHARACTER_NEGATIVE.anatomy,
        ...CHARACTER_NEGATIVE.limbs,
        ...CHARACTER_NEGATIVE.face
      );
      break;
    case 'scene':
      negatives.push(
        ...SCENE_NEGATIVE.composition,
        ...SCENE_NEGATIVE.lighting,
        ...SCENE_NEGATIVE.environment
      );
      break;
    case 'storyboard':
      negatives.push(
        ...STORYBOARD_NEGATIVE.cinematography,
        ...STORYBOARD_NEGATIVE.technical,
        ...CHARACTER_NEGATIVE.anatomy.slice(0, 5), // 部分角色问题
        ...SCENE_NEGATIVE.composition.slice(0, 3) // 部分场景问题
      );
      break;
    case 'prop':
      negatives.push(...PROP_NEGATIVE.quality, ...PROP_NEGATIVE.technical);
      break;
    case 'costume':
      negatives.push(...COSTUME_NEGATIVE.fit, ...COSTUME_NEGATIVE.quality);
      break;
    default:
      break;
  }

  return negatives.join(', ');
}

/**
 * 根据平台获取特定负面提示词
 */
export function getNegativePromptByPlatform(platform: string): string {
  const platformNegatives =
    PLATFORM_SPECIFIC_NEGATIVE[platform as keyof typeof PLATFORM_SPECIFIC_NEGATIVE] || [];
  return [...GENERAL_NEGATIVE.quality, ...platformNegatives].join(', ');
}

/**
 * 根据风格获取负面提示词
 */
export function getNegativePromptByStyle(style: string): string {
  const styleKey = style.toLowerCase();
  if (styleKey.includes('realistic') || styleKey.includes('photo')) {
    return STYLE_SPECIFIC_NEGATIVE.realistic.join(', ');
  }
  if (styleKey.includes('anime') || styleKey.includes('manga')) {
    return STYLE_SPECIFIC_NEGATIVE.anime.join(', ');
  }
  if (styleKey.includes('cinematic') || styleKey.includes('film')) {
    return STYLE_SPECIFIC_NEGATIVE.cinematic.join(', ');
  }
  if (styleKey.includes('artistic') || styleKey.includes('painting')) {
    return STYLE_SPECIFIC_NEGATIVE.artistic.join(', ');
  }
  return GENERAL_NEGATIVE.quality.join(', ');
}

/**
 * 生成完整的负面提示词
 */
export function generateNegativePrompt(options: {
  type?: 'character' | 'scene' | 'storyboard' | 'prop' | 'costume';
  platform?: string;
  style?: string;
  custom?: string[];
}): string {
  const negatives: Set<string> = new Set();

  // 通用负面提示词
  GENERAL_NEGATIVE.quality.forEach((n) => negatives.add(n));
  GENERAL_NEGATIVE.artifacts.forEach((n) => negatives.add(n));

  // 类型特定
  if (options.type) {
    const typeNegative = getNegativePromptByType(options.type);
    typeNegative.split(', ').forEach((n) => negatives.add(n));
  }

  // 平台特定
  if (options.platform) {
    const platformNegative = getNegativePromptByPlatform(options.platform);
    platformNegative.split(', ').forEach((n) => negatives.add(n));
  }

  // 风格特定
  if (options.style) {
    const styleNegative = getNegativePromptByStyle(options.style);
    styleNegative.split(', ').forEach((n) => negatives.add(n));
  }

  // 自定义
  if (options.custom) {
    options.custom.forEach((n) => negatives.add(n));
  }

  return Array.from(negatives).join(', ');
}

/**
 * 优化负面提示词（去重、排序）
 */
export function optimizeNegativePrompt(prompt: string): string {
  const terms = prompt
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // 去重
  const unique = Array.from(new Set(terms));

  // 按重要性排序（质量问题 > 解剖问题 > 技术问题 > 其他）
  const priority = {
    quality: ['low quality', 'worst quality', 'bad art', 'ugly'],
    anatomy: ['bad anatomy', 'deformed', 'mutation'],
    technical: ['blurry', 'watermark', 'text'],
  };

  const sorted = unique.sort((a, b) => {
    const aInQuality = priority.quality.some((p) => a.includes(p));
    const bInQuality = priority.quality.some((p) => b.includes(p));
    if (aInQuality && !bInQuality) return -1;
    if (!aInQuality && bInQuality) return 1;

    const aInAnatomy = priority.anatomy.some((p) => a.includes(p));
    const bInAnatomy = priority.anatomy.some((p) => b.includes(p));
    if (aInAnatomy && !bInAnatomy) return -1;
    if (!aInAnatomy && bInAnatomy) return 1;

    return 0;
  });

  return sorted.join(', ');
}

export default {
  GENERAL_NEGATIVE,
  CHARACTER_NEGATIVE,
  SCENE_NEGATIVE,
  STORYBOARD_NEGATIVE,
  PROP_NEGATIVE,
  COSTUME_NEGATIVE,
  PLATFORM_SPECIFIC_NEGATIVE,
  STYLE_SPECIFIC_NEGATIVE,
  getNegativePromptByType,
  getNegativePromptByPlatform,
  getNegativePromptByStyle,
  generateNegativePrompt,
  optimizeNegativePrompt,
};
