/**
 * 列表视图组件
 * 显示分镜卡片的列表布局，支持拖拽排序
 */

import React from 'react';
import { ShotCard } from '../../../components/storyboard/ShotCard';
import { DraggablePanelList } from './DraggablePanelList';
import { useStoryboardContext } from '../context/StoryboardContext';
import type { StoryboardPanel } from '../../../types';

interface ListViewProps {
  panels: StoryboardPanel[];
}

export function ListView({ panels }: ListViewProps) {
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
    handleMovePanel, // 🆕 拖拽排序
  } = useStoryboardContext();

  return (
    <DraggablePanelList
      panels={panels}
      onMove={(fromIndex, toIndex) => {
        const fromPanel = panels[fromIndex];
        const toPanel = panels[toIndex];
        if (fromPanel && toPanel && handleMovePanel) {
          handleMovePanel(fromPanel.id, toPanel.id);
        }
      }}
      renderPanel={(panel, index, isDragging, isDragOver) => (
        <div
          data-panel-id={panel.id}
          className={`transition-opacity ${isDragging ? 'opacity-50' : ''}`}
        >
          <ShotCard
            key={panel.id}
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
            viewMode="list"
            densityMode={panelDensityMode}
          />
        </div>
      )}
      className="space-y-6"
    />
  );
}
