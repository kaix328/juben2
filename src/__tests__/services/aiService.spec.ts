/**
 * aiService 测试套件
 * 测试统一 AI 服务层的所有功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  aiService,
  textService,
  imageService,
  promptService,
  apiStats,
  callDeepSeek,
  callDoubaoImage,
  optimizePrompt,
  type TextGenerationParams,
  type ImageGenerationParams,
  type PromptOptimizeParams,
} from '../../app/services/aiService';

// Mock dependencies
vi.mock('../../app/stores', () => ({
  useConfigStore: {
    getState: vi.fn(() => ({
      apiSettings: {
        volcApiKey: 'test-volc-key',
        llmEndpointId: 'test-llm-model',
        imageEndpointId: 'test-image-model',
      },
    })),
  },
}));

vi.mock('../../app/utils/secureKeys', () => ({
  secureKeyManager: {
    getKeyByProvider: vi.fn((provider: string) => {
      const keys: Record<string, string> = {
        openai: 'test-openai-key',
        deepseek: 'test-deepseek-key',
        qianwen: 'test-qianwen-key',
      };
      return keys[provider] || null;
    }),
  },
}));

vi.mock('../../app/services/errorHandler', () => ({
  errorHandler: {
    handleAPI: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('textService', () => {
    describe('callVolcEngine', () => {
      it('应该成功调用火山引擎 API', async () => {
        const mockResponse = {
          choices: [{ message: { content: '测试响应' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: TextGenerationParams = {
          prompt: '测试提示',
          systemPrompt: '系统提示',
        };

        const result = await textService.callVolcEngine(params);

        expect(result.success).toBe(true);
        expect(result.data).toBe('测试响应');
        expect(result.usage).toEqual({
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        });
      });

      it('应该处理 API Key 未配置的情况', async () => {
        // 直接 mock import.meta.env 和 useConfigStore
        vi.stubEnv('VITE_VOLC_API_KEY', '');
        
        const { useConfigStore } = await import('../../app/stores');
        const originalGetState = useConfigStore.getState;
        
        (useConfigStore.getState as any) = vi.fn(() => ({
          apiSettings: { 
            volcApiKey: '',
            llmEndpointId: 'test-model',
          },
        }));

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.callVolcEngine(params);

        expect(result.success).toBe(false);
        expect(result.error).toContain('API Key');
        
        useConfigStore.getState = originalGetState;
        vi.unstubAllEnvs();
      });

      it('应该处理模型 ID 未配置的情况', async () => {
        vi.stubEnv('VITE_VOLC_LLM_ENDPOINT_ID', '');
        
        const { useConfigStore } = await import('../../app/stores');
        const originalGetState = useConfigStore.getState;
        
        (useConfigStore.getState as any) = vi.fn(() => ({
          apiSettings: {
            volcApiKey: 'test-key',
            llmEndpointId: '',
          },
        }));

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.callVolcEngine(params);

        expect(result.success).toBe(false);
        expect(result.error).toContain('模型 ID');
        
        useConfigStore.getState = originalGetState;
        vi.unstubAllEnvs();
      });

      it('应该处理 HTTP 错误', async () => {
        // Mock 3 次失败（原始 + 2 次重试）
        (global.fetch as any)
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
          });

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.callVolcEngine(params);

        expect(result.success).toBe(false);
        expect(result.error).toContain('HTTP 500');
      });

      it('应该处理网络错误', async () => {
        // Mock 3 次失败（原始 + 2 次重试）
        (global.fetch as any)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'));

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.callVolcEngine(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
      });

      it('应该处理超时错误', async () => {
        (global.fetch as any).mockImplementationOnce(() => 
          new Promise((_, reject) => {
            setTimeout(() => reject({ name: 'AbortError' }), 100);
          })
        );

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.callVolcEngine(params);

        expect(result.success).toBe(false);
        expect(result.error).toBe('请求超时');
      });

      it('应该支持自定义参数', async () => {
        const mockResponse = {
          choices: [{ message: { content: '响应' } }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: TextGenerationParams = {
          prompt: '测试',
          temperature: 0.5,
          maxTokens: 2000,
          model: 'custom-model',
        };

        await textService.callVolcEngine(params);

        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);

        expect(body.temperature).toBe(0.5);
        expect(body.max_tokens).toBe(2000);
        expect(body.model).toBe('custom-model');
      });

      it('应该支持 messages 格式', async () => {
        const mockResponse = {
          choices: [{ message: { content: '响应' } }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: TextGenerationParams = {
          prompt: '不使用',
          messages: [
            { role: 'system', content: '系统' },
            { role: 'user', content: '用户' },
          ],
        };

        await textService.callVolcEngine(params);

        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);

        expect(body.messages).toHaveLength(2);
        expect(body.messages[0].role).toBe('system');
      });
    });

    describe('callOpenAI', () => {
      it('应该成功调用 OpenAI API', async () => {
        const mockResponse = {
          choices: [{ message: { content: 'OpenAI 响应' } }],
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.callOpenAI(params);

        expect(result.success).toBe(true);
        expect(result.data).toBe('OpenAI 响应');
      });

      it('应该处理 API Key 未配置', async () => {
        const { secureKeyManager } = await import('../../app/utils/secureKeys');
        (secureKeyManager.getKeyByProvider as any).mockReturnValueOnce(null);

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.callOpenAI(params);

        expect(result.success).toBe(false);
        expect(result.error).toContain('未配置');
      });
    });

    describe('callDeepSeek', () => {
      it('应该成功调用 DeepSeek API', async () => {
        const mockResponse = {
          choices: [{ message: { content: 'DeepSeek 响应' } }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.callDeepSeek(params);

        expect(result.success).toBe(true);
        expect(result.data).toBe('DeepSeek 响应');
      });
    });

    describe('callQianwen', () => {
      it('应该成功调用通义千问 API', async () => {
        const mockResponse = {
          choices: [{ message: { content: '千问响应' } }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.callQianwen(params);

        expect(result.success).toBe(true);
        expect(result.data).toBe('千问响应');
      });
    });

    describe('generate', () => {
      it('应该使用指定的提供商', async () => {
        const mockResponse = {
          choices: [{ message: { content: 'OpenAI 响应' } }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.generate(params, 'openai');

        expect(result.success).toBe(true);
        expect(result.data).toBe('OpenAI 响应');
      });

      it('应该默认使用火山引擎', async () => {
        const mockResponse = {
          choices: [{ message: { content: '火山响应' } }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.generate(params);

        expect(result.success).toBe(true);
        expect(result.data).toBe('火山响应');
      });

      it('应该在主提供商失败时回退', async () => {
        // 第一次调用失败（火山引擎）
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Error',
        });

        // 第二次调用成功（DeepSeek）
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'DeepSeek 响应' } }],
          }),
        });

        const params: TextGenerationParams = { prompt: '测试' };
        const result = await textService.generate(params);

        expect(result.success).toBe(true);
        expect(result.data).toBe('DeepSeek 响应');
      });
    });
  });

  describe('imageService', () => {
    describe('callVolcEngine', () => {
      it('应该成功生成图像（URL 格式）', async () => {
        const mockResponse = {
          data: [{ url: 'https://example.com/image.png' }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: ImageGenerationParams = {
          prompt: '测试图像',
          width: 1024,
          height: 1024,
        };

        const result = await imageService.callVolcEngine(params);

        expect(result.success).toBe(true);
        expect(result.data).toBe('https://example.com/image.png');
      });

      it('应该成功生成图像（Base64 格式）', async () => {
        const mockResponse = {
          data: [{ b64_json: 'base64data' }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: ImageGenerationParams = { prompt: '测试' };
        const result = await imageService.callVolcEngine(params);

        expect(result.success).toBe(true);
        expect(result.data).toContain('data:image/png;base64,');
      });

      it('应该处理 API Key 未配置', async () => {
        vi.stubEnv('VITE_VOLC_API_KEY', '');
        
        const { useConfigStore } = await import('../../app/stores');
        const originalGetState = useConfigStore.getState;
        
        (useConfigStore.getState as any) = vi.fn(() => ({
          apiSettings: { 
            volcApiKey: '',
            imageEndpointId: 'test-model',
          },
        }));

        const params: ImageGenerationParams = { prompt: '测试' };
        const result = await imageService.callVolcEngine(params);

        expect(result.success).toBe(false);
        expect(result.error).toContain('API Key');
        
        useConfigStore.getState = originalGetState;
        vi.unstubAllEnvs();
      });

      it('应该支持自定义参数', async () => {
        const mockResponse = {
          data: [{ url: 'https://example.com/image.png' }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: ImageGenerationParams = {
          prompt: '测试',
          negativePrompt: '负面提示',
          size: '512x512',
          seed: 12345,
        };

        await imageService.callVolcEngine(params);

        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);

        expect(body.negative_prompt).toBe('负面提示');
        expect(body.size).toBe('512x512');
        expect(body.seed).toBe(12345);
      });
    });

    describe('callOpenAI', () => {
      it('应该成功调用 OpenAI 图像生成', async () => {
        const mockResponse = {
          data: [{ url: 'https://openai.com/image.png' }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: ImageGenerationParams = { prompt: '测试' };
        const result = await imageService.callOpenAI(params);

        expect(result.success).toBe(true);
        expect(result.data).toBe('https://openai.com/image.png');
      });
    });

    describe('generate', () => {
      it('应该使用指定的提供商', async () => {
        const mockResponse = {
          data: [{ url: 'https://openai.com/image.png' }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: ImageGenerationParams = { prompt: '测试' };
        const result = await imageService.generate(params, 'openai');

        expect(result.success).toBe(true);
      });

      it('应该默认使用火山引擎', async () => {
        const mockResponse = {
          data: [{ url: 'https://volc.com/image.png' }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: ImageGenerationParams = { prompt: '测试' };
        const result = await imageService.generate(params);

        expect(result.success).toBe(true);
      });
    });
  });

  describe('promptService', () => {
    describe('getSystemPrompt', () => {
      it('应该返回角色类型的系统提示词', () => {
        const prompt = promptService.getSystemPrompt('character', 'Anime');
        expect(prompt).toContain('角色设计');
        expect(prompt).toContain('Anime');
      });

      it('应该返回场景类型的系统提示词', () => {
        const prompt = promptService.getSystemPrompt('scene', 'Realistic');
        expect(prompt).toContain('场景设计');
        expect(prompt).toContain('Realistic');
      });

      it('应该返回分镜类型的系统提示词', () => {
        const prompt = promptService.getSystemPrompt('storyboard', 'Cinematic');
        expect(prompt).toContain('分镜设计');
        expect(prompt).toContain('Cinematic');
      });

      it('应该返回默认系统提示词', () => {
        const prompt = promptService.getSystemPrompt('unknown', 'Default');
        expect(prompt).toContain('AI绘画提示词专家');
      });
    });

    describe('optimize', () => {
      it('应该成功优化提示词', async () => {
        const mockResponse = {
          choices: [{ message: { content: '优化后的提示词' } }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: PromptOptimizeParams = {
          description: '一个角色',
          style: 'Anime',
          resourceType: 'character',
        };

        const result = await promptService.optimize(params);

        expect(result.success).toBe(true);
        expect(result.data).toBe('优化后的提示词');
      });

      it('应该使用默认参数', async () => {
        const mockResponse = {
          choices: [{ message: { content: '优化结果' } }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const params: PromptOptimizeParams = {
          description: '测试',
        };

        await promptService.optimize(params);

        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);

        expect(body.temperature).toBe(0.3);
        expect(body.max_tokens).toBe(500);
      });
    });
  });

  describe('apiStats', () => {
    it('应该记录 API 调用', () => {
      apiStats.recordCall('test-provider', true, 100);
      const stats = apiStats.getStats();

      expect(stats.totalCalls).toBeGreaterThan(0);
      expect(stats.successCalls).toBeGreaterThan(0);
      expect(stats.totalTokens).toBeGreaterThan(0);
    });

    it('应该记录失败的调用', () => {
      const beforeStats = apiStats.getStats();
      apiStats.recordCall('test-provider', false, 0);
      const afterStats = apiStats.getStats();

      expect(afterStats.failedCalls).toBeGreaterThan(beforeStats.failedCalls);
    });

    it('应该按提供商统计', () => {
      apiStats.recordCall('provider-a', true, 50);
      apiStats.recordCall('provider-b', true, 100);
      const stats = apiStats.getStats();

      expect(stats.byProvider['provider-a']).toBeDefined();
      expect(stats.byProvider['provider-b']).toBeDefined();
    });

    it('应该能重置统计', () => {
      apiStats.recordCall('test', true, 100);
      apiStats.resetStats();
      const stats = apiStats.getStats();

      expect(stats.totalCalls).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });
  });

  describe('兼容 API', () => {
    describe('callDeepSeek', () => {
      it('应该成功调用', async () => {
        const mockResponse = {
          choices: [{ message: { content: '响应' } }],
          usage: { total_tokens: 50 },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const messages = [{ role: 'user', content: '测试' }];
        const result = await callDeepSeek(messages, 0.7);

        expect(result).toBe('响应');
      });

      it('应该在失败时抛出错误', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Error',
        });

        const messages = [{ role: 'user', content: '测试' }];

        await expect(callDeepSeek(messages)).rejects.toThrow();
      });
    });

    describe('callDoubaoImage', () => {
      it('应该成功生成图像', async () => {
        const mockResponse = {
          data: [{ url: 'https://example.com/image.png' }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await callDoubaoImage('测试提示', '1024x1024');

        expect(result).toBe('https://example.com/image.png');
      });

      it('应该在失败时抛出错误', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Error',
        });

        await expect(callDoubaoImage('测试')).rejects.toThrow();
      });
    });

    describe('optimizePrompt', () => {
      it('应该成功优化提示词', async () => {
        const mockResponse = {
          choices: [{ message: { content: '优化后' } }],
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await optimizePrompt('原始描述', 'Anime', 'character');

        expect(result).toBe('优化后');
      });

      it('应该在失败时返回原始描述', async () => {
        // Mock 所有可能的调用都失败
        (global.fetch as any).mockImplementation(() => 
          Promise.resolve({
            ok: false,
            status: 500,
            text: async () => 'Error',
          })
        );

        const result = await optimizePrompt('原始描述');

        expect(result).toBe('原始描述');
      }, 10000);
    });
  });

  describe('重试机制', () => {
    it('应该在可重试错误时重试', async () => {
      // 第一次失败
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit',
      });

      // 第二次成功
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '成功' } }],
        }),
      });

      const params: TextGenerationParams = { prompt: '测试' };
      const result = await textService.callVolcEngine(params);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('应该在达到最大重试次数后失败', async () => {
      // 清除之前的调用记录
      vi.clearAllMocks();
      
      // 所有调用都失败
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error',
      });

      const params: TextGenerationParams = { prompt: '测试' };
      const result = await textService.callVolcEngine(params);

      expect(result.success).toBe(false);
      // 注意：可能会有额外的回退调用
      expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('aiService 统一接口', () => {
    it('应该导出所有服务', () => {
      expect(aiService.text).toBeDefined();
      expect(aiService.image).toBeDefined();
      expect(aiService.prompt).toBeDefined();
      expect(aiService.stats).toBeDefined();
    });

    it('应该能通过统一接口调用', async () => {
      const mockResponse = {
        choices: [{ message: { content: '响应' } }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiService.text.generate({ prompt: '测试' });

      expect(result.success).toBe(true);
    });
  });
});
