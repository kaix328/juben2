/**
 * 深色主题配置
 * 使用 next-themes 实现主题切换
 */

import { useEffect, useState } from 'react';

// ============ 主题类型 ============

export type Theme = 'light' | 'dark' | 'system';

// ============ 主题管理器 ============

class ThemeManager {
  private theme: Theme = 'light';
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    this.loadTheme();
    this.applyTheme();
    this.watchSystemTheme();
  }

  /**
   * 加载保存的主题
   */
  private loadTheme() {
    try {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        this.theme = saved;
      }
    } catch (e) {
      console.warn('无法加载主题设置');
    }
  }

  /**
   * 保存主题
   */
  private saveTheme() {
    try {
      localStorage.setItem('theme', this.theme);
    } catch (e) {
      console.warn('无法保存主题设置');
    }
  }

  /**
   * 获取当前主题
   */
  getTheme(): Theme {
    return this.theme;
  }

  /**
   * 获取实际应用的主题（解析 system）
   */
  getResolvedTheme(): 'light' | 'dark' {
    if (this.theme === 'system') {
      return this.getSystemTheme();
    }
    return this.theme;
  }

  /**
   * 获取系统主题
   */
  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * 设置主题
   */
  setTheme(theme: Theme) {
    this.theme = theme;
    this.saveTheme();
    this.applyTheme();
    this.notifyListeners();
  }

  /**
   * 应用主题到 DOM
   */
  private applyTheme() {
    if (typeof document === 'undefined') return;

    const resolvedTheme = this.getResolvedTheme();
    const root = document.documentElement;

    // 移除旧类名
    root.classList.remove('light', 'dark');
    
    // 添加新类名
    root.classList.add(resolvedTheme);

    // 设置 data 属性（兼容某些组件库）
    root.setAttribute('data-theme', resolvedTheme);

    // 设置颜色方案（影响浏览器 UI）
    root.style.colorScheme = resolvedTheme;
  }

  /**
   * 监听系统主题变化
   */
  private watchSystemTheme() {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = () => {
      if (this.theme === 'system') {
        this.applyTheme();
        this.notifyListeners();
      }
    };

    // 现代浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // 旧浏览器
      mediaQuery.addListener(handler);
    }
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(this.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  /**
   * 订阅主题变化
   */
  subscribe(listener: (theme: Theme) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知监听器
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.theme));
  }
}

// ============ 导出单例 ============

export const themeManager = new ThemeManager();

// ============ React Hook ============

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(themeManager.getTheme());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    themeManager.getResolvedTheme()
  );

  useEffect(() => {
    // 订阅主题变化
    const unsubscribe = themeManager.subscribe((newTheme) => {
      setTheme(newTheme);
      setResolvedTheme(themeManager.getResolvedTheme());
    });

    return unsubscribe;
  }, []);

  const setThemeValue = (newTheme: Theme) => {
    themeManager.setTheme(newTheme);
  };

  const toggleTheme = () => {
    themeManager.toggleTheme();
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeValue,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
  };
}

// ============ 主题提供者组件 ============

import React from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  useEffect(() => {
    // 初始化主题
    if (themeManager.getTheme() === 'light' && defaultTheme !== 'light') {
      themeManager.setTheme(defaultTheme);
    }
  }, [defaultTheme]);

  return <>{children}</>;
}

// ============ 主题切换按钮组件 ============

import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const labels = {
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
  };

  const Icon = icons[theme];

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      title={`当前主题: ${labels[theme]}`}
    >
      <Icon className="w-5 h-5" />
      {showLabel && <span className="text-sm font-medium">{labels[theme]}</span>}
    </button>
  );
}

// ============ 主题选择器组件 ============

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor },
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            theme === value
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300'
              : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ============ 初始化函数 ============

/**
 * 初始化主题系统
 * 在应用启动时调用
 */
export function initTheme(defaultTheme: Theme = 'light') {
  if (themeManager.getTheme() === 'light' && defaultTheme !== 'light') {
    themeManager.setTheme(defaultTheme);
  }
}

export default themeManager;
