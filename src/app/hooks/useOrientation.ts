/**
 * 横屏检测和优化 Hook
 */
import { useState, useEffect } from 'react';

export type Orientation = 'portrait' | 'landscape';

export interface OrientationInfo {
  orientation: Orientation;
  isLandscape: boolean;
  isPortrait: boolean;
  angle: number;
}

/**
 * 获取当前屏幕方向
 */
function getOrientation(): OrientationInfo {
  const angle = window.screen?.orientation?.angle ?? 0;
  const isLandscape = window.innerWidth > window.innerHeight;
  
  return {
    orientation: isLandscape ? 'landscape' : 'portrait',
    isLandscape,
    isPortrait: !isLandscape,
    angle,
  };
}

/**
 * 使用屏幕方向 Hook
 */
export function useOrientation(): OrientationInfo {
  const [orientationInfo, setOrientationInfo] = useState<OrientationInfo>(getOrientation);

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientationInfo(getOrientation());
    };

    // 监听方向变化
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientationInfo;
}

/**
 * 锁定屏幕方向
 */
export async function lockOrientation(orientation: OrientationLockType): Promise<boolean> {
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock(orientation);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('无法锁定屏幕方向:', error);
    return false;
  }
}

/**
 * 解锁屏幕方向
 */
export function unlockOrientation(): void {
  try {
    screen.orientation?.unlock();
  } catch (error) {
    console.warn('无法解锁屏幕方向:', error);
  }
}

/**
 * 横屏布局 Hook
 */
export function useLandscapeLayout() {
  const { isLandscape } = useOrientation();
  const [showSidebar, setShowSidebar] = useState(isLandscape);

  useEffect(() => {
    setShowSidebar(isLandscape);
  }, [isLandscape]);

  return {
    isLandscape,
    showSidebar,
    setShowSidebar,
    // 推荐的布局配置
    layout: isLandscape
      ? {
          columns: 2,
          sidebarWidth: 320,
          contentPadding: 24,
          gridGap: 20,
        }
      : {
          columns: 1,
          sidebarWidth: 0,
          contentPadding: 16,
          gridGap: 16,
        },
  };
}

/**
 * 全屏 Hook
 */
export function useFullscreen(elementRef?: React.RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    try {
      const element = elementRef?.current || document.documentElement;
      await element.requestFullscreen();
      return true;
    } catch (error) {
      console.warn('无法进入全屏:', error);
      return false;
    }
  };

  const exitFullscreen = async () => {
    try {
      await document.exitFullscreen();
      return true;
    } catch (error) {
      console.warn('无法退出全屏:', error);
      return false;
    }
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      return await exitFullscreen();
    } else {
      return await enterFullscreen();
    }
  };

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}

export default useOrientation;
