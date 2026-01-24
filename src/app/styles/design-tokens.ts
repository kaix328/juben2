/**
 * 设计令牌系统 (Design Tokens)
 * 基于 ui-ux-pro-max skill 的最佳实践
 * 
 * 提供统一的设计变量，确保整个应用的视觉一致性
 */

// ============ 颜色系统 ============

/**
 * 品牌色彩
 */
export const BRAND_COLORS = {
  // 主色 - 靛蓝紫
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',  // 主色
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  // 强调色 - 粉红
  accent: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',  // 强调色
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  },
  // 成功色 - 翠绿
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',  // 成功色
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  // 警告色 - 琥珀
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // 警告色
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // 错误色 - 红色
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // 错误色
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
} as const;

/**
 * 中性色
 */
export const NEUTRAL_COLORS = {
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
} as const;

// ============ 字体系统 ============

/**
 * 字体族
 */
export const FONT_FAMILIES = {
  // 显示字体 - 用于标题
  display: "'Playfair Display', Georgia, serif",
  // 正文字体 - 用于内容
  body: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  // 等宽字体 - 用于代码
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
} as const;

/**
 * 字体大小
 */
export const FONT_SIZES = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
} as const;

/**
 * 字重
 */
export const FONT_WEIGHTS = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/**
 * 行高
 */
export const LINE_HEIGHTS = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// ============ 间距系统 ============

/**
 * 间距比例 (基于 4px 网格)
 */
export const SPACING = {
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
} as const;

// ============ 圆角系统 ============

/**
 * 圆角大小
 */
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============ 阴影系统 ============

/**
 * 阴影效果
 */
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // 品牌发光效果
  glow: {
    primary: '0 0 20px rgb(99 102 241 / 0.3)',
    accent: '0 0 20px rgb(236 72 153 / 0.3)',
    success: '0 0 20px rgb(16 185 129 / 0.3)',
  },
} as const;

// ============ 动画系统 ============

/**
 * 动画时长
 */
export const DURATIONS = {
  instant: '0ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '700ms',
  slowest: '1000ms',
} as const;

/**
 * 缓动函数
 */
export const EASINGS = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // 高级缓动
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeInOutCirc: 'cubic-bezier(0.85, 0, 0.15, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// ============ 断点系统 ============

/**
 * 响应式断点
 */
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============ Z-Index 系统 ============

/**
 * 层级管理
 */
export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ============ 组件特定令牌 ============

/**
 * 按钮变体
 */
export const BUTTON_VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
    color: '#ffffff',
    hoverBackground: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
  },
  secondary: {
    background: '#f3f4f6',
    color: '#374151',
    hoverBackground: '#e5e7eb',
  },
  outline: {
    background: 'transparent',
    color: '#6366f1',
    border: '1px solid #6366f1',
    hoverBackground: '#eef2ff',
  },
  ghost: {
    background: 'transparent',
    color: '#6b7280',
    hoverBackground: '#f3f4f6',
  },
  destructive: {
    background: '#ef4444',
    color: '#ffffff',
    hoverBackground: '#dc2626',
  },
} as const;

/**
 * 卡片变体
 */
export const CARD_VARIANTS = {
  default: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  },
  elevated: {
    background: '#ffffff',
    border: 'none',
    borderRadius: '1rem',
    shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '1rem',
  },
  gradient: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    border: 'none',
    borderRadius: '1rem',
  },
} as const;

/**
 * 输入框变体
 */
export const INPUT_VARIANTS = {
  default: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    focusBorder: '#6366f1',
    focusRing: 'rgba(99, 102, 241, 0.2)',
  },
  filled: {
    background: '#f3f4f6',
    border: '2px solid transparent',
    borderRadius: '0.5rem',
    focusBorder: '#6366f1',
    focusBackground: '#ffffff',
  },
  outline: {
    background: 'transparent',
    border: '2px solid #d1d5db',
    borderRadius: '0.5rem',
    focusBorder: '#6366f1',
  },
} as const;

// ============ 导出类型 ============

export type BrandColorKey = keyof typeof BRAND_COLORS;
export type NeutralColorKey = keyof typeof NEUTRAL_COLORS;
export type FontSizeKey = keyof typeof FONT_SIZES;
export type SpacingKey = keyof typeof SPACING;
export type BorderRadiusKey = keyof typeof BORDER_RADIUS;
export type ShadowKey = keyof typeof SHADOWS;
export type DurationKey = keyof typeof DURATIONS;
export type EasingKey = keyof typeof EASINGS;
export type BreakpointKey = keyof typeof BREAKPOINTS;
export type ZIndexKey = keyof typeof Z_INDEX;
