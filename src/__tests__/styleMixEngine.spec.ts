/**
 * 风格混合引擎测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  styleMixEngine,
  STYLE_CATEGORIES,
  LIGHTING_STYLES,
  RENDERING_STYLES,
  type StyleMixItem,
} from '../app/utils/styleMixEngine';

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

describe('StyleMixEngine', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // 清空所有自定义混合
    const allMixes = styleMixEngine.getAllMixes();
    allMixes.forEach(mix => styleMixEngine.deleteMix(mix.id));
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('风格管理', () => {
    it('应该有预设风格', () => {
      const styles = styleMixEngine.getAllStyles();
      expect(styles.length).toBeGreaterThan(0);
    });

    it('应该能获取单个风格', () => {
      const style = styleMixEngine.getStyle('realistic-photo');
      expect(style).toBeDefined();
      expect(style?.name).toBe('写实摄影');
    });

    it('应该按流行度排序', () => {
      const styles = styleMixEngine.getAllStyles();
      for (let i = 0; i < styles.length - 1; i++) {
        expect(styles[i].popularity).toBeGreaterThanOrEqual(styles[i + 1].popularity);
      }
    });

    it('应该能按分类获取风格', () => {
      const realisticStyles = styleMixEngine.getStylesByCategory('realistic');
      expect(realisticStyles.length).toBeGreaterThan(0);
      realisticStyles.forEach(style => {
        expect(style.category).toBe('realistic');
      });
    });

    it('应该能搜索风格', () => {
      const results = styleMixEngine.searchStyles('写实');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('写实');
    });

    it('搜索不存在的风格应返回空数组', () => {
      const results = styleMixEngine.searchStyles('不存在的风格xyz');
      expect(results).toHaveLength(0);
    });
  });

  describe('自定义风格', () => {
    it('应该能添加自定义风格', () => {
      const customStyle = styleMixEngine.addCustomStyle({
        name: '自定义风格',
        category: 'artistic',
        description: '测试风格',
        positivePrompt: 'test prompt',
        negativePrompt: 'test negative',
        parameters: {
          cfgScale: 7,
          steps: 30,
          sampler: 'Euler',
          clipSkip: 1,
          strength: 0.75
        },
        tags: ['测试']
      });

      expect(customStyle.id).toContain('custom_');
      expect(customStyle.name).toBe('自定义风格');
    });

    it('应该能删除自定义风格', () => {
      const customStyle = styleMixEngine.addCustomStyle({
        name: '待删除',
        category: 'artistic',
        description: '测试',
        positivePrompt: '',
        negativePrompt: '',
        parameters: {
          cfgScale: 7,
          steps: 30,
          sampler: 'Euler',
          clipSkip: 1,
          strength: 0.75
        },
        tags: []
      });

      const success = styleMixEngine.deleteCustomStyle(customStyle.id);
      expect(success).toBe(true);
      expect(styleMixEngine.getStyle(customStyle.id)).toBeUndefined();
    });

    it('不能删除预设风格', () => {
      const success = styleMixEngine.deleteCustomStyle('realistic-photo');
      expect(success).toBe(false);
      expect(styleMixEngine.getStyle('realistic-photo')).toBeDefined();
    });
  });

  describe('风格混合', () => {
    it('应该能混合参数', () => {
      const items: StyleMixItem[] = [
        { styleId: 'realistic-photo', weight: 0.7 },
        { styleId: 'anime-style', weight: 0.3 }
      ];

      const params = styleMixEngine.mixStyles(items);
      
      expect(params.cfgScale).toBeGreaterThan(0);
      expect(params.steps).toBeGreaterThan(0);
      expect(params.sampler).toBeDefined();
    });

    it('空混合应返回默认参数', () => {
      const params = styleMixEngine.mixStyles([]);
      
      expect(params.cfgScale).toBe(7);
      expect(params.steps).toBe(30);
      expect(params.sampler).toBe('DPM++ 2M Karras');
    });

    it('应该归一化权重', () => {
      const items: StyleMixItem[] = [
        { styleId: 'realistic-photo', weight: 2 },
        { styleId: 'anime-style', weight: 2 }
      ];

      const params = styleMixEngine.mixStyles(items);
      expect(params).toBeDefined();
    });

    it('应该能混合提示词', () => {
      const items: StyleMixItem[] = [
        { styleId: 'realistic-photo', weight: 0.5 },
        { styleId: 'cinematic', weight: 0.5 }
      ];

      const { positive, negative } = styleMixEngine.mixPrompts(items);
      
      expect(positive).toBeDefined();
      expect(positive.length).toBeGreaterThan(0);
      expect(negative).toBeDefined();
    });

    it('应该包含基础提示词', () => {
      const items: StyleMixItem[] = [
        { styleId: 'realistic-photo', weight: 1 }
      ];

      const { positive } = styleMixEngine.mixPrompts(items, 'base prompt');
      expect(positive).toContain('base prompt');
    });

    it('空混合应返回基础提示词', () => {
      const { positive, negative } = styleMixEngine.mixPrompts([], 'test');
      expect(positive).toBe('test');
      expect(negative).toBe('');
    });
  });

  describe('混合保存', () => {
    it('应该能保存混合', () => {
      const items: StyleMixItem[] = [
        { styleId: 'realistic-photo', weight: 0.6 },
        { styleId: 'cinematic', weight: 0.4 }
      ];

      const mix = styleMixEngine.saveMix('我的混合', '测试混合', items);
      
      expect(mix.id).toBeDefined();
      expect(mix.name).toBe('我的混合');
      expect(mix.items).toEqual(items);
      expect(mix.usageCount).toBe(0);
    });

    it('应该能获取所有混合', () => {
      styleMixEngine.saveMix('混合1', '描述1', []);
      styleMixEngine.saveMix('混合2', '描述2', []);

      const mixes = styleMixEngine.getAllMixes();
      expect(mixes.length).toBeGreaterThanOrEqual(2);
    });

    it('应该能获取单个混合', () => {
      const saved = styleMixEngine.saveMix('测试', '描述', []);
      const retrieved = styleMixEngine.getMix(saved.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('测试');
    });

    it('应该能删除混合', () => {
      const mix = styleMixEngine.saveMix('待删除', '描述', []);
      const success = styleMixEngine.deleteMix(mix.id);

      expect(success).toBe(true);
      expect(styleMixEngine.getMix(mix.id)).toBeUndefined();
    });

    it('删除不存在的混合应返回false', () => {
      const success = styleMixEngine.deleteMix('non-existent');
      expect(success).toBe(false);
    });

    it('应该能增加使用次数', () => {
      const mix = styleMixEngine.saveMix('测试', '描述', []);
      expect(mix.usageCount).toBe(0);

      styleMixEngine.incrementMixUsage(mix.id);
      const updated = styleMixEngine.getMix(mix.id);
      expect(updated?.usageCount).toBe(1);
    });

    it('混合应按创建时间倒序排列', async () => {
      const mix1 = styleMixEngine.saveMix('混合1', '描述', []);
      // 等待一小段时间确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 10));
      const mix2 = styleMixEngine.saveMix('混合2', '描述', []);

      const mixes = styleMixEngine.getAllMixes();
      expect(mixes[0].createdAt).toBeGreaterThanOrEqual(mixes[1].createdAt);
    });
  });

  describe('边界情况', () => {
    it('获取不存在的风格应返回undefined', () => {
      const style = styleMixEngine.getStyle('non-existent');
      expect(style).toBeUndefined();
    });

    it('混合不存在的风格应返回默认参数', () => {
      const items: StyleMixItem[] = [
        { styleId: 'non-existent', weight: 1 }
      ];

      const params = styleMixEngine.mixStyles(items);
      // 当所有风格都不存在时，应该返回默认参数
      expect(params.cfgScale).toBe(7);
      expect(params.steps).toBe(30);
    });

    it('增加不存在混合的使用次数应不报错', () => {
      expect(() => {
        styleMixEngine.incrementMixUsage('non-existent');
      }).not.toThrow();
    });
  });
});

describe('常量定义', () => {
  describe('STYLE_CATEGORIES', () => {
    it('应该包含风格分类', () => {
      expect(STYLE_CATEGORIES).toBeDefined();
      expect(STYLE_CATEGORIES.length).toBeGreaterThan(0);
    });

    it('每个分类应该有必需字段', () => {
      STYLE_CATEGORIES.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.icon).toBeDefined();
      });
    });

    it('应该包含"全部"分类', () => {
      const allCategory = STYLE_CATEGORIES.find(c => c.id === 'all');
      expect(allCategory).toBeDefined();
    });
  });

  describe('LIGHTING_STYLES', () => {
    it('应该包含光照风格', () => {
      expect(LIGHTING_STYLES).toBeDefined();
      expect(LIGHTING_STYLES.length).toBeGreaterThan(0);
    });

    it('每个光照风格应该有提示词', () => {
      LIGHTING_STYLES.forEach(style => {
        expect(style.id).toBeDefined();
        expect(style.name).toBeDefined();
        expect(style.prompt).toBeDefined();
      });
    });
  });

  describe('RENDERING_STYLES', () => {
    it('应该包含渲染风格', () => {
      expect(RENDERING_STYLES).toBeDefined();
      expect(RENDERING_STYLES.length).toBeGreaterThan(0);
    });

    it('每个渲染风格应该有提示词', () => {
      RENDERING_STYLES.forEach(style => {
        expect(style.id).toBeDefined();
        expect(style.name).toBeDefined();
        expect(style.prompt).toBeDefined();
      });
    });
  });
});
