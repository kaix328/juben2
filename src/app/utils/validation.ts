import type { Character, Scene, Prop, Costume } from '../types';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 验证角色数据
 */
export function validateCharacter(character: Partial<Character>): void {
  // 名称验证
  if (!character.name || character.name.trim().length === 0) {
    throw new ValidationError('角色名称不能为空', 'name', 'REQUIRED');
  }
  if (character.name.length > 100) {
    throw new ValidationError('角色名称不能超过100个字符', 'name', 'MAX_LENGTH');
  }

  // 描述验证
  if (character.description && character.description.length > 5000) {
    throw new ValidationError('角色描述不能超过5000个字符', 'description', 'MAX_LENGTH');
  }

  // 外貌验证
  if (character.appearance && character.appearance.length > 1000) {
    throw new ValidationError('外貌描述不能超过1000个字符', 'appearance', 'MAX_LENGTH');
  }

  // 性格验证
  if (character.personality && character.personality.length > 1000) {
    throw new ValidationError('性格描述不能超过1000个字符', 'personality', 'MAX_LENGTH');
  }

  // 提示词验证
  if (character.fullBodyPrompt && character.fullBodyPrompt.length > 2000) {
    throw new ValidationError('全身提示词不能超过2000个字符', 'fullBodyPrompt', 'MAX_LENGTH');
  }
  if (character.facePrompt && character.facePrompt.length > 2000) {
    throw new ValidationError('面部提示词不能超过2000个字符', 'facePrompt', 'MAX_LENGTH');
  }

  // 标签验证
  if (character.tags) {
    if (character.tags.length > 20) {
      throw new ValidationError('标签数量不能超过20个', 'tags', 'MAX_COUNT');
    }
    character.tags.forEach((tag, index) => {
      if (tag.length > 50) {
        throw new ValidationError(`标签"${tag}"长度不能超过50个字符`, `tags[${index}]`, 'MAX_LENGTH');
      }
    });
  }
}

/**
 * 验证场景数据
 */
export function validateScene(scene: Partial<Scene>): void {
  if (!scene.name || scene.name.trim().length === 0) {
    throw new ValidationError('场景名称不能为空', 'name', 'REQUIRED');
  }
  if (scene.name.length > 100) {
    throw new ValidationError('场景名称不能超过100个字符', 'name', 'MAX_LENGTH');
  }

  if (scene.description && scene.description.length > 5000) {
    throw new ValidationError('场景描述不能超过5000个字符', 'description', 'MAX_LENGTH');
  }

  if (scene.location && scene.location.length > 200) {
    throw new ValidationError('地点描述不能超过200个字符', 'location', 'MAX_LENGTH');
  }

  if (scene.environment && scene.environment.length > 2000) {
    throw new ValidationError('环境描述不能超过2000个字符', 'environment', 'MAX_LENGTH');
  }

  // 提示词验证
  const prompts = ['widePrompt', 'mediumPrompt', 'closeupPrompt'] as const;
  prompts.forEach(prompt => {
    if (scene[prompt] && scene[prompt]!.length > 2000) {
      throw new ValidationError(`${prompt}不能超过2000个字符`, prompt, 'MAX_LENGTH');
    }
  });

  if (scene.tags && scene.tags.length > 20) {
    throw new ValidationError('标签数量不能超过20个', 'tags', 'MAX_COUNT');
  }
}

/**
 * 验证道具数据
 */
export function validateProp(prop: Partial<Prop>): void {
  if (!prop.name || prop.name.trim().length === 0) {
    throw new ValidationError('道具名称不能为空', 'name', 'REQUIRED');
  }
  if (prop.name.length > 100) {
    throw new ValidationError('道具名称不能超过100个字符', 'name', 'MAX_LENGTH');
  }

  if (prop.description && prop.description.length > 2000) {
    throw new ValidationError('道具描述不能超过2000个字符', 'description', 'MAX_LENGTH');
  }

  if (prop.category && prop.category.length > 50) {
    throw new ValidationError('类别名称不能超过50个字符', 'category', 'MAX_LENGTH');
  }

  if (prop.aiPrompt && prop.aiPrompt.length > 2000) {
    throw new ValidationError('提示词不能超过2000个字符', 'aiPrompt', 'MAX_LENGTH');
  }

  if (prop.tags && prop.tags.length > 20) {
    throw new ValidationError('标签数量不能超过20个', 'tags', 'MAX_COUNT');
  }
}

/**
 * 验证服装数据
 */
export function validateCostume(costume: Partial<Costume>): void {
  if (!costume.name || costume.name.trim().length === 0) {
    throw new ValidationError('服装名称不能为空', 'name', 'REQUIRED');
  }
  if (costume.name.length > 100) {
    throw new ValidationError('服装名称不能超过100个字符', 'name', 'MAX_LENGTH');
  }

  if (!costume.characterId) {
    throw new ValidationError('必须指定所属角色', 'characterId', 'REQUIRED');
  }

  if (costume.description && costume.description.length > 2000) {
    throw new ValidationError('服装描述不能超过2000个字符', 'description', 'MAX_LENGTH');
  }

  if (costume.style && costume.style.length > 100) {
    throw new ValidationError('款式描述不能超过100个字符', 'style', 'MAX_LENGTH');
  }

  if (costume.aiPrompt && costume.aiPrompt.length > 2000) {
    throw new ValidationError('提示词不能超过2000个字符', 'aiPrompt', 'MAX_LENGTH');
  }

  if (costume.tags && costume.tags.length > 20) {
    throw new ValidationError('标签数量不能超过20个', 'tags', 'MAX_COUNT');
  }
}

/**
 * 验证图片URL
 */
export function validateImageUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:', 'data:', 'blob:'];
    return validProtocols.includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * 验证标签
 */
export function validateTag(tag: string): void {
  if (!tag || tag.trim().length === 0) {
    throw new ValidationError('标签不能为空', 'tag', 'REQUIRED');
  }
  if (tag.length > 50) {
    throw new ValidationError('标签长度不能超过50个字符', 'tag', 'MAX_LENGTH');
  }
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(tag)) {
    throw new ValidationError('标签只能包含中文、英文、数字、下划线和连字符', 'tag', 'INVALID_FORMAT');
  }
}

/**
 * 批量验证
 */
export function validateBatch<T>(
  items: T[],
  validator: (item: T) => void
): { valid: T[]; invalid: Array<{ item: T; error: ValidationError }> } {
  const valid: T[] = [];
  const invalid: Array<{ item: T; error: ValidationError }> = [];

  items.forEach(item => {
    try {
      validator(item);
      valid.push(item);
    } catch (error) {
      if (error instanceof ValidationError) {
        invalid.push({ item, error });
      } else {
        throw error;
      }
    }
  });

  return { valid, invalid };
}

/**
 * 安全的数据清理
 */
export function sanitizeString(str: string, maxLength?: number): string {
  let cleaned = str
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
    .replace(/\s+/g, ' '); // 合并多个空格

  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * 验证并清理数据
 */
export function validateAndSanitizeCharacter(character: Partial<Character>): Character {
  // 先清理数据
  const sanitized = {
    ...character,
    name: sanitizeString(character.name || '', 100),
    description: sanitizeString(character.description || '', 5000),
    appearance: sanitizeString(character.appearance || '', 1000),
    personality: sanitizeString(character.personality || '', 1000),
    fullBodyPrompt: sanitizeString(character.fullBodyPrompt || '', 2000),
    facePrompt: sanitizeString(character.facePrompt || '', 2000),
    tags: character.tags?.map(tag => sanitizeString(tag, 50)).filter(Boolean) || [],
  };

  // 再验证
  validateCharacter(sanitized);

  return sanitized as Character;
}
