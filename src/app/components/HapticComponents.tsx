/**
 * 带触觉反馈的按钮组件
 */
import React from 'react';
import { useHaptic, HapticFeedbackType } from '../hooks/useHaptic';
import { cn } from '../utils/classnames';

export interface HapticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hapticType?: HapticFeedbackType;
  hapticEnabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * 带触觉反馈的按钮
 */
export function HapticButton({
  hapticType = 'light',
  hapticEnabled = true,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  onClick,
  disabled,
  className,
  ...props
}: HapticButtonProps) {
  const { trigger } = useHaptic({ enabled: hapticEnabled });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      trigger(hapticType);
      onClick?.(e);
    }
  };

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

/**
 * 带触觉反馈的图标按钮
 */
export interface HapticIconButtonProps extends Omit<HapticButtonProps, 'children'> {
  icon: React.ReactNode;
  label?: string;
}

export function HapticIconButton({
  icon,
  label,
  size = 'md',
  ...props
}: HapticIconButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <HapticButton
      {...props}
      size={size}
      className={cn('rounded-full', sizeClasses[size], props.className)}
      aria-label={label}
    >
      {icon}
    </HapticButton>
  );
}

/**
 * 带触觉反馈的切换开关
 */
export interface HapticToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  hapticEnabled?: boolean;
  className?: string;
}

export function HapticToggle({
  checked,
  onChange,
  label,
  disabled = false,
  hapticEnabled = true,
  className,
}: HapticToggleProps) {
  const { trigger } = useHaptic({ enabled: hapticEnabled });

  const handleToggle = () => {
    if (!disabled) {
      trigger('selection');
      onChange(!checked);
    }
  };

  return (
    <label className={cn('inline-flex items-center gap-3 cursor-pointer', className)}>
      <div
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-indigo-600' : 'bg-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleToggle}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
            checked && 'transform translate-x-6'
          )}
        />
      </div>
      {label && (
        <span className={cn('text-sm font-medium', disabled && 'text-gray-400')}>
          {label}
        </span>
      )}
    </label>
  );
}

/**
 * 带触觉反馈的复选框
 */
export interface HapticCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  hapticEnabled?: boolean;
  className?: string;
}

export function HapticCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  hapticEnabled = true,
  className,
}: HapticCheckboxProps) {
  const { trigger } = useHaptic({ enabled: hapticEnabled });

  const handleChange = () => {
    if (!disabled) {
      trigger('selection');
      onChange(!checked);
    }
  };

  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer', className)}>
      <div
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150',
          checked
            ? 'bg-indigo-600 border-indigo-600'
            : 'bg-white border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleChange}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className={cn('text-sm', disabled && 'text-gray-400')}>
          {label}
        </span>
      )}
    </label>
  );
}

/**
 * 带触觉反馈的单选按钮
 */
export interface HapticRadioProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
  hapticEnabled?: boolean;
  className?: string;
}

export function HapticRadio({
  checked,
  onChange,
  label,
  disabled = false,
  hapticEnabled = true,
  className,
}: HapticRadioProps) {
  const { trigger } = useHaptic({ enabled: hapticEnabled });

  const handleChange = () => {
    if (!disabled) {
      trigger('selection');
      onChange();
    }
  };

  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer', className)}>
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150',
          checked
            ? 'border-indigo-600'
            : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleChange}
      >
        {checked && (
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
        )}
      </div>
      {label && (
        <span className={cn('text-sm', disabled && 'text-gray-400')}>
          {label}
        </span>
      )}
    </label>
  );
}

export default HapticButton;
