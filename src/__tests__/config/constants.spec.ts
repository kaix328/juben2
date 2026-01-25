/**
 * CONFIG 常量配置测试
 */
import { describe, it, expect } from 'vitest';
import { CONFIG } from '../../app/config/constants';

describe('CONFIG 常量配置', () => {
  describe('AI_CONFIG', () => {
    it('应该包含所有必需的 AI 配置', () => {
      expect(CONFIG.AI.MAX_CHUNK_SIZE).toBe(8000);
      expect(CONFIG.AI.MAX_RETRIES).toBe(3);
      expect(CONFIG.AI.RETRY_DELAY).toBe(1000);
      expect(CONFIG.AI.TIMEOUT).toBe(30000);
      expect(CONFIG.AI.DEFAULT_TEMPERATURE).toBe(0.7);
      expect(CONFIG.AI.MAX_TOKENS).toBe(4000);
    });
  });

  describe('BACKUP_CONFIG', () => {
    it('应该包含所有必需的备份配置', () => {
      expect(CONFIG.BACKUP.AUTO_INTERVAL).toBe(60000);
      expect(CONFIG.BACKUP.MAX_HISTORY).toBe(50);
      expect(CONFIG.BACKUP.RETENTION_DAYS).toBe(30);
      expect(CONFIG.BACKUP.AUTO_SAVE_DELAY).toBe(2000);
    });
  });

  describe('PERFORMANCE_CONFIG', () => {
    it('应该包含所有必需的性能配置', () => {
      expect(CONFIG.PERFORMANCE.DEBOUNCE_DELAY).toBe(300);
      expect(CONFIG.PERFORMANCE.THROTTLE_DELAY).toBe(1000);
      expect(CONFIG.PERFORMANCE.VIRTUAL_SCROLL_OVERSCAN).toBe(5);
      expect(CONFIG.PERFORMANCE.LONG_LIST_THRESHOLD).toBe(50);
      expect(CONFIG.PERFORMANCE.IMAGE_LAZY_THRESHOLD).toBe(200);
      expect(CONFIG.PERFORMANCE.MAX_RENDER_TIME).toBe(16);
    });
  });

  describe('VALIDATION_CONFIG', () => {
    it('应该包含所有必需的验证配置', () => {
      expect(CONFIG.VALIDATION.PROJECT_NAME_MIN_LENGTH).toBe(1);
      expect(CONFIG.VALIDATION.PROJECT_NAME_MAX_LENGTH).toBe(100);
      expect(CONFIG.VALIDATION.SCRIPT_TEXT_MAX_LENGTH).toBe(100000);
      expect(CONFIG.VALIDATION.SCENE_DESCRIPTION_MAX_LENGTH).toBe(5000);
      expect(CONFIG.VALIDATION.DIALOGUE_MAX_LENGTH).toBe(1000);
      expect(CONFIG.VALIDATION.CHARACTER_NAME_MAX_LENGTH).toBe(50);
    });
  });

  describe('STORYBOARD_CONFIG', () => {
    it('应该包含所有必需的分镜配置', () => {
      expect(CONFIG.STORYBOARD.DEFAULT_PANEL_DURATION).toBe(3);
      expect(CONFIG.STORYBOARD.MIN_PANEL_DURATION).toBe(1);
      expect(CONFIG.STORYBOARD.MAX_PANEL_DURATION).toBe(30);
      expect(CONFIG.STORYBOARD.DEFAULT_ASPECT_RATIO).toBe('16:9');
      expect(CONFIG.STORYBOARD.SUPPORTED_ASPECT_RATIOS).toContain('16:9');
      expect(CONFIG.STORYBOARD.SUPPORTED_ASPECT_RATIOS).toContain('4:3');
      expect(CONFIG.STORYBOARD.DEFAULT_SHOT_SIZE).toBe('中景');
    });
  });

  describe('QUALITY_CONFIG', () => {
    it('应该包含所有必需的质量检查配置', () => {
      expect(CONFIG.QUALITY.SCORE_WEIGHTS.continuity).toBe(0.25);
      expect(CONFIG.QUALITY.SCORE_WEIGHTS.duration).toBe(0.15);
      expect(CONFIG.QUALITY.QUALITY_THRESHOLDS.excellent).toBe(90);
      expect(CONFIG.QUALITY.QUALITY_THRESHOLDS.good).toBe(75);
      expect(CONFIG.QUALITY.MAX_ISSUES).toBe(100);
    });

    it('权重总和应该为 1', () => {
      const weights = CONFIG.QUALITY.SCORE_WEIGHTS;
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 2);
    });
  });

  describe('UI_CONFIG', () => {
    it('应该包含所有必需的 UI 配置', () => {
      expect(CONFIG.UI.TOAST_DURATION).toBe(3000);
      expect(CONFIG.UI.TOAST_ERROR_DURATION).toBe(5000);
      expect(CONFIG.UI.TOAST_CRITICAL_DURATION).toBe(10000);
      expect(CONFIG.UI.DEFAULT_PAGE_SIZE).toBe(20);
      expect(CONFIG.UI.MAX_PAGE_SIZE).toBe(100);
    });
  });

  describe('配置不可变性', () => {
    it('配置对象应该是只读的', () => {
      expect(() => {
        // @ts-expect-error - 测试不可变性
        CONFIG.AI.MAX_CHUNK_SIZE = 9000;
      }).toThrow();
    });
  });
});
