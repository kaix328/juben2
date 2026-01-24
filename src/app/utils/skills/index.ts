/**
 * 提示词技能库统一导出
 * 整合所有专业提示词生成技能
 */

export * from './cinematicTerms';
export * from './videoPromptSkills';
export * from './negativePrompts';
export * from './platformOptimization';

// 重新导出默认对象
export { default as cinematicTerms } from './cinematicTerms';
export { default as videoPromptSkills } from './videoPromptSkills';
export { default as negativePrompts } from './negativePrompts';
export { default as platformOptimization } from './platformOptimization';
