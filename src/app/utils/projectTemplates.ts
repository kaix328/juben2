/**
 * 项目模板系统
 * 提供预设项目模板，快速创建不同类型的项目
 */

// ============ 类型定义 ============

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string;
  
  // 项目配置
  config: TemplateConfig;
  
  // 预设内容
  presets: TemplatePresets;
  
  // 元数据
  isBuiltIn: boolean;
  author?: string;
  version: string;
  createdAt: string;
  usageCount: number;
}

export type TemplateCategory = 
  | 'film'          // 电影
  | 'short'         // 短片
  | 'commercial'    // 广告
  | 'music_video'   // MV
  | 'animation'     // 动画
  | 'documentary'   // 纪录片
  | 'web_series'    // 网剧
  | 'custom';       // 自定义

export interface TemplateConfig {
  // 视频规格
  resolution: { width: number; height: number };
  frameRate: number;
  aspectRatio: string;
  
  // 默认时长
  defaultPanelDuration: number;
  
  // 风格预设
  defaultStyleId?: string;
  
  // 导出设置
  exportFormat: string;
}

export interface TemplatePresets {
  // 章节结构
  chapters?: ChapterPreset[];
  
  // 场景模板
  scenes?: ScenePreset[];
  
  // 角色模板
  characters?: CharacterPreset[];
  
  // 分镜模板
  storyboardTemplates?: StoryboardPreset[];
  
  // 导演风格
  directorStyle?: DirectorStylePreset;
}

export interface ChapterPreset {
  name: string;
  description: string;
  suggestedDuration?: number;
}

export interface ScenePreset {
  name: string;
  location: string;
  timeOfDay: string;
  description: string;
  suggestedShots: string[];
}

export interface CharacterPreset {
  name: string;
  role: string;
  description: string;
  traits: string[];
}

export interface StoryboardPreset {
  name: string;
  shotType: string;
  angle: string;
  movement?: string;
  description: string;
  duration: number;
}

export interface DirectorStylePreset {
  name: string;
  colorPalette: string[];
  lightingStyle: string;
  cameraStyle: string;
  editingPace: string;
}

// ============ 内置模板 ============

export const BUILT_IN_TEMPLATES: ProjectTemplate[] = [
  // 电影长片模板
  {
    id: 'feature_film',
    name: '电影长片',
    description: '适用于90-120分钟的剧情长片，包含完整的三幕结构',
    category: 'film',
    config: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 24,
      aspectRatio: '2.39:1',
      defaultPanelDuration: 3,
      exportFormat: 'fcpxml'
    },
    presets: {
      chapters: [
        { name: '第一幕：建置', description: '介绍主角、世界观和主要冲突', suggestedDuration: 25 },
        { name: '第一转折点', description: '推动主角进入第二幕的关键事件', suggestedDuration: 5 },
        { name: '第二幕A：对抗', description: '主角面对挑战，尝试解决问题', suggestedDuration: 25 },
        { name: '中点', description: '故事的重大转折或启示', suggestedDuration: 5 },
        { name: '第二幕B：危机', description: '情况恶化，主角陷入困境', suggestedDuration: 25 },
        { name: '第二转折点', description: '最黑暗的时刻，推动进入第三幕', suggestedDuration: 5 },
        { name: '第三幕：解决', description: '高潮和结局', suggestedDuration: 20 }
      ],
      scenes: [
        { name: '开场', location: '外景', timeOfDay: '日', description: '建立世界观的开场镜头', suggestedShots: ['EWS', 'WS', 'MS'] },
        { name: '主角登场', location: '内景', timeOfDay: '日', description: '主角首次出场', suggestedShots: ['MS', 'CU', 'MCU'] },
        { name: '对话场景', location: '内景', timeOfDay: '日', description: '双人对话', suggestedShots: ['TWO', 'OTS', 'CU'] },
        { name: '动作场景', location: '外景', timeOfDay: '夜', description: '紧张的动作戏', suggestedShots: ['WS', 'MS', 'CU', 'INSERT'] },
        { name: '高潮', location: '外景', timeOfDay: '日', description: '故事高潮', suggestedShots: ['EWS', 'WS', 'CU', 'ECU'] }
      ],
      directorStyle: {
        name: '经典电影',
        colorPalette: ['#2C3E50', '#E74C3C', '#ECF0F1', '#3498DB'],
        lightingStyle: 'dramatic',
        cameraStyle: 'classical',
        editingPace: 'medium'
      }
    },
    isBuiltIn: true,
    version: '1.0',
    createdAt: '2024-01-01',
    usageCount: 0
  },

  // 短片模板
  {
    id: 'short_film',
    name: '短片',
    description: '适用于5-30分钟的短片，简洁的叙事结构',
    category: 'short',
    config: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 24,
      aspectRatio: '16:9',
      defaultPanelDuration: 2.5,
      exportFormat: 'fcpxml'
    },
    presets: {
      chapters: [
        { name: '开端', description: '快速建立情境和角色', suggestedDuration: 3 },
        { name: '发展', description: '核心冲突展开', suggestedDuration: 7 },
        { name: '高潮', description: '冲突达到顶点', suggestedDuration: 3 },
        { name: '结局', description: '解决和收尾', suggestedDuration: 2 }
      ],
      directorStyle: {
        name: '独立电影',
        colorPalette: ['#1A1A2E', '#16213E', '#0F3460', '#E94560'],
        lightingStyle: 'natural',
        cameraStyle: 'handheld',
        editingPace: 'varied'
      }
    },
    isBuiltIn: true,
    version: '1.0',
    createdAt: '2024-01-01',
    usageCount: 0
  },

  // 广告模板
  {
    id: 'commercial_30s',
    name: '30秒广告',
    description: '适用于30秒电视/网络广告',
    category: 'commercial',
    config: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      aspectRatio: '16:9',
      defaultPanelDuration: 2,
      exportFormat: 'premiere_xml'
    },
    presets: {
      chapters: [
        { name: '吸引注意', description: '前5秒抓住观众', suggestedDuration: 5 },
        { name: '问题/需求', description: '展示痛点或需求', suggestedDuration: 5 },
        { name: '解决方案', description: '产品/服务介绍', suggestedDuration: 10 },
        { name: '行动号召', description: 'CTA和品牌展示', suggestedDuration: 10 }
      ],
      storyboardTemplates: [
        { name: '产品特写', shotType: 'ECU', angle: 'EYE_LEVEL', description: '产品细节展示', duration: 2 },
        { name: '使用场景', shotType: 'MS', angle: 'EYE_LEVEL', description: '产品使用演示', duration: 3 },
        { name: '品牌Logo', shotType: 'CU', angle: 'EYE_LEVEL', description: 'Logo展示', duration: 2 }
      ],
      directorStyle: {
        name: '商业广告',
        colorPalette: ['#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4'],
        lightingStyle: 'studio',
        cameraStyle: 'smooth',
        editingPace: 'fast'
      }
    },
    isBuiltIn: true,
    version: '1.0',
    createdAt: '2024-01-01',
    usageCount: 0
  },

  // MV模板
  {
    id: 'music_video',
    name: '音乐MV',
    description: '适用于3-5分钟的音乐视频',
    category: 'music_video',
    config: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 24,
      aspectRatio: '16:9',
      defaultPanelDuration: 1.5,
      exportFormat: 'fcpxml'
    },
    presets: {
      chapters: [
        { name: '前奏', description: '视觉建立，氛围营造', suggestedDuration: 15 },
        { name: '主歌A', description: '叙事展开', suggestedDuration: 30 },
        { name: '副歌', description: '视觉高潮', suggestedDuration: 30 },
        { name: '主歌B', description: '叙事深入', suggestedDuration: 30 },
        { name: '副歌重复', description: '视觉强化', suggestedDuration: 30 },
        { name: 'Bridge', description: '情感转折', suggestedDuration: 20 },
        { name: '最终副歌', description: '视觉高潮', suggestedDuration: 40 },
        { name: '尾奏', description: '收尾', suggestedDuration: 15 }
      ],
      directorStyle: {
        name: 'MV风格',
        colorPalette: ['#9B59B6', '#3498DB', '#E91E63', '#00BCD4'],
        lightingStyle: 'neon',
        cameraStyle: 'dynamic',
        editingPace: 'fast'
      }
    },
    isBuiltIn: true,
    version: '1.0',
    createdAt: '2024-01-01',
    usageCount: 0
  },

  // 动画模板
  {
    id: 'animation_short',
    name: '动画短片',
    description: '适用于2-10分钟的动画短片',
    category: 'animation',
    config: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 24,
      aspectRatio: '16:9',
      defaultPanelDuration: 3,
      defaultStyleId: 'anime_modern',
      exportFormat: 'psd_layers'
    },
    presets: {
      chapters: [
        { name: '开场', description: '世界观建立', suggestedDuration: 1 },
        { name: '角色介绍', description: '主角登场', suggestedDuration: 1 },
        { name: '事件触发', description: '故事开始', suggestedDuration: 2 },
        { name: '冒险/冲突', description: '主要情节', suggestedDuration: 4 },
        { name: '结局', description: '故事收尾', suggestedDuration: 2 }
      ],
      characters: [
        { name: '主角', role: '主角', description: '故事的主要角色', traits: ['勇敢', '善良'] },
        { name: '伙伴', role: '配角', description: '主角的朋友', traits: ['幽默', '忠诚'] },
        { name: '反派', role: '反派', description: '故事的对立面', traits: ['狡猾', '强大'] }
      ],
      directorStyle: {
        name: '动画风格',
        colorPalette: ['#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3'],
        lightingStyle: 'soft',
        cameraStyle: 'animated',
        editingPace: 'medium'
      }
    },
    isBuiltIn: true,
    version: '1.0',
    createdAt: '2024-01-01',
    usageCount: 0
  },

  // 纪录片模板
  {
    id: 'documentary',
    name: '纪录片',
    description: '适用于纪录片项目',
    category: 'documentary',
    config: {
      resolution: { width: 3840, height: 2160 },
      frameRate: 24,
      aspectRatio: '16:9',
      defaultPanelDuration: 4,
      exportFormat: 'davinci_xml'
    },
    presets: {
      chapters: [
        { name: '引入', description: '主题介绍，吸引观众', suggestedDuration: 5 },
        { name: '背景', description: '历史背景和上下文', suggestedDuration: 10 },
        { name: '主体A', description: '第一个主要论点/故事线', suggestedDuration: 15 },
        { name: '主体B', description: '第二个主要论点/故事线', suggestedDuration: 15 },
        { name: '主体C', description: '第三个主要论点/故事线', suggestedDuration: 15 },
        { name: '高潮', description: '情感或信息高潮', suggestedDuration: 10 },
        { name: '结论', description: '总结和反思', suggestedDuration: 10 }
      ],
      scenes: [
        { name: '采访', location: '内景', timeOfDay: '日', description: '人物采访', suggestedShots: ['MCU', 'CU', 'MS'] },
        { name: 'B-Roll', location: '外景', timeOfDay: '日', description: '补充画面', suggestedShots: ['WS', 'MS', 'INSERT', 'AERIAL'] },
        { name: '档案资料', location: '内景', timeOfDay: '日', description: '历史影像', suggestedShots: ['INSERT'] }
      ],
      directorStyle: {
        name: '纪录片风格',
        colorPalette: ['#2C3E50', '#7F8C8D', '#BDC3C7', '#ECF0F1'],
        lightingStyle: 'natural',
        cameraStyle: 'observational',
        editingPace: 'slow'
      }
    },
    isBuiltIn: true,
    version: '1.0',
    createdAt: '2024-01-01',
    usageCount: 0
  },

  // 网剧模板
  {
    id: 'web_series',
    name: '网剧单集',
    description: '适用于20-45分钟的网剧单集',
    category: 'web_series',
    config: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 25,
      aspectRatio: '16:9',
      defaultPanelDuration: 2.5,
      exportFormat: 'premiere_xml'
    },
    presets: {
      chapters: [
        { name: '冷开场', description: '前情提要或悬念开场', suggestedDuration: 2 },
        { name: '片头', description: '片头曲和制作信息', suggestedDuration: 1 },
        { name: '第一幕', description: '本集主线建立', suggestedDuration: 8 },
        { name: '第二幕', description: '冲突发展', suggestedDuration: 12 },
        { name: '第三幕', description: '高潮和部分解决', suggestedDuration: 8 },
        { name: '钩子', description: '下集预告/悬念', suggestedDuration: 2 },
        { name: '片尾', description: '片尾曲和演职员表', suggestedDuration: 2 }
      ],
      directorStyle: {
        name: '网剧风格',
        colorPalette: ['#1E272E', '#485460', '#D2DAE2', '#FF6B81'],
        lightingStyle: 'mixed',
        cameraStyle: 'modern',
        editingPace: 'fast'
      }
    },
    isBuiltIn: true,
    version: '1.0',
    createdAt: '2024-01-01',
    usageCount: 0
  }
];

// ============ 模板管理器 ============

export class TemplateManager {
  private customTemplates: Map<string, ProjectTemplate> = new Map();
  private storageKey = 'project_templates';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const templates = JSON.parse(data) as ProjectTemplate[];
        templates.forEach(t => this.customTemplates.set(t.id, t));
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const templates = Array.from(this.customTemplates.values());
      localStorage.setItem(this.storageKey, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): ProjectTemplate[] {
    return [...BUILT_IN_TEMPLATES, ...Array.from(this.customTemplates.values())];
  }

  /**
   * 按分类获取模板
   */
  getTemplatesByCategory(category: TemplateCategory): ProjectTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * 获取单个模板
   */
  getTemplate(id: string): ProjectTemplate | undefined {
    return BUILT_IN_TEMPLATES.find(t => t.id === id) || this.customTemplates.get(id);
  }

  /**
   * 创建自定义模板
   */
  createTemplate(data: Partial<ProjectTemplate>): ProjectTemplate {
    const id = `custom_${Date.now()}`;
    const template: ProjectTemplate = {
      id,
      name: data.name || '自定义模板',
      description: data.description || '',
      category: data.category || 'custom',
      config: data.config || {
        resolution: { width: 1920, height: 1080 },
        frameRate: 24,
        aspectRatio: '16:9',
        defaultPanelDuration: 3,
        exportFormat: 'fcpxml'
      },
      presets: data.presets || {},
      isBuiltIn: false,
      version: '1.0',
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    this.customTemplates.set(id, template);
    this.saveToStorage();
    return template;
  }

  /**
   * 从现有项目创建模板
   */
  createFromProject(
    projectData: any,
    name: string,
    description: string
  ): ProjectTemplate {
    return this.createTemplate({
      name,
      description,
      category: 'custom',
      config: projectData.config,
      presets: {
        chapters: projectData.chapters?.map((c: any) => ({
          name: c.title,
          description: c.description || '',
          suggestedDuration: c.duration
        })),
        characters: projectData.characters,
        directorStyle: projectData.directorStyle
      }
    });
  }

  /**
   * 更新模板
   */
  updateTemplate(id: string, updates: Partial<ProjectTemplate>): ProjectTemplate | null {
    const template = this.customTemplates.get(id);
    if (!template) return null;

    const updated = { ...template, ...updates };
    this.customTemplates.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * 删除模板
   */
  deleteTemplate(id: string): boolean {
    const result = this.customTemplates.delete(id);
    if (result) this.saveToStorage();
    return result;
  }

  /**
   * 增加使用次数
   */
  incrementUsage(id: string): void {
    const template = this.getTemplate(id);
    if (template && !template.isBuiltIn) {
      template.usageCount++;
      this.saveToStorage();
    }
  }

  /**
   * 导出模板
   */
  exportTemplate(id: string): string | null {
    const template = this.getTemplate(id);
    if (!template) return null;
    return JSON.stringify(template, null, 2);
  }

  /**
   * 导入模板
   */
  importTemplate(json: string): ProjectTemplate | null {
    try {
      const data = JSON.parse(json) as ProjectTemplate;
      return this.createTemplate({
        ...data,
        id: undefined // 生成新ID
      });
    } catch (error) {
      console.error('Failed to import template:', error);
      return null;
    }
  }
}

// ============ 单例导出 ============

export const templateManager = new TemplateManager();

// ============ 分类信息 ============

export const CATEGORY_INFO: Record<TemplateCategory, { name: string; icon: string; description: string }> = {
  film: { name: '电影', icon: '🎬', description: '剧情长片、艺术电影' },
  short: { name: '短片', icon: '🎞️', description: '短片、微电影' },
  commercial: { name: '广告', icon: '📺', description: '电视广告、网络广告' },
  music_video: { name: 'MV', icon: '🎵', description: '音乐视频' },
  animation: { name: '动画', icon: '🎨', description: '动画短片、动画电影' },
  documentary: { name: '纪录片', icon: '📹', description: '纪录片、专题片' },
  web_series: { name: '网剧', icon: '📱', description: '网络剧集' },
  custom: { name: '自定义', icon: '⚙️', description: '用户自定义模板' }
};
