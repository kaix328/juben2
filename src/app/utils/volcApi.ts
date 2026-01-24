/// <reference types="vite/client" />

/**
 * 火山引擎 API 兼容层
 * 
 * ⚠️ 此文件已重构为兼容层！
 * 所有 API 调用已迁移到 ../services/aiService.ts
 * 此文件保留向后兼容性，建议新代码直接使用 aiService
 * 
 * 迁移指南：
 * - callDeepSeek → aiService.text.callVolcEngine 或 textService.generate
 * - callDoubaoImage → aiService.image.callVolcEngine 或 imageService.generate
 * - optimizePrompt → aiService.prompt.optimize 或 promptService.optimize
 */

// 重导出新 API 服务的兼容函数
export {
  callDeepSeek,
  callDoubaoImage,
  optimizePrompt,
  aiService,
  textService,
  imageService,
  promptService,
  apiStats,
} from '../services/aiService';

// 重导出类型
export type {
  AIProvider,
  AIModelConfig,
  APIResponse,
  TextGenerationParams,
  ImageGenerationParams,
  PromptOptimizeParams,
} from '../services/aiService';

// JSON 解析工具保持原位置
export { parseJSON } from './json-parser';

// ============ 类型定义（保持兼容） ============

import type { ScriptScene, StoryboardPanel, DirectorStyle } from '../types';

// ============ 辅助函数（保持兼容） ============

/**
 * 从 DirectorStyle 构建风格描述
 * @deprecated 使用 promptService.optimize 代替
 */
export function buildStyleDescription(style?: DirectorStyle): string {
  if (!style) return 'Cinematic';

  const parts: string[] = [];
  if (style.artStyle) parts.push(style.artStyle);
  if (style.colorTone) parts.push(style.colorTone);
  if (style.lightingStyle) parts.push(style.lightingStyle);
  if (style.cameraStyle) parts.push(style.cameraStyle);
  if (style.mood) parts.push(`${style.mood}氛围`);
  if (style.customPrompt) parts.push(style.customPrompt);

  return parts.length > 0 ? parts.join(', ') : 'Cinematic';
}
