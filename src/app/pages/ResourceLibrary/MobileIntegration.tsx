/**
 * 资源库移动端集成组件
 */
import React, { useState } from 'react';
import { MobileAssetCard } from '../../components/library/MobileAssetCard';
import { MobileAlert } from '../../components/MobileAlert';
import { useDevice } from '../../hooks/useDevice';
import type { Asset } from '../../types';

export interface MobileAssetLibraryProps {
  assets: Asset[];
  onView: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onCopy?: (asset: Asset) => void;
  showAlert?: boolean;
  onDismissAlert?: () => void;
}

/**
 * 移动端资源库列表
 */
export function MobileAssetLibrary({
  assets,
  onView,
  onDownload,
  onDelete,
  onCopy,
  showAlert = true,
  onDismissAlert,
}: MobileAssetLibraryProps) {
  const device = useDevice();

  // 桌面端不渲染
  if (device.isDesktop) return null;

  return (
    <>
      {/* 移动端提示 */}
      {showAlert && (
        <MobileAlert 
          page="assets"
          onDismiss={onDismissAlert}
        />
      )}

      {/* 资源网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {assets.map((asset) => (
          <MobileAssetCard
            key={asset.id}
            asset={asset}
            onView={() => onView(asset)}
            onDownload={() => onDownload(asset)}
            onDelete={() => onDelete(asset)}
            onCopy={onCopy ? () => onCopy(asset) : undefined}
          />
        ))}
      </div>
    </>
  );
}

export default MobileAssetLibrary;
