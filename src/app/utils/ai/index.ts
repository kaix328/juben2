/**
 * AI 模块统一导出入口
 * 保持向后兼容性，所有函数从这里统一导出
 */

// 工具函数
export { devLog, callWithRetry, checkCharacterConsistency } from './utils';

// 剧本提取
export { extractScript, extractScriptInChunks, extractScriptGenerator, type ScriptMode } from './scriptExtractor';

// 分镜后处理
export { smartFillPanel } from './panelProcessor';

// 分镜生成
export { extractStoryboard, generateFallbackPanels } from './storyboardGenerator';

// 图像生成
export { generateStoryboardImage } from './imageGenerator';

// 资产提取
export { extractAssets, type ExtractedAssets } from './assetExtractor';

// 故事五元素分析
export { StoryAnalyzer, analyzeStoryFiveElements, formatFiveElementsReport } from './storyAnalyzer';
