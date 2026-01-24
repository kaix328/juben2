/**
 * 移动端底部导航栏
 */
import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, FileText, Layers, Users, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  matchPattern?: RegExp;
}

export function MobileBottomNav() {
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();

  // 根据是否在项目内显示不同导航
  const navItems: NavItem[] = projectId
    ? [
        {
          icon: Home,
          label: '概览',
          path: `/projects/${projectId}`,
          matchPattern: new RegExp(`^/projects/${projectId}/?$`),
        },
        {
          icon: FileText,
          label: '剧本',
          path: `/projects/${projectId}/script`,
          matchPattern: /\/script\//,
        },
        {
          icon: Layers,
          label: '分镜',
          path: `/projects/${projectId}/storyboard`,
          matchPattern: /\/storyboard\//,
        },
        {
          icon: Users,
          label: '资源',
          path: `/projects/${projectId}/assets`,
          matchPattern: /\/assets/,
        },
        {
          icon: Settings,
          label: '设置',
          path: `/projects/${projectId}/style`,
          matchPattern: /\/(style|tools|dashboard)/,
        },
      ]
    : [
        {
          icon: Home,
          label: '书架',
          path: '/',
          matchPattern: /^\/$/,
        },
        {
          icon: Settings,
          label: '设置',
          path: '/settings',
          matchPattern: /^\/settings/,
        },
      ];

  const isActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(location.pathname);
    }
    return location.pathname === item.path;
  };

  return (
    <nav className="mobile-bottom-nav md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
              active
                ? 'text-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
