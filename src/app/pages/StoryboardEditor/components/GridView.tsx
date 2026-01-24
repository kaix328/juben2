/**
 * 网格视图组件
 * 显示分镜卡片的网格布局
 */

import React from 'react';
import { ShotCard } from '../../../components/storyboard/ShotCard';
import { VirtualGrid } from '../../../components/VirtualList';
import { useStoryboardContext } from '../context/StoryboardContext';
import type { StoryboardPanel } from '../../../types';

interface GridViewProps {
  panels: StoryboardPanel[];
  useVirtualScroll?: boolean;
}

export function GridView({ panels, useVirtualScroll = false }: GridViewProps) {
  const {
    selectedPanels,
    panelStatuses,
    panelDensityMode,
    handleToggleSelect,
    handleUpdatePanel,
    handleDeletePanel,
    handleGenerateImage,
    handleCopyPanel,
    handleSplitPanel,
    handleGeneratePrompts,
    handleOpenPromptPreview,
  } = useStoryboardContext();

  // 根据密度模式计算卡片尺寸
  const getCardHeight = () => {
    switch (panelDensityMode) {
      case 'compact': return 280;
      case 'detailed': return 500;
      default: return 380;
    }
  };

  const cardHeight = getCardHeight();
  const cardWidth = 320;
  const gap = 24;

  // 渲染单个卡片
  const renderCard = (panel: StoryboardPanel, index: number) => (
    <div data-panel-id={panel.id} key={panel.id}>
      <ShotCard
        panel={panel}
        index={index}
        isSelected={selectedPanels.has(panel.id)}
        status={panelStatuses[panel.id]}
        onSelect={() => handleToggleSelect(panel.id)}
        onUpdate={(params) => handleUpdatePanel(panel.id, params)}
        onDelete={() => handleDeletePanel(panel.id)}
        onGenerateImage={async () => await handleGenerateImage(panel)}
        onCopy={() => handleCopyPanel(panel)}
        onSplit={(count) => handleSplitPanel(panel.id, count)}
        onGeneratePrompts={() => handleGeneratePrompts(panel)}
        onApplyPreset={(params) => handleUpdatePanel(panel.id, params)}
        onCopyPrompt={(prompt) => {
          navigator.clipboard.writeText(prompt);
        }}
        onOpenPromptPreview={handleOpenPromptPreview}
        viewMode="grid"
        densityMode={panelDensityMode}
      />
    </div>
  );

  // 使用虚拟滚动（大量分镜时）
  if (useVirtualScroll && panels.length > 50) {
    return (
      <VirtualGrid
        items={panels}
        itemWidth={cardWidth}
        itemHeight={cardHeight}
        gap={gap}
        className="h-full"
        renderItem={renderCard}
        getItemKey={(panel) => panel.id}
      />
    );
  }

  // 普通网格布局
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {panels.map((panel, index) => renderCard(panel, index))}
    </div>
  );
}
