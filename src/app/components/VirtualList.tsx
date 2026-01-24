/**
 * 虚拟滚动列表组件
 * 用于高效渲染大量分镜卡片
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../utils/classnames';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

/**
 * 虚拟滚动列表
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  onScroll,
  getItemKey = (_, index) => index,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // 计算每个项目的高度
  const getHeight = useCallback(
    (item: T, index: number) => {
      return typeof itemHeight === 'function' ? itemHeight(item, index) : itemHeight;
    },
    [itemHeight]
  );

  // 计算所有项目的位置
  const itemPositions = useMemo(() => {
    const positions: { top: number; height: number }[] = [];
    let currentTop = 0;

    items.forEach((item, index) => {
      const height = getHeight(item, index);
      positions.push({ top: currentTop, height });
      currentTop += height;
    });

    return positions;
  }, [items, getHeight]);

  // 总高度
  const totalHeight = useMemo(() => {
    if (itemPositions.length === 0) return 0;
    const last = itemPositions[itemPositions.length - 1];
    return last.top + last.height;
  }, [itemPositions]);

  // 可见范围
  const visibleRange = useMemo(() => {
    if (itemPositions.length === 0) return { start: 0, end: 0 };

    // 二分查找起始位置
    let start = 0;
    let end = itemPositions.length - 1;

    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      if (itemPositions[mid].top + itemPositions[mid].height < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    const startIndex = Math.max(0, start - overscan);

    // 查找结束位置
    const viewportBottom = scrollTop + containerHeight;
    let endIndex = startIndex;

    while (
      endIndex < itemPositions.length &&
      itemPositions[endIndex].top < viewportBottom
    ) {
      endIndex++;
    }

    endIndex = Math.min(itemPositions.length, endIndex + overscan);

    return { start: startIndex, end: endIndex };
  }, [scrollTop, containerHeight, itemPositions, overscan]);

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // 处理滚动
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];

    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      const item = items[i];
      const position = itemPositions[i];

      const style: React.CSSProperties = {
        position: 'absolute',
        top: position.top,
        left: 0,
        right: 0,
        height: position.height,
      };

      result.push(
        <div key={getItemKey(item, i)} style={style}>
          {renderItem(item, i, style)}
        </div>
      );
    }

    return result;
  }, [items, visibleRange, itemPositions, renderItem, getItemKey]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto relative', className)}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}

/**
 * 虚拟滚动网格
 */
export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  gap = 16,
  renderItem,
  overscan = 2,
  className,
  getItemKey = (_, index) => index,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 计算列数
  const columns = useMemo(() => {
    if (containerSize.width === 0) return 1;
    return Math.max(1, Math.floor((containerSize.width + gap) / (itemWidth + gap)));
  }, [containerSize.width, itemWidth, gap]);

  // 计算行数
  const rows = useMemo(() => {
    return Math.ceil(items.length / columns);
  }, [items.length, columns]);

  // 总高度
  const totalHeight = useMemo(() => {
    return rows * (itemHeight + gap) - gap;
  }, [rows, itemHeight, gap]);

  // 可见行范围
  const visibleRowRange = useMemo(() => {
    const rowHeight = itemHeight + gap;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      rows,
      Math.ceil((scrollTop + containerSize.height) / rowHeight) + overscan
    );
    return { start: startRow, end: endRow };
  }, [scrollTop, containerSize.height, itemHeight, gap, rows, overscan]);

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);
    setContainerSize({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    return () => resizeObserver.disconnect();
  }, []);

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];
    const rowHeight = itemHeight + gap;

    for (let row = visibleRowRange.start; row < visibleRowRange.end; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index >= items.length) break;

        const item = items[index];
        const style: React.CSSProperties = {
          position: 'absolute',
          top: row * rowHeight,
          left: col * (itemWidth + gap),
          width: itemWidth,
          height: itemHeight,
        };

        result.push(
          <div key={getItemKey(item, index)} style={style}>
            {renderItem(item, index, style)}
          </div>
        );
      }
    }

    return result;
  }, [
    items,
    visibleRowRange,
    columns,
    itemWidth,
    itemHeight,
    gap,
    renderItem,
    getItemKey,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto relative', className)}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}

/**
 * 简单的虚拟列表 Hook
 */
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { start: startIndex, end: endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, i) => ({
      item,
      index: visibleRange.start + i,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + i) * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      },
    }));
  }, [items, visibleRange, itemHeight]);

  return {
    totalHeight,
    visibleItems,
    setScrollTop,
    visibleRange,
  };
}

export default VirtualList;
