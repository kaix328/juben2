/**
 * 统一提示词生成引擎
 * 整合 promptGenerator.ts 和 promptOptimizer.ts 的功能
 * 提供一致的、可扩展的提示词生成接口
 */

import type { DirectorStyle, Character, Scene, Prop, Costume, StoryboardPanel } from '../types';
import {
  generateCinematicParams,
  generateVideoParams,
  generateNegativePrompt,
  getFocalLengthByShot,
  getLightingByMood,
  getColorTemperatureByTime,
} from './skills';
import { getColorPreset } from './prompts/colorGrading';
import { PromptValidator, sanitizePrompt, deduplicatePrompt } from './validation/promptValidator';
import { 
  SHOT_TYPES, 
  CAMERA_ANGLES, 
  CAMERA_MOVEMENTS,
  getShotTypeByCN,
  getCameraAngleByCN,
  getCameraMovementByCN 
} from '../constants/cinematography';

// ============ 类型定义 ============

/**
 * 提示词元素
 */
interface PromptPart {
  type: 'subject' | 'appearance' | 'style' | 'lighting' | 'mood' | 'technical' | 'quality';
  value: string;
  weight?: number; // 权重，默认1.0
  language?: 'zh' | 'en' | 'mixed'; // 语言标识
}

/**
 * 高级提示词（包含正负提示词和参数）
 */
export interface AdvancedPrompt {
  positive: string; // 正面提示词
  negative: string; // 负面提示词
  weights?: Record<string, number>; // 权重映射
  metadata?: {
    totalParts: number;
    hasStyle: boolean;
    language: 'zh' | 'en' | 'mixed';
  };
}

/**
 * 引擎配置
 */
interface EngineConfig {
  separateLanguages: boolean; // 是否分离中英文
  useWeights: boolean; // 是否使用权重
  includeNegative: boolean; // 是否包含负面提示词
  qualityTags: 'basic' | 'professional' | 'none'; // 质量标签级别
  useProfessionalSkills?: boolean; // 是否使用专业技能库（v2.0新增）
  targetPlatform?: string; // 目标平台（midjourney, stable-diffusion, runway等）
  outputLanguage?: 'zh' | 'en' | 'mixed'; // 🆕 输出语言偏好
  enableValidation?: boolean; // 🆕 是否启用提示词验证
  enableOptimization?: boolean; // 🆕 是否启用提示词优化（去重、精简）
  maxTokens?: number; // 🆕 最大 token 数量限制
}

// ============ 负面提示词库 ============

const NEGATIVE_PROMPTS = {
  general: 'low quality, worst quality, blurry, out of focus, bad art, ugly, watermark, signature, text',
  character: 'deformed, bad anatomy, disfigured, poorly drawn face, mutation, extra limbs, bad proportions, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers',
  scene: 'cluttered, messy, poor composition, bad perspective, distorted, unrealistic lighting',
  storyboard: 'inconsistent style, bad framing, poor cinematography, amateur',
  prop: 'broken, damaged, low detail, pixelated',
  costume: 'ill-fitting, unrealistic, bad texture',
};

// ============ 质量标签库 ============

const QUALITY_TAGS = {
  basic: {
    zh: ['高质量', '清晰'],
    en: ['high quality', 'detailed'],
  },
  professional: {
    zh: ['超高质量', '8K分辨率', '专业级', '精细细节', '完美构图'],
    en: ['masterpiece', 'best quality', '8k', 'ultra detailed', 'professional', 'perfect composition'],
  },
};

// ============ 景别和角度映射（已废弃，使用统一常量）============
// 🔧 已迁移到 cinematography.ts，保留此注释以便追溯

// ============ 提示词生成引擎 ============

export class PromptEngine {
  private style?: DirectorStyle;
  private config: EngineConfig;

  constructor(style?: DirectorStyle, config?: Partial<EngineConfig>) {
    this.style = style;
    this.config = {
      separateLanguages: true,
      useWeights: false, // 默认不使用权重（兼容性）
      includeNegative: true,
      qualityTags: 'professional',
      enableValidation: true, // 🆕 默认启用验证
      enableOptimization: true, // 🆕 默认启用优化
      maxTokens: 150, // 🆕 默认最大 150 tokens
      ...config,
    };
  }

  /**
   * 生成标准化的角色触发词（优化版）
   * 格式: char_[姓名拼音/英文]_[随机Hash]
   * 
   * 优化：
   * - 中文名称转换为拼音首字母
   * - 英文名称保留原样
   * - 确保触发词有意义且易读
   */
  static generateTriggerWord(name: string, characterId: string): string {
    // 移除空格和特殊字符
    const cleanName = name.trim().replace(/\s+/g, '');
    
    // 尝试提取有意义的标识符
    let safeName = '';
    
    // 检查是否包含英文字符
    const hasEnglish = /[a-zA-Z]/.test(cleanName);
    
    if (hasEnglish) {
      // 如果包含英文，提取英文部分
      safeName = cleanName
        .split('')
        .filter(char => /[a-zA-Z0-9]/.test(char))
        .join('')
        .toLowerCase()
        .substring(0, 8);
    } else {
      // 纯中文名称，使用拼音首字母或简化处理
      // 常见姓氏映射（可扩展）
      const surnameMap: Record<string, string> = {
        '张': 'zhang', '王': 'wang', '李': 'li', '刘': 'liu', '陈': 'chen',
        '杨': 'yang', '黄': 'huang', '赵': 'zhao', '周': 'zhou', '吴': 'wu',
        '徐': 'xu', '孙': 'sun', '马': 'ma', '朱': 'zhu', '胡': 'hu',
        '郭': 'guo', '何': 'he', '林': 'lin', '罗': 'luo', '高': 'gao'
      };
      
      // 尝试识别姓氏
      const firstChar = cleanName.charAt(0);
      const surname = surnameMap[firstChar] || 'char';
      
      // 如果名字长度 > 1，添加名字首字母的简化
      if (cleanName.length > 1) {
        const nameChars = cleanName.substring(1, 3); // 取名字的前2个字
        // 简单映射：每个中文字符用其 Unicode 的后3位十六进制表示
        const nameCode = Array.from(nameChars)
          .map(c => c.charCodeAt(0).toString(16).slice(-3))
          .join('')
          .substring(0, 4);
        safeName = `${surname}${nameCode}`;
      } else {
        safeName = surname;
      }
    }
    
    // 如果处理后为空，使用默认值
    if (!safeName) {
      safeName = 'char';
    }
    
    // 确保长度合适
    safeName = safeName.substring(0, 8);
    
    // 取 ID 后 4 位作为 Hash
    const hash = characterId.substring(characterId.length - 4);
    
    return `char_${safeName}_${hash}`;
  }

  // ============ 公共接口 ============

  /**
   * 生成角色全身图提示词
   */
  forCharacterFullBody(character: Character, existingPrompt?: string): AdvancedPrompt {
    const parts: PromptPart[] = [];

    // 基础信息
    if (character.name) {
      parts.push({ type: 'subject', value: character.name, weight: 1.2, language: 'zh' });
    }

    // 注入触发词 (Trigger Word)
    if (character.triggerWord) {
      parts.push({ type: 'subject', value: character.triggerWord, weight: 1.3, language: 'en' });
    }

    if (character.appearance) {
      parts.push({ type: 'appearance', value: character.appearance, weight: 1.1, language: 'zh' });
    }

    // 视图类型
    parts.push({ type: 'technical', value: '全身正视图', language: 'zh' });
    parts.push({ type: 'technical', value: 'full body shot, standing pose, front view', language: 'en' });
    parts.push({ type: 'technical', value: '白色背景', language: 'zh' });
    parts.push({ type: 'technical', value: 'white background, simple background', language: 'en' });

    // 现有提示词
    if (existingPrompt) {
      parts.push({ type: 'style', value: existingPrompt, language: 'mixed' });
    }

    // 导演风格
    if (this.style) {
      parts.push(...this.styleToPromptParts(this.style));
    }

    // 质量标签
    parts.push(...this.getQualityTags());
    parts.push({ type: 'quality', value: 'character design, reference sheet', language: 'en' });

    return this.buildAdvancedPrompt(parts, 'character');
  }

  /**
   * 生成角色脸部图提示词
   */
  forCharacterFace(character: Character, existingPrompt?: string): AdvancedPrompt {
    const parts: PromptPart[] = [];

    // 基础信息
    if (character.name) {
      parts.push({ type: 'subject', value: character.name, weight: 1.2, language: 'zh' });
    }

    // 注入触发词
    if (character.triggerWord) {
      parts.push({ type: 'subject', value: character.triggerWord, weight: 1.3, language: 'en' });
    }

    // 提取面部特征（前3个特征）
    if (character.appearance) {
      const features = character.appearance.split(/[，,]/).slice(0, 3).join('，');
      parts.push({ type: 'appearance', value: features, weight: 1.1, language: 'zh' });
    }

    // 视图类型
    parts.push({ type: 'technical', value: '脸部特写', language: 'zh' });
    parts.push({ type: 'technical', value: 'face close-up, portrait, facial features', language: 'en' });
    parts.push({ type: 'technical', value: '正面视角，中性表情', language: 'zh' });
    parts.push({ type: 'technical', value: 'front view, neutral expression', language: 'en' });

    // 现有提示词
    if (existingPrompt) {
      parts.push({ type: 'style', value: existingPrompt, language: 'mixed' });
    }

    // 导演风格
    if (this.style) {
      parts.push(...this.styleToPromptParts(this.style));
    }

    // 质量标签
    parts.push(...this.getQualityTags());
    parts.push({ type: 'quality', value: 'detailed face, clear eyes, sharp focus', language: 'en' });

    return this.buildAdvancedPrompt(parts, 'character');
  }

  /**
   * 生成场景远景提示词
   */
  forSceneWide(scene: Scene, existingPrompt?: string): AdvancedPrompt {
    const parts: PromptPart[] = [];

    // 场景信息
    if (scene.name) {
      parts.push({ type: 'subject', value: scene.name, weight: 1.2, language: 'zh' });
    }

    if (scene.location) {
      parts.push({ type: 'appearance', value: scene.location, weight: 1.1, language: 'zh' });
    }

    // 景别
    parts.push({ type: 'technical', value: '远景镜头', language: 'zh' });
    parts.push({ type: 'technical', value: 'wide shot, establishing shot, panoramic view', language: 'en' });

    if (scene.environment) {
      parts.push({ type: 'appearance', value: scene.environment, language: 'zh' });
    }

    // 时间和天气
    if (scene.timeOfDay) {
      const timeDesc = this.getTimeOfDayDescription(scene.timeOfDay);
      parts.push({ type: 'lighting', value: timeDesc.zh, language: 'zh' });
      parts.push({ type: 'lighting', value: timeDesc.en, language: 'en' });
    }

    if (scene.weather) {
      parts.push({ type: 'mood', value: `${scene.weather}天气`, language: 'zh' });
    }

    // 现有提示词
    if (existingPrompt) {
      parts.push({ type: 'style', value: existingPrompt, language: 'mixed' });
    }

    // 导演风格
    if (this.style) {
      parts.push(...this.styleToPromptParts(this.style));
    }

    // 质量标签
    parts.push(...this.getQualityTags());
    parts.push({ type: 'quality', value: 'cinematic, detailed environment, atmospheric', language: 'en' });

    return this.buildAdvancedPrompt(parts, 'scene');
  }

  /**
   * 生成场景中景提示词
   */
  forSceneMedium(scene: Scene, existingPrompt?: string): AdvancedPrompt {
    const parts: PromptPart[] = [];

    if (scene.name) {
      parts.push({ type: 'subject', value: scene.name, weight: 1.2, language: 'zh' });
    }

    parts.push({ type: 'technical', value: '中景镜头', language: 'zh' });
    parts.push({ type: 'technical', value: 'medium shot, balanced composition', language: 'en' });

    if (scene.description) {
      parts.push({ type: 'appearance', value: scene.description, weight: 1.1, language: 'zh' });
    }

    if (scene.environment) {
      parts.push({ type: 'appearance', value: scene.environment, language: 'zh' });
    }

    if (scene.timeOfDay) {
      const timeDesc = this.getTimeOfDayDescription(scene.timeOfDay);
      parts.push({ type: 'lighting', value: timeDesc.zh, language: 'zh' });
      parts.push({ type: 'lighting', value: timeDesc.en, language: 'en' });
    }

    if (existingPrompt) {
      parts.push({ type: 'style', value: existingPrompt, language: 'mixed' });
    }

    if (this.style) {
      parts.push(...this.styleToPromptParts(this.style));
    }

    parts.push(...this.getQualityTags());
    parts.push({ type: 'quality', value: 'detailed scene, cinematic lighting', language: 'en' });

    return this.buildAdvancedPrompt(parts, 'scene');
  }

  /**
   * 生成场景特写提示词
   */
  forSceneCloseup(scene: Scene, existingPrompt?: string): AdvancedPrompt {
    const parts: PromptPart[] = [];

    if (scene.name) {
      parts.push({ type: 'subject', value: scene.name, weight: 1.2, language: 'zh' });
    }

    parts.push({ type: 'technical', value: '特写镜头', language: 'zh' });
    parts.push({ type: 'technical', value: 'close-up shot, detail view, focused composition', language: 'en' });

    if (scene.description) {
      parts.push({ type: 'appearance', value: scene.description, weight: 1.1, language: 'zh' });
    }

    if (existingPrompt) {
      parts.push({ type: 'style', value: existingPrompt, language: 'mixed' });
    }

    if (this.style) {
      parts.push(...this.styleToPromptParts(this.style));
    }

    parts.push(...this.getQualityTags());
    parts.push({ type: 'quality', value: 'extreme detail, texture focus, macro photography', language: 'en' });

    return this.buildAdvancedPrompt(parts, 'scene');
  }

  /**
   * 生成道具提示词
   */
  forProp(prop: Prop, existingPrompt?: string): AdvancedPrompt {
    const parts: PromptPart[] = [];

    if (prop.name) {
      parts.push({ type: 'subject', value: prop.name, weight: 1.2, language: 'zh' });
    }

    if (prop.description) {
      parts.push({ type: 'appearance', value: prop.description, weight: 1.1, language: 'zh' });
    }

    if (prop.category) {
      parts.push({ type: 'appearance', value: prop.category, language: 'zh' });
    }

    parts.push({ type: 'technical', value: '产品视图', language: 'zh' });
    parts.push({ type: 'technical', value: 'product view, item showcase, clean composition', language: 'en' });
    parts.push({ type: 'technical', value: '白色背景', language: 'zh' });
    parts.push({ type: 'technical', value: 'white background, studio lighting', language: 'en' });

    if (existingPrompt) {
      parts.push({ type: 'style', value: existingPrompt, language: 'mixed' });
    }

    if (this.style) {
      parts.push(...this.styleToPromptParts(this.style));
    }

    parts.push(...this.getQualityTags());
    parts.push({ type: 'quality', value: 'clear details, professional photography, sharp focus', language: 'en' });

    return this.buildAdvancedPrompt(parts, 'prop');
  }

  /**
   * 生成服饰提示词
   */
  forCostume(costume: Costume, character?: Character, existingPrompt?: string): AdvancedPrompt {
    const parts: PromptPart[] = [];

    if (costume.name) {
      parts.push({ type: 'subject', value: costume.name, weight: 1.2, language: 'zh' });
    }

    if (costume.description) {
      parts.push({ type: 'appearance', value: costume.description, weight: 1.1, language: 'zh' });
    }

    if (costume.style) {
      parts.push({ type: 'style', value: costume.style, language: 'zh' });
    }

    if (character) {
      // 🆕 提取角色关键物理特征
      const physicalTraits: string[] = [];
      
      // 体型和身高
      if (character.bodyType) physicalTraits.push(character.bodyType);
      if (character.height) physicalTraits.push(character.height);
      
      // 发型和发色
      if (character.hairStyle && character.hairColor) {
        physicalTraits.push(`${character.hairColor} ${character.hairStyle}`);
      } else if (character.hairStyle) {
        physicalTraits.push(character.hairStyle);
      } else if (character.hairColor) {
        physicalTraits.push(`${character.hairColor} hair`);
      }
      
      // 肤色（如果有）
      if ((character as any).skinTone) {
        physicalTraits.push((character as any).skinTone);
      }
      
      // 性别和年龄
      if (character.gender) physicalTraits.push(character.gender);
      if (character.age) physicalTraits.push(character.age);

      // 🆕 构建完整的角色+服饰描述
      const characterIdentifier = character.triggerWord || character.name;
      
      if (physicalTraits.length > 0) {
        // 有物理特征，构建详细描述
        const traitsDesc = physicalTraits.join(', ');
        parts.push({
          type: 'subject',
          value: `${characterIdentifier}, ${traitsDesc}, wearing ${costume.name}`,
          weight: 1.3,
          language: 'en'
        });
      } else {
        // 没有物理特征，使用简单描述
        parts.push({
          type: 'subject',
          value: `${characterIdentifier} wearing ${costume.name}`,
          weight: 1.3,
          language: 'en'
        });
      }

      // 🆕 添加角色外貌的关键特征（保持一致性）
      if (character.appearance) {
        // 提取前3个关键特征
        const keyFeatures = character.appearance.split(/[，,]/).slice(0, 3).join(', ');
        parts.push({
          type: 'appearance',
          value: keyFeatures,
          weight: 1.1,
          language: 'mixed'
        });
      }

      // 🆕 添加姿势和视角（服饰展示）
      parts.push({
        type: 'technical',
        value: 'full body shot, fashion pose, standing',
        language: 'en'
      });
      
      parts.push({
        type: 'technical',
        value: 'studio lighting, clean background',
        language: 'en'
      });
    } else {
      // 没有角色信息，使用通用服饰展示
      parts.push({ type: 'technical', value: '服装展示', language: 'zh' });
      parts.push({ type: 'technical', value: 'costume design, fashion showcase, outfit display', language: 'en' });
    }

    if (existingPrompt) {
      parts.push({ type: 'style', value: existingPrompt, language: 'mixed' });
    }

    if (this.style) {
      parts.push(...this.styleToPromptParts(this.style));
    }

    parts.push(...this.getQualityTags());
    parts.push({ type: 'quality', value: 'detailed clothing, fabric texture, professional fashion photography', language: 'en' });

    return this.buildAdvancedPrompt(parts, 'costume');
  }

  /**
   * 生成分镜图片提示词
   */
  forStoryboardImage(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[]
  ): AdvancedPrompt {
    const parts: PromptPart[] = [];

    // 🔧 景别和角度（使用统一常量）
    if (panel.shot) {
      const shotCode = getShotTypeByCN(panel.shot);
      if (shotCode) {
        const shotType = SHOT_TYPES[shotCode];
        parts.push({ type: 'technical', value: shotType.cn, language: 'zh' });
        parts.push({ type: 'technical', value: shotType.promptEn, language: 'en' });
      }
    }

    if (panel.angle) {
      const angleCode = getCameraAngleByCN(panel.angle);
      if (angleCode) {
        const angle = CAMERA_ANGLES[angleCode];
        parts.push({ type: 'technical', value: angle.cn, language: 'zh' });
        parts.push({ type: 'technical', value: angle.promptEn, language: 'en' });
      }
    }

    // 镜头技术参数（焦距 / 光圈 / 景深 / 焦点）
    if (panel.lens || panel.fStop || panel.depthOfField || panel.focusPoint) {
      const techParts: string[] = [];
      if (panel.lens) {
        techParts.push(`${panel.lens} lens`);
      }
      if (panel.fStop) {
        techParts.push(`shot at ${panel.fStop}`);
      }
      if (panel.depthOfField) {
        const dofMap: Record<string, string> = {
          SHALLOW: 'shallow depth of field, blurred background',
          DEEP: 'deep focus, everything in focus',
          SELECTIVE: 'selective focus, subject isolated',
          NORMAL: 'natural depth of field',
        };
        const dofDesc = dofMap[panel.depthOfField];
        if (dofDesc) {
          techParts.push(dofDesc);
        }
      }
      if (panel.focusPoint) {
        techParts.push(`focus on ${panel.focusPoint}`);
      }
      if (techParts.length > 0) {
        parts.push({
          type: 'technical',
          value: techParts.join(', '),
          language: 'en',
        });
      }
    }

    // 画面描述
    if (panel.description) {
      parts.push({ type: 'appearance', value: panel.description, weight: 1.2, language: 'zh' });
    }

    // 构图与镜头意图
    if (panel.composition) {
      parts.push({ type: 'style', value: panel.composition, language: 'zh' });
    }
    if (panel.shotIntent) {
      parts.push({
        type: 'style',
        value: `镜头意图：${panel.shotIntent}`,
        language: 'zh',
      });
    }

    // 角色信息
    if (panel.characters && panel.characters.length > 0) {
      panel.characters.forEach((charName) => {
        if (!charName || !charName.trim()) return;

        const char = characters.find((c) => c.name === charName);
        if (char) {
          // 🆕 生成或获取触发词
          const triggerWord = char.triggerWord || PromptEngine.generateTriggerWord(char.name, char.id);
          
          if (char.appearance) {
            // 清理外观描述，去除重复和首尾标点
            let appearance = char.appearance.trim().replace(/^[,，]+|[,，]+$/g, '');
            // 避免重复名字
            if (appearance.startsWith(charName)) {
              appearance = appearance.substring(charName.length).replace(/^[:：,，]+/, '').trim();
            }
            // 格式：角色名(触发词), 外貌描述
            parts.push({ 
              type: 'subject', 
              value: `${charName}(${triggerWord}), ${appearance}`, 
              weight: 1.1, 
              language: 'zh' 
            });
          } else {
            // 只有角色名和触发词
            parts.push({ 
              type: 'subject', 
              value: `${charName}(${triggerWord})`, 
              language: 'zh' 
            });
          }
        } else {
          // 找不到角色信息，只显示角色名
          parts.push({ type: 'subject', value: charName, language: 'zh' });
        }
      });
    }

    // 道具
    if (panel.props && panel.props.length > 0) {
      const validProps = panel.props.filter(p => p && p.trim());
      if (validProps.length > 0) {
        parts.push({ type: 'appearance', value: `道具: ${validProps.join('、')}`, language: 'zh' });
        parts.push({ type: 'appearance', value: `props: ${validProps.join(', ')}`, language: 'en' });
      }
    }

    // 导演风格
    if (this.style) {
      parts.push(...this.styleToPromptParts(this.style, true)); // 包含镜头风格
    }

    // 🆕 调色风格 (使用专业调色预设库)
    if (panel.colorGrade) {
      const colorPreset = getColorPreset(panel.colorGrade);
      if (colorPreset) {
        parts.push({ type: 'style', value: colorPreset.promptZh, language: 'zh', weight: 1.1 });
        parts.push({ type: 'style', value: colorPreset.promptEn, language: 'en', weight: 1.1 });
      } else {
        // 兼容旧格式（直接字符串描述）
        parts.push({ type: 'style', value: panel.colorGrade, language: 'zh' });
      }
    }

    // 灯光氛围
    if (panel.lighting) {
      if (panel.lighting.mood) {
        parts.push({
          type: 'lighting',
          value: panel.lighting.mood,
          language: 'zh',
        });
      }
      const lightingDetails: string[] = [];
      if (panel.lighting.keyLight) {
        lightingDetails.push(`key light: ${panel.lighting.keyLight}`);
      }
      if (panel.lighting.fillLight) {
        lightingDetails.push(`fill light: ${panel.lighting.fillLight}`);
      }
      if (panel.lighting.backLight) {
        lightingDetails.push(`back light: ${panel.lighting.backLight}`);
      }
      if (panel.lighting.practicalLights && panel.lighting.practicalLights.length > 0) {
        lightingDetails.push(`practical lights: ${panel.lighting.practicalLights.join(', ')}`);
      }
      if (lightingDetails.length > 0) {
        parts.push({
          type: 'lighting',
          value: lightingDetails.join(', '),
          language: 'en',
        });
      }
    }

    // 环境动态与特效
    if (panel.environmentMotion) {
      parts.push({
        type: 'appearance',
        value: `环境动态：${panel.environmentMotion}`,
        language: 'zh',
      });
    }
    if (panel.vfx && panel.vfx.length > 0) {
      parts.push({
        type: 'appearance',
        value: `visual effects: ${panel.vfx.join(', ')}`,
        language: 'en',
      });
    }
    // 声音氛围（转为视觉气氛提示）
    if (panel.soundEffects && panel.soundEffects.length > 0) {
      parts.push({
        type: 'mood',
        value: `音效氛围：${panel.soundEffects.slice(0, 3).join('、')}`,
        language: 'zh',
      });
    }
    if (panel.music) {
      parts.push({
        type: 'mood',
        value: `background music: ${panel.music}`,
        language: 'en',
      });
    }

    // 质量标签
    parts.push(...this.getQualityTags());
    parts.push({ type: 'quality', value: 'cinematic composition, professional storyboard, movie scene', language: 'en' });

    return this.buildAdvancedPrompt(parts, 'storyboard');
  }

  /**
   * 生成分镜视频提示词
   */
  forStoryboardVideo(
    panel: StoryboardPanel,
    characters: Character[],
    scenes?: Scene[],
    prevPanel?: StoryboardPanel
  ): AdvancedPrompt {
    const parts: PromptPart[] = [];

    // 🔧 基本景别与角度（使用统一常量）
    if (panel.shot) {
      const shotCode = getShotTypeByCN(panel.shot);
      if (shotCode) {
        const shotType = SHOT_TYPES[shotCode];
        parts.push({ type: 'technical', value: shotType.cn, language: 'zh' });
        parts.push({ type: 'technical', value: shotType.promptEn, language: 'en' });
      }
    }
    
    if (panel.angle) {
      const angleCode = getCameraAngleByCN(panel.angle);
      if (angleCode) {
        const angle = CAMERA_ANGLES[angleCode];
        parts.push({ type: 'technical', value: angle.cn, language: 'zh' });
        parts.push({ type: 'technical', value: angle.promptEn, language: 'en' });
      }
    }

    // 1. 上下文过渡 (Contextual Transition)
    if (prevPanel && prevPanel.endFrame) {
      parts.push({
        type: 'technical',
        value: `[过渡] 承接上一镜：${prevPanel.endFrame}，画面自然延续`,
        language: 'zh'
      });
    }

    // 2. 转场效果
    if (panel.transition && panel.transition !== '切至') {
      const transitionMap: Record<string, string> = {
        '溶至': '画面溶解过渡，从前一镜渐变融入',
        '淡出': '画面淡出至黑，再淡入新镜',
        '淡入': '从黑色淡入画面',
        '闪白': '画面闪白过渡，强调冲击感',
        '擦除': '画面擦除过渡'
      };
      if (transitionMap[panel.transition]) {
        parts.push({ type: 'technical', value: `[转场] ${transitionMap[panel.transition]}`, language: 'zh' });
      }
    }

    // 🔧 镜头运动（使用统一常量）
    if (panel.cameraMovement) {
      const movementCode = getCameraMovementByCN(panel.cameraMovement);
      if (movementCode) {
        const movement = CAMERA_MOVEMENTS[movementCode];
        parts.push({ type: 'technical', value: movement.cn, language: 'zh' });
        parts.push({ type: 'technical', value: movement.promptEn, language: 'en', weight: 1.2 });
      }
    }

    // 时长
    if (panel.duration) {
      parts.push({ type: 'technical', value: `${panel.duration}秒`, language: 'zh' });
      parts.push({ type: 'technical', value: `${panel.duration} seconds duration`, language: 'en' });
    }

    // 镜头技术参数（焦距 / 光圈 / 景深）
    if (panel.lens || panel.fStop || panel.depthOfField || panel.focusPoint) {
      const techParts: string[] = [];
      if (panel.lens) {
        techParts.push(`${panel.lens} lens`);
      }
      if (panel.fStop) {
        techParts.push(`shot at ${panel.fStop}`);
      }
      if (panel.depthOfField) {
        const dofMap: Record<string, string> = {
          SHALLOW: 'shallow depth of field, blurred background',
          DEEP: 'deep focus, everything in focus',
          SELECTIVE: 'selective focus, subject isolated',
          NORMAL: 'natural depth of field',
        };
        const dofDesc = dofMap[panel.depthOfField];
        if (dofDesc) {
          techParts.push(dofDesc);
        }
      }
      if (panel.focusPoint) {
        techParts.push(`focus on ${panel.focusPoint}`);
      }
      if (techParts.length > 0) {
        parts.push({
          type: 'technical',
          value: techParts.join(', '),
          language: 'en',
        });
      }
    }

    // 动作与画面描述
    if (panel.description) {
      parts.push({ type: 'appearance', value: panel.description, weight: 1.2, language: 'zh' });
    }
    if (panel.shotIntent) {
      parts.push({
        type: 'style',
        value: `镜头意图：${panel.shotIntent}`,
        language: 'zh',
      });
    }
    if (panel.composition) {
      parts.push({ type: 'style', value: panel.composition, language: 'zh' });
    }

    // 角色外观与动作
    if (panel.characters && panel.characters.length > 0) {
      // 1. 角色外观 (Consistency) - 确保视频生成时角色外观一致
      panel.characters.forEach(name => {
        const char = characters.find(c => c.name === name);
        if (char) {
          // 🆕 优化：使用更友好的格式
          const triggerWord = char.triggerWord || PromptEngine.generateTriggerWord(char.name, char.id);
          const appearance = char.standardAppearance || char.appearance;
          
          if (appearance) {
            // 对于视频生成，外观描述要尽量精简（取第一句）
            const briefDesc = appearance.split(/[,，。]/)[0];
            // 格式：角色名(触发词): 外貌描述
            parts.push({ 
              type: 'subject', 
              value: `${char.name}(${triggerWord}): ${briefDesc}`, 
              language: 'zh', 
              weight: 1.0 
            });
          } else {
            // 如果没有外貌描述，只显示角色名和触发词
            parts.push({ 
              type: 'subject', 
              value: `${char.name}(${triggerWord})`, 
              language: 'zh', 
              weight: 1.0 
            });
          }
        }
      });

      // 2. 角色动作：优先使用分镜卡中的 characterActions
      if (panel.characterActions && panel.characterActions.length > 0) {
        const zhActions = panel.characterActions.join('；');
        parts.push({
          type: 'appearance',
          value: `【角色动作】${zhActions}`,
          language: 'zh',
        });
      } else {
        // 否则退化为简单的“in motion”描述
        const charActions = panel.characters.map((name) => {
          const char = characters.find(c => c.name === name);
          return `${char?.triggerWord || name} in motion`;
        }).join(', ');
        parts.push({ type: 'subject', value: charActions, language: 'en', weight: 1.1 });
      }
    }

    // v2.0: 添加专业视频生成参数
    if (this.config.useProfessionalSkills) {
      const videoParams = generateVideoParams({
        movement: this.mapMovementToKey(panel.cameraMovement),
        speed: panel.motionSpeed || 'normal',
        duration: panel.duration,
        mood: this.style?.mood,
        platform: this.config.targetPlatform,
      });

      videoParams.forEach(param => {
        parts.push({ type: 'technical', value: param, language: 'en' });
      });
    }

    // 场景环境 (新增)
    if (scenes) {
      const scene = scenes.find(s => s.id === panel.sceneId);
      if (scene) {
        if (scene.location) parts.push({ type: 'appearance', value: `场景：${scene.location}`, language: 'zh' });
        if (scene.environment) parts.push({ type: 'appearance', value: scene.environment, language: 'zh' });
      }
    }

    // 环境动态 (新增)
    if (panel.environmentMotion) {
      parts.push({ type: 'appearance', value: `【环境动态】${panel.environmentMotion}`, language: 'zh' });
    }

    // 音效氛围 (新增)
    if (panel.soundEffects && panel.soundEffects.length > 0) {
      parts.push({ type: 'mood', value: `【音效氛围】${panel.soundEffects.slice(0, 3).join('、')}`, language: 'zh' });
    }

    // 起始帧 / 结束帧
    if (panel.startFrame) {
      parts.push({
        type: 'technical',
        value: `[起始帧] ${panel.startFrame}`,
        language: 'zh',
      });
    }
    if (panel.endFrame) {
      parts.push({
        type: 'technical',
        value: `[结束帧] ${panel.endFrame}`,
        language: 'zh',
      });
    }

    // 轴线备注
    if (panel.axisNote) {
      parts.push({
        type: 'technical',
        value: `【轴线】${panel.axisNote}`,
        language: 'zh',
      });
    }

    // 导演风格（镜头风格）
    if (this.style) {
      if (this.style.cameraStyle) {
        parts.push({ type: 'style', value: this.style.cameraStyle, language: 'zh' });
      }
      if (this.style.mood) {
        parts.push({ type: 'mood', value: `${this.style.mood}氛围`, language: 'zh' });
        parts.push({ type: 'mood', value: `${this.style.mood} atmosphere`, language: 'en' });
      }
      if (this.style.customPrompt) {
        parts.push({ type: 'style', value: this.style.customPrompt, language: 'en' });
      }
    }

    // 🆕 调色风格 (视频也需要调色一致性)
    if (panel.colorGrade) {
      const colorPreset = getColorPreset(panel.colorGrade);
      if (colorPreset) {
        parts.push({ type: 'style', value: colorPreset.promptZh, language: 'zh', weight: 1.0 });
        parts.push({ type: 'style', value: colorPreset.promptEn, language: 'en', weight: 1.0 });
      } else {
        parts.push({ type: 'style', value: panel.colorGrade, language: 'zh' });
      }
    }

    // 视频质量标签
    parts.push({ type: 'quality', value: 'smooth motion, fluid animation', language: 'en' });
    parts.push({ type: 'quality', value: 'cinematic video, professional cinematography', language: 'en' });

    return this.buildAdvancedPrompt(parts, 'storyboard');
  }

  /**
   * 🆕 静态辅助：根据平台格式化输出
   */
  static formatForPlatform(prompt: string, platform: string): string {
    const parts = prompt.split(', ').map(p => p.trim());
    
    switch (platform) {
      case 'stable-diffusion':
        // Stable Diffusion 格式：纯英文，支持权重语法
        return parts
          .filter(p => !/[\u4e00-\u9fa5]/.test(p)) // 过滤中文
          .join(', ');

      case 'midjourney':
        // Midjourney 格式：纯英文，简洁自然语言，使用 -- 参数
        const mjPrompt = parts
          .filter(p => !/[\u4e00-\u9fa5]/.test(p))
          .filter(p => !p.includes('效果') && !p.includes('标签'))
          .slice(0, 15) // 限制关键词数量
          .join(', ');
        return `${mjPrompt} --ar 16:9 --quality 2 --stylize 500`;

      case 'runway':
        // Runway Gen-3 格式：结构化标签
        return parts.map(p => {
          if (p.startsWith('【')) return p.replace(/【(.+?)】/, '[$1]'); // 把【】转为 []
          return p;
        }).join(', ') + ' --resolution 1280x768 --duration 4s';

      case 'pika':
        // Pika 格式：简洁自然语言
        return parts
          .filter(p => !p.includes('效果') && !p.includes('标签'))
          .slice(0, 10)
          .join('，') + '，高质量视频';

      case 'kling':
        // 可灵格式：支持中文
        return parts.join('，') + ' #视频生成 #电影感';

      case 'doubao':
        // 豆包格式：支持中英文混合
        return prompt; // 保持原样

      case 'comfyui':
        // ComfyUI 格式
        return `positive_prompt: "${parts.filter(p => !p.startsWith('--')).join(', ')}"`;

      default:
        return prompt;
    }
  }

  /**
   * 🆕 获取平台推荐配置
   */
  static getPlatformConfig(platform: string): Partial<EngineConfig> {
    const configs: Record<string, Partial<EngineConfig>> = {
      'stable-diffusion': {
        outputLanguage: 'en',
        maxTokens: 150,
        useWeights: true,
        includeNegative: true,
        enableOptimization: true,
        targetPlatform: 'stable-diffusion',
      },
      'midjourney': {
        outputLanguage: 'en',
        maxTokens: 200,
        useWeights: false,
        includeNegative: false,
        enableOptimization: true,
        targetPlatform: 'midjourney',
      },
      'runway': {
        outputLanguage: 'en',
        maxTokens: 300,
        useWeights: false,
        includeNegative: false,
        enableOptimization: true,
        targetPlatform: 'runway',
      },
      'doubao': {
        outputLanguage: 'mixed',
        maxTokens: 500,
        useWeights: false,
        includeNegative: true,
        enableOptimization: true,
        targetPlatform: 'doubao',
      },
    };

    return configs[platform] || {
      outputLanguage: 'mixed',
      maxTokens: 200,
      enableOptimization: true,
    };
  }

  // ============ 私有辅助方法 ============

  /**
   * 将导演风格转换为提示词部分
   */
  private styleToPromptParts(style: DirectorStyle, includeCameraStyle: boolean = false): PromptPart[] {
    const parts: PromptPart[] = [];

    if (style.artStyle) {
      parts.push({ type: 'style', value: style.artStyle, language: 'zh' });
    }

    if (style.colorTone) {
      parts.push({ type: 'style', value: style.colorTone, language: 'zh' });
    }

    if (style.lightingStyle) {
      parts.push({ type: 'lighting', value: style.lightingStyle, language: 'zh' });
    }

    if (includeCameraStyle && style.cameraStyle) {
      parts.push({ type: 'style', value: style.cameraStyle, language: 'zh' });
    }

    if (style.mood) {
      parts.push({ type: 'mood', value: `${style.mood}氛围`, language: 'zh' });
    }

    if (style.customPrompt) {
      parts.push({ type: 'style', value: style.customPrompt, language: 'en' });
    }

    return parts;
  }

  /**
   * 获取质量标签
   */
  private getQualityTags(): PromptPart[] {
    if (this.config.qualityTags === 'none') return [];

    const tags = QUALITY_TAGS[this.config.qualityTags];
    const parts: PromptPart[] = [];

    tags.zh.forEach((tag) => {
      parts.push({ type: 'quality', value: tag, language: 'zh' });
    });

    tags.en.forEach((tag) => {
      parts.push({ type: 'quality', value: tag, language: 'en' });
    });

    return parts;
  }

  /**
   * 获取时间段描述
   */
  private getTimeOfDayDescription(timeOfDay: 'day' | 'night' | 'dawn' | 'dusk'): { zh: string; en: string } {
    const descriptions = {
      day: { zh: '白天，明亮的自然光', en: 'daytime, bright natural light, sunny' },
      night: { zh: '夜晚，月光或灯光照明', en: 'nighttime, moonlight, artificial lighting' },
      dawn: { zh: '黎明，柔和的晨光', en: 'dawn, soft morning light, sunrise' },
      dusk: { zh: '黄昏，温暖的夕阳光线', en: 'dusk, golden hour, warm sunset light' },
    };
    return descriptions[timeOfDay] || { zh: '', en: '' };
  }

  /**
   * 构建高级提示词
   */
  private buildAdvancedPrompt(parts: PromptPart[], category: keyof typeof NEGATIVE_PROMPTS): AdvancedPrompt {
    // 分离中英文
    const zhParts: string[] = [];
    const enParts: string[] = [];
    const mixedParts: string[] = [];
    const weights: Record<string, number> = {};

    // 🆕 语言过滤
    const targetLang = this.config.outputLanguage || 'mixed';

    parts.forEach((part) => {
      if (!part.value) return;

      const value = part.value.trim();
      if (!value) return;

      // 语言过滤逻辑
      if (targetLang === 'zh' && part.language === 'en') return;
      if (targetLang === 'en' && part.language === 'zh') return;

      // 收集权重
      if (this.config.useWeights && part.weight && part.weight !== 1.0) {
        weights[value] = part.weight;
      }

      // 根据语言分类 (用于排序)
      if (part.language === 'zh') {
        zhParts.push(value);
      } else if (part.language === 'en') {
        enParts.push(value);
      } else {
        mixedParts.push(value);
      }
    });

    // 构建最终提示词
    let positive: string;
    if (this.config.separateLanguages) {
      // 中文在前，英文在后
      positive = [...zhParts, ...mixedParts, ...enParts].join(', ');
    } else {
      // 混合排列
      positive = [...zhParts, ...enParts, ...mixedParts].join(', ');
    }

    // 🆕 优化提示词（去重、精简）
    if (this.config.enableOptimization) {
      // 1. 清理和规范化
      positive = sanitizePrompt(positive);
      
      // 2. 去重
      positive = deduplicatePrompt(positive);
      
      // 3. 截断到最大长度
      if (this.config.maxTokens) {
        positive = PromptValidator.truncate(positive, this.config.maxTokens);
      }
      
      // 4. 平台适配
      if (this.config.targetPlatform) {
        positive = PromptEngine.formatForPlatform(positive, this.config.targetPlatform);
      }
    }

    // 🆕 验证提示词质量
    if (this.config.enableValidation) {
      const validation = PromptValidator.validate(positive, this.config.targetPlatform);
      if (!validation.isValid) {
        console.warn('[PromptEngine] 提示词验证失败:', validation.issues);
      }
      if (validation.warnings.length > 0) {
        console.warn('[PromptEngine] 提示词警告:', validation.warnings);
      }
    }

    // v2.0: 使用专业负面提示词库
    let negative: string;
    if (this.config.includeNegative) {
      if (this.config.useProfessionalSkills) {
        // 使用专业负面提示词库
        negative = generateNegativePrompt({
          type: category as any,
          platform: this.config.targetPlatform,
          style: this.style?.artStyle,
        });
      } else {
        // 使用原有简单负面提示词
        negative = `${NEGATIVE_PROMPTS.general}, ${NEGATIVE_PROMPTS[category]}`;
      }
    } else {
      negative = '';
    }

    // 元数据
    const metadata = {
      totalParts: parts.length,
      hasStyle: !!this.style,
      language: (zhParts.length > 0 && enParts.length > 0
        ? 'mixed'
        : zhParts.length > 0
          ? 'zh'
          : 'en') as 'zh' | 'en' | 'mixed',
    };

    return {
      positive,
      negative,
      weights: Object.keys(weights).length > 0 ? weights : undefined,
      metadata,
    };
  }
  /**
   * 映射镜头运动到键名
   */
  private mapMovementToKey(movement?: string): string {
    const map: Record<string, string> = {
      '静止': 'static',
      '推镜': 'dollyIn',
      '拉镜': 'dollyOut',
      '摇镜': 'panRight',
      '移镜': 'trackRight',
      '跟镜': 'follow',
      '升降': 'craneUp',
      '环绕': 'orbit',
    };
    return movement ? (map[movement] || 'static') : 'static';
  }
}

// ============ 导出便捷函数（向后兼容） ============

/**
 * 创建默认引擎实例
 */
export function createPromptEngine(style?: DirectorStyle, config?: Partial<EngineConfig>): PromptEngine {
  return new PromptEngine(style, config);
}

/**
 * 快速生成角色提示词（兼容旧API）
 */
export function generateCharacterPrompt(character: Character, directorStyle?: DirectorStyle): string {
  const engine = new PromptEngine(directorStyle, { includeNegative: false });
  return engine.forCharacterFullBody(character).positive;
}

/**
 * 快速生成场景提示词（兼容旧API）
 */
export function generateScenePrompt(scene: Scene, directorStyle?: DirectorStyle): string {
  const engine = new PromptEngine(directorStyle, { includeNegative: false });
  return engine.forSceneWide(scene).positive;
}

/**
 * 快速生成分镜图片提示词（兼容旧API）
 */
export function generateStoryboardImagePrompt(
  panel: StoryboardPanel,
  characters: Character[],
  scenes: Scene[],
  directorStyle?: DirectorStyle
): string {
  const engine = new PromptEngine(directorStyle, { includeNegative: false });
  return engine.forStoryboardImage(panel, characters, scenes).positive;
}

/**
 * 快速生成分镜视频提示词（兼容旧API）
 */
export function generateStoryboardVideoPrompt(
  panel: StoryboardPanel,
  characters: Character[],
  directorStyle?: DirectorStyle
): string {
  const engine = new PromptEngine(directorStyle, { includeNegative: false });
  return engine.forStoryboardVideo(panel, characters).positive;
}
