/**
 * 移动端导航优化
 * 优化触摸目标和交互体验
 */
import React from 'react';
import { Home, FileText, Film, Library, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface MobileNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const navItems: MobileNavItem[] = [
  { icon: Home, label: '首页', path: '/' },
  { icon: FileText, label: '剧本', path: '/scripts' },
  { icon: Film, label: '分镜', path: '/storyboard' },
  { icon: Library, label: '资源', path: '/library' },
  { icon: Settings, label: '设置', path: '/settings' },
];

/**
 * 优化后的移动端底部导航
 */
export function OptimizedMobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg transition-all touch-manipulation",
                "min-w-[64px] min-h-[56px] px-3 py-2",
                "active:scale-95 active:bg-gray-100",
                isActive 
                  ? "text-blue-600" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default OptimizedMobileNav;
