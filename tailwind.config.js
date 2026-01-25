/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      // 标准断点
      'xs': '375px',   // 小手机
      'sm': '640px',   // 大手机
      'md': '768px',   // 平板竖屏
      'lg': '1024px',  // 平板横屏/小笔记本
      'xl': '1280px',  // 桌面
      '2xl': '1536px', // 大屏
      
      // 设备特定断点
      'mobile': '375px',
      'tablet': '768px',
      'laptop': '1024px',
      'desktop': '1280px',
      
      // iPad 特定
      'ipad': '768px',
      'ipad-pro': '1024px',
    },
    extend: {
      // 安全区域支持
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // 触摸目标最小尺寸
      minHeight: {
        'touch': '44px', // iOS 推荐的最小触摸目标
        'touch-sm': '36px',
        'touch-lg': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-sm': '36px',
        'touch-lg': '48px',
      },
      // 移动端优化的字体大小
      fontSize: {
        'mobile-xs': ['12px', { lineHeight: '16px' }],
        'mobile-sm': ['14px', { lineHeight: '20px' }],
        'mobile-base': ['16px', { lineHeight: '24px' }], // 防止 iOS 自动缩放
        'mobile-lg': ['18px', { lineHeight: '28px' }],
      },
      // 移动端优化的间距
      gap: {
        'mobile': '12px',
        'tablet': '16px',
        'desktop': '24px',
      },
      // 移动端优化的圆角
      borderRadius: {
        'mobile': '12px',
        'mobile-sm': '8px',
        'mobile-lg': '16px',
      },
      // 移动端优化的阴影
      boxShadow: {
        'mobile': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'mobile-lg': '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      // 动画时长
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      },
      // Z-index 层级
      zIndex: {
        'modal': '100',
        'dropdown': '50',
        'sticky': '40',
        'fixed': '30',
        'overlay': '20',
      },
    },
  },
  plugins: [],
};
