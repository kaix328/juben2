/**
 * AI 服务模块 - 重导出入口
 * 
 * ⚠️ 此文件已重构！所有功能已拆分到 ./ai/ 子目录
 * 
 * 为保持向后兼容，此文件重导出所有函数。
 * 建议新代码直接从 './ai' 导入。
 */

// 重导出所有函数以保持兼容性
export {
  // 工具函数
  devLog,
  callWithRetry,
  checkCharacterConsistency,

  // 剧本提取
  extractScript,
  extractScriptInChunks,
  type ScriptMode,

  // 分镜后处理
  smartFillPanel,

  // 分镜生成
  extractStoryboard,
  generateFallbackPanels,

  // 图像生成
  generateStoryboardImage,

  // 资产提取
  extractAssets,
  type ExtractedAssets,
} from './ai';