/**
 * 虚拟滚动列表组件
 */
import React, { useRef, useEffect } from 'react';
import { useVirtualScroll } from '../hooks/useVirtualScroll';
import { cn } from '../utils/classnames';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  containerClassName?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  estimatedItemHeight?: number;
}

/**
 * 虚拟滚动列表
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  containerClassName,
  overscan = 3,
  onScroll,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { virtualItems, totalHeight, scrollToIndex, measureElement } = useVirtualScroll({
    itemCount: items.length,
    itemHeight,
    overscan,
    getScrollElement: () => containerRef.current,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      onScroll?.(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', containerClassName)}
      style={{ height: '100%' }}
    >
      <div
        className={cn('relative', className)}
        style={{ height: totalHeight }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          
          return (
            <div
              key={virtualItem.index}
              ref={(el) => {
                if (el) {
                  measureElement(virtualItem.index, el);
                }
              }}
              className="absolute left-0 right-0"
              style={{
                top: virtualItem.start,
                height: virtualItem.size,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 虚拟滚动网格
 */
export interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  columns: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
  containerClassName?: string;
  overscan?: number;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  columns,
  renderItem,
  gap = 16,
  className,
  containerClassName,
  overscan = 1,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(items.length / columns);
  const rowHeight = itemHeight + gap;

  const { virtualItems, totalHeight } = useVirtualScroll({
    itemCount: rowCount,
    itemHeight: rowHeight,
    overscan,
    getScrollElement: () => containerRef.current,
  });

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', containerClassName)}
      style={{ height: '100%' }}
    >
      <div
        className={cn('relative', className)}
        style={{ height: totalHeight }}
      >
        {virtualItems.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const endIndex = Math.min(startIndex + columns, items.length);
          const rowItems = items.slice(startIndex, endIndex);

          return (
            <div
              key={virtualRow.index}
              className="absolute left-0 right-0 grid"
              style={{
                top: virtualRow.start,
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const itemIndex = startIndex + colIndex;
                return (
                  <div key={itemIndex} style={{ height: itemHeight }}>
                    {renderItem(item, itemIndex)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 无限滚动列表
 */
export interface InfiniteScrollListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loading?: boolean;
  className?: string;
  containerClassName?: string;
  threshold?: number;
}

export function InfiniteScrollList<T>({
  items,
  itemHeight,
  renderItem,
  hasMore,
  loadMore,
  loading = false,
  className,
  containerClassName,
  threshold = 200,
}: InfiniteScrollListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const { virtualItems, totalHeight } = useVirtualScroll({
    itemCount: items.length,
    itemHeight,
    overscan: 5,
    getScrollElement: () => containerRef.current,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;

      if (
        distanceToBottom < threshold &&
        hasMore &&
        !loading &&
        !loadingRef.current
      ) {
        loadingRef.current = true;
        await loadMore();
        loadingRef.current = false;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadMore, threshold]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', containerClassName)}
      style={{ height: '100%' }}
    >
      <div
        className={cn('relative', className)}
        style={{ height: totalHeight }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          
          return (
            <div
              key={virtualItem.index}
              className="absolute left-0 right-0"
              style={{
                top: virtualItem.start,
                height: virtualItem.size,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>

      {/* 加载指示器 */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-600">加载中...</span>
        </div>
      )}

      {/* 没有更多数据 */}
      {!hasMore && items.length > 0 && (
        <div className="flex items-center justify-center py-4 text-sm text-gray-500">
          没有更多数据了
        </div>
      )}
    </div>
  );
}

export default VirtualList;
