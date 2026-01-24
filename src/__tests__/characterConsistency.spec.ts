/**
 * 角色一致性管理系统测试（简化版）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  characterManager,
  generateCharacterSummary,
  validateCharacterProfile,
  calculateCharacterSimilarity,
  APPEARANCE_PRESETS,
  type CharacterProfile,
} from '../app/utils/characterConsistency';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CharacterManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // 清空所有角色
    const allChars = characterManager.getAllCharacters();
    allChars.forEach(char => characterManager.deleteCharacter(char.id));
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('基本操作', () => {
    it('应该能创建角色', () => {
      const character = characterManager.createCharacter({
        name: '张三',
        description: '主角'
      });

      expect(character.id).toBeDefined();
      expect(character.name).toBe('张三');
      expect(character.description).toBe('主角');
    });

    it('应该能获取角色', () => {
      const created = characterManager.createCharacter({ name: '测试' });
      const retrieved = characterManager.getCharacter(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('测试');
    });

    it('应该能更新角色', () => {
      const character = characterManager.createCharacter({ name: '原名' });
      characterManager.updateCharacter(character.id, { name: '新名' });

      const updated = characterManager.getCharacter(character.id);
      expect(updated?.name).toBe('新名');
    });

    it('应该能删除角色', () => {
      const character = characterManager.createCharacter({ name: '待删除' });
      characterManager.deleteCharacter(character.id);

      expect(characterManager.getCharacter(character.id)).toBeUndefined();
    });

    it('应该能获取所有角色', () => {
      characterManager.createCharacter({ name: '角色1' });
      characterManager.createCharacter({ name: '角色2' });

      const all = characterManager.getAllCharacters();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('AI提示词生成', () => {
    it('应该生成提示词', () => {
      const character = characterManager.createCharacter({
        name: '测试',
        appearance: {
          gender: 'female',
          ageRange: '20-30',
          face: {
            shape: '椭圆形',
            eyeColor: '蓝色',
            eyeShape: '杏眼',
            skinTone: '白皙'
          },
          hair: {
            color: '金色',
            length: '长发',
            style: '波浪'
          },
          body: {
            height: '中等',
            build: '标准'
          }
        }
      });

      const { positive, negative } = characterManager.generatePrompt(character.id);

      expect(positive).toContain('1girl');
      expect(positive).toBeDefined();
      expect(negative).toBeDefined();
    });

    it('生成提示词应增加使用次数', () => {
      const character = characterManager.createCharacter({ name: '测试' });
      expect(character.usageCount).toBe(0);

      characterManager.generatePrompt(character.id);
      const updated = characterManager.getCharacter(character.id);
      expect(updated?.usageCount).toBe(1);
    });
  });

  describe('搜索功能', () => {
    beforeEach(() => {
      characterManager.createCharacter({ name: '张三', description: '主角' });
      characterManager.createCharacter({ name: '李四', description: '配角' });
    });

    it('应该能搜索角色', () => {
      const results = characterManager.searchCharacters('张三');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('张三');
    });

    it('没有匹配应返回空数组', () => {
      const results = characterManager.searchCharacters('不存在');
      expect(results).toHaveLength(0);
    });
  });
});

describe('工具函数', () => {
  describe('validateCharacterProfile', () => {
    it('空名称应返回错误', () => {
      const errors = validateCharacterProfile({ name: '' });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('有效数据应返回空数组', () => {
      const errors = validateCharacterProfile({
        name: '测试角色',
        description: '描述'
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('generateCharacterSummary', () => {
    it('应该生成摘要', () => {
      const character: CharacterProfile = {
        id: 'test',
        name: '测试',
        aliases: [],
        description: '',
        appearance: {
          gender: 'female',
          ageRange: '20-30',
          hair: {
            color: '黑色',
            length: '长发',
            style: '自然'
          }
        },
        referenceImages: [],
        aiConfig: {
          positivePrompt: '',
          negativePrompt: '',
          faceRestoration: true,
          faceConsistencyStrength: 0.8
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0
      };

      const summary = generateCharacterSummary(character);
      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCharacterSimilarity', () => {
    const char1: CharacterProfile = {
      id: '1',
      name: '角色1',
      aliases: [],
      description: '',
      appearance: {
        gender: 'female',
        ageRange: '20-30',
        face: { shape: '', eyeColor: '蓝色', eyeShape: '', skinTone: '' },
        hair: { color: '金色', length: '', style: '' },
        body: { height: '', build: '' }
      },
      referenceImages: [],
      aiConfig: {
        positivePrompt: '',
        negativePrompt: '',
        faceRestoration: true,
        faceConsistencyStrength: 0.8
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0
    };

    it('相同角色应该相似度为1', () => {
      const similarity = calculateCharacterSimilarity(char1, char1);
      expect(similarity).toBe(1);
    });

    it('不同角色应该有不同相似度', () => {
      const char2: CharacterProfile = {
        ...char1,
        id: '2',
        appearance: {
          gender: 'male',
          ageRange: '40-50',
          face: { shape: '', eyeColor: '黑色', eyeShape: '', skinTone: '' },
          hair: { color: '黑色', length: '', style: '' },
          body: { height: '', build: '' }
        }
      };

      const similarity = calculateCharacterSimilarity(char1, char2);
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });
});

describe('APPEARANCE_PRESETS', () => {
  it('应该包含预设选项', () => {
    expect(APPEARANCE_PRESETS.faceShapes).toBeDefined();
    expect(APPEARANCE_PRESETS.eyeColors).toBeDefined();
    expect(APPEARANCE_PRESETS.hairColors).toBeDefined();
    expect(APPEARANCE_PRESETS.faceShapes.length).toBeGreaterThan(0);
  });
});
