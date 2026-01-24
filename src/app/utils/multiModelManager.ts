/**
 * 多模型管理系统
 * 支持多个AI模型的配置、选择和负载均衡
 */

// ============ 类型定义 ============

export type AIProvider = 'volcengine' | 'openai' | 'deepseek' | 'qwen' | 'custom';

export type AIModelCapability = 
  | 'text_generation'
  | 'image_generation'
  | 'image_analysis'
  | 'embedding'
  | 'chat';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  modelId: string;
  apiKey?: string;
  apiEndpoint?: string;
  capabilities: AIModelCapability[];
  enabled: boolean;
  priority: number;
  maxTokens?: number;
  temperature?: number;
  costPer1kTokens?: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  metadata?: Record<string, any>;
  lastUsed?: number;
  usageCount: number;
  errorCount: number;
  isHealthy: boolean;
}

export interface ModelSelectionStrategy {
  type: 'priority' | 'round_robin' | 'least_used' | 'cost_optimized' | 'random';
  fallbackEnabled?: boolean;
}

export interface ModelUsageStats {
  modelId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  lastUsed: number;
}

// ============ 提供商信息 ============

export const PROVIDER_INFO: Record<AIProvider, { name: string; icon: string; color: string }> = {
  volcengine: { name: '火山引擎', icon: '🌋', color: 'orange' },
  openai: { name: 'OpenAI', icon: '🤖', color: 'green' },
  deepseek: { name: 'DeepSeek', icon: '🔍', color: 'blue' },
  qwen: { name: '通义千问', icon: '💬', color: 'purple' },
  custom: { name: '自定义', icon: '⚙️', color: 'gray' }
};

export const CAPABILITY_INFO: Record<AIModelCapability, { name: string; icon: string }> = {
  text_generation: { name: '文本生成', icon: '📝' },
  image_generation: { name: '图像生成', icon: '🎨' },
  image_analysis: { name: '图像分析', icon: '🔍' },
  embedding: { name: '向量嵌入', icon: '🧮' },
  chat: { name: '对话', icon: '💬' }
};

// ============ 多模型管理器 ============

class MultiModelManager {
  private models: Map<string, AIModelConfig> = new Map();
  private strategy: ModelSelectionStrategy = { type: 'priority', fallbackEnabled: true };
  private usageStats: Map<string, ModelUsageStats> = new Map();
  private roundRobinIndex = 0;
  private storageKey = 'ai_model_configs';

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultModels();
  }

  /**
   * 初始化默认模型
   */
  private initializeDefaultModels() {
    if (this.models.size === 0) {
      // 火山引擎模型
      this.addModel({
        id: 'volc-doubao-pro',
        name: '豆包 Pro',
        provider: 'volcengine',
        modelId: 'doubao-pro-32k',
        capabilities: ['text_generation', 'chat'],
        enabled: false,
        priority: 1,
        maxTokens: 32000,
        temperature: 0.7,
        costPer1kTokens: 0.008,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 100000
        },
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      // OpenAI 模型
      this.addModel({
        id: 'openai-gpt4',
        name: 'GPT-4',
        provider: 'openai',
        modelId: 'gpt-4',
        capabilities: ['text_generation', 'chat', 'image_analysis'],
        enabled: false,
        priority: 2,
        maxTokens: 8000,
        temperature: 0.7,
        costPer1kTokens: 0.03,
        rateLimit: {
          requestsPerMinute: 40,
          tokensPerMinute: 80000
        },
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      // DeepSeek 模型
      this.addModel({
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'deepseek',
        modelId: 'deepseek-chat',
        capabilities: ['text_generation', 'chat'],
        enabled: false,
        priority: 3,
        maxTokens: 32000,
        temperature: 0.7,
        costPer1kTokens: 0.001,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 120000
        },
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      // 通义千问模型
      this.addModel({
        id: 'qwen-turbo',
        name: '通义千问 Turbo',
        provider: 'qwen',
        modelId: 'qwen-turbo',
        capabilities: ['text_generation', 'chat'],
        enabled: false,
        priority: 4,
        maxTokens: 8000,
        temperature: 0.7,
        costPer1kTokens: 0.002,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 100000
        },
        usageCount: 0,
        errorCount: 0,
        isHealthy: true
      });

      this.saveToStorage();
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const configs = JSON.parse(data) as AIModelConfig[];
        configs.forEach(config => {
          this.models.set(config.id, config);
        });
      }

      const statsData = localStorage.getItem(`${this.storageKey}_stats`);
      if (statsData) {
        const stats = JSON.parse(statsData) as ModelUsageStats[];
        stats.forEach(stat => {
          this.usageStats.set(stat.modelId, stat);
        });
      }
    } catch (e) {
      console.error('加载模型配置失败:', e);
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage() {
    try {
      const configs = Array.from(this.models.values());
      localStorage.setItem(this.storageKey, JSON.stringify(configs));

      const stats = Array.from(this.usageStats.values());
      localStorage.setItem(`${this.storageKey}_stats`, JSON.stringify(stats));
    } catch (e) {
      console.error('保存模型配置失败:', e);
    }
  }

  /**
   * 添加模型
   */
  addModel(config: AIModelConfig): void {
    this.models.set(config.id, config);
    this.saveToStorage();
  }

  /**
   * 获取模型
   */
  getModel(id: string): AIModelConfig | undefined {
    return this.models.get(id);
  }

  /**
   * 获取所有模型
   */
  getAllModels(): AIModelConfig[] {
    return Array.from(this.models.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * 更新模型
   */
  updateModel(id: string, updates: Partial<AIModelConfig>): boolean {
    const model = this.models.get(id);
    if (!model) return false;

    const updated = { ...model, ...updates, id: model.id };
    this.models.set(id, updated);
    this.saveToStorage();
    return true;
  }

  /**
   * 删除模型
   */
  deleteModel(id: string): boolean {
    const deleted = this.models.delete(id);
    if (deleted) {
      this.usageStats.delete(id);
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * 启用/禁用模型
   */
  enableModel(id: string, enabled: boolean): boolean {
    return this.updateModel(id, { enabled });
  }

  /**
   * 设置API密钥
   */
  setApiKey(id: string, apiKey: string): boolean {
    return this.updateModel(id, { apiKey });
  }

  /**
   * 设置选择策略
   */
  setStrategy(strategy: ModelSelectionStrategy): void {
    this.strategy = strategy;
  }

  /**
   * 获取当前策略
   */
  getStrategy(): ModelSelectionStrategy {
    return this.strategy;
  }

  /**
   * 根据能力筛选模型
   */
  getModelsByCapability(capability: AIModelCapability): AIModelConfig[] {
    return this.getAllModels().filter(
      model => model.enabled && model.isHealthy && model.capabilities.includes(capability)
    );
  }

  /**
   * 选择最佳模型
   */
  selectModel(capability: AIModelCapability): AIModelConfig | null {
    const availableModels = this.getModelsByCapability(capability);
    if (availableModels.length === 0) return null;

    switch (this.strategy.type) {
      case 'priority':
        return availableModels[0]; // 已按优先级排序

      case 'round_robin':
        const model = availableModels[this.roundRobinIndex % availableModels.length];
        this.roundRobinIndex++;
        return model;

      case 'least_used':
        return availableModels.reduce((least, current) => 
          current.usageCount < least.usageCount ? current : least
        );

      case 'cost_optimized':
        return availableModels.reduce((cheapest, current) => {
          const cheapestCost = cheapest.costPer1kTokens || Infinity;
          const currentCost = current.costPer1kTokens || Infinity;
          return currentCost < cheapestCost ? current : cheapest;
        });

      case 'random':
        return availableModels[Math.floor(Math.random() * availableModels.length)];

      default:
        return availableModels[0];
    }
  }

  /**
   * 记录使用情况
   */
  recordUsage(
    modelId: string,
    success: boolean,
    tokens: number = 0,
    latency: number = 0
  ): void {
    const model = this.models.get(modelId);
    if (!model) return;

    // 更新模型统计
    model.usageCount++;
    model.lastUsed = Date.now();
    if (!success) {
      model.errorCount++;
    }

    // 更新详细统计
    let stats = this.usageStats.get(modelId);
    if (!stats) {
      stats = {
        modelId,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageLatency: 0,
        lastUsed: Date.now()
      };
      this.usageStats.set(modelId, stats);
    }

    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }
    stats.totalTokens += tokens;
    stats.totalCost += (tokens / 1000) * (model.costPer1kTokens || 0);
    stats.averageLatency = 
      (stats.averageLatency * (stats.totalRequests - 1) + latency) / stats.totalRequests;
    stats.lastUsed = Date.now();

    this.saveToStorage();
  }

  /**
   * 获取使用统计
   */
  getUsageStats(modelId: string): ModelUsageStats | undefined {
    return this.usageStats.get(modelId);
  }

  /**
   * 获取所有统计
   */
  getAllStats(): ModelUsageStats[] {
    return Array.from(this.usageStats.values());
  }

  /**
   * 健康检查
   */
  async healthCheck(modelId: string): Promise<boolean> {
    const model = this.models.get(modelId);
    if (!model) return false;

    try {
      // 这里应该实际调用API进行健康检查
      // 简化版本：检查是否有API密钥
      const isHealthy = !!model.apiKey;
      this.updateModel(modelId, { isHealthy });
      return isHealthy;
    } catch (e) {
      this.updateModel(modelId, { isHealthy: false });
      return false;
    }
  }

  /**
   * 批量健康检查
   */
  async healthCheckAll(): Promise<void> {
    const models = this.getAllModels();
    await Promise.all(models.map(model => this.healthCheck(model.id)));
  }

  /**
   * 重置统计
   */
  resetStats(modelId?: string): void {
    if (modelId) {
      this.usageStats.delete(modelId);
      const model = this.models.get(modelId);
      if (model) {
        model.usageCount = 0;
        model.errorCount = 0;
      }
    } else {
      this.usageStats.clear();
      this.models.forEach(model => {
        model.usageCount = 0;
        model.errorCount = 0;
      });
    }
    this.saveToStorage();
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    const config = {
      models: Array.from(this.models.values()),
      strategy: this.strategy,
      stats: Array.from(this.usageStats.values())
    };
    return JSON.stringify(config, null, 2);
  }

  /**
   * 导入配置
   */
  importConfig(json: string): boolean {
    try {
      const config = JSON.parse(json);
      
      if (config.models) {
        this.models.clear();
        config.models.forEach((model: AIModelConfig) => {
          this.models.set(model.id, model);
        });
      }

      if (config.strategy) {
        this.strategy = config.strategy;
      }

      if (config.stats) {
        this.usageStats.clear();
        config.stats.forEach((stat: ModelUsageStats) => {
          this.usageStats.set(stat.modelId, stat);
        });
      }

      this.saveToStorage();
      return true;
    } catch (e) {
      console.error('导入配置失败:', e);
      return false;
    }
  }
}

// ============ 导出单例 ============

export const multiModelManager = new MultiModelManager();

export default multiModelManager;
