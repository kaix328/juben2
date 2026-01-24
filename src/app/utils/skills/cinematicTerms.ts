/**
 * 电影摄影专业术语库
 * 用于生成高质量的图像提示词
 */

// ============ 镜头焦距 ============

export const FOCAL_LENGTHS = {
  ultraWide: {
    range: '8-24mm',
    terms: ['ultra wide angle', 'fisheye', 'extreme perspective', 'distorted edges'],
    use: '极端透视、环境全景、创意构图',
  },
  wide: {
    range: '24-35mm',
    terms: ['wide angle', 'environmental shot', 'spacious composition'],
    use: '环境展示、建立镜头、空间感',
  },
  standard: {
    range: '35-50mm',
    terms: ['standard lens', 'natural perspective', 'human eye view'],
    use: '自然视角、日常场景、纪实摄影',
  },
  portrait: {
    range: '50-85mm',
    terms: ['portrait lens', 'flattering perspective', 'shallow depth of field'],
    use: '人像摄影、特写镜头、背景虚化',
  },
  telephoto: {
    range: '85-200mm',
    terms: ['telephoto lens', 'compressed perspective', 'background blur'],
    use: '压缩空间、背景虚化、远距离拍摄',
  },
  superTelephoto: {
    range: '200mm+',
    terms: ['super telephoto', 'extreme compression', 'isolated subject'],
    use: '极度压缩、主体隔离、远距离特写',
  },
};

// ============ 光圈值 ============

export const APERTURES = {
  veryWide: {
    value: 'f/1.2 - f/1.8',
    terms: ['very wide aperture', 'extremely shallow depth of field', 'creamy bokeh', 'subject isolation'],
    effect: '极浅景深、奶油般虚化、主体突出',
  },
  wide: {
    value: 'f/2.0 - f/2.8',
    terms: ['wide aperture', 'shallow depth of field', 'soft bokeh', 'background blur'],
    effect: '浅景深、柔和虚化、背景模糊',
  },
  moderate: {
    value: 'f/4.0 - f/5.6',
    terms: ['moderate aperture', 'balanced depth of field', 'some background detail'],
    effect: '平衡景深、部分背景细节',
  },
  narrow: {
    value: 'f/8.0 - f/11',
    terms: ['narrow aperture', 'deep depth of field', 'sharp throughout'],
    effect: '深景深、全局清晰',
  },
  veryNarrow: {
    value: 'f/16 - f/22',
    terms: ['very narrow aperture', 'maximum depth of field', 'everything in focus'],
    effect: '最大景深、全景清晰',
  },
};

// ============ 快门速度 ============

export const SHUTTER_SPEEDS = {
  veryFast: {
    value: '1/1000s+',
    terms: ['very fast shutter', 'frozen motion', 'sharp action', 'no motion blur'],
    effect: '冻结动作、无运动模糊',
  },
  fast: {
    value: '1/250s - 1/500s',
    terms: ['fast shutter', 'crisp motion', 'minimal blur'],
    effect: '清晰动作、最小模糊',
  },
  normal: {
    value: '1/60s - 1/125s',
    terms: ['normal shutter', 'natural motion', 'slight blur'],
    effect: '自然动作、轻微模糊',
  },
  slow: {
    value: '1/15s - 1/30s',
    terms: ['slow shutter', 'motion blur', 'dynamic movement'],
    effect: '运动模糊、动态感',
  },
  verySlow: {
    value: '1s+',
    terms: ['very slow shutter', 'long exposure', 'light trails', 'motion streaks'],
    effect: '长曝光、光轨、运动轨迹',
  },
};

// ============ ISO 感光度 ============

export const ISO_VALUES = {
  low: {
    value: 'ISO 100-400',
    terms: ['low ISO', 'clean image', 'no noise', 'maximum detail'],
    effect: '干净画面、无噪点、最大细节',
  },
  medium: {
    value: 'ISO 800-1600',
    terms: ['medium ISO', 'slight grain', 'balanced exposure'],
    effect: '轻微颗粒、平衡曝光',
  },
  high: {
    value: 'ISO 3200-6400',
    terms: ['high ISO', 'visible grain', 'film-like texture'],
    effect: '明显颗粒、胶片质感',
  },
  veryHigh: {
    value: 'ISO 12800+',
    terms: ['very high ISO', 'heavy grain', 'artistic noise'],
    effect: '重度颗粒、艺术噪点',
  },
};

// ============ 光影类型 ============

export const LIGHTING_TYPES = {
  rembrandt: {
    name: '伦勃朗光',
    terms: ['Rembrandt lighting', 'triangle of light', 'dramatic shadows', '45-degree angle'],
    description: '45度角光源，脸颊形成三角形光斑',
  },
  butterfly: {
    name: '蝴蝶光',
    terms: ['butterfly lighting', 'paramount lighting', 'nose shadow', 'glamour lighting'],
    description: '正面上方光源，鼻下形成蝴蝶形阴影',
  },
  loop: {
    name: '环形光',
    terms: ['loop lighting', 'slight shadow', 'natural look'],
    description: '略微偏离正面的光源，鼻侧形成小阴影',
  },
  split: {
    name: '分割光',
    terms: ['split lighting', 'half shadow', 'dramatic contrast', 'side lighting'],
    description: '侧面光源，脸部一半明一半暗',
  },
  broad: {
    name: '宽光',
    terms: ['broad lighting', 'face towards light', 'wider appearance'],
    description: '脸部朝向光源，照亮较宽的一侧',
  },
  short: {
    name: '窄光',
    terms: ['short lighting', 'face away from light', 'slimming effect'],
    description: '脸部背向光源，照亮较窄的一侧',
  },
  rim: {
    name: '轮廓光',
    terms: ['rim lighting', 'edge light', 'backlight', 'silhouette'],
    description: '背后光源，勾勒主体轮廓',
  },
  threePoint: {
    name: '三点布光',
    terms: ['three-point lighting', 'key light', 'fill light', 'back light', 'professional setup'],
    description: '主光+补光+轮廓光的经典布光',
  },
};

// ============ 色温 ============

export const COLOR_TEMPERATURES = {
  veryWarm: {
    kelvin: '2000K-3000K',
    terms: ['very warm', 'candlelight', 'firelight', 'orange glow'],
    mood: '温馨、浪漫、怀旧',
  },
  warm: {
    kelvin: '3000K-4000K',
    terms: ['warm', 'tungsten', 'incandescent', 'golden hour'],
    mood: '温暖、舒适、黄昏',
  },
  neutral: {
    kelvin: '4000K-5000K',
    terms: ['neutral', 'balanced', 'natural white'],
    mood: '自然、平衡、日常',
  },
  cool: {
    kelvin: '5000K-6500K',
    terms: ['cool', 'daylight', 'overcast', 'blue tint'],
    mood: '清爽、明亮、白天',
  },
  veryCool: {
    kelvin: '6500K+',
    terms: ['very cool', 'blue hour', 'moonlight', 'cold atmosphere'],
    mood: '冷峻、神秘、夜晚',
  },
};

// ============ 构图法则 ============

export const COMPOSITION_RULES = {
  ruleOfThirds: {
    name: '三分法',
    terms: ['rule of thirds', 'grid composition', 'intersection points', 'balanced placement'],
    description: '画面分为九宫格，主体放在交叉点',
  },
  goldenRatio: {
    name: '黄金分割',
    terms: ['golden ratio', 'fibonacci spiral', 'phi composition', '1.618 ratio'],
    description: '使用黄金比例1.618进行构图',
  },
  symmetry: {
    name: '对称构图',
    terms: ['symmetrical composition', 'mirror image', 'balanced symmetry', 'centered subject'],
    description: '画面左右或上下对称',
  },
  leadingLines: {
    name: '引导线',
    terms: ['leading lines', 'visual flow', 'directional composition', 'eye guidance'],
    description: '使用线条引导视线到主体',
  },
  frameWithinFrame: {
    name: '框中框',
    terms: ['frame within frame', 'natural framing', 'layered composition'],
    description: '使用前景元素框住主体',
  },
  diagonals: {
    name: '对角线',
    terms: ['diagonal composition', 'dynamic angles', 'tension', 'movement'],
    description: '使用对角线增加动感和张力',
  },
  negativeSpace: {
    name: '负空间',
    terms: ['negative space', 'minimalist', 'breathing room', 'isolation'],
    description: '留白突出主体',
  },
  patterns: {
    name: '图案重复',
    terms: ['pattern repetition', 'rhythm', 'visual interest'],
    description: '重复元素形成图案',
  },
};

// ============ 景深效果 ============

export const DEPTH_OF_FIELD = {
  veryShallow: {
    name: '极浅景深',
    terms: ['extremely shallow depth of field', 'razor-thin focus', 'creamy bokeh', 'subject isolation'],
    aperture: 'f/1.2 - f/1.8',
    effect: '只有主体清晰，背景完全虚化',
  },
  shallow: {
    name: '浅景深',
    terms: ['shallow depth of field', 'soft bokeh', 'background blur', 'subject separation'],
    aperture: 'f/2.0 - f/2.8',
    effect: '主体清晰，背景柔和虚化',
  },
  moderate: {
    name: '中等景深',
    terms: ['moderate depth of field', 'balanced focus', 'some background detail'],
    aperture: 'f/4.0 - f/5.6',
    effect: '主体和部分背景清晰',
  },
  deep: {
    name: '深景深',
    terms: ['deep depth of field', 'everything in focus', 'sharp throughout'],
    aperture: 'f/8.0 - f/11',
    effect: '前景到背景都清晰',
  },
  hyperfocal: {
    name: '超焦距',
    terms: ['hyperfocal distance', 'infinite focus', 'maximum sharpness'],
    aperture: 'f/11 - f/16',
    effect: '从近到远全部清晰',
  },
};

// ============ 镜头特效 ============

export const LENS_EFFECTS = {
  bokeh: {
    name: '焦外虚化',
    terms: ['bokeh', 'out-of-focus blur', 'circular highlights', 'creamy background'],
    description: '背景光点形成圆形或多边形虚化',
  },
  lensFlare: {
    name: '镜头光晕',
    terms: ['lens flare', 'sun flare', 'light streaks', 'anamorphic flare'],
    description: '强光源造成的光晕和光斑',
  },
  chromaticAberration: {
    name: '色差',
    terms: ['chromatic aberration', 'color fringing', 'purple fringing'],
    description: '高对比边缘出现彩色边缘',
  },
  vignette: {
    name: '暗角',
    terms: ['vignette', 'darkened corners', 'edge falloff'],
    description: '画面四角变暗',
  },
  tiltShift: {
    name: '移轴效果',
    terms: ['tilt-shift', 'miniature effect', 'selective focus'],
    description: '模拟微缩景观效果',
  },
  motionBlur: {
    name: '运动模糊',
    terms: ['motion blur', 'speed lines', 'dynamic movement'],
    description: '运动物体产生的模糊轨迹',
  },
  filmGrain: {
    name: '胶片颗粒',
    terms: ['film grain', 'analog texture', 'vintage look'],
    description: '模拟胶片的颗粒质感',
  },
};

// ============ 色彩分级 ============

export const COLOR_GRADING = {
  cinematic: {
    name: '电影级调色',
    terms: ['cinematic color grading', 'teal and orange', 'film look', 'professional grade'],
    description: '青橙色调，电影感强',
  },
  bleachBypass: {
    name: '漂白效果',
    terms: ['bleach bypass', 'desaturated', 'high contrast', 'gritty look'],
    description: '低饱和度、高对比度',
  },
  crossProcess: {
    name: '交叉冲洗',
    terms: ['cross process', 'shifted colors', 'vintage film'],
    description: '色彩偏移、复古胶片感',
  },
  lut: {
    name: 'LUT调色',
    terms: ['LUT color grading', 'color lookup table', 'preset grade'],
    description: '使用预设色彩查找表',
  },
  hdr: {
    name: 'HDR调色',
    terms: ['HDR grading', 'high dynamic range', 'enhanced contrast'],
    description: '高动态范围、增强对比',
  },
};

// ============ 辅助函数 ============

/**
 * 根据景别推荐焦距
 */
export function getFocalLengthByShot(shotType: string): string {
  const map: Record<string, string> = {
    'ECU': '85-200mm telephoto',
    'CU': '50-85mm portrait',
    'MCU': '35-50mm standard',
    'MS': '35-50mm standard',
    'MWS': '24-35mm wide',
    'WS': '24-35mm wide',
    'EWS': '8-24mm ultra wide',
  };
  return map[shotType] || '35-50mm standard';
}

/**
 * 根据情绪推荐光影
 */
export function getLightingByMood(mood: string): string[] {
  const map: Record<string, string[]> = {
    '浪漫': ['soft lighting', 'warm color temperature', 'golden hour', 'rim light'],
    '紧张': ['dramatic lighting', 'hard shadows', 'split lighting', 'high contrast'],
    '神秘': ['low key lighting', 'rim light', 'silhouette', 'fog'],
    '欢快': ['bright lighting', 'even illumination', 'natural light', 'high key'],
    '悲伤': ['cool color temperature', 'soft shadows', 'overcast light', 'blue tint'],
  };
  return map[mood] || ['natural lighting', 'balanced exposure'];
}

/**
 * 根据时间推荐色温
 */
export function getColorTemperatureByTime(timeOfDay: string): string {
  const map: Record<string, string> = {
    'dawn': '3500K warm, golden hour, soft morning light',
    'day': '5500K neutral, bright daylight, natural white',
    'dusk': '3000K very warm, sunset glow, orange sky',
    'night': '6500K cool, moonlight, blue tint',
  };
  return map[timeOfDay] || '5500K neutral daylight';
}

/**
 * 生成完整的摄影参数描述
 */
export function generateCinematicParams(options: {
  shotType?: string;
  mood?: string;
  timeOfDay?: string;
  focusType?: 'shallow' | 'deep';
  platform?: string; // 🆕 添加平台参数
}): string[] {
  const params: string[] = [];

  // 焦距
  if (options.shotType) {
    params.push(getFocalLengthByShot(options.shotType));
  }

  // 光圈和景深
  if (options.focusType === 'shallow') {
    params.push('f/2.8 aperture', 'shallow depth of field', 'cinematic bokeh');
  } else if (options.focusType === 'deep') {
    params.push('f/8 aperture', 'deep depth of field', 'everything in focus');
  }

  // 光影
  if (options.mood) {
    params.push(...getLightingByMood(options.mood));
  }

  // 色温
  if (options.timeOfDay) {
    params.push(getColorTemperatureByTime(options.timeOfDay));
  }

  // 🆕 根据平台添加特定参数
  const platform = options.platform?.toLowerCase();
  
  if (platform === 'midjourney') {
    params.push('professional photography', 'award winning', 'high detail', 'sharp focus', '8k resolution');
  } else if (platform === 'stable-diffusion') {
    params.push('masterpiece', 'best quality', 'ultra detailed', 'high resolution', 'professional');
  } else if (platform === 'nanobanana-pro') {
    params.push('ultra high quality', 'extremely detailed', 'perfect composition', 'studio lighting', 'professional grade', '4K HDR');
  } else if (platform === 'runway') {
    params.push('cinematic composition', 'film quality', 'professional grade');
  } else if (platform === 'pika') {
    params.push('artistic style', 'creative composition', 'unique perspective');
  } else if (platform === 'sora') {
    params.push('photorealistic', 'cinematic lighting', 'natural composition', 'film grain texture');
  } else if (platform === 'kling') {
    params.push('专业摄影', '电影级画质', '高清细节');
  } else {
    // 默认通用参数
    params.push('professional cinematography', 'film grain', 'anamorphic lens');
  }

  return params;
}

export default {
  FOCAL_LENGTHS,
  APERTURES,
  SHUTTER_SPEEDS,
  ISO_VALUES,
  LIGHTING_TYPES,
  COLOR_TEMPERATURES,
  COMPOSITION_RULES,
  DEPTH_OF_FIELD,
  LENS_EFFECTS,
  COLOR_GRADING,
  getFocalLengthByShot,
  getLightingByMood,
  getColorTemperatureByTime,
  generateCinematicParams,
};
