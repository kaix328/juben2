/**
 * 防抖 Hook
 * 延迟执行函数，直到停止调用一段时间后才执行
 */
import { useEffect, useState } from 'react';
import { CONFIG } from '../config/constants';

/**
 * 防抖 Hook
 * 
 * @param value - 需要防抖的值
 * @param delay - 延迟时间（毫秒），默认使用配置中的值
 * @returns 防抖后的值
 * 
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 *   useEffect(() => {
 *     if (debouncedSearchTerm) {
 *       performSearch(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 * 
 *   return (
 *     <input
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const actualDelay = delay ?? CONFIG.PERFORMANCE.DEBOUNCE_DELAY;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, actualDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, actualDelay]);

  return debouncedValue;
}

/**
 * 防抖回调 Hook
 * 
 * @param callback - 需要防抖的回调函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的回调函数
 * 
 * @example
 * ```tsx
 * function SearchInput() {
 *   const handleSearch = useDebouncedCallback((term: string) => {
 *     performSearch(term);
 *   }, 300);
 * 
 *   return (
 *     <input onChange={(e) => handleSearch(e.target.value)} />
 *   );
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay?: number
): (...args: Parameters<T>) => void {
  const actualDelay = delay ?? CONFIG.PERFORMANCE.DEBOUNCE_DELAY;
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, actualDelay);
    },
    [callback, actualDelay]
  );
}

import * as React from 'react';
