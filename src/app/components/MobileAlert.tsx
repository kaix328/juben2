/**
 * 移动端提示组件
 * 在移动设备上显示优化提示
 */
import React from 'react';
import { Info, Monitor, Tablet, Smartphone, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { useDevice } from '../hooks/useDevice';

export interface MobileAlertProps {
  page?: 'storyboard' | 'script' | 'assets';
  onDismiss?: () => void;
  dismissible?: boolean;
}

/**
 * 移动端优化提示
 */
export function MobileAlert({ 
  page = 'storyboard', 
  onDismiss,
  dismissible = true 
}: MobileAlertProps) {
  const device = useDevice();

  // 桌面端不显示
  if (device.isDesktop) return null;

  const messages = {
    storyboard: {
      title: '移动端提示',
      description: device.isMobile 
        ? '分镜编辑功能已针对手机优化。为获得最佳体验，建议使用平板或电脑进行复杂编辑。'
        : '分镜编辑功能在平板上运行良好。横屏使用可获得更好的体验。',
      icon: device.isMobile ? Smartphone : Tablet,
    },
    script: {
      title: '移动端提示',
      description: device.isMobile
        ? '剧本编辑已优化移动端体验。长文本编辑建议使用平板或电脑。'
        : '剧本编辑在平板上运行良好。',
      icon: device.isMobile ? Smartphone : Tablet,
    },
    assets: {
      title: '移动端提示',
      description: device.isMobile
        ? '资源库已针对触摸操作优化。点击资源可查看详情。'
        : '资源库在平板上运行良好。',
      icon: device.isMobile ? Smartphone : Tablet,
    },
  };

  const message = messages[page];
  const Icon = message.icon;

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-blue-900 font-semibold mb-1">
            {message.title}
          </AlertTitle>
          <AlertDescription className="text-blue-700 text-sm">
            {message.description}
          </AlertDescription>
        </div>
        {dismissible && onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="w-8 h-8 flex-shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * 设备建议提示
 */
export function DeviceRecommendation() {
  const device = useDevice();

  // 只在手机上显示
  if (!device.isMobile) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <div className="flex items-start gap-3">
        <Monitor className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="text-amber-900 font-semibold mb-1">
            推荐使用更大屏幕
          </AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            当前功能在手机上可用，但使用平板或电脑可获得更好的编辑体验。
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

/**
 * 横屏提示
 */
export function LandscapeRecommendation() {
  const device = useDevice();

  // 只在平板竖屏时显示
  if (!device.isTablet || device.isLandscape) return null;

  return (
    <Alert className="mb-4 border-purple-200 bg-purple-50">
      <div className="flex items-start gap-3">
        <Tablet className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="text-purple-900 font-semibold mb-1">
            建议横屏使用
          </AlertTitle>
          <AlertDescription className="text-purple-700 text-sm">
            将设备横向旋转可获得更宽敞的编辑空间。
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

/**
 * 触摸提示
 */
export function TouchTip({ children }: { children: React.ReactNode }) {
  const device = useDevice();

  if (!device.isTouchDevice) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-active:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        长按查看更多选项
      </div>
    </div>
  );
}

export default MobileAlert;
