/**
 * 触觉反馈 Hook
 * 支持 iOS 和 Android 设备的触觉反馈
 */
import { useCallback } from 'react';

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error'
  | 'impact'
  | 'notification';

export interface HapticFeedbackOptions {
  enabled?: boolean;
  fallback?: boolean;
}

/**
 * 检查是否支持触觉反馈
 */
function isHapticSupported(): boolean {
  // iOS 设备
  if ('vibrate' in navigator) {
    return true;
  }
  
  // Android 设备
  if ('Vibration' in window) {
    return true;
  }
  
  return false;
}

/**
 * 触发触觉反馈
 */
function triggerHaptic(type: HapticFeedbackType, options: HapticFeedbackOptions = {}): void {
  const { enabled = true, fallback = true } = options;
  
  if (!enabled) {
    return;
  }
  
  // 检查是否支持
  if (!isHapticSupported()) {
    console.warn('当前设备不支持触觉反馈');
    return;
  }
  
  // iOS Haptic Engine (iOS 10+)
  if ('Taptic' in window || 'TapticEngine' in window) {
    triggerIOSHaptic(type);
    return;
  }
  
  // Web Vibration API
  if ('vibrate' in navigator) {
    const pattern = getVibrationPattern(type);
    navigator.vibrate(pattern);
    return;
  }
  
  // 降级处理
  if (fallback) {
    console.log(`触觉反馈: ${type}`);
  }
}

/**
 * iOS 触觉反馈
 */
function triggerIOSHaptic(type: HapticFeedbackType): void {
  // iOS 使用 Haptic Feedback API
  // 注意：这需要在真实设备上测试，模拟器不支持
  
  const hapticMap: Record<HapticFeedbackType, string> = {
    light: 'light',
    medium: 'medium',
    heavy: 'heavy',
    selection: 'selection',
    success: 'success',
    warning: 'warning',
    error: 'error',
    impact: 'medium',
    notification: 'success',
  };
  
  const hapticType = hapticMap[type] || 'medium';
  
  // 尝试使用 iOS Haptic API
  try {
    // @ts-ignore - iOS 特定 API
    if (window.TapticEngine) {
      // @ts-ignore
      window.TapticEngine.impact(hapticType);
    }
  } catch (error) {
    console.warn('iOS 触觉反馈失败:', error);
  }
}

/**
 * 获取振动模式
 */
function getVibrationPattern(type: HapticFeedbackType): number | number[] {
  const patterns: Record<HapticFeedbackType, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    selection: 5,
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 100, 30, 100, 30],
    impact: 15,
    notification: [10, 50, 10, 50, 10],
  };
  
  return patterns[type] || 20;
}

/**
 * 使用触觉反馈 Hook
 */
export function useHaptic(options: HapticFeedbackOptions = {}) {
  const isSupported = isHapticSupported();
  
  const trigger = useCallback(
    (type: HapticFeedbackType) => {
      triggerHaptic(type, options);
    },
    [options]
  );
  
  // 预定义的触觉反馈函数
  const light = useCallback(() => trigger('light'), [trigger]);
  const medium = useCallback(() => trigger('medium'), [trigger]);
  const heavy = useCallback(() => trigger('heavy'), [trigger]);
  const selection = useCallback(() => trigger('selection'), [trigger]);
  const success = useCallback(() => trigger('success'), [trigger]);
  const warning = useCallback(() => trigger('warning'), [trigger]);
  const error = useCallback(() => trigger('error'), [trigger]);
  const impact = useCallback(() => trigger('impact'), [trigger]);
  const notification = useCallback(() => trigger('notification'), [trigger]);
  
  return {
    isSupported,
    trigger,
    light,
    medium,
    heavy,
    selection,
    success,
    warning,
    error,
    impact,
    notification,
  };
}

/**
 * 带触觉反馈的点击处理
 */
export function useHapticClick(
  onClick: () => void,
  hapticType: HapticFeedbackType = 'light'
) {
  const { trigger } = useHaptic();
  
  return useCallback(() => {
    trigger(hapticType);
    onClick();
  }, [onClick, hapticType, trigger]);
}

/**
 * 带触觉反馈的长按处理
 */
export function useHapticLongPress(
  onLongPress: () => void,
  options: {
    threshold?: number;
    hapticType?: HapticFeedbackType;
  } = {}
) {
  const { threshold = 500, hapticType = 'medium' } = options;
  const { trigger } = useHaptic();
  
  let timeoutId: NodeJS.Timeout;
  
  const handleStart = useCallback(() => {
    timeoutId = setTimeout(() => {
      trigger(hapticType);
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold, hapticType, trigger]);
  
  const handleEnd = useCallback(() => {
    clearTimeout(timeoutId);
  }, []);
  
  return {
    onTouchStart: handleStart,
    onTouchEnd: handleEnd,
    onMouseDown: handleStart,
    onMouseUp: handleEnd,
    onMouseLeave: handleEnd,
  };
}

/**
 * 自定义振动模式
 */
export function customVibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * 停止振动
 */
export function stopVibrate(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

export default useHaptic;
