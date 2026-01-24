/**
 * 移动端底部导航组件
 * 提供移动设备上的主要导航功能
 */
import React from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  FolderOpen, 
  Film, 
  Image, 
  LayoutDashboard,
  Palette,
  Wrench
} from 'lucide-react';
import { cn } from '../utils/classnames';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
}

// 主导航项（书架页面）
const mainNavItems: NavItem[] = [
  { path: '/', icon: Home, label: '书架', exact: true },
  { path: '/settings', icon: Settings, label: '设置' },
];

// 项目内导航项
const projectNavItems: (projectId: string) => NavItem[] = (projectId) => [
  { path: `/projects/${projectId}`, icon: FolderOpen, label: '项目', exact: true },
  { path: `/projects/${projectId}/dashboard`, icon: LayoutDashboard, label: '统计' },
  { path: `/projects/${projectId}/style`, icon: Palette, label: '风格' },
  { path: `/projects/${projectId}/assets`, icon: Image, label: '资源' },
  { path: `/projects/${projectId}/tools`, icon: Wrench, label: '工具' },
];

/**
 * 移动端底部导航
 */
export function MobileNav() {
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  
  // 判断是否在项目内
  const isInProject = location.pathname.includes('/projects/') && projectId;
  
  // 选择导航项
  const navItems = isInProject 
    ? projectNavItems(projectId) 
    : mainNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 px-2',
                'transition-colors duration-150',
                isActive 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 active:text-gray-700'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 mb-1',
                  isActive && 'stroke-[2.5]'
                )} 
              />
              <span className={cn(
                'text-xs font-medium',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
              
              {/* 活动指示器 */}
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * 编辑器页面的快捷导航
 * 用于在章节/剧本/分镜之间快速切换
 */
export function EditorQuickNav() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>();
  const location = useLocation();
  
  if (!projectId || !chapterId) return null;
  
  const editorNavItems: NavItem[] = [
    { path: `/projects/${projectId}/chapter/${chapterId}`, icon: FolderOpen, label: '章节' },
    { path: `/projects/${projectId}/script/${chapterId}`, icon: Film, label: '剧本' },
    { path: `/projects/${projectId}/storyboard/${chapterId}`, icon: Image, label: '分镜' },
  ];

  return (
    <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-gray-50 border-t border-gray-100">
      <div className="flex items-center justify-around h-12 px-4">
        {editorNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                'transition-colors duration-150',
                isActive 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 active:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 移动端安全区域底部间距
 */
export function MobileBottomSpacer() {
  return <div className="md:hidden h-16 safe-area-bottom" />;
}

export default MobileNav;
