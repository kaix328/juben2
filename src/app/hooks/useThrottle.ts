/**
 * 节流 Hook
 * 限制函数执行频率，在指定时间内最多执行一次
 */
import { useCallback, useRef } from 'react';
import { CONFIG } from '../config/constants';

/**
 * 节流回调 Hook
 * 
 * @param callback - 需要节流的回调函数
 * @param delay - 节流时间间隔（毫秒），默认使用配置中的值
 * @returns 节流后的回调函数
 * 
 * @example
 * ```tsx
 * function ScrollHandler() {
 *   const handleScroll = useThrottle(() => {
 *     console.log('Scrolling...');
 *   }, 1000);
 * 
 *   useEffect(() => {
 *     window.addEventListener('scroll', handleScroll);
 *     return () => window.removeEventListener('scroll', handleScroll);
 *   }, [handleScroll]);
 * 
 *   return <div>...</div>;
 * }
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay?: number
): (...args: Parameters<T>) => void {
  const actualDelay = delay ?? CONFIG.PERFORMANCE.THROTTLE_DELAY;
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= actualDelay) {
        // 立即执行
        callback(...args);
        lastRunRef.current = now;
      } else {
        // 延迟执行（确保最后一次调用会被执行）
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, actualDelay - timeSinceLastRun);
      }
    },
    [callback, actualDelay]
  );
}

/**
 * 节流值 Hook
 * 
 * @param value - 需要节流的值
 * @param delay - 节流时间间隔（毫秒）
 * @returns 节流后的值
 * 
 * @example
 * ```tsx
 * function MouseTracker() {
 *   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
 *   const throttledPos = useThrottledValue(mousePos, 100);
 * 
 *   return <div>X: {throttledPos.x}, Y: {throttledPos.y}</div>;
 * }
 * ```
 */
export function useThrottledValue<T>(value: T, delay?: number): T {
  const actualDelay = delay ?? CONFIG.PERFORMANCE.THROTTLE_DELAY;
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastUpdateRef = React.useRef<number>(0);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= actualDelay) {
      setThrottledValue(value);
      lastUpdateRef.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastUpdateRef.current = Date.now();
      }, actualDelay - timeSinceLastUpdate);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, actualDelay]);

  return throttledValue;
}

import * as React from 'react';
