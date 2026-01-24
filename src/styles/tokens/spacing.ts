/**
 * 间距设计令牌
 * 定义应用的间距系统
 */

export const spacing = {
  // 基础间距单位（4px 基准）
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  64: '16rem',    // 256px
} as const;

// 语义化间距
export const spacingSemantic = {
  // 组件内部间距
  component: {
    xs: spacing[1],   // 4px
    sm: spacing[2],   // 8px
    md: spacing[4],  // 16px
    lg: spacing[6],  // 24px
    xl: spacing[8],  // 32px
  },

  // 组件之间间距
  section: {
    xs: spacing[4],  // 16px
    sm: spacing[6],  // 24px
    md: spacing[8],  // 32px
    lg: spacing[12], // 48px
    xl: spacing[16], // 64px
  },

  // 页面边距
  page: {
    xs: spacing[4],  // 16px
    sm: spacing[6],  // 24px
    md: spacing[8],  // 32px
    lg: spacing[12], // 48px
    xl: spacing[16], // 64px
  },
} as const;

export type SpacingToken = typeof spacing;
export type SpacingSemanticToken = typeof spacingSemantic;
