/**
 * 可滑动卡片组件
 * 支持左右滑动显示操作按钮
 */
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/classnames';

export interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'red' | 'yellow';
    onClick: () => void;
  }>;
  rightActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'red' | 'yellow';
    onClick: () => void;
  }>;
  className?: string;
  disabled?: boolean;
}

const colorClasses = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  green: 'bg-green-500 hover:bg-green-600',
  red: 'bg-red-500 hover:bg-red-600',
  yellow: 'bg-yellow-500 hover:bg-yellow-600',
};

/**
 * 可滑动卡片
 */
export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  className,
  disabled = false,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const maxSwipeDistance = 80 * Math.max(leftActions.length, rightActions.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isSwiping) return;

    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // 限制滑动距离
    const limitedDiff = Math.max(
      -maxSwipeDistance,
      Math.min(maxSwipeDistance, diff)
    );

    setTranslateX(limitedDiff);
  };

  const handleTouchEnd = () => {
    if (disabled) return;

    setIsSwiping(false);

    // 判断是否显示操作按钮
    if (Math.abs(translateX) > 60) {
      // 吸附到操作按钮位置
      if (translateX > 0 && leftActions.length > 0) {
        setTranslateX(leftActions.length * 80);
      } else if (translateX < 0 && rightActions.length > 0) {
        setTranslateX(-rightActions.length * 80);
      } else {
        setTranslateX(0);
      }
    } else {
      // 回到原位
      setTranslateX(0);
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setTranslateX(0);
      }
    };

    if (translateX !== 0) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [translateX]);

  const handleActionClick = (action: () => void) => {
    action();
    setTranslateX(0);
  };

  return (
    <div className="relative overflow-hidden" ref={cardRef}>
      {/* 左侧操作按钮 */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action.onClick)}
              className={cn(
                'w-20 flex flex-col items-center justify-center text-white transition-colors',
                colorClasses[action.color || 'blue']
              )}
            >
              {action.icon && <div className="mb-1">{action.icon}</div>}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 右侧操作按钮 */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action.onClick)}
              className={cn(
                'w-20 flex flex-col items-center justify-center text-white transition-colors',
                colorClasses[action.color || 'red']
              )}
            >
              {action.icon && <div className="mb-1">{action.icon}</div>}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 卡片内容 */}
      <div
        className={cn(
          'relative bg-white transition-transform',
          isSwiping ? 'duration-0' : 'duration-300',
          className
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 下拉刷新组件
 */
export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
}: {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const threshold = 80;
  const maxPullDistance = 150;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || window.scrollY !== 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && window.scrollY === 0) {
      const dampedDistance = Math.min(distance * 0.5, maxPullDistance);
      setPullDistance(dampedDistance);
      setIsPulling(dampedDistance >= threshold);

      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    if (isPulling && pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
        }, 300);
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }

    startY.current = 0;
  };

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉指示器 */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
        style={{
          height: pullDistance,
          opacity: progress,
        }}
      >
        <div className="flex flex-col items-center">
          {isRefreshing ? (
            <>
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="mt-2 text-sm text-gray-600">刷新中...</span>
            </>
          ) : (
            <>
              <div
                className="w-8 h-8 border-3 border-indigo-600 rounded-full transition-transform"
                style={{
                  transform: `rotate(${progress * 360}deg)`,
                  borderTopColor: 'transparent',
                }}
              />
              <span className="mt-2 text-sm text-gray-600">
                {isPulling ? '松开刷新' : '下拉刷新'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 内容 */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default SwipeableCard;
