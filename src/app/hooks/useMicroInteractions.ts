/**
 * 微交互动画 Hook
 * 提供常用的微交互效果
 */

import { useState, useCallback, useRef } from 'react';

/**
 * 按钮点击涟漪效果
 */
export function useRipple() {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const nextIdRef = useRef(0);

  const addRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const id = nextIdRef.current++;
    setRipples((prev) => [...prev, { id, x, y }]);

    // 移除涟漪
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  }, []);

  return { ripples, addRipple };
}

/**
 * 悬停提升效果
 */
export function useHoverLift() {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const style: React.CSSProperties = {
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    transition: 'transform 0.2s ease-out',
    boxShadow: isHovered
      ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
      : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  };

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    style,
  };
}

/**
 * 加载状态动画
 */
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [progress, setProgress] = useState(0);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setProgress(0);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setProgress(100);
    setTimeout(() => setProgress(0), 300);
  }, []);

  const updateProgress = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);

  return {
    isLoading,
    progress,
    startLoading,
    stopLoading,
    updateProgress,
  };
}

/**
 * 成功/错误反馈动画
 */
export function useFeedback() {
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showFeedback = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }, []);

  return { feedback, showFeedback };
}
