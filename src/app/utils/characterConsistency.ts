/**
 * 角色一致性管理系统
 * 管理角色档案、外观特征、AI配置等
 */

// ============ 类型定义 ============

export interface ReferenceImage {
  id: string;
  url: string;
  type: 'face' | 'full_body' | 'outfit' | 'expression';
  isPrimary: boolean;
  uploadedAt: number;
}

export interface CharacterAppearance {
  gender: 'male' | 'female' | 'other';
  ageRange: string;
  face?: {
    shape: string;
    eyeColor: string;
    eyeShape: string;
    skinTone: string;
  };
  hair?: {
    color: string;
    length: string;
    style: string;
  };
  body?: {
    height: string;
    build: string;
  };
}

export interface LoRAModel {
  modelName: string;
  triggerWord: string;
  weight: number;
}

export interface AIConfig {
  loraModel?: LoRAModel;
  positivePrompt: string;
  negativePrompt: string;
  faceRestoration: boolean;
  faceConsistencyStrength: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  appearance: CharacterAppearance;
  referenceImages: ReferenceImage[];
  aiConfig: AIConfig;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
}

// ============ 外观预设 ============

export const APPEARANCE_PRESETS = {
  faceShapes: ['椭圆形', '圆形', '方形', '心形', '长形', '菱形'],
  eyeColors: ['黑色', '棕色', '蓝色', '绿色', '灰色', '琥珀色'],
  eyeShapes: ['杏眼', '丹凤眼', '圆眼', '桃花眼', '狐狸眼', '下垂眼'],
  skinTones: ['白皙', '自然肤色', '小麦色', '古铜色', '深色'],
  hairColors: ['黑色', '棕色', '金色', '红色', '银色', '白色', '彩色'],
  hairLengths: ['短发', '中等', '长发', '超长'],
  hairStyles: ['自然', '直发', '卷发', '波浪', '马尾', '双马尾', '丸子头', '编发'],
  heights: ['矮小', '中等', '高挑', '很高'],
  bodyBuilds: ['纤细', '标准', '健壮', '魁梧', '丰满']
};

// ============ 角色管理器 ============

class CharacterManager {
  private characters: Map<string, CharacterProfile> = new Map();
  private storageKey = 'character_profiles';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const profiles = JSON.parse(data) as CharacterProfile[];
        profiles.forEach(profile => {
          this.characters.set(profile.id, profile);
        });
      }
    } catch (e) {
      console.error('加载角色档案失败:', e);
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage() {
    try {
      const profiles = Array.from(this.characters.values());
      localStorage.setItem(this.storageKey, JSON.stringify(profiles));
    } catch (e) {
      console.error('保存角色档案失败:', e);
    }
  }

  /**
   * 创建角色
   */
  createCharacter(data: Partial<CharacterProfile>): CharacterProfile {
    const id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const character: CharacterProfile = {
      id,
      name: data.name || '未命名角色',
      aliases: data.aliases || [],
      description: data.description || '',
      appearance: data.appearance || {
        gender: 'other',
        ageRange: '20-30',
        face: {
          shape: '椭圆形',
          eyeColor: '黑色',
          eyeShape: '杏眼',
          skinTone: '自然肤色'
        },
        hair: {
          color: '黑色',
          length: '中等',
          style: '自然'
        },
        body: {
          height: '中等',
          build: '标准'
        }
      },
      referenceImages: data.referenceImages || [],
      aiConfig: data.aiConfig || {
        positivePrompt: '',
        negativePrompt: '',
        faceRestoration: true,
        faceConsistencyStrength: 0.8
      },
      createdAt: now,
      updatedAt: now,
      usageCount: 0
    };

    this.characters.set(id, character);
    this.saveToStorage();
    return character;
  }

  /**
   * 获取角色
   */
  getCharacter(id: string): CharacterProfile | undefined {
    return this.characters.get(id);
  }

  /**
   * 获取所有角色
   */
  getAllCharacters(): CharacterProfile[] {
    return Array.from(this.characters.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 更新角色
   */
  updateCharacter(id: string, updates: Partial<CharacterProfile>): boolean {
    const character = this.characters.get(id);
    if (!character) return false;

    const updated = {
      ...character,
      ...updates,
      id: character.id, // 保持ID不变
      createdAt: character.createdAt, // 保持创建时间不变
      updatedAt: Date.now()
    };

    this.characters.set(id, updated);
    this.saveToStorage();
    return true;
  }

  /**
   * 删除角色
   */
  deleteCharacter(id: string): boolean {
    const deleted = this.characters.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * 增加使用次数
   */
  incrementUsage(id: string) {
    const character = this.characters.get(id);
    if (character) {
      character.usageCount++;
      character.updatedAt = Date.now();
      this.saveToStorage();
    }
  }

  /**
   * 生成AI提示词
   */
  generatePrompt(id: string): { positive: string; negative: string } {
    const character = this.characters.get(id);
    if (!character) {
      return { positive: '', negative: '' };
    }

    const { appearance, aiConfig } = character;
    const parts: string[] = [];

    // 基本信息
    if (appearance.gender === 'male') {
      parts.push('1boy');
    } else if (appearance.gender === 'female') {
      parts.push('1girl');
    }

    // LoRA 触发词
    if (aiConfig.loraModel) {
      parts.push(aiConfig.loraModel.triggerWord);
    }

    // 面部特征
    if (appearance.face) {
      const { eyeColor, eyeShape, skinTone } = appearance.face;
      parts.push(`${eyeColor} eyes`);
      parts.push(`${eyeShape}`);
      parts.push(`${skinTone} skin`);
    }

    // 发型
    if (appearance.hair) {
      const { color, length, style } = appearance.hair;
      parts.push(`${color} hair`);
      parts.push(`${length} hair`);
      if (style !== '自然') {
        parts.push(`${style}`);
      }
    }

    // 体型
    if (appearance.body) {
      const { height, build } = appearance.body;
      if (height !== '中等') {
        parts.push(`${height}`);
      }
      if (build !== '标准') {
        parts.push(`${build} build`);
      }
    }

    // 年龄
    parts.push(`${appearance.ageRange} years old`);

    // 额外的正向提示词
    if (aiConfig.positivePrompt) {
      parts.push(aiConfig.positivePrompt);
    }

    // 质量标签
    parts.push('best quality', 'high quality', 'detailed');

    const positive = parts.join(', ');

    // 负向提示词
    const negative = aiConfig.negativePrompt || 
      'low quality, worst quality, bad anatomy, bad hands, missing fingers, extra fingers, blurry, cropped';

    // 增加使用次数
    this.incrementUsage(id);

    return { positive, negative };
  }

  /**
   * 添加参考图片
   */
  addReferenceImage(
    characterId: string,
    url: string,
    type: ReferenceImage['type'],
    isPrimary: boolean = false
  ): boolean {
    const character = this.characters.get(characterId);
    if (!character) return false;

    const image: ReferenceImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      type,
      isPrimary,
      uploadedAt: Date.now()
    };

    // 如果设为主图，取消其他主图
    if (isPrimary) {
      character.referenceImages.forEach(img => {
        img.isPrimary = false;
      });
    }

    character.referenceImages.push(image);
    character.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  /**
   * 删除参考图片
   */
  removeReferenceImage(characterId: string, imageId: string): boolean {
    const character = this.characters.get(characterId);
    if (!character) return false;

    const index = character.referenceImages.findIndex(img => img.id === imageId);
    if (index === -1) return false;

    character.referenceImages.splice(index, 1);
    character.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  /**
   * 导出角色
   */
  exportCharacter(id: string): string | null {
    const character = this.characters.get(id);
    if (!character) return null;

    return JSON.stringify(character, null, 2);
  }

  /**
   * 导入角色
   */
  importCharacter(json: string): CharacterProfile | null {
    try {
      const data = JSON.parse(json) as CharacterProfile;
      
      // 生成新ID避免冲突
      const newId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const character: CharacterProfile = {
        ...data,
        id: newId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0
      };

      this.characters.set(newId, character);
      this.saveToStorage();
      return character;
    } catch (e) {
      console.error('导入角色失败:', e);
      return null;
    }
  }

  /**
   * 搜索角色
   */
  searchCharacters(query: string): CharacterProfile[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllCharacters().filter(char =>
      char.name.toLowerCase().includes(lowerQuery) ||
      char.aliases.some(alias => alias.toLowerCase().includes(lowerQuery)) ||
      char.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取最常用的角色
   */
  getMostUsedCharacters(limit: number = 5): CharacterProfile[] {
    return this.getAllCharacters()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }
}

// ============ 工具函数 ============

/**
 * 生成角色摘要
 */
export function generateCharacterSummary(character: CharacterProfile): string {
  const { appearance } = character;
  const parts: string[] = [];

  if (appearance.gender === 'male') {
    parts.push('男性');
  } else if (appearance.gender === 'female') {
    parts.push('女性');
  }

  parts.push(appearance.ageRange + '岁');

  if (appearance.hair) {
    parts.push(appearance.hair.color + appearance.hair.length);
  }

  return parts.join(' · ');
}

/**
 * 验证角色数据
 */
export function validateCharacterProfile(data: Partial<CharacterProfile>): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('角色名称不能为空');
  }

  if (data.name && data.name.length > 50) {
    errors.push('角色名称不能超过50个字符');
  }

  if (data.description && data.description.length > 1000) {
    errors.push('角色描述不能超过1000个字符');
  }

  return errors;
}

/**
 * 比较两个角色的相似度
 */
export function calculateCharacterSimilarity(
  char1: CharacterProfile,
  char2: CharacterProfile
): number {
  let score = 0;
  let total = 0;

  // 比较性别
  total++;
  if (char1.appearance.gender === char2.appearance.gender) {
    score++;
  }

  // 比较年龄范围
  total++;
  if (char1.appearance.ageRange === char2.appearance.ageRange) {
    score++;
  }

  // 比较发色
  if (char1.appearance.hair && char2.appearance.hair) {
    total++;
    if (char1.appearance.hair.color === char2.appearance.hair.color) {
      score++;
    }
  }

  // 比较眼睛颜色
  if (char1.appearance.face && char2.appearance.face) {
    total++;
    if (char1.appearance.face.eyeColor === char2.appearance.face.eyeColor) {
      score++;
    }
  }

  return total > 0 ? score / total : 0;
}

// ============ 导出单例 ============

export const characterManager = new CharacterManager();

export default characterManager;
