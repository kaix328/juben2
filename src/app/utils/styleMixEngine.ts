/**
 * 风格混合引擎
 * 支持多种艺术风格的混合和参数调整
 */

// ============ 类型定义 ============

export interface StyleParameters {
  cfgScale: number;
  steps: number;
  sampler: string;
  clipSkip: number;
  strength: number;
  // 扩展属性（用于 UI 展示）
  colorSaturation?: number;
  contrast?: number;
  lighting?: { style: string };
  rendering?: { style: string };
}

export interface StylePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  positivePrompt: string;
  negativePrompt: string;
  parameters: StyleParameters;
  thumbnail?: string;
  tags: string[];
  popularity: number;
  // 扩展属性
  promptTemplate?: string;
  isBuiltIn?: boolean;
}

export interface StyleMixItem {
  styleId: string;
  weight: number; // 0-1
}

export interface StyleMix {
  id: string;
  name: string;
  description: string;
  items: StyleMixItem[];
  createdAt: number;
  usageCount: number;
}

// ============ 风格分类 ============

export const STYLE_CATEGORIES = [
  { id: 'all', name: '全部', icon: '🎨' },
  { id: 'realistic', name: '写实', icon: '📷' },
  { id: 'anime', name: '动漫', icon: '🎭' },
  { id: 'artistic', name: '艺术', icon: '🖼️' },
  { id: 'cinematic', name: '电影', icon: '🎬' },
  { id: 'fantasy', name: '奇幻', icon: '✨' },
  { id: 'vintage', name: '复古', icon: '📼' },
  { id: 'modern', name: '现代', icon: '🏙️' }
];

export const LIGHTING_STYLES = [
  { id: 'natural', name: '自然光', prompt: 'natural lighting' },
  { id: 'dramatic', name: '戏剧光', prompt: 'dramatic lighting' },
  { id: 'soft', name: '柔光', prompt: 'soft lighting' },
  { id: 'neon', name: '霓虹灯', prompt: 'neon lighting' },
  { id: 'golden', name: '金色时刻', prompt: 'golden hour lighting' },
  { id: 'studio', name: '影棚光', prompt: 'studio lighting' }
];

export const RENDERING_STYLES = [
  { id: 'photorealistic', name: '照片级', prompt: 'photorealistic, highly detailed' },
  { id: 'illustration', name: '插画', prompt: 'illustration, digital art' },
  { id: '3d', name: '3D渲染', prompt: '3d render, octane render' },
  { id: 'watercolor', name: '水彩', prompt: 'watercolor painting' },
  { id: 'oil', name: '油画', prompt: 'oil painting' },
  { id: 'sketch', name: '素描', prompt: 'pencil sketch, line art' }
];

// ============ 预设风格 ============

const DEFAULT_STYLES: StylePreset[] = [
  {
    id: 'realistic-photo',
    name: '写实摄影',
    category: 'realistic',
    description: '高质量的写实摄影风格',
    positivePrompt: 'photorealistic, highly detailed, 8k uhd, dslr, soft lighting, high quality, film grain',
    negativePrompt: 'cartoon, anime, illustration, painting, drawing, art, sketch',
    parameters: {
      cfgScale: 7,
      steps: 30,
      sampler: 'DPM++ 2M Karras',
      clipSkip: 1,
      strength: 0.75
    },
    tags: ['写实', '摄影', '高清'],
    popularity: 100
  },
  {
    id: 'anime-style',
    name: '日系动漫',
    category: 'anime',
    description: '日本动漫风格',
    positivePrompt: 'anime style, manga, cel shading, vibrant colors, clean lines',
    negativePrompt: 'realistic, photo, 3d',
    parameters: {
      cfgScale: 8,
      steps: 28,
      sampler: 'Euler a',
      clipSkip: 2,
      strength: 0.7
    },
    tags: ['动漫', '日系', '二次元'],
    popularity: 95
  },
  {
    id: 'cinematic',
    name: '电影感',
    category: 'cinematic',
    description: '电影级画面质感',
    positivePrompt: 'cinematic, dramatic lighting, film grain, depth of field, bokeh, anamorphic lens',
    negativePrompt: 'amateur, low quality, flat lighting',
    parameters: {
      cfgScale: 7.5,
      steps: 35,
      sampler: 'DPM++ SDE Karras',
      clipSkip: 1,
      strength: 0.8
    },
    tags: ['电影', '戏剧', '景深'],
    popularity: 90
  },
  {
    id: 'oil-painting',
    name: '古典油画',
    category: 'artistic',
    description: '古典油画艺术风格',
    positivePrompt: 'oil painting, classical art, renaissance style, rich colors, textured brushstrokes',
    negativePrompt: 'photo, digital, modern, flat',
    parameters: {
      cfgScale: 9,
      steps: 40,
      sampler: 'Euler',
      clipSkip: 1,
      strength: 0.85
    },
    tags: ['油画', '古典', '艺术'],
    popularity: 75
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    category: 'fantasy',
    description: '未来科幻赛博朋克风格',
    positivePrompt: 'cyberpunk, neon lights, futuristic, high tech, dystopian, rain, night city',
    negativePrompt: 'nature, daylight, vintage, medieval',
    parameters: {
      cfgScale: 8,
      steps: 32,
      sampler: 'DPM++ 2M Karras',
      clipSkip: 1,
      strength: 0.75
    },
    tags: ['科幻', '霓虹', '未来'],
    popularity: 85
  },
  {
    id: 'vintage-film',
    name: '复古胶片',
    category: 'vintage',
    description: '70年代胶片摄影风格',
    positivePrompt: 'vintage, film photography, 1970s, grainy, faded colors, nostalgic, retro',
    negativePrompt: 'modern, digital, sharp, vibrant',
    parameters: {
      cfgScale: 6.5,
      steps: 25,
      sampler: 'Euler a',
      clipSkip: 1,
      strength: 0.7
    },
    tags: ['复古', '胶片', '怀旧'],
    popularity: 70
  },
  {
    id: 'minimalist',
    name: '极简主义',
    category: 'modern',
    description: '现代极简设计风格',
    positivePrompt: 'minimalist, clean, simple, modern design, negative space, geometric',
    negativePrompt: 'cluttered, detailed, ornate, busy',
    parameters: {
      cfgScale: 7,
      steps: 25,
      sampler: 'Euler',
      clipSkip: 1,
      strength: 0.65
    },
    tags: ['极简', '现代', '简洁'],
    popularity: 65
  },
  {
    id: 'fantasy-art',
    name: '奇幻艺术',
    category: 'fantasy',
    description: '魔幻奇幻艺术风格',
    positivePrompt: 'fantasy art, magical, ethereal, mystical, enchanted, vibrant colors, detailed',
    negativePrompt: 'realistic, mundane, dull',
    parameters: {
      cfgScale: 8.5,
      steps: 35,
      sampler: 'DPM++ 2M Karras',
      clipSkip: 2,
      strength: 0.8
    },
    tags: ['奇幻', '魔法', '梦幻'],
    popularity: 80
  }
];

// ============ 风格混合引擎 ============

class StyleMixEngine {
  private styles: Map<string, StylePreset> = new Map();
  private mixes: Map<string, StyleMix> = new Map();
  private storageKey = 'style_mixes';

  constructor() {
    this.initializeStyles();
    this.loadFromStorage();
  }

  /**
   * 初始化默认风格
   */
  private initializeStyles() {
    DEFAULT_STYLES.forEach(style => {
      this.styles.set(style.id, style);
    });
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const mixes = JSON.parse(data) as StyleMix[];
        mixes.forEach(mix => {
          this.mixes.set(mix.id, mix);
        });
      }
    } catch (e) {
      console.error('加载风格混合失败:', e);
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage() {
    try {
      const mixes = Array.from(this.mixes.values());
      localStorage.setItem(this.storageKey, JSON.stringify(mixes));
    } catch (e) {
      console.error('保存风格混合失败:', e);
    }
  }

  /**
   * 获取所有风格
   */
  getAllStyles(): StylePreset[] {
    return Array.from(this.styles.values()).sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * 获取风格
   */
  getStyle(id: string): StylePreset | undefined {
    return this.styles.get(id);
  }

  /**
   * 按分类获取风格
   */
  getStylesByCategory(category: string): StylePreset[] {
    return this.getAllStyles().filter(s => s.category === category);
  }

  /**
   * 混合风格参数
   */
  mixStyles(items: StyleMixItem[]): StyleParameters {
    if (items.length === 0) {
      return {
        cfgScale: 7,
        steps: 30,
        sampler: 'DPM++ 2M Karras',
        clipSkip: 1,
        strength: 0.75
      };
    }

    // 归一化权重
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const normalizedItems = items.map(item => ({
      ...item,
      weight: item.weight / totalWeight
    }));

    // 加权平均参数
    let cfgScale = 0;
    let steps = 0;
    let clipSkip = 0;
    let strength = 0;
    const samplers: { [key: string]: number } = {};

    normalizedItems.forEach(item => {
      const style = this.styles.get(item.styleId);
      if (style) {
        cfgScale += style.parameters.cfgScale * item.weight;
        steps += style.parameters.steps * item.weight;
        clipSkip += style.parameters.clipSkip * item.weight;
        strength += style.parameters.strength * item.weight;

        samplers[style.parameters.sampler] =
          (samplers[style.parameters.sampler] || 0) + item.weight;
      }
    });

    // 选择权重最高的采样器
    const samplerEntries = Object.entries(samplers);
    const sampler = samplerEntries.length > 0
      ? samplerEntries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
      : 'DPM++ 2M Karras'; // 默认采样器

    return {
      cfgScale: Math.round(cfgScale * 10) / 10 || 7,
      steps: Math.round(steps) || 30,
      sampler,
      clipSkip: Math.round(clipSkip) || 1,
      strength: Math.round(strength * 100) / 100 || 0.75
    };
  }

  /**
   * 混合提示词
   */
  mixPrompts(items: StyleMixItem[], basePrompt: string = ''): { positive: string; negative: string } {
    if (items.length === 0) {
      return { positive: basePrompt, negative: '' };
    }

    const positivePrompts: string[] = [];
    const negativePrompts: string[] = [];

    if (basePrompt) {
      positivePrompts.push(basePrompt);
    }

    items.forEach(item => {
      const style = this.styles.get(item.styleId);
      if (style) {
        if (style.positivePrompt) {
          positivePrompts.push(style.positivePrompt);
        }
        if (style.negativePrompt) {
          negativePrompts.push(style.negativePrompt);
        }
      }
    });

    return {
      positive: positivePrompts.join(', '),
      negative: negativePrompts.join(', ')
    };
  }

  /**
   * 保存混合
   */
  saveMix(name: string, description: string, items: StyleMixItem[]): StyleMix {
    const id = `mix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mix: StyleMix = {
      id,
      name,
      description,
      items,
      createdAt: Date.now(),
      usageCount: 0
    };

    this.mixes.set(id, mix);
    this.saveToStorage();
    return mix;
  }

  /**
   * 获取所有混合
   */
  getAllMixes(): StyleMix[] {
    return Array.from(this.mixes.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取混合
   */
  getMix(id: string): StyleMix | undefined {
    return this.mixes.get(id);
  }

  /**
   * 删除混合
   */
  deleteMix(id: string): boolean {
    const deleted = this.mixes.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * 增加混合使用次数
   */
  incrementMixUsage(id: string) {
    const mix = this.mixes.get(id);
    if (mix) {
      mix.usageCount++;
      this.saveToStorage();
    }
  }

  /**
   * 搜索风格
   */
  searchStyles(query: string): StylePreset[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllStyles().filter(style =>
      style.name.toLowerCase().includes(lowerQuery) ||
      style.description.toLowerCase().includes(lowerQuery) ||
      style.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 添加自定义风格
   */
  addCustomStyle(style: Omit<StylePreset, 'id' | 'popularity'>): StylePreset {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newStyle: StylePreset = {
      ...style,
      id,
      popularity: 0
    };

    this.styles.set(id, newStyle);
    return newStyle;
  }

  /**
   * 删除自定义风格
   */
  deleteCustomStyle(id: string): boolean {
    if (!id.startsWith('custom_')) {
      return false; // 不能删除预设风格
    }
    return this.styles.delete(id);
  }
}

// ============ 导出单例 ============

export const styleMixEngine = new StyleMixEngine();

export default styleMixEngine;
