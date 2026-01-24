/**
 * iPad 专属检测和优化 Hook
 */
import { useState, useEffect } from 'react';
import { useDevice } from './useDevice';

export interface IPadInfo {
  isIPad: boolean;
  isIPadPro: boolean;
  isIPadMini: boolean;
  screenSize: 'small' | 'medium' | 'large';
  supportsSplitView: boolean;
}

/**
 * 检测是否为 iPad
 */
function detectIPad(): boolean {
  const ua = navigator.userAgent;
  
  // 检测 iPad User Agent
  if (/iPad/.test(ua)) {
    return true;
  }
  
  // iPadOS 13+ 会伪装成 Mac，需要额外检测
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) {
    return true;
  }
  
  return false;
}

/**
 * 检测 iPad 型号
 */
function detectIPadModel(width: number, height: number): {
  isIPadPro: boolean;
  isIPadMini: boolean;
  screenSize: 'small' | 'medium' | 'large';
} {
  const maxDimension = Math.max(width, height);
  
  // iPad Pro 12.9" (1366x1024)
  if (maxDimension >= 1366) {
    return {
      isIPadPro: true,
      isIPadMini: false,
      screenSize: 'large',
    };
  }
  
  // iPad Pro 11" / iPad Air (1194x834)
  if (maxDimension >= 1194) {
    return {
      isIPadPro: true,
      isIPadMini: false,
      screenSize: 'medium',
    };
  }
  
  // iPad Mini (1024x768)
  if (maxDimension <= 1024) {
    return {
      isIPadPro: false,
      isIPadMini: true,
      screenSize: 'small',
    };
  }
  
  // 标准 iPad
  return {
    isIPadPro: false,
    isIPadMini: false,
    screenSize: 'medium',
  };
}

/**
 * 使用 iPad 信息 Hook
 */
export function useIPad(): IPadInfo {
  const { width, height, isTablet } = useDevice();
  const [ipadInfo, setIpadInfo] = useState<IPadInfo>(() => {
    const isIPad = detectIPad();
    const model = detectIPadModel(width, height);
    
    return {
      isIPad,
      ...model,
      supportsSplitView: isIPad && width >= 768,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const isIPad = detectIPad();
      const model = detectIPadModel(window.innerWidth, window.innerHeight);
      
      setIpadInfo({
        isIPad,
        ...model,
        supportsSplitView: isIPad && window.innerWidth >= 768,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return ipadInfo;
}

/**
 * 简化版：只返回是否为 iPad
 */
export function useIsIPad(): boolean {
  const { isIPad } = useIPad();
  return isIPad;
}

/**
 * 检测是否支持分屏
 */
export function useIPadSplitView(): boolean {
  const { supportsSplitView } = useIPad();
  return supportsSplitView;
}

/**
 * iPad 专属布局 Hook
 */
export function useIPadLayout() {
  const ipadInfo = useIPad();
  const { width, isLandscape } = useDevice();
  
  return {
    ...ipadInfo,
    // 推荐的列数
    gridColumns: ipadInfo.isIPad
      ? ipadInfo.screenSize === 'large'
        ? isLandscape ? 4 : 3
        : isLandscape ? 3 : 2
      : 1,
    
    // 是否显示侧边栏
    showSidebar: ipadInfo.isIPad && width >= 768,
    
    // 侧边栏宽度
    sidebarWidth: ipadInfo.screenSize === 'large' ? 320 : 280,
    
    // 是否使用紧凑布局
    useCompactLayout: ipadInfo.isIPadMini,
  };
}

export default useIPad;
