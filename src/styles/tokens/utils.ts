/**
 * 设计令牌工具函数
 * 提供便捷的方式使用设计令牌
 */

import { colors, typography, spacing, shadows } from './index';

/**
 * 获取颜色值
 */
export function getColor(path: string): string {
  const parts = path.split('.');
  let value: any = colors;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part as keyof typeof value];
    } else {
      console.warn(`Color path "${path}" not found`);
      return colors.gray[500];
    }
  }
  
  return typeof value === 'string' ? value : colors.gray[500];
}

/**
 * 获取字体样式
 */
export function getTypographyStyle(style: keyof typeof typography.styles) {
  return typography.styles[style];
}

/**
 * 获取间距值
 */
export function getSpacing(size: keyof typeof spacing): string {
  return spacing[size];
}

/**
 * 获取阴影值
 */
export function getShadow(size: keyof typeof shadows): string {
  return shadows[size];
}

/**
 * 创建渐变背景
 */
export function createGradient(
  from: string,
  to: string,
  direction: 'horizontal' | 'vertical' | 'diagonal' = 'horizontal'
): string {
  const directions = {
    horizontal: 'to right',
    vertical: 'to bottom',
    diagonal: 'to bottom right',
  };
  
  return `linear-gradient(${directions[direction]}, ${from}, ${to})`;
}

/**
 * 创建主色调渐变
 */
export function primaryGradient(direction: 'horizontal' | 'vertical' | 'diagonal' = 'horizontal'): string {
  return createGradient(colors.primary[500], colors.secondary[500], direction);
}

/**
 * 创建语义颜色渐变
 */
export function semanticGradient(
  type: 'success' | 'warning' | 'error' | 'info',
  direction: 'horizontal' | 'vertical' | 'diagonal' = 'horizontal'
): string {
  const colorMap = {
    success: colors.semantic.success[500],
    warning: colors.semantic.warning[500],
    error: colors.semantic.error[500],
    info: colors.semantic.info[500],
  };
  
  return createGradient(colorMap[type], colors.gray[500], direction);
}

/**
 * 创建玻璃态效果样式
 */
export function glassEffect(opacity: number = 0.8): React.CSSProperties {
  return {
    backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };
}

/**
 * 创建卡片样式
 */
export function cardStyle(elevation: 'sm' | 'md' | 'lg' = 'md'): React.CSSProperties {
  const shadowMap = {
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
  };
  
  return {
    backgroundColor: colors.background.default,
    borderRadius: '12px',
    boxShadow: shadowMap[elevation],
    padding: spacing[6],
  };
}
