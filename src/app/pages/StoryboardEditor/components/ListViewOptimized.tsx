/**
 * ListView 虚拟滚动优化版
 * 使用 @tanstack/react-virtual 实现高性能列表渲染
 */

import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { StoryboardPanel } from '../../../types';
import { ShotCard } from '../../../components/storyboard/ShotCard';

interface ListViewProps {
    panels: StoryboardPanel[];
    selectedPanels: Set<string>;
    onPanelSelect: (panelId: string) => void;
    onPanelUpdate: (panelId: string, updates: Partial<StoryboardPanel>) => void;
    onPanelDelete: (panelId: string) => void;
    onPanelCopy: (panel: StoryboardPanel) => void;
    onGenerateImage: (panel: StoryboardPanel) => void;
    isGenerating?: boolean;
    generatingPanelIds?: Set<string>;
}

export function ListView({
    panels,
    selectedPanels,
    onPanelSelect,
    onPanelUpdate,
    onPanelDelete,
    onPanelCopy,
    onGenerateImage,
    isGenerating = false,
    generatingPanelIds = new Set(),
}: ListViewProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    
    // 配置虚拟滚动
    const virtualizer = useVirtualizer({
        count: panels.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 400, // 估计每个卡片高度为 400px
        overscan: 3, // 预渲染上下各 3 个项目
        measureElement:
            typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
                ? (element) => element?.getBoundingClientRect().height
                : undefined,
    });
    
    const virtualItems = virtualizer.getVirtualItems();
    
    // 计算总高度
    const totalSize = virtualizer.getTotalSize();
    
    // 如果没有分镜，显示空状态
    if (panels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg
                    className="w-16 h-16 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                    />
                </svg>
                <p className="text-lg font-medium">暂无分镜</p>
                <p className="text-sm mt-2">点击"AI 提取分镜"开始创建</p>
            </div>
        );
    }
    
    return (
        <div
            ref={parentRef}
            className="h-full overflow-auto"
            style={{
                contain: 'strict',
            }}
        >
            <div
                style={{
                    height: `${totalSize}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const panel = panels[virtualItem.index];
                    const isSelected = selectedPanels.has(panel.id);
                    const isPanelGenerating = generatingPanelIds.has(panel.id);
                    
                    return (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <div className="px-4 py-3">
                                <ShotCard
                                    panel={panel}
                                    index={virtualItem.index}
                                    isSelected={isSelected}
                                    onSelect={() => onPanelSelect(panel.id)}
                                    onUpdate={(updates) => onPanelUpdate(panel.id, updates)}
                                    onDelete={() => onPanelDelete(panel.id)}
                                    onCopy={() => onPanelCopy(panel)}
                                    onGenerateImage={() => onGenerateImage(panel)}
                                    isGenerating={isPanelGenerating}
                                    disabled={isGenerating && !isPanelGenerating}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * ListView 性能优化版（带 memo）
 */
export const ListViewOptimized = React.memo(ListView, (prevProps, nextProps) => {
    // 自定义比较函数，只在关键 props 变化时重新渲染
    return (
        prevProps.panels === nextProps.panels &&
        prevProps.selectedPanels === nextProps.selectedPanels &&
        prevProps.isGenerating === nextProps.isGenerating &&
        prevProps.generatingPanelIds === nextProps.generatingPanelIds
    );
});

ListViewOptimized.displayName = 'ListViewOptimized';
