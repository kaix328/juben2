/**
 * 移动端集成组件
 * 为分镜编辑器提供移动端优化
 */
import React from 'react';
import { MobileShotCard } from '../../components/storyboard/MobileShotCard';
import { MobileShotEditor } from '../../components/storyboard/MobileShotEditor';
import { MobileAlert } from '../../components/MobileAlert';
import { useDevice } from '../../hooks/useDevice';
import type { StoryboardPanel } from '../../types';
import type { PanelStatus } from './types';

export interface MobileIntegrationProps {
  panels: StoryboardPanel[];
  selectedPanels: Set<string>;
  panelStatuses: Record<string, PanelStatus>;
  onToggleSelect: (id: string) => void;
  onUpdatePanel: (id: string, params: Partial<StoryboardPanel>) => void;
  onDeletePanel: (id: string) => void;
  onGenerateImage: (panel: StoryboardPanel) => Promise<any>;
  onCopyPanel: (panel: StoryboardPanel) => void;
  onGeneratePrompts: (panel: StoryboardPanel) => void;
  showAlert?: boolean;
  onDismissAlert?: () => void;
}

/**
 * 移动端分镜列表
 */
export function MobilePanelList({
  panels,
  selectedPanels,
  panelStatuses,
  onToggleSelect,
  onUpdatePanel,
  onDeletePanel,
  onGenerateImage,
  onCopyPanel,
  onGeneratePrompts,
  showAlert = true,
  onDismissAlert,
}: MobileIntegrationProps) {
  const device = useDevice();
  const [editingPanel, setEditingPanel] = React.useState<StoryboardPanel | null>(null);
  const [mobileEditorOpen, setMobileEditorOpen] = React.useState(false);

  // 桌面端不渲染
  if (device.isDesktop) return null;

  const handleMobileEdit = (panel: StoryboardPanel) => {
    setEditingPanel(panel);
    setMobileEditorOpen(true);
  };

  const handleMobileUpdate = (params: Partial<StoryboardPanel>) => {
    if (editingPanel) {
      onUpdatePanel(editingPanel.id, params);
    }
  };

  return (
    <>
      {/* 移动端提示 */}
      {showAlert && (
        <MobileAlert 
          page="storyboard"
          onDismiss={onDismissAlert}
        />
      )}

      {/* 分镜列表 */}
      <div className="space-y-4">
        {panels.map((panel) => (
          <MobileShotCard
            key={panel.id}
            panel={panel}
            isSelected={selectedPanels.has(panel.id)}
            status={panelStatuses[panel.id]}
            onSelect={() => onToggleSelect(panel.id)}
            onEdit={() => handleMobileEdit(panel)}
            onDelete={() => onDeletePanel(panel.id)}
            onGenerateImage={async () => await onGenerateImage(panel)}
            onCopy={() => onCopyPanel(panel)}
          />
        ))}
      </div>

      {/* 全屏编辑器 */}
      {editingPanel && (
        <MobileShotEditor
          panel={editingPanel}
          open={mobileEditorOpen}
          onClose={() => {
            setMobileEditorOpen(false);
            setEditingPanel(null);
          }}
          onUpdate={handleMobileUpdate}
          onGeneratePrompts={() => editingPanel && onGeneratePrompts(editingPanel)}
        />
      )}
    </>
  );
}

/**
 * 响应式分镜卡片包装器
 * 自动根据设备类型选择合适的卡片组件
 */
export function ResponsiveShotCard({
  panel,
  index,
  isSelected,
  status,
  onSelect,
  onUpdate,
  onDelete,
  onGenerateImage,
  onCopy,
  onGeneratePrompts,
  DesktopCard,
}: {
  panel: StoryboardPanel;
  index: number;
  isSelected: boolean;
  status?: PanelStatus;
  onSelect: () => void;
  onUpdate: (params: Partial<StoryboardPanel>) => void;
  onDelete: () => void;
  onGenerateImage: () => Promise<any>;
  onCopy: () => void;
  onGeneratePrompts: () => void;
  DesktopCard: React.ComponentType<any>;
}) {
  const device = useDevice();
  const [editingPanel, setEditingPanel] = React.useState<StoryboardPanel | null>(null);
  const [mobileEditorOpen, setMobileEditorOpen] = React.useState(false);

  const handleMobileEdit = () => {
    setEditingPanel(panel);
    setMobileEditorOpen(true);
  };

  const handleMobileUpdate = (params: Partial<StoryboardPanel>) => {
    onUpdate(params);
  };

  // 移动端使用简化卡片
  if (device.isMobile) {
    return (
      <>
        <MobileShotCard
          panel={panel}
          isSelected={isSelected}
          status={status}
          onSelect={onSelect}
          onEdit={handleMobileEdit}
          onDelete={onDelete}
          onGenerateImage={onGenerateImage}
          onCopy={onCopy}
        />
        
        {editingPanel && (
          <MobileShotEditor
            panel={editingPanel}
            open={mobileEditorOpen}
            onClose={() => {
              setMobileEditorOpen(false);
              setEditingPanel(null);
            }}
            onUpdate={handleMobileUpdate}
            onGeneratePrompts={onGeneratePrompts}
          />
        )}
      </>
    );
  }

  // 桌面端使用完整卡片
  return <DesktopCard />;
}

export default MobilePanelList;
