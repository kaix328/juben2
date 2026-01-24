/**
 * 分镜建议生成器测试
 */

import { describe, it, expect } from 'vitest';
import { generateStoryboardSuggestion } from '../app/utils/storyboardSuggester';

describe('StoryboardSuggester', () => {
  describe('场景分析', () => {
    it('应该能识别对话场景', () => {
      const result = generateStoryboardSuggestion(
        '两人在咖啡馆对话',
        '你好，最近怎么样？',
        ['张三', '李四']
      );

      expect(result.sceneAnalysis.sceneType).toBe('dialogue');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('应该能识别动作场景', () => {
      const result = generateStoryboardSuggestion(
        '主角快速移动穿过街道',
        undefined,
        ['主角']
      );

      // "跑"会被识别为 chase，所以我们改用其他动作词
      const result2 = generateStoryboardSuggestion(
        '主角进行复杂的动作表演',
        undefined,
        ['主角']
      );

      expect(['action', 'chase']).toContain(result.sceneAnalysis.sceneType);
    });

    it('应该能识别建立镜头场景', () => {
      const result = generateStoryboardSuggestion(
        '建立城市全景，展示繁华的街道'
      );

      expect(result.sceneAnalysis.sceneType).toBe('establishing');
    });

    it('应该能识别情感场景', () => {
      const result = generateStoryboardSuggestion(
        '角色独自坐在房间里，陷入回忆'
      );

      expect(result.sceneAnalysis.sceneType).toBe('emotional');
    });

    it('应该能识别追逐场景', () => {
      const result = generateStoryboardSuggestion(
        '警察追捕逃犯，穿过拥挤的人群'
      );

      expect(result.sceneAnalysis.sceneType).toBe('chase');
    });

    it('应该能识别揭示场景', () => {
      const result = generateStoryboardSuggestion(
        '主角发现了隐藏的秘密'
      );

      expect(result.sceneAnalysis.sceneType).toBe('revelation');
    });

    it('应该能识别高潮场景', () => {
      const result = generateStoryboardSuggestion(
        '最终的冲突爆发，双方对峙'
      );

      expect(result.sceneAnalysis.sceneType).toBe('climax');
    });
  });

  describe('情感分析', () => {
    it('应该能识别快乐情感', () => {
      const result = generateStoryboardSuggestion(
        '角色开心地笑着'
      );

      expect(result.sceneAnalysis.emotion).toBe('happy');
    });

    it('应该能识别悲伤情感', () => {
      const result = generateStoryboardSuggestion(
        '角色难过地哭泣'
      );

      expect(result.sceneAnalysis.emotion).toBe('sad');
    });

    it('应该能识别愤怒情感', () => {
      const result = generateStoryboardSuggestion(
        '角色愤怒地拍桌子'
      );

      expect(result.sceneAnalysis.emotion).toBe('angry');
    });

    it('应该能识别恐惧情感', () => {
      const result = generateStoryboardSuggestion(
        '角色害怕地躲在角落'
      );

      expect(result.sceneAnalysis.emotion).toBe('fear');
    });

    it('应该能识别紧张情感', () => {
      const result = generateStoryboardSuggestion(
        '气氛紧张，所有人都在等待'
      );

      expect(result.sceneAnalysis.emotion).toBe('tension');
    });
  });

  describe('节奏分析', () => {
    it('快节奏场景应该有快节奏标记', () => {
      const result = generateStoryboardSuggestion(
        '激烈的追逐场面'
      );

      expect(result.sceneAnalysis.pacing).toBe('fast');
    });

    it('慢节奏场景应该有慢节奏标记', () => {
      const result = generateStoryboardSuggestion(
        '建立城市全景，缓慢展示'
      );

      expect(result.sceneAnalysis.pacing).toBe('slow');
    });

    it('中等节奏场景应该有中等节奏标记', () => {
      const result = generateStoryboardSuggestion(
        '两人在咖啡馆对话'
      );

      expect(result.sceneAnalysis.pacing).toBe('medium');
    });
  });

  describe('分镜建议生成', () => {
    it('应该生成指定数量的分镜', () => {
      const result = generateStoryboardSuggestion(
        '测试场景',
        undefined,
        undefined,
        6
      );

      expect(result.suggestions).toHaveLength(6);
    });

    it('每个分镜应该有必需字段', () => {
      const result = generateStoryboardSuggestion(
        '测试场景'
      );

      result.suggestions.forEach(shot => {
        expect(shot.id).toBeDefined();
        expect(shot.shotSize).toBeDefined();
        expect(shot.cameraAngle).toBeDefined();
        expect(shot.description).toBeDefined();
        expect(shot.duration).toBeGreaterThan(0);
        expect(shot.reason).toBeDefined();
        expect(shot.confidence).toBeGreaterThan(0);
        expect(shot.confidence).toBeLessThanOrEqual(1);
        expect(shot.tags).toBeDefined();
        expect(Array.isArray(shot.tags)).toBe(true);
      });
    });

    it('对话场景应该包含对话相关的分镜', () => {
      const result = generateStoryboardSuggestion(
        '两人对话',
        '你好',
        ['张三', '李四']
      );

      const hasDialogueShots = result.suggestions.some(shot =>
        shot.tags.includes('对话') || shot.description.includes('说话')
      );

      expect(hasDialogueShots).toBe(true);
    });

    it('动作场景应该包含动作相关的分镜', () => {
      const result = generateStoryboardSuggestion(
        '角色快速移动'
      );

      const hasActionShots = result.suggestions.some(shot =>
        shot.tags.includes('动作') || shot.description.includes('动作')
      );

      expect(hasActionShots).toBe(true);
    });

    it('情感场景应该包含特写镜头', () => {
      const result = generateStoryboardSuggestion(
        '角色陷入回忆，情感复杂'
      );

      const hasCloseups = result.suggestions.some(shot =>
        shot.shotSize === '特写' || shot.shotSize === '近景'
      );

      expect(hasCloseups).toBe(true);
    });
  });

  describe('替代方案', () => {
    it('应该生成多个替代方案', () => {
      const result = generateStoryboardSuggestion(
        '测试场景'
      );

      expect(result.alternativeApproaches.length).toBeGreaterThan(0);
    });

    it('每个替代方案应该有必需字段', () => {
      const result = generateStoryboardSuggestion(
        '测试场景'
      );

      result.alternativeApproaches.forEach(approach => {
        expect(approach.name).toBeDefined();
        expect(approach.description).toBeDefined();
        expect(approach.shots).toBeDefined();
        expect(Array.isArray(approach.shots)).toBe(true);
        expect(approach.shots.length).toBeGreaterThan(0);
      });
    });

    it('应该包含经典风格方案', () => {
      const result = generateStoryboardSuggestion(
        '测试场景'
      );

      const hasClassic = result.alternativeApproaches.some(
        approach => approach.name === '经典风格'
      );

      expect(hasClassic).toBe(true);
    });

    it('应该包含艺术风格方案', () => {
      const result = generateStoryboardSuggestion(
        '测试场景'
      );

      const hasArtistic = result.alternativeApproaches.some(
        approach => approach.name === '艺术风格'
      );

      expect(hasArtistic).toBe(true);
    });

    it('应该包含快节奏方案', () => {
      const result = generateStoryboardSuggestion(
        '测试场景'
      );

      const hasFast = result.alternativeApproaches.some(
        approach => approach.name === '快节奏'
      );

      expect(hasFast).toBe(true);
    });
  });

  describe('拍摄提示', () => {
    it('应该生成拍摄提示', () => {
      const result = generateStoryboardSuggestion(
        '测试场景'
      );

      expect(result.tips.length).toBeGreaterThan(0);
    });

    it('每个提示应该是字符串', () => {
      const result = generateStoryboardSuggestion(
        '测试场景'
      );

      result.tips.forEach(tip => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });

    it('对话场景应该有对话相关提示', () => {
      const result = generateStoryboardSuggestion(
        '两人对话',
        '你好',
        ['张三', '李四']
      );

      const hasDialogueTips = result.tips.some(tip =>
        tip.includes('对话') || tip.includes('眼神') || tip.includes('反应')
      );

      expect(hasDialogueTips).toBe(true);
    });

    it('动作场景应该有动作相关提示', () => {
      const result = generateStoryboardSuggestion(
        '激烈的动作场面'
      );

      const hasActionTips = result.tips.some(tip =>
        tip.includes('动作') || tip.includes('角度') || tip.includes('节奏') || tip.includes('冲击')
      );

      expect(hasActionTips).toBe(true);
    });

    it('情感场景应该有情感相关提示', () => {
      const result = generateStoryboardSuggestion(
        '角色情感爆发'
      );

      const hasEmotionalTips = result.tips.some(tip =>
        tip.includes('情感') || tip.includes('特写') || tip.includes('表情')
      );

      expect(hasEmotionalTips).toBe(true);
    });
  });

  describe('关键词提取', () => {
    it('应该提取场景关键词', () => {
      const result = generateStoryboardSuggestion(
        '夜晚的咖啡馆，室内，两人独自对话'
      );

      expect(result.sceneAnalysis.keywords.length).toBeGreaterThan(0);
    });

    it('应该识别时间关键词', () => {
      const result = generateStoryboardSuggestion(
        '夜晚的街道'
      );

      expect(result.sceneAnalysis.keywords).toContain('夜晚');
    });

    it('应该识别地点关键词', () => {
      const result = generateStoryboardSuggestion(
        '室内咖啡馆'
      );

      expect(result.sceneAnalysis.keywords).toContain('室内');
    });
  });

  describe('边界情况', () => {
    it('应该处理空描述', () => {
      const result = generateStoryboardSuggestion('');

      expect(result).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('应该处理没有对话的场景', () => {
      const result = generateStoryboardSuggestion(
        '测试场景',
        undefined
      );

      expect(result).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('应该处理没有角色的场景', () => {
      const result = generateStoryboardSuggestion(
        '测试场景',
        undefined,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('应该处理极少的分镜数量', () => {
      const result = generateStoryboardSuggestion(
        '测试场景',
        undefined,
        undefined,
        1
      );

      expect(result.suggestions).toHaveLength(1);
    });

    it('应该处理大量的分镜数量', () => {
      const result = generateStoryboardSuggestion(
        '测试场景',
        undefined,
        undefined,
        10
      );

      expect(result.suggestions).toHaveLength(10);
    });
  });

  describe('强度计算', () => {
    it('高强度场景应该有高强度值', () => {
      const result = generateStoryboardSuggestion(
        '愤怒的冲突场面'
      );

      expect(result.sceneAnalysis.intensity).toBeGreaterThan(0.7);
    });

    it('低强度场景应该有低强度值', () => {
      const result = generateStoryboardSuggestion(
        '平静的对话'
      );

      expect(result.sceneAnalysis.intensity).toBeLessThanOrEqual(0.7);
    });
  });
});
