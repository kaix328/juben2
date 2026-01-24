/**
 * 虚拟滚动 Hook
 * 优化长列表性能，只渲染可见区域的元素
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export interface VirtualScrollOptions {
  itemHeight: number | ((index: number) => number);
  itemCount: number;
  overscan?: number;
  scrollingDelay?: number;
  getScrollElement?: () => HTMLElement | null;
}

export interface VirtualScrollResult {
  virtualItems: VirtualItem[];
  totalHeight: number;
  isScrolling: boolean;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  measureElement: (index: number, element: HTMLElement) => void;
}

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  end: number;
}

/**
 * 使用虚拟滚动
 */
export function useVirtualScroll({
  itemHeight,
  itemCount,
  overscan = 3,
  scrollingDelay = 150,
  getScrollElement,
}: VirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<NodeJS.Timeout>();
  const measurementsRef = useRef<Map<number, number>>(new Map());
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // 获取元素高度
  const getItemHeight = useCallback(
    (index: number): number => {
      // 优先使用测量的高度
      const measured = measurementsRef.current.get(index);
      if (measured !== undefined) {
        return measured;
      }
      
      // 使用配置的高度
      if (typeof itemHeight === 'function') {
        return itemHeight(index);
      }
      return itemHeight;
    },
    [itemHeight]
  );

  // 计算虚拟项
  const virtualItems = useCallback((): VirtualItem[] => {
    const items: VirtualItem[] = [];
    let start = 0;

    for (let i = 0; i < itemCount; i++) {
      const size = getItemHeight(i);
      const end = start + size;

      items.push({
        index: i,
        start,
        size,
        end,
      });

      start = end;
    }

    return items;
  }, [itemCount, getItemHeight]);

  // 获取可见范围
  const getVisibleRange = useCallback(
    (items: VirtualItem[]) => {
      const scrollStart = scrollTop;
      const scrollEnd = scrollTop + containerHeight;

      let startIndex = 0;
      let endIndex = items.length - 1;

      // 二分查找起始索引
      for (let i = 0; i < items.length; i++) {
        if (items[i].end > scrollStart) {
          startIndex = Math.max(0, i - overscan);
          break;
        }
      }

      // 二分查找结束索引
      for (let i = startIndex; i < items.length; i++) {
        if (items[i].start > scrollEnd) {
          endIndex = Math.min(items.length - 1, i + overscan);
          break;
        }
      }

      return items.slice(startIndex, endIndex + 1);
    },
    [scrollTop, containerHeight, overscan]
  );

  // 计算总高度
  const totalHeight = useCallback(() => {
    const items = virtualItems();
    return items.length > 0 ? items[items.length - 1].end : 0;
  }, [virtualItems]);

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      const element = scrollElementRef.current;
      if (!element) return;

      const items = virtualItems();
      const item = items[index];
      if (!item) return;

      let scrollTo = item.start;

      if (align === 'center') {
        scrollTo = item.start - containerHeight / 2 + item.size / 2;
      } else if (align === 'end') {
        scrollTo = item.end - containerHeight;
      }

      element.scrollTop = Math.max(0, scrollTo);
    },
    [virtualItems, containerHeight]
  );

  // 测量元素
  const measureElement = useCallback((index: number, element: HTMLElement) => {
    const height = element.getBoundingClientRect().height;
    measurementsRef.current.set(index, height);
  }, []);

  // 监听滚动
  useEffect(() => {
    const element = getScrollElement?.() || window;
    scrollElementRef.current = element as HTMLElement;

    const handleScroll = () => {
      const scrollElement = scrollElementRef.current;
      const newScrollTop = scrollElement
        ? scrollElement.scrollTop
        : window.pageYOffset;

      setScrollTop(newScrollTop);
      setIsScrolling(true);

      // 延迟设置滚动状态
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }

      scrollingTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, scrollingDelay);
    };

    const handleResize = () => {
      const scrollElement = scrollElementRef.current;
      const newHeight = scrollElement
        ? scrollElement.clientHeight
        : window.innerHeight;

      setContainerHeight(newHeight);
    };

    handleResize();
    handleScroll();

    element.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [getScrollElement, scrollingDelay]);

  const items = virtualItems();
  const visibleItems = getVisibleRange(items);

  return {
    virtualItems: visibleItems,
    totalHeight: totalHeight(),
    isScrolling,
    scrollToIndex,
    measureElement,
  };
}

/**
 * 简化版虚拟滚动（固定高度）
 */
export function useSimpleVirtualScroll(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      index: i,
      start: i * itemHeight,
      size: itemHeight,
      end: (i + 1) * itemHeight,
    });
  }

  return {
    virtualItems: visibleItems,
    totalHeight: itemCount * itemHeight,
    startIndex,
    endIndex,
    setScrollTop,
  };
}

export default useVirtualScroll;
