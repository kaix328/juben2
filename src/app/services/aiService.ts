/**
 * 统一 AI 服务层
 * 整合所有 AI API 调用，支持多提供商
 */

import { useConfigStore } from '../stores';
import { secureKeyManager } from '../utils/secureKeys';
import { errorHandler } from './errorHandler';

// ============ 类型定义 ============

export type AIProvider = 'volcengine' | 'openai' | 'deepseek' | 'qianwen' | 'custom';

export interface AIModelConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TextGenerationParams {
  prompt: string;
  systemPrompt?: string;
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  size?: string;
  steps?: number;
  seed?: number;
  model?: string;
  responseFormat?: 'url' | 'b64_json';
}

export interface PromptOptimizeParams {
  description: string;
  style?: string;
  resourceType?: 'character' | 'scene' | 'prop' | 'costume' | 'storyboard';
  subType?: string; // 子类型：face/fullBody, wide/medium/closeup, image/video
  language?: 'zh' | 'en';
}

// ============ 请求配置 ============

const REQUEST_CONFIG = {
  timeout: 600000,      // 🆕 10分钟超时（从5分钟增加到10分钟，处理复杂场景）
  maxRetries: 3,        // 🆕 最大重试3次（从2次增加到3次）
  retryDelay: 2000,     // 🆕 重试间隔2秒（从1秒增加到2秒）
  enableLog: true,      // 启用日志
};

// ============ 日志工具 ============

function logAPI(method: string, provider: string, status: 'start' | 'success' | 'error' | 'retry', details?: string) {
  if (!REQUEST_CONFIG.enableLog) return;
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  const icons = { start: '🚀', success: '✅', error: '❌', retry: '🔄' };
  console.log(`[${time}] ${icons[status]} [${provider}] ${method} ${details || ''}`);
}

// ============ 基础请求封装 ============

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_CONFIG.timeout
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiRequest<T>(
  url: string,
  options: RequestInit,
  retryCount = 0
): Promise<APIResponse<T>> {
  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();

      // 特殊处理 403 权限错误
      if (response.status === 403) {
        return {
          success: false,
          error: 'API 访问受限 (403)。请检查您的 API Key 是否由于欠费、配置错误或模型已过期而被禁止。',
          code: 403,
        };
      }

      // 判断是否可重试
      const isRetryable = [429, 500, 502, 503, 504].includes(response.status);
      if (isRetryable && retryCount < REQUEST_CONFIG.maxRetries) {
        await new Promise(r => setTimeout(r, REQUEST_CONFIG.retryDelay * (retryCount + 1)));
        return apiRequest(url, options, retryCount + 1);
      }

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorBody}`,
        code: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // 🆕 超时错误使用指数退避重试策略
      if (retryCount < REQUEST_CONFIG.maxRetries) {
        const delay = REQUEST_CONFIG.retryDelay * Math.pow(2, retryCount); // 2s → 4s → 8s
        console.log(`[API] 请求超时，${delay}ms 后重试（${retryCount + 1}/${REQUEST_CONFIG.maxRetries}）`);
        await new Promise(r => setTimeout(r, delay));
        return apiRequest(url, options, retryCount + 1);
      }
      return { success: false, error: '请求超时，已达最大重试次数。建议：1) 减少场景数量 2) 检查网络连接 3) 稍后重试' };
    }

    // 网络错误重试（线性退避）
    if (retryCount < REQUEST_CONFIG.maxRetries) {
      const delay = REQUEST_CONFIG.retryDelay * (retryCount + 1);
      console.log(`[API] 网络错误，${delay}ms 后重试（${retryCount + 1}/${REQUEST_CONFIG.maxRetries}）`);
      await new Promise(r => setTimeout(r, delay));
      return apiRequest(url, options, retryCount + 1);
    }

    return { success: false, error: error.message || '网络错误' };
  }
}

// ============ 配置获取 ============

function getVolcEngineConfig() {
  const state = useConfigStore.getState();
  const settings = state.apiSettings;

  return {
    apiKey: settings.volcApiKey || import.meta.env.VITE_VOLC_API_KEY || '',
    llmModel: settings.llmEndpointId || import.meta.env.VITE_VOLC_LLM_ENDPOINT_ID || '',
    imageModel: settings.imageEndpointId || import.meta.env.VITE_VOLC_IMAGE_ENDPOINT_ID || '',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  };
}

function getProviderConfig(provider: AIProvider): AIModelConfig | null {
  // 优先从安全存储获取
  const secureKey = secureKeyManager.getKeyByProvider(provider);

  switch (provider) {
    case 'volcengine': {
      const config = getVolcEngineConfig();
      return config.apiKey ? {
        provider,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.llmModel,
      } : null;
    }
    case 'openai':
      return secureKey ? {
        provider,
        apiKey: secureKey,
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      } : null;
    case 'deepseek':
      return secureKey ? {
        provider,
        apiKey: secureKey,
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
      } : null;
    case 'qianwen':
      return secureKey ? {
        provider,
        apiKey: secureKey,
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-turbo',
      } : null;
    default:
      return null;
  }
}

// ============ 文本生成服务 ============

export const textService = {
  /**
   * 火山引擎 (DeepSeek/Doubao)
   */
  async callVolcEngine(params: TextGenerationParams): Promise<APIResponse<string>> {
    const config = getVolcEngineConfig();
    if (!config.apiKey) {
      const error = '火山引擎 API Key 未配置，请在设置页面配置';
      errorHandler.handleAPI(error, 'VolcEngine.callVolcEngine', { showToast: false });
      return { success: false, error };
    }
    if (!config.llmModel) {
      const error = 'LLM 模型 ID 未配置，请在设置页面配置';
      errorHandler.handleAPI(error, 'VolcEngine.callVolcEngine', { showToast: false });
      return { success: false, error };
    }

    logAPI('chat/completions', 'VolcEngine', 'start');

    const messages = params.messages || [
      ...(params.systemPrompt ? [{ role: 'system' as const, content: params.systemPrompt }] : []),
      { role: 'user' as const, content: params.prompt },
    ];

    const response = await apiRequest<any>(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: params.model || config.llmModel,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens || 16384,  // 🆕 默认增加到 16384
        stream: false,
      }),
    });

    if (response.success && response.data?.choices?.[0]?.message?.content) {
      logAPI('chat/completions', 'VolcEngine', 'success');
      return {
        success: true,
        data: response.data.choices[0].message.content,
        usage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        } : undefined,
      };
    }

    logAPI('chat/completions', 'VolcEngine', 'error', response.error);
    errorHandler.handleAPI(response.error || '生成失败', 'VolcEngine.callVolcEngine');
    return { success: false, error: response.error || '生成失败' };
  },

  /**
   * OpenAI
   */
  async callOpenAI(params: TextGenerationParams): Promise<APIResponse<string>> {
    const config = getProviderConfig('openai');
    if (!config) {
      return { success: false, error: 'OpenAI API Key 未配置' };
    }

    logAPI('chat/completions', 'OpenAI', 'start');

    const messages = params.messages || [
      ...(params.systemPrompt ? [{ role: 'system' as const, content: params.systemPrompt }] : []),
      { role: 'user' as const, content: params.prompt },
    ];

    const response = await apiRequest<any>(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: params.model || config.model || 'gpt-4o-mini',
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens || 4096,
      }),
    });

    if (response.success && response.data?.choices?.[0]?.message?.content) {
      logAPI('chat/completions', 'OpenAI', 'success');
      return {
        success: true,
        data: response.data.choices[0].message.content,
        usage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        } : undefined,
      };
    }

    logAPI('chat/completions', 'OpenAI', 'error', response.error);
    return { success: false, error: response.error || '生成失败' };
  },

  /**
   * DeepSeek
   */
  async callDeepSeek(params: TextGenerationParams): Promise<APIResponse<string>> {
    const config = getProviderConfig('deepseek');
    if (!config) {
      return { success: false, error: 'DeepSeek API Key 未配置' };
    }

    logAPI('chat/completions', 'DeepSeek', 'start');

    const messages = params.messages || [
      ...(params.systemPrompt ? [{ role: 'system' as const, content: params.systemPrompt }] : []),
      { role: 'user' as const, content: params.prompt },
    ];

    const response = await apiRequest<any>(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: params.model || config.model || 'deepseek-chat',
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens || 4096,
      }),
    });

    if (response.success && response.data?.choices?.[0]?.message?.content) {
      logAPI('chat/completions', 'DeepSeek', 'success');
      return {
        success: true,
        data: response.data.choices[0].message.content,
        usage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        } : undefined,
      };
    }

    logAPI('chat/completions', 'DeepSeek', 'error', response.error);
    return { success: false, error: response.error || '生成失败' };
  },

  /**
   * 通义千问
   */
  async callQianwen(params: TextGenerationParams): Promise<APIResponse<string>> {
    const config = getProviderConfig('qianwen');
    if (!config) {
      return { success: false, error: '通义千问 API Key 未配置' };
    }

    logAPI('chat/completions', 'Qianwen', 'start');

    const messages = params.messages || [
      ...(params.systemPrompt ? [{ role: 'system' as const, content: params.systemPrompt }] : []),
      { role: 'user' as const, content: params.prompt },
    ];

    const response = await apiRequest<any>(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: params.model || config.model || 'qwen-turbo',
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens || 4096,
      }),
    });

    if (response.success && response.data?.choices?.[0]?.message?.content) {
      logAPI('chat/completions', 'Qianwen', 'success');
      return {
        success: true,
        data: response.data.choices[0].message.content,
        usage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        } : undefined,
      };
    }

    logAPI('chat/completions', 'Qianwen', 'error', response.error);
    return { success: false, error: response.error || '生成失败' };
  },

  /**
   * 通用调用（自动选择可用提供商）
   */
  async generate(params: TextGenerationParams, preferredProvider?: AIProvider): Promise<APIResponse<string>> {
    // 优先使用指定提供商
    if (preferredProvider) {
      switch (preferredProvider) {
        case 'volcengine': return this.callVolcEngine(params);
        case 'openai': return this.callOpenAI(params);
        case 'deepseek': return this.callDeepSeek(params);
        case 'qianwen': return this.callQianwen(params);
      }
    }

    // 默认使用火山引擎
    const volcResult = await this.callVolcEngine(params);
    if (volcResult.success) return volcResult;

    // 回退到其他提供商
    const fallbackProviders: AIProvider[] = ['deepseek', 'openai', 'qianwen'];
    for (const provider of fallbackProviders) {
      const config = getProviderConfig(provider);
      if (config) {
        console.log(`[API] 回退到 ${provider}`);
        switch (provider) {
          case 'deepseek': return this.callDeepSeek(params);
          case 'openai': return this.callOpenAI(params);
          case 'qianwen': return this.callQianwen(params);
        }
      }
    }

    return { success: false, error: '没有可用的 AI 服务，请在设置页面配置 API Key' };
  },
};

// ============ 图像生成服务 ============

export const imageService = {
  /**
   * 火山引擎 Doubao-Seedream
   */
  async callVolcEngine(params: ImageGenerationParams): Promise<APIResponse<string>> {
    const config = getVolcEngineConfig();
    if (!config.apiKey) {
      return { success: false, error: '火山引擎 API Key 未配置' };
    }
    if (!config.imageModel) {
      return { success: false, error: '图像模型 ID 未配置' };
    }

    logAPI('images/generations', 'VolcEngine', 'start');

    const size = params.size || `${params.width || 1024}x${params.height || 1024}`;

    const response = await apiRequest<any>(`${config.baseUrl}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: params.model || config.imageModel,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        n: 1,
        size,
        seed: params.seed,
      }),
    });

    if (response.success && response.data?.data?.[0]) {
      logAPI('images/generations', 'VolcEngine', 'success');
      const imageData = response.data.data[0];
      return {
        success: true,
        data: imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : ''),
      };
    }

    logAPI('images/generations', 'VolcEngine', 'error', response.error);
    return { success: false, error: response.error || '图像生成失败' };
  },

  /**
   * OpenAI DALL-E
   */
  async callOpenAI(params: ImageGenerationParams): Promise<APIResponse<string>> {
    const config = getProviderConfig('openai');
    if (!config) {
      return { success: false, error: 'OpenAI API Key 未配置' };
    }

    logAPI('images/generations', 'OpenAI', 'start');

    const response = await apiRequest<any>(`${config.baseUrl}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: params.model || 'dall-e-3',
        prompt: params.prompt,
        n: 1,
        size: params.size || '1024x1024',
        response_format: params.responseFormat || 'url',
      }),
    });

    if (response.success && response.data?.data?.[0]) {
      logAPI('images/generations', 'OpenAI', 'success');
      const imageData = response.data.data[0];
      return {
        success: true,
        data: imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : ''),
      };
    }

    logAPI('images/generations', 'OpenAI', 'error', response.error);
    return { success: false, error: response.error || '图像生成失败' };
  },

  /**
   * 通用调用
   */
  async generate(params: ImageGenerationParams, preferredProvider?: AIProvider): Promise<APIResponse<string>> {
    if (preferredProvider === 'openai') {
      return this.callOpenAI(params);
    }

    // 默认使用火山引擎
    return this.callVolcEngine(params);
  },
};

// ============ 提示词优化服务 ============

// 导入专业系统提示词
import { getSystemPrompt as getEnhancedSystemPrompt } from '../utils/skills/aiSystemPrompts';

export const promptService = {
  /**
   * 获取优化系统提示词（增强版）
   */
  getSystemPrompt(resourceType: string, style: string, subType?: string): string {
    // 使用新的专业系统提示词库
    return getEnhancedSystemPrompt(resourceType, style, subType);
  },

  /**
   * 优化提示词
   */
  async optimize(params: PromptOptimizeParams): Promise<APIResponse<string>> {
    const style = params.style || 'Cinematic';
    const systemPrompt = this.getSystemPrompt(
      params.resourceType || 'default',
      style,
      params.subType
    );

    return textService.generate({
      prompt: params.description,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 800, // 增加到 800 以支持更详细的提示词
    });
  },
};

// ============ API 统计服务 ============

interface APIStats {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  totalTokens: number;
  byProvider: Record<string, {
    calls: number;
    tokens: number;
    errors: number;
  }>;
  lastUpdated: string;
}



// ============ 剧本改写服务 ============



class APIStatsManager {
  private stats: APIStats = {
    totalCalls: 0,
    successCalls: 0,
    failedCalls: 0,
    totalTokens: 0,
    byProvider: {},
    lastUpdated: new Date().toISOString(),
  };

  constructor() {
    this.loadStats();
  }

  private loadStats() {
    try {
      const stored = localStorage.getItem('api-stats');
      if (stored) {
        this.stats = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load API stats:', e);
    }
  }

  private saveStats() {
    try {
      this.stats.lastUpdated = new Date().toISOString();
      localStorage.setItem('api-stats', JSON.stringify(this.stats));
    } catch (e) {
      console.warn('Failed to save API stats:', e);
    }
  }

  recordCall(provider: string, success: boolean, tokens: number = 0) {
    this.stats.totalCalls++;
    if (success) {
      this.stats.successCalls++;
    } else {
      this.stats.failedCalls++;
    }
    this.stats.totalTokens += tokens;

    if (!this.stats.byProvider[provider]) {
      this.stats.byProvider[provider] = { calls: 0, tokens: 0, errors: 0 };
    }
    this.stats.byProvider[provider].calls++;
    this.stats.byProvider[provider].tokens += tokens;
    if (!success) {
      this.stats.byProvider[provider].errors++;
    }

    this.saveStats();
  }

  getStats(): APIStats {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
      byProvider: {},
      lastUpdated: new Date().toISOString(),
    };
    this.saveStats();
  }
}

export const apiStats = new APIStatsManager();

// ============ 导出统一接口 ============

export const aiService = {
  text: textService,
  image: imageService,
  prompt: promptService,
  stats: apiStats,
};

// ============ 兼容旧 API ============

/**
 * 兼容 volcApi.ts 的 callDeepSeek
 */
export async function callDeepSeek(
  messages: { role: string; content: string }[],
  temperature = 0.7,
  maxTokens = 16384  // 🆕 增加默认 maxTokens 到 16384，支持更长的输出
): Promise<string> {
  console.log('[callDeepSeek] 开始调用，消息数量:', messages.length);
  console.log('[callDeepSeek] 第一条消息长度:', messages[0]?.content?.length || 0);
  console.log('[callDeepSeek] maxTokens:', maxTokens);

  const result = await textService.callVolcEngine({
    prompt: '', // 兼容性填充
    messages: messages as any,
    temperature,
    maxTokens,  // 🆕 传递 maxTokens 参数
  });

  console.log('[callDeepSeek] API 调用结果:', result.success ? '成功' : '失败');
  if (!result.success) {
    console.error('[callDeepSeek] 错误信息:', result.error);
  } else {
    console.log('[callDeepSeek] 返回数据长度:', result.data?.length || 0);
    console.log('[callDeepSeek] 返回数据预览:', result.data?.substring(0, 200));
  }

  if (result.success && result.data) {
    apiStats.recordCall('volcengine', true, result.usage?.totalTokens || 0);
    return result.data;
  }

  apiStats.recordCall('volcengine', false);
  const errorMessage = typeof result.error === 'string'
    ? result.error
    : JSON.stringify(result.error);
  throw new Error(errorMessage || 'API 调用失败');
}

/**
 * 兼容 volcApi.ts 的 callDoubaoImage
 */
export async function callDoubaoImage(
  prompt: string,
  size: string = '1920x1920',
  negativePrompt?: string
): Promise<string> {
  const result = await imageService.callVolcEngine({
    prompt,
    size,
    negativePrompt,
  });

  if (result.success && result.data) {
    apiStats.recordCall('volcengine-image', true);
    return result.data;
  }

  apiStats.recordCall('volcengine-image', false);
  throw new Error(result.error || '图像生成失败');
}

/**
 * 兼容 volcApi.ts 的 optimizePrompt
 */
export async function optimizePrompt(
  description: string,
  style: string = 'Cinematic',
  resourceType?: 'character' | 'scene' | 'prop' | 'costume' | 'storyboard'
): Promise<string> {
  const result = await promptService.optimize({
    description,
    style,
    resourceType,
  });

  if (result.success && result.data) {
    return result.data;
  }

  // 如果优化失败，返回原始描述
  console.warn('Prompt optimization failed:', result.error);
  return description;
}

export default aiService;
