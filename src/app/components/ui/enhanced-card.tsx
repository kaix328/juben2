/**
 * 增强卡片组件
 * 提供多种视觉变体和交互效果
 */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/classnames';

const enhancedCardVariants = cva(
  // 基础样式
  'rounded-xl transition-all duration-300',
  {
    variants: {
      variant: {
        // 默认
        default:
          'bg-white border border-gray-200 shadow-sm hover:shadow-md',
        // 提升
        elevated:
          'bg-white shadow-lg hover:shadow-xl',
        // 轮廓
        outline:
          'bg-transparent border-2 border-gray-200 hover:border-purple-300',
        // 玻璃态
        glass:
          'bg-white/70 backdrop-blur-md border border-white/50 shadow-lg',
        // 渐变
        gradient:
          'bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-md hover:shadow-lg',
        // 渐变边框
        'gradient-border':
          'bg-white relative before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-r before:from-purple-500 before:to-pink-500 before:-z-10 before:opacity-0 hover:before:opacity-100 before:transition-opacity',
        // 霓虹
        neon:
          'bg-gray-900 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]',
        // 柔和
        soft:
          'bg-gray-50 border border-gray-100',
        // 交互式
        interactive:
          'bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-purple-200 cursor-pointer',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
);

export interface EnhancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedCardVariants> {
  /** 是否显示顶部装饰条 */
  showTopBar?: boolean;
  /** 顶部装饰条颜色 */
  topBarColor?: 'purple' | 'pink' | 'blue' | 'green' | 'orange' | 'gradient';
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, variant, padding, showTopBar, topBarColor = 'gradient', children, ...props }, ref) => {
    const topBarColors = {
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      blue: 'bg-blue-500',
      green: 'bg-emerald-500',
      orange: 'bg-orange-500',
      gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500',
    };

    return (
      <div
        ref={ref}
        className={cn(
          enhancedCardVariants({ variant, padding }),
          'overflow-hidden',
          className
        )}
        {...props}
      >
        {showTopBar && (
          <div className={cn('h-1 -mx-4 -mt-4 mb-4', topBarColors[topBarColor])} 
               style={{ marginLeft: padding === 'none' ? 0 : undefined, marginRight: padding === 'none' ? 0 : undefined, marginTop: padding === 'none' ? 0 : undefined }} />
        )}
        {children}
      </div>
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

// 卡片头部
const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));
EnhancedCardHeader.displayName = 'EnhancedCardHeader';

// 卡片标题
const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
EnhancedCardTitle.displayName = 'EnhancedCardTitle';

// 卡片描述
const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));
EnhancedCardDescription.displayName = 'EnhancedCardDescription';

// 卡片内容
const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
EnhancedCardContent.displayName = 'EnhancedCardContent';

// 卡片底部
const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 border-t border-gray-100 mt-4', className)}
    {...props}
  />
));
EnhancedCardFooter.displayName = 'EnhancedCardFooter';

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  EnhancedCardFooter,
  enhancedCardVariants,
};
