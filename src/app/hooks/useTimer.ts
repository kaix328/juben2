/**
 * 定时器 Hooks
 * 提供安全的定时器管理，自动清理
 */
import { useEffect, useRef, useCallback } from 'react';

/**
 * 安全的 setInterval Hook
 * 自动在组件卸载时清理定时器
 * 
 * @param callback - 定时执行的回调函数
 * @param delay - 时间间隔（毫秒），null 表示暂停
 * 
 * @example
 * ```tsx
 * function Timer() {
 *   const [count, setCount] = useState(0);
 * 
 *   useInterval(() => {
 *     setCount(c => c + 1);
 *   }, 1000);
 * 
 *   return <div>Count: {count}</div>;
 * }
 * ```
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // 记住最新的回调
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 设置定时器
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * 安全的 setTimeout Hook
 * 自动在组件卸载时清理定时器
 * 
 * @param callback - 延迟执行的回调函数
 * @param delay - 延迟时间（毫秒），null 表示取消
 * 
 * @example
 * ```tsx
 * function DelayedMessage() {
 *   const [show, setShow] = useState(false);
 * 
 *   useTimeout(() => {
 *     setShow(true);
 *   }, 3000);
 * 
 *   return show ? <div>Hello!</div> : null;
 * }
 * ```
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // 记住最新的回调
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 设置定时器
  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * 可控制的定时器 Hook
 * 提供 start、stop、reset 方法
 * 
 * @param callback - 定时执行的回调函数
 * @param delay - 时间间隔（毫秒）
 * @returns 控制方法
 * 
 * @example
 * ```tsx
 * function ControlledTimer() {
 *   const [count, setCount] = useState(0);
 *   const { start, stop, reset } = useControllableInterval(() => {
 *     setCount(c => c + 1);
 *   }, 1000);
 * 
 *   return (
 *     <div>
 *       <div>Count: {count}</div>
 *       <button onClick={start}>Start</button>
 *       <button onClick={stop}>Stop</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useControllableInterval(
  callback: () => void,
  delay: number
): {
  start: () => void;
  stop: () => void;
  reset: () => void;
  isRunning: boolean;
} {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  // 记住最新的回调
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (intervalRef.current) return; // 已经在运行

    intervalRef.current = setInterval(() => savedCallback.current(), delay);
    setIsRunning(true);
  }, [delay]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    start();
  }, [start, stop]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { start, stop, reset, isRunning };
}

import * as React from 'react';
