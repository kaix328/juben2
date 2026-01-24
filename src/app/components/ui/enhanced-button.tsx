/**
 * 增强按钮组件
 * 提供多种视觉变体和动画效果
 */
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/classnames';
import { Loader2 } from 'lucide-react';

const enhancedButtonVariants = cva(
  // 基础样式
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        // 默认 - 渐变主色
        default:
          'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:from-purple-700 hover:via-purple-600 hover:to-pink-600 focus-visible:ring-purple-500',
        // 次要
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
        // 轮廓
        outline:
          'border-2 border-purple-500 text-purple-600 bg-transparent hover:bg-purple-50 focus-visible:ring-purple-500',
        // 幽灵
        ghost:
          'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
        // 链接
        link:
          'text-purple-600 underline-offset-4 hover:underline focus-visible:ring-purple-500',
        // 危险
        destructive:
          'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 hover:from-red-700 hover:to-red-600 focus-visible:ring-red-500',
        // 成功
        success:
          'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:from-emerald-700 hover:to-emerald-600 focus-visible:ring-emerald-500',
        // 警告
        warning:
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 hover:from-amber-600 hover:to-orange-600 focus-visible:ring-amber-500',
        // 玻璃态
        glass:
          'bg-white/80 backdrop-blur-md border border-white/50 text-gray-800 shadow-lg hover:bg-white/90 focus-visible:ring-gray-500',
        // 霓虹
        neon:
          'bg-transparent border-2 border-purple-500 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] hover:bg-purple-500/10 focus-visible:ring-purple-500',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      rounded: {
        default: 'rounded-lg',
        sm: 'rounded-md',
        lg: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
    },
  }
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size, rounded, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            <span>加载中...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton, enhancedButtonVariants };
