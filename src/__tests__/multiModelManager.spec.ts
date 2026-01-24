/**
 * 多模型管理系统测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  multiModelManager,
  PROVIDER_INFO,
  CAPABILITY_INFO,
  type AIModelConfig,
  type AIModelCapability,
} from '../app/utils/multiModelManager';

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

describe('MultiModelManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // 清空所有模型
    const allModels = multiModelManager.getAllModels();
    allModels.forEach(model => multiModelManager.deleteModel(model.id));
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('模型管理', () => {
    it('应该能添加模型', () => {
      const model: AIModelConfig = {
        id: 'test-model',
        name: '测试模型',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      };

      multiModelManager.addModel(model);
      const retrieved = multiModelManager.getModel('test-model');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('测试模型');
    });

    it('应该能获取所有模型', () => {
      multiModelManager.addModel({
        id: 'model1',
        name: '模型1',
        provider: 'custom',
        modelId: 'test1',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 2,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      multiModelManager.addModel({
        id: 'model2',
        name: '模型2',
        provider: 'custom',
        modelId: 'test2',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      const models = multiModelManager.getAllModels();
      expect(models.length).toBeGreaterThanOrEqual(2);
    });

    it('模型应该按优先级排序', () => {
      multiModelManager.addModel({
        id: 'low-priority',
        name: '低优先级',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 10,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      multiModelManager.addModel({
        id: 'high-priority',
        name: '高优先级',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      const models = multiModelManager.getAllModels();
      expect(models[0].priority).toBeLessThanOrEqual(models[1].priority);
    });

    it('应该能更新模型', () => {
      multiModelManager.addModel({
        id: 'test',
        name: '原名',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      multiModelManager.updateModel('test', { name: '新名' });
      const updated = multiModelManager.getModel('test');
      expect(updated?.name).toBe('新名');
    });

    it('应该能删除模型', () => {
      multiModelManager.addModel({
        id: 'to-delete',
        name: '待删除',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      const success = multiModelManager.deleteModel('to-delete');
      expect(success).toBe(true);
      expect(multiModelManager.getModel('to-delete')).toBeUndefined();
    });

    it('应该能启用/禁用模型', () => {
      multiModelManager.addModel({
        id: 'test',
        name: '测试',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      multiModelManager.enableModel('test', false);
      expect(multiModelManager.getModel('test')?.enabled).toBe(false);

      multiModelManager.enableModel('test', true);
      expect(multiModelManager.getModel('test')?.enabled).toBe(true);
    });

    it('应该能设置API密钥', () => {
      multiModelManager.addModel({
        id: 'test',
        name: '测试',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      multiModelManager.setApiKey('test', 'test-api-key');
      expect(multiModelManager.getModel('test')?.apiKey).toBe('test-api-key');
    });
  });

  describe('能力筛选', () => {
    beforeEach(() => {
      multiModelManager.addModel({
        id: 'text-model',
        name: '文本模型',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation', 'chat'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      multiModelManager.addModel({
        id: 'image-model',
        name: '图像模型',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['image_generation'],
        enabled: true,
        priority: 2,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });
    });

    it('应该能按能力筛选模型', () => {
      const textModels = multiModelManager.getModelsByCapability('text_generation');
      expect(textModels.length).toBeGreaterThan(0);
      textModels.forEach(model => {
        expect(model.capabilities).toContain('text_generation');
      });
    });

    it('只返回启用且健康的模型', () => {
      multiModelManager.addModel({
        id: 'disabled-model',
        name: '禁用模型',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: false,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      const models = multiModelManager.getModelsByCapability('text_generation');
      const disabledModel = models.find(m => m.id === 'disabled-model');
      expect(disabledModel).toBeUndefined();
    });
  });

  describe('模型选择策略', () => {
    beforeEach(() => {
      multiModelManager.addModel({
        id: 'model1',
        name: '模型1',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 5,
        errorCount: 0,
        isHealthy: true,
        costPer1kTokens: 0.01
      });

      multiModelManager.addModel({
        id: 'model2',
        name: '模型2',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 2,
        usageCount: 10,
        errorCount: 0,
        isHealthy: true,
        costPer1kTokens: 0.005
      });
    });

    it('优先级策略应选择最高优先级模型', () => {
      multiModelManager.setStrategy({ type: 'priority' });
      const model = multiModelManager.selectModel('text_generation');
      expect(model?.priority).toBe(1);
    });

    it('最少使用策略应选择使用次数最少的模型', () => {
      multiModelManager.setStrategy({ type: 'least_used' });
      const model = multiModelManager.selectModel('text_generation');
      expect(model?.usageCount).toBe(5);
    });

    it('成本优化策略应选择最便宜的模型', () => {
      multiModelManager.setStrategy({ type: 'cost_optimized' });
      const model = multiModelManager.selectModel('text_generation');
      expect(model?.costPer1kTokens).toBe(0.005);
    });

    it('随机策略应返回可用模型', () => {
      multiModelManager.setStrategy({ type: 'random' });
      const model = multiModelManager.selectModel('text_generation');
      expect(model).toBeDefined();
      expect(model?.capabilities).toContain('text_generation');
    });

    it('没有可用模型时应返回null', () => {
      const model = multiModelManager.selectModel('embedding' as AIModelCapability);
      expect(model).toBeNull();
    });
  });

  describe('使用统计', () => {
    beforeEach(() => {
      multiModelManager.addModel({
        id: 'test-model',
        name: '测试模型',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true,
        costPer1kTokens: 0.01
      });
    });

    it('应该能记录成功使用', () => {
      multiModelManager.recordUsage('test-model', true, 1000, 100);
      
      const model = multiModelManager.getModel('test-model');
      expect(model?.usageCount).toBe(1);

      const stats = multiModelManager.getUsageStats('test-model');
      expect(stats?.successfulRequests).toBe(1);
      expect(stats?.totalTokens).toBe(1000);
    });

    it('应该能记录失败使用', () => {
      multiModelManager.recordUsage('test-model', false, 0, 50);
      
      const model = multiModelManager.getModel('test-model');
      expect(model?.errorCount).toBe(1);

      const stats = multiModelManager.getUsageStats('test-model');
      expect(stats?.failedRequests).toBe(1);
    });

    it('应该计算总成本', () => {
      multiModelManager.recordUsage('test-model', true, 1000, 100);
      
      const stats = multiModelManager.getUsageStats('test-model');
      expect(stats?.totalCost).toBeCloseTo(0.01, 2);
    });

    it('应该能重置统计', () => {
      multiModelManager.recordUsage('test-model', true, 1000, 100);
      multiModelManager.resetStats('test-model');

      const model = multiModelManager.getModel('test-model');
      expect(model?.usageCount).toBe(0);
      expect(model?.errorCount).toBe(0);
    });
  });

  describe('配置导入导出', () => {
    it('应该能导出配置', () => {
      multiModelManager.addModel({
        id: 'test',
        name: '测试',
        provider: 'custom',
        modelId: 'test',
        capabilities: ['text_generation'],
        enabled: true,
        priority: 1,
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      const config = multiModelManager.exportConfig();
      expect(config).toBeDefined();
      expect(config.length).toBeGreaterThan(0);
    });

    it('应该能导入配置', () => {
      const config = {
        models: [{
          id: 'imported',
          name: '导入的模型',
          provider: 'custom',
          modelId: 'test',
          capabilities: ['text_generation'],
          enabled: true,
          priority: 1,
          usageCount: 0,
          errorCount: 0,
          isHealthy: true
        }],
        strategy: { type: 'priority' },
        stats: []
      };

      const success = multiModelManager.importConfig(JSON.stringify(config));
      expect(success).toBe(true);

      const model = multiModelManager.getModel('imported');
      expect(model).toBeDefined();
      expect(model?.name).toBe('导入的模型');
    });

    it('导入无效配置应返回false', () => {
      const success = multiModelManager.importConfig('invalid json');
      expect(success).toBe(false);
    });
  });
});

describe('常量定义', () => {
  describe('PROVIDER_INFO', () => {
    it('应该包含所有提供商信息', () => {
      expect(PROVIDER_INFO.volcengine).toBeDefined();
      expect(PROVIDER_INFO.openai).toBeDefined();
      expect(PROVIDER_INFO.deepseek).toBeDefined();
      expect(PROVIDER_INFO.qwen).toBeDefined();
      expect(PROVIDER_INFO.custom).toBeDefined();
    });

    it('每个提供商应该有必需字段', () => {
      Object.values(PROVIDER_INFO).forEach(info => {
        expect(info.name).toBeDefined();
        expect(info.icon).toBeDefined();
        expect(info.color).toBeDefined();
      });
    });
  });

  describe('CAPABILITY_INFO', () => {
    it('应该包含所有能力信息', () => {
      expect(CAPABILITY_INFO.text_generation).toBeDefined();
      expect(CAPABILITY_INFO.image_generation).toBeDefined();
      expect(CAPABILITY_INFO.image_analysis).toBeDefined();
      expect(CAPABILITY_INFO.embedding).toBeDefined();
      expect(CAPABILITY_INFO.chat).toBeDefined();
    });

    it('每个能力应该有必需字段', () => {
      Object.values(CAPABILITY_INFO).forEach(info => {
        expect(info.name).toBeDefined();
        expect(info.icon).toBeDefined();
      });
    });
  });
});
