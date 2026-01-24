/**
 * 页面过渡动画组件
 * 提供流畅的页面切换效果
 */
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../utils/classnames';

// ============ 类型定义 ============

type TransitionType = 'fade' | 'slide' | 'scale' | 'slideUp' | 'none';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  className?: string;
}

interface AnimatedOutletProps {
  type?: TransitionType;
  duration?: number;
}

// ============ 动画配置 ============

const TRANSITIONS: Record<TransitionType, {
  initial: React.CSSProperties;
  animate: React.CSSProperties;
  exit: React.CSSProperties;
}> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, transform: 'translateX(20px)' },
    animate: { opacity: 1, transform: 'translateX(0)' },
    exit: { opacity: 0, transform: 'translateX(-20px)' },
  },
  slideUp: {
    initial: { opacity: 0, transform: 'translateY(20px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
    exit: { opacity: 0, transform: 'translateY(-20px)' },
  },
  scale: {
    initial: { opacity: 0, transform: 'scale(0.95)' },
    animate: { opacity: 1, transform: 'scale(1)' },
    exit: { opacity: 0, transform: 'scale(1.05)' },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

// ============ 页面过渡组件 ============

/**
 * 页面过渡动画包装器
 */
export function PageTransition({
  children,
  type = 'fade',
  duration = 200,
  className,
}: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<React.CSSProperties>(
    TRANSITIONS[type].initial
  );

  useEffect(() => {
    // 入场动画
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
      setCurrentStyle(TRANSITIONS[type].animate);
    });

    return () => cancelAnimationFrame(timer);
  }, [type]);

  return (
    <div
      className={cn('transition-all', className)}
      style={{
        ...currentStyle,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
}

// ============ 路由感知动画 ============

/**
 * 路由变化时自动触发动画
 */
export function RouteTransition({
  children,
  type = 'fade',
  duration = 200,
}: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>(TRANSITIONS[type].animate);

  useEffect(() => {
    // 路由变化时触发退出动画
    setIsAnimating(true);
    setStyle(TRANSITIONS[type].exit);

    const exitTimer = setTimeout(() => {
      // 更新内容
      setDisplayChildren(children);
      setStyle(TRANSITIONS[type].initial);

      // 触发入场动画
      requestAnimationFrame(() => {
        setStyle(TRANSITIONS[type].animate);
        setTimeout(() => setIsAnimating(false), duration);
      });
    }, duration);

    return () => clearTimeout(exitTimer);
  }, [location.pathname, children, type, duration]);

  return (
    <div
      style={{
        ...style,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionProperty: 'opacity, transform',
      }}
    >
      {displayChildren}
    </div>
  );
}

// ============ 列表项动画 ============

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}

/**
 * 列表项交错动画
 */
export function StaggeredList({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  className,
}: StaggeredListProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="animate-fadeInUp"
          style={{
            animationDelay: `${initialDelay + index * staggerDelay}ms`,
            animationFillMode: 'backwards',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ============ 懒加载动画 ============

interface LazyRevealProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'scale';
}

/**
 * 滚动时懒加载显示动画
 */
export function LazyReveal({
  children,
  threshold = 0.1,
  className,
  animation = 'fadeIn',
}: LazyRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const animationClasses: Record<string, string> = {
    fadeIn: 'animate-fadeIn',
    slideUp: 'animate-fadeInUp',
    slideLeft: 'animate-fadeInLeft',
    scale: 'animate-scaleIn',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500',
        isVisible ? animationClasses[animation] : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============ 加载状态动画 ============

interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minLoadingTime?: number;
}

/**
 * 加载状态过渡动画
 */
export function LoadingTransition({
  isLoading,
  children,
  fallback,
  minLoadingTime = 300,
}: LoadingTransitionProps) {
  const [showContent, setShowContent] = useState(!isLoading);
  const [showFallback, setShowFallback] = useState(isLoading);
  const loadingStartRef = useRef<number>(0);

  useEffect(() => {
    if (isLoading) {
      loadingStartRef.current = Date.now();
      setShowContent(false);
      setShowFallback(true);
    } else {
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = Math.max(0, minLoadingTime - elapsed);

      setTimeout(() => {
        setShowFallback(false);
        requestAnimationFrame(() => setShowContent(true));
      }, remaining);
    }
  }, [isLoading, minLoadingTime]);

  return (
    <>
      {showFallback && (
        <div className="animate-fadeIn">
          {fallback}
        </div>
      )}
      {showContent && (
        <div className="animate-fadeIn">
          {children}
        </div>
      )}
    </>
  );
}

// ============ CSS 动画样式（需要添加到全局 CSS） ============

export const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-fadeInUp {
  animation: fadeInUp 0.4s ease-out forwards;
}

.animate-fadeInLeft {
  animation: fadeInLeft 0.4s ease-out forwards;
}

.animate-scaleIn {
  animation: scaleIn 0.3s ease-out forwards;
}

.animate-slideInRight {
  animation: slideInRight 0.3s ease-out forwards;
}

.animate-pulse-slow {
  animation: pulse 2s ease-in-out infinite;
}
`;

export default PageTransition;
