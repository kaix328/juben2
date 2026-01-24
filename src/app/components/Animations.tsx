/**
 * 微交互动画组件和工具
 * 提供丰富的动画效果增强用户体验
 */
import React, { useState, useEffect, useRef } from 'react';
import { cn } from './ui/utils';

// ============ 动画包装组件 ============

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  once?: boolean;
}

/**
 * 淡入动画组件
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  direction = 'up',
  className,
  once = true,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [once]);

  const directionStyles = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4',
    none: '',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all',
        isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${directionStyles[direction]}`,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

interface StaggerChildrenProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

/**
 * 交错动画容器
 */
export function StaggerChildren({
  children,
  staggerDelay = 50,
  className,
}: StaggerChildrenProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn delay={index * staggerDelay} key={index}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

interface ScaleOnHoverProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

/**
 * 悬停缩放组件
 */
export function ScaleOnHover({
  children,
  scale = 1.02,
  className,
}: ScaleOnHoverProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-200 ease-out',
        className
      )}
      style={{
        ['--hover-scale' as any]: scale,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `scale(${scale})`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {children}
    </div>
  );
}

interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  color?: string;
  className?: string;
}

/**
 * 脉冲动画组件
 */
export function Pulse({
  children,
  active = true,
  color = 'rgba(147, 51, 234, 0.5)',
  className,
}: PulseProps) {
  return (
    <div className={cn('relative', className)}>
      {active && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ backgroundColor: color, opacity: 0.75 }}
        />
      )}
      <span className="relative">{children}</span>
    </div>
  );
}

interface ShakeProps {
  children: React.ReactNode;
  trigger?: boolean;
  intensity?: 'light' | 'medium' | 'strong';
  className?: string;
}

/**
 * 抖动动画组件
 */
export function Shake({
  children,
  trigger = false,
  intensity = 'medium',
  className,
}: ShakeProps) {
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const intensityClass = {
    light: 'animate-shake-light',
    medium: 'animate-shake',
    strong: 'animate-shake-strong',
  };

  return (
    <div className={cn(shaking && intensityClass[intensity], className)}>
      {children}
    </div>
  );
}

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * 数字递增动画
 */
export function CountUp({
  end,
  start = 0,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = start + (end - start) * easeOutQuart;

      countRef.current = currentCount;
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [end, start, duration]);

  return (
    <span className={className}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  className?: string;
  onComplete?: () => void;
}

/**
 * 打字机效果
 */
export function Typewriter({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  className,
  onComplete,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);

    const timeout = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {cursor && !isComplete && (
        <span className="animate-blink ml-0.5">|</span>
      )}
    </span>
  );
}

interface RippleProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

/**
 * 涟漪效果组件
 */
export function Ripple({
  children,
  color = 'rgba(255, 255, 255, 0.5)',
  className,
}: RippleProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: color,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  animated?: boolean;
  color?: string;
  className?: string;
}

/**
 * 动画进度条
 */
export function ProgressBar({
  value,
  max = 100,
  animated = true,
  color = 'bg-purple-600',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('h-2 bg-gray-200 rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          color,
          animated && 'animate-progress-shine'
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

interface SkeletonPulseProps {
  className?: string;
}

/**
 * 骨架屏脉冲效果
 */
export function SkeletonPulse({ className }: SkeletonPulseProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded',
        className
      )}
    />
  );
}

// ============ 动画 CSS 样式 ============

export const animationStyles = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes shake-light {
  0%, 100% { transform: translateX(0); }
  25%, 75% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
}

@keyframes shake-strong {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.5;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes progress-shine {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slide-up {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes slide-down {
  0% { transform: translateY(-20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes spin-slow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-shake { animation: shake 0.5s ease-in-out; }
.animate-shake-light { animation: shake-light 0.3s ease-in-out; }
.animate-shake-strong { animation: shake-strong 0.5s ease-in-out; }
.animate-ripple { animation: ripple 0.6s ease-out; }
.animate-blink { animation: blink 1s step-end infinite; }
.animate-progress-shine { 
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: progress-shine 1.5s infinite; 
}
.animate-shimmer { animation: shimmer 1.5s infinite; }
.animate-bounce-in { animation: bounce-in 0.5s ease-out; }
.animate-slide-up { animation: slide-up 0.3s ease-out; }
.animate-slide-down { animation: slide-down 0.3s ease-out; }
.animate-fade-in { animation: fade-in 0.3s ease-out; }
.animate-spin-slow { animation: spin-slow 3s linear infinite; }
`;

// ============ Hooks ============

/**
 * 使用动画状态
 */
export function useAnimation(duration: number = 300) {
  const [isAnimating, setIsAnimating] = useState(false);

  const trigger = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), duration);
  };

  return { isAnimating, trigger };
}

/**
 * 使用进入动画
 */
export function useEnterAnimation(delay: number = 0) {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasEntered(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return hasEntered;
}

/**
 * 使用交叉观察器动画
 */
export function useInViewAnimation(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}

export default {
  FadeIn,
  StaggerChildren,
  ScaleOnHover,
  Pulse,
  Shake,
  CountUp,
  Typewriter,
  Ripple,
  ProgressBar,
  SkeletonPulse,
  useAnimation,
  useEnterAnimation,
  useInViewAnimation,
};
