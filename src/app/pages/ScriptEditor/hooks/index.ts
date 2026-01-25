/**
 * Hooks 导出索引
 * 统一导出所有剧本相关的 Hooks
 */

// 主 Hook（重构版）
export { useScriptData } from './useScriptData.refactored';

// 子 Hooks（可单独使用）
export { useScriptLoader } from './useScriptLoader';
export { useScriptSaver } from './useScriptSaver';
export { useScriptExtractor } from './useScriptExtractor';
export { useScriptHistory } from './useScriptHistory';
export { useScriptEditor } from './useScriptEditor';

// 类型导出
export type { UseScriptDataOptions, UseScriptDataReturn } from './useScriptData.refactored';
