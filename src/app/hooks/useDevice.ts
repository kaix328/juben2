/**
 * 设备检测 Hook
 * 用于检测当前设备类型（手机、平板、桌面）
 */
import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
}

/**
 * 检测设备类型
 */
function getDeviceType(width: number): DeviceType {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * 检测是否为触摸设备
 */
function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * 使用设备信息 Hook
 */
export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const type = getDeviceType(width);
    
    return {
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      width,
      height,
      isPortrait: height > width,
      isLandscape: width > height,
      isTouchDevice: isTouchDevice(),
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const type = getDeviceType(width);
      
      setDeviceInfo({
        type,
        isMobile: type === 'mobile',
        isTablet: type === 'tablet',
        isDesktop: type === 'desktop',
        width,
        height,
        isPortrait: height > width,
        isLandscape: width > height,
        isTouchDevice: isTouchDevice(),
      });
    };

    // 使用 debounce 优化性能
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return deviceInfo;
}

/**
 * 简化版：只返回设备类型
 */
export function useDeviceType(): DeviceType {
  const { type } = useDevice();
  return type;
}

/**
 * 检测是否为移动设备
 */
export function useIsMobile(): boolean {
  const { isMobile } = useDevice();
  return isMobile;
}

/**
 * 检测是否为触摸设备
 */
export function useIsTouchDevice(): boolean {
  const { isTouchDevice: isTouch } = useDevice();
  return isTouch;
}

/**
 * 响应式断点 Hook
 */
export function useBreakpoint() {
  const { width } = useDevice();
  
  return {
    xs: width >= 375,
    sm: width >= 640,
    md: width >= 768,
    lg: width >= 1024,
    xl: width >= 1280,
    '2xl': width >= 1536,
  };
}

export default useDevice;
