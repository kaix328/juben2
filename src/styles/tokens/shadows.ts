/**
 * 阴影设计令牌
 * 定义应用的阴影系统
 */

export const shadows = {
  // 基础阴影
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

  // 彩色阴影（用于强调）
  colored: {
    primary: '0 4px 14px 0 rgba(139, 92, 246, 0.15)',
    secondary: '0 4px 14px 0 rgba(236, 72, 153, 0.15)',
    success: '0 4px 14px 0 rgba(34, 197, 94, 0.15)',
    warning: '0 4px 14px 0 rgba(245, 158, 11, 0.15)',
    error: '0 4px 14px 0 rgba(239, 68, 68, 0.15)',
    info: '0 4px 14px 0 rgba(59, 130, 246, 0.15)',
  },

  // 悬停阴影
  hover: {
    sm: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
    md: '0 6px 12px -2px rgba(0, 0, 0, 0.15)',
    lg: '0 12px 20px -4px rgba(0, 0, 0, 0.15)',
  },

  // 聚焦阴影
  focus: {
    default: '0 0 0 3px rgba(139, 92, 246, 0.1)',
    error: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    success: '0 0 0 3px rgba(34, 197, 94, 0.1)',
  },
} as const;

export type ShadowToken = typeof shadows;
