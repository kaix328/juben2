/**
 * 滑动手势 Hook
 * 支持左右滑动检测
 */
import { useState, useRef, useCallback } from 'react';

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
}

/**
 * 使用滑动手势
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventDefaultTouchmoveEvent = false,
}: SwipeOptions): SwipeHandlers {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, [preventDefaultTouchmoveEvent]);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const absDistanceX = Math.abs(distanceX);
    const absDistanceY = Math.abs(distanceY);

    // 判断是水平滑动还是垂直滑动
    if (absDistanceX > absDistanceY) {
      // 水平滑动
      if (absDistanceX > threshold) {
        if (distanceX > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    } else {
      // 垂直滑动
      if (absDistanceY > threshold) {
        if (distanceY > 0) {
          onSwipeUp?.();
        } else {
          onSwipeDown?.();
        }
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

/**
 * 长按手势 Hook
 */
export function useLongPress(
  callback: () => void,
  options: {
    threshold?: number;
    onStart?: () => void;
    onFinish?: () => void;
    onCancel?: () => void;
  } = {}
) {
  const { threshold = 500, onStart, onFinish, onCancel } = options;
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    onStart?.();
    target.current = event.target;
    timeout.current = setTimeout(() => {
      callback();
      onFinish?.();
    }, threshold);
  }, [callback, threshold, onStart, onFinish]);

  const clear = useCallback((shouldTriggerCancel = true) => {
    timeout.current && clearTimeout(timeout.current);
    shouldTriggerCancel && onCancel?.();
  }, [onCancel]);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: () => clear(true),
    onTouchEnd: clear,
  };
}

/**
 * 下拉刷新 Hook
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: {
    threshold?: number;
    maxPullDistance?: number;
    disabled?: boolean;
  } = {}
) {
  const { threshold = 80, maxPullDistance = 150, disabled = false } = options;
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // 只在页面顶部时启用下拉刷新
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0 && window.scrollY === 0) {
      // 使用阻尼效果
      const dampedDistance = Math.min(
        distance * 0.5,
        maxPullDistance
      );
      setPullDistance(dampedDistance);
      setIsPulling(dampedDistance >= threshold);

      // 防止页面滚动
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, isRefreshing, threshold, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    if (isPulling && pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setIsPulling(false);
        setPullDistance(0);
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }

    startY.current = 0;
    currentY.current = 0;
  }, [disabled, isRefreshing, isPulling, pullDistance, threshold, onRefresh]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/**
 * 双击手势 Hook
 */
export function useDoubleTap(
  callback: () => void,
  options: {
    delay?: number;
  } = {}
) {
  const { delay = 300 } = options;
  const lastTap = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      callback();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }, [callback, delay]);

  return {
    onClick: handleTap,
    onTouchEnd: handleTap,
  };
}

/**
 * 捏合缩放手势 Hook
 */
export function usePinchZoom(
  onZoom: (scale: number) => void,
  options: {
    minScale?: number;
    maxScale?: number;
  } = {}
) {
  const { minScale = 0.5, maxScale = 3 } = options;
  const initialDistance = useRef(0);
  const currentScale = useRef(1);

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current > 0) {
      e.preventDefault();
      
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistance.current;
      const newScale = Math.min(Math.max(currentScale.current * scale, minScale), maxScale);
      
      onZoom(newScale);
    }
  }, [minScale, maxScale, onZoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialDistance.current = 0;
    }
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

export default useSwipe;
