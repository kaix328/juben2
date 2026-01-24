/**
 * 设计令牌统一导出
 * 提供完整的设计系统令牌
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';

import { colors } from './colors';
import { typography } from './typography';
import { spacing, spacingSemantic } from './spacing';
import { shadows } from './shadows';

/**
 * 完整的设计令牌对象
 */
export const designTokens = {
  colors,
  typography,
  spacing,
  spacingSemantic,
  shadows,
} as const;

export type DesignTokens = typeof designTokens;
