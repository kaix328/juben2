/**
 * 虚拟滚动分镜网格
 * 用于高效渲染大量分镜卡片
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../utils/classnames';
import type { StoryboardPanel } from '../../types';

interface VirtualStoryboardGridProps {
  panels: StoryboardPanel[];
  renderPanel: (panel: StoryboardPanel, index: number) => React.ReactNode;
  viewMode: 'list' | 'grid';
  className?: string;
  emptyMessage?: string;
}

// 根据视图模式计算项目尺寸
const ITEM_SIZES = {
  list: { width: 0, height: 280 }, // 列表模式：全宽，固定高度
  grid: { width: 320, height: 420 }, // 网格模式：固定宽高
};

const GAP = 24; // 间距
const OVERSCAN = 2; // 预渲染行数

/**
 * 虚拟滚动分镜网格组件
 */
export function VirtualStoryboardGrid({
  panels,
  renderPanel,
  viewMode,
  className,
  emptyMessage = '暂无分镜',
}: VirtualStoryboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 如果分镜数量少于阈值，不使用虚拟滚动
  const VIRTUAL_THRESHOLD = 20;
  const useVirtual = panels.length > VIRTUAL_THRESHOLD;

  // 计算列数（网格模式）
  const columns = useMemo(() => {
    if (viewMode === 'list') return 1;
    if (containerSize.width === 0) return 1;
    
    // 响应式列数
    const availableWidth = containerSize.width;
    const itemWidth = ITEM_SIZES.grid.width;
    return Math.max(1, Math.floor((availableWidth + GAP) / (itemWidth + GAP)));
  }, [containerSize.width, viewMode]);

  // 获取项目高度
  const itemHeight = viewMode === 'list' ? ITEM_SIZES.list.height : ITEM_SIZES.grid.height;

  // 计算行数
  const rows = useMemo(() => {
    return Math.ceil(panels.length / columns);
  }, [panels.length, columns]);

  // 总高度
  const totalHeight = useMemo(() => {
    return rows * (itemHeight + GAP) - GAP;
  }, [rows, itemHeight]);

  // 可见行范围
  const visibleRowRange = useMemo(() => {
    if (!useVirtual) return { start: 0, end: rows };
    
    const rowHeight = itemHeight + GAP;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
    const endRow = Math.min(
      rows,
      Math.ceil((scrollTop + containerSize.height) / rowHeight) + OVERSCAN
    );
    return { start: startRow, end: endRow };
  }, [scrollTop, containerSize.height, itemHeight, rows, useVirtual]);

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
    if (useVirtual) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  }, [useVirtual]);

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];
    const rowHeight = itemHeight + GAP;
    const itemWidth = viewMode === 'list' 
      ? containerSize.width 
      : ITEM_SIZES.grid.width;

    for (let row = visibleRowRange.start; row < visibleRowRange.end; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index >= panels.length) break;

        const panel = panels[index];
        
        if (useVirtual) {
          // 虚拟滚动模式：绝对定位
          const style: React.CSSProperties = {
            position: 'absolute',
            top: row * rowHeight,
            left: viewMode === 'list' ? 0 : col * (itemWidth + GAP),
            width: viewMode === 'list' ? '100%' : itemWidth,
            height: itemHeight,
          };

          result.push(
            <div key={panel.id} style={style}>
              {renderPanel(panel, index)}
            </div>
          );
        } else {
          // 普通模式：直接渲染
          result.push(
            <div key={panel.id}>
              {renderPanel(panel, index)}
            </div>
          );
        }
      }
    }

    return result;
  }, [
    panels,
    visibleRowRange,
    columns,
    itemHeight,
    viewMode,
    containerSize.width,
    renderPanel,
    useVirtual,
  ]);

  // 空状态
  if (panels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  // 非虚拟滚动模式（分镜数量少）
  if (!useVirtual) {
    return (
      <div
        className={cn(
          viewMode === 'list' 
            ? 'space-y-6' 
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
          className
        )}
      >
        {visibleItems}
      </div>
    );
  }

  // 虚拟滚动模式
  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto relative h-[calc(100vh-300px)]', className)}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
      
      {/* 滚动指示器 */}
      <div className="fixed bottom-24 right-8 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        {Math.round((scrollTop / (totalHeight - containerSize.height)) * 100) || 0}%
      </div>
    </div>
  );
}

export default VirtualStoryboardGrid;
