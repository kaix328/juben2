/**
 * 提示词生成函数测试
 */
import { describe, it, expect } from 'vitest';
import {
  generateCharacterPrompt,
  generateScenePrompt,
  generateStoryboardImagePrompt,
  generateNegativePrompt,
  applyPromptWeight,
} from '../../app/utils/prompts';
import type { Character, Scene, StoryboardPanel, DirectorStyle } from '../../app/types';

describe('提示词生成函数', () => {
  // 测试数据
  const mockCharacter: Character = {
    id: 'char-1',
    name: '李明',
    appearance: '黑色短发，戴眼镜，身穿白色衬衫',
    personality: '沉稳内敛',
    triggerWord: 'liming_character',
  };

  const mockScene: Scene = {
    id: 'scene-1',
    name: '咖啡厅',
    location: '现代都市咖啡厅',
    environment: '温馨的室内环境，暖色调灯光',
    description: '一家装修精致的咖啡厅，木质桌椅，落地窗',
    timeOfDay: '下午',
  };

  const mockPanel: StoryboardPanel = {
    id: 'panel-1',
    panelNumber: 1,
    sceneId: 'scene-1',
    description: '李明坐在咖啡厅窗边，望着窗外',
    characters: ['李明'],
    shotSize: 'MS',
    angle: 'EYE_LEVEL',
    duration: 3,
  };

  const mockDirectorStyle: DirectorStyle = {
    artStyle: '写实主义',
    colorTone: '温暖柔和色调',
    lightingStyle: '自然柔和光线',
    cameraStyle: '电影级镜头',
    mood: '温馨治愈',
    customPrompt: '',
    negativePrompt: '变形, 模糊',
    aspectRatio: '16:9',
  };

  describe('applyPromptWeight', () => {
    it('应该正确应用权重', () => {
      const result = applyPromptWeight('关键词', 1.5);
      expect(result).toBe('(关键词:1.5)');
    });

    it('权重为1.0时应返回原文本', () => {
      const result = applyPromptWeight('关键词', 1.0);
      expect(result).toBe('关键词');
    });
  });

  describe('generateCharacterPrompt', () => {
    it('应该生成包含角色名称的提示词', () => {
      const result = generateCharacterPrompt(mockCharacter);
      expect(result).toContain('李明');
    });

    it('应该包含外貌描述', () => {
      const result = generateCharacterPrompt(mockCharacter);
      expect(result).toContain('黑色短发');
    });

    it('应该包含质量标签', () => {
      const result = generateCharacterPrompt(mockCharacter);
      expect(result).toContain('高品质');
    });

    it('应用导演风格时应包含风格信息', () => {
      const result = generateCharacterPrompt(mockCharacter, mockDirectorStyle);
      expect(result).toContain('写实主义');
    });
  });

  describe('generateScenePrompt', () => {
    it('应该生成包含场景位置的提示词', () => {
      const result = generateScenePrompt(mockScene);
      expect(result).toContain('现代都市咖啡厅');
    });

    it('应该包含环境描述', () => {
      const result = generateScenePrompt(mockScene);
      expect(result).toContain('温馨的室内环境');
    });

    it('应用导演风格时应包含色调信息', () => {
      const result = generateScenePrompt(mockScene, mockDirectorStyle);
      expect(result).toContain('温暖柔和色调');
    });
  });

  describe('generateStoryboardImagePrompt', () => {
    it('应该生成包含景别的提示词', () => {
      const result = generateStoryboardImagePrompt(
        mockPanel,
        [mockCharacter],
        [mockScene],
        mockDirectorStyle
      );
      expect(result).toContain('中景');
    });

    it('应该包含角色触发词', () => {
      const result = generateStoryboardImagePrompt(
        mockPanel,
        [mockCharacter],
        [mockScene],
        mockDirectorStyle
      );
      expect(result).toContain('liming_character');
    });

    it('应该包含画面描述', () => {
      const result = generateStoryboardImagePrompt(
        mockPanel,
        [mockCharacter],
        [mockScene],
        mockDirectorStyle
      );
      expect(result).toContain('咖啡厅');
    });

    it('应该包含宽高比参数', () => {
      const result = generateStoryboardImagePrompt(
        mockPanel,
        [mockCharacter],
        [mockScene],
        mockDirectorStyle
      );
      expect(result).toContain('--ar 16:9');
    });

    it('应该包含负面提示词', () => {
      const result = generateStoryboardImagePrompt(
        mockPanel,
        [mockCharacter],
        [mockScene],
        mockDirectorStyle
      );
      expect(result).toContain('--neg');
    });
  });

  describe('generateNegativePrompt', () => {
    it('无导演风格时应返回默认负面提示词', () => {
      const result = generateNegativePrompt();
      expect(result).toContain('变形');
      expect(result).toContain('扭曲');
    });

    it('有导演风格时应返回自定义负面提示词', () => {
      const result = generateNegativePrompt(mockDirectorStyle);
      expect(result).toBe('变形, 模糊');
    });
  });
});
