/**
 * 快捷键系统
 * 提供全局快捷键管理、自定义配置和冲突检测
 */

import { useEffect, useCallback, useRef } from 'react';

// ============ 类型定义 ============

export interface KeyBinding {
  id: string;
  name: string;
  description: string;
  category: KeyBindingCategory;
  keys: string[];           // 如 ['Ctrl', 'S'] 或 ['Cmd', 'Shift', 'P']
  action: string;           // 动作标识符
  enabled: boolean;
  isDefault: boolean;
}

export type KeyBindingCategory = 
  | 'general'       // 通用
  | 'navigation'    // 导航
  | 'editing'       // 编辑
  | 'storyboard'    // 分镜
  | 'playback'      // 播放
  | 'view'          // 视图
  | 'tools';        // 工具

export interface KeyEvent {
  key: string;
  code: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export type KeyHandler = (event: KeyboardEvent) => void | boolean;

// ============ 默认快捷键配置 ============

export const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  // 通用
  {
    id: 'save',
    name: '保存',
    description: '保存当前项目',
    category: 'general',
    keys: ['Ctrl', 'S'],
    action: 'save',
    enabled: true,
    isDefault: true
  },
  {
    id: 'save_as',
    name: '另存为',
    description: '将项目另存为新文件',
    category: 'general',
    keys: ['Ctrl', 'Shift', 'S'],
    action: 'saveAs',
    enabled: true,
    isDefault: true
  },
  {
    id: 'undo',
    name: '撤销',
    description: '撤销上一步操作',
    category: 'general',
    keys: ['Ctrl', 'Z'],
    action: 'undo',
    enabled: true,
    isDefault: true
  },
  {
    id: 'redo',
    name: '重做',
    description: '重做上一步撤销的操作',
    category: 'general',
    keys: ['Ctrl', 'Shift', 'Z'],
    action: 'redo',
    enabled: true,
    isDefault: true
  },
  {
    id: 'copy',
    name: '复制',
    description: '复制选中内容',
    category: 'general',
    keys: ['Ctrl', 'C'],
    action: 'copy',
    enabled: true,
    isDefault: true
  },
  {
    id: 'paste',
    name: '粘贴',
    description: '粘贴剪贴板内容',
    category: 'general',
    keys: ['Ctrl', 'V'],
    action: 'paste',
    enabled: true,
    isDefault: true
  },
  {
    id: 'cut',
    name: '剪切',
    description: '剪切选中内容',
    category: 'general',
    keys: ['Ctrl', 'X'],
    action: 'cut',
    enabled: true,
    isDefault: true
  },
  {
    id: 'select_all',
    name: '全选',
    description: '选择所有内容',
    category: 'general',
    keys: ['Ctrl', 'A'],
    action: 'selectAll',
    enabled: true,
    isDefault: true
  },
  {
    id: 'search',
    name: '搜索',
    description: '打开搜索面板',
    category: 'general',
    keys: ['Ctrl', 'F'],
    action: 'search',
    enabled: true,
    isDefault: true
  },
  {
    id: 'command_palette',
    name: '命令面板',
    description: '打开命令面板',
    category: 'general',
    keys: ['Ctrl', 'Shift', 'P'],
    action: 'commandPalette',
    enabled: true,
    isDefault: true
  },

  // 导航
  {
    id: 'nav_chapters',
    name: '章节编辑器',
    description: '切换到章节编辑器',
    category: 'navigation',
    keys: ['Ctrl', '1'],
    action: 'navChapters',
    enabled: true,
    isDefault: true
  },
  {
    id: 'nav_script',
    name: '剧本编辑器',
    description: '切换到剧本编辑器',
    category: 'navigation',
    keys: ['Ctrl', '2'],
    action: 'navScript',
    enabled: true,
    isDefault: true
  },
  {
    id: 'nav_storyboard',
    name: '分镜编辑器',
    description: '切换到分镜编辑器',
    category: 'navigation',
    keys: ['Ctrl', '3'],
    action: 'navStoryboard',
    enabled: true,
    isDefault: true
  },
  {
    id: 'nav_assets',
    name: '素材库',
    description: '切换到素材库',
    category: 'navigation',
    keys: ['Ctrl', '4'],
    action: 'navAssets',
    enabled: true,
    isDefault: true
  },
  {
    id: 'nav_style',
    name: '导演风格',
    description: '切换到导演风格',
    category: 'navigation',
    keys: ['Ctrl', '5'],
    action: 'navStyle',
    enabled: true,
    isDefault: true
  },
  {
    id: 'nav_prev',
    name: '上一个',
    description: '切换到上一个分镜/场景',
    category: 'navigation',
    keys: ['Alt', 'ArrowLeft'],
    action: 'navPrev',
    enabled: true,
    isDefault: true
  },
  {
    id: 'nav_next',
    name: '下一个',
    description: '切换到下一个分镜/场景',
    category: 'navigation',
    keys: ['Alt', 'ArrowRight'],
    action: 'navNext',
    enabled: true,
    isDefault: true
  },

  // 分镜操作
  {
    id: 'new_panel',
    name: '新建分镜',
    description: '在当前位置新建分镜',
    category: 'storyboard',
    keys: ['Ctrl', 'N'],
    action: 'newPanel',
    enabled: true,
    isDefault: true
  },
  {
    id: 'duplicate_panel',
    name: '复制分镜',
    description: '复制当前分镜',
    category: 'storyboard',
    keys: ['Ctrl', 'D'],
    action: 'duplicatePanel',
    enabled: true,
    isDefault: true
  },
  {
    id: 'delete_panel',
    name: '删除分镜',
    description: '删除当前分镜',
    category: 'storyboard',
    keys: ['Delete'],
    action: 'deletePanel',
    enabled: true,
    isDefault: true
  },
  {
    id: 'generate_image',
    name: '生成图片',
    description: '为当前分镜生成图片',
    category: 'storyboard',
    keys: ['Ctrl', 'G'],
    action: 'generateImage',
    enabled: true,
    isDefault: true
  },
  {
    id: 'regenerate_image',
    name: '重新生成',
    description: '重新生成当前分镜图片',
    category: 'storyboard',
    keys: ['Ctrl', 'Shift', 'G'],
    action: 'regenerateImage',
    enabled: true,
    isDefault: true
  },
  {
    id: 'edit_prompt',
    name: '编辑提示词',
    description: '编辑当前分镜的提示词',
    category: 'storyboard',
    keys: ['Ctrl', 'E'],
    action: 'editPrompt',
    enabled: true,
    isDefault: true
  },
  {
    id: 'check_continuity',
    name: '连贯性检测',
    description: '运行分镜连贯性检测',
    category: 'storyboard',
    keys: ['Ctrl', 'Shift', 'C'],
    action: 'checkContinuity',
    enabled: true,
    isDefault: true
  },

  // 播放控制
  {
    id: 'play_pause',
    name: '播放/暂停',
    description: '播放或暂停预览',
    category: 'playback',
    keys: ['Space'],
    action: 'playPause',
    enabled: true,
    isDefault: true
  },
  {
    id: 'stop',
    name: '停止',
    description: '停止播放并回到开始',
    category: 'playback',
    keys: ['Escape'],
    action: 'stop',
    enabled: true,
    isDefault: true
  },
  {
    id: 'frame_prev',
    name: '上一帧',
    description: '后退一帧',
    category: 'playback',
    keys: ['ArrowLeft'],
    action: 'framePrev',
    enabled: true,
    isDefault: true
  },
  {
    id: 'frame_next',
    name: '下一帧',
    description: '前进一帧',
    category: 'playback',
    keys: ['ArrowRight'],
    action: 'frameNext',
    enabled: true,
    isDefault: true
  },
  {
    id: 'go_start',
    name: '跳到开始',
    description: '跳转到时间轴开始',
    category: 'playback',
    keys: ['Home'],
    action: 'goStart',
    enabled: true,
    isDefault: true
  },
  {
    id: 'go_end',
    name: '跳到结束',
    description: '跳转到时间轴结束',
    category: 'playback',
    keys: ['End'],
    action: 'goEnd',
    enabled: true,
    isDefault: true
  },

  // 视图
  {
    id: 'zoom_in',
    name: '放大',
    description: '放大视图',
    category: 'view',
    keys: ['Ctrl', '='],
    action: 'zoomIn',
    enabled: true,
    isDefault: true
  },
  {
    id: 'zoom_out',
    name: '缩小',
    description: '缩小视图',
    category: 'view',
    keys: ['Ctrl', '-'],
    action: 'zoomOut',
    enabled: true,
    isDefault: true
  },
  {
    id: 'zoom_fit',
    name: '适应窗口',
    description: '缩放以适应窗口',
    category: 'view',
    keys: ['Ctrl', '0'],
    action: 'zoomFit',
    enabled: true,
    isDefault: true
  },
  {
    id: 'fullscreen',
    name: '全屏',
    description: '切换全屏模式',
    category: 'view',
    keys: ['F11'],
    action: 'fullscreen',
    enabled: true,
    isDefault: true
  },
  {
    id: 'toggle_sidebar',
    name: '切换侧边栏',
    description: '显示/隐藏侧边栏',
    category: 'view',
    keys: ['Ctrl', 'B'],
    action: 'toggleSidebar',
    enabled: true,
    isDefault: true
  },
  {
    id: 'toggle_timeline',
    name: '切换时间轴',
    description: '显示/隐藏时间轴',
    category: 'view',
    keys: ['Ctrl', 'T'],
    action: 'toggleTimeline',
    enabled: true,
    isDefault: true
  },

  // 工具
  {
    id: 'ai_suggest',
    name: 'AI建议',
    description: '获取AI分镜建议',
    category: 'tools',
    keys: ['Ctrl', 'Shift', 'A'],
    action: 'aiSuggest',
    enabled: true,
    isDefault: true
  },
  {
    id: 'style_mixer',
    name: '风格混合器',
    description: '打开风格混合器',
    category: 'tools',
    keys: ['Ctrl', 'Shift', 'M'],
    action: 'styleMixer',
    enabled: true,
    isDefault: true
  },
  {
    id: 'export',
    name: '导出',
    description: '导出项目',
    category: 'tools',
    keys: ['Ctrl', 'Shift', 'E'],
    action: 'export',
    enabled: true,
    isDefault: true
  }
];

// ============ 快捷键管理器 ============

class KeyboardShortcutManager {
  private bindings: Map<string, KeyBinding> = new Map();
  private handlers: Map<string, Set<KeyHandler>> = new Map();
  private storageKey = 'keyboard_shortcuts';
  private enabled = true;

  constructor() {
    this.loadBindings();
    this.setupGlobalListener();
  }

  // ============ 存储 ============

  private loadBindings(): void {
    // 先加载默认配置
    DEFAULT_KEY_BINDINGS.forEach(binding => {
      this.bindings.set(binding.id, { ...binding });
    });

    // 再加载用户自定义配置
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const customBindings = JSON.parse(saved) as Partial<KeyBinding>[];
        customBindings.forEach(custom => {
          if (custom.id && this.bindings.has(custom.id)) {
            const existing = this.bindings.get(custom.id)!;
            this.bindings.set(custom.id, { ...existing, ...custom, isDefault: false });
          }
        });
      }
    } catch (error) {
      console.error('Failed to load custom key bindings:', error);
    }
  }

  private saveBindings(): void {
    try {
      const customBindings = Array.from(this.bindings.values())
        .filter(b => !b.isDefault)
        .map(b => ({ id: b.id, keys: b.keys, enabled: b.enabled }));
      localStorage.setItem(this.storageKey, JSON.stringify(customBindings));
    } catch (error) {
      console.error('Failed to save key bindings:', error);
    }
  }

  // ============ 全局监听 ============

  private setupGlobalListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (event) => {
      if (!this.enabled) return;

      // 忽略输入框中的快捷键（除了特定的）
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;

      const keyEvent = this.normalizeEvent(event);
      const binding = this.findMatchingBinding(keyEvent);

      if (binding) {
        // 某些快捷键在输入框中也应该生效
        const allowInInput = ['save', 'undo', 'redo', 'command_palette'];
        
        if (isInput && !allowInInput.includes(binding.id)) {
          return;
        }

        event.preventDefault();
        this.executeAction(binding.action, event);
      }
    });
  }

  private normalizeEvent(event: KeyboardEvent): KeyEvent {
    return {
      key: event.key,
      code: event.code,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey
    };
  }

  private findMatchingBinding(event: KeyEvent): KeyBinding | null {
    for (const binding of this.bindings.values()) {
      if (!binding.enabled) continue;
      if (this.matchesKeys(event, binding.keys)) {
        return binding;
      }
    }
    return null;
  }

  private matchesKeys(event: KeyEvent, keys: string[]): boolean {
    const normalizedKeys = keys.map(k => k.toLowerCase());
    
    // 检查修饰键
    const needsCtrl = normalizedKeys.includes('ctrl') || normalizedKeys.includes('control');
    const needsShift = normalizedKeys.includes('shift');
    const needsAlt = normalizedKeys.includes('alt');
    const needsMeta = normalizedKeys.includes('meta') || normalizedKeys.includes('cmd');

    if (event.ctrl !== needsCtrl) return false;
    if (event.shift !== needsShift) return false;
    if (event.alt !== needsAlt) return false;
    if (event.meta !== needsMeta) return false;

    // 检查主键
    const mainKey = normalizedKeys.find(k => 
      !['ctrl', 'control', 'shift', 'alt', 'meta', 'cmd'].includes(k)
    );

    if (!mainKey) return false;

    const eventKey = event.key.toLowerCase();
    const eventCode = event.code.toLowerCase();

    return eventKey === mainKey || 
           eventCode === mainKey || 
           eventCode === `key${mainKey}` ||
           eventCode === `digit${mainKey}`;
  }

  private executeAction(action: string, event: KeyboardEvent): void {
    const handlers = this.handlers.get(action);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  // ============ 公共API ============

  /**
   * 注册动作处理器
   */
  registerHandler(action: string, handler: KeyHandler): () => void {
    if (!this.handlers.has(action)) {
      this.handlers.set(action, new Set());
    }
    this.handlers.get(action)!.add(handler);

    // 返回取消注册函数
    return () => {
      this.handlers.get(action)?.delete(handler);
    };
  }

  /**
   * 获取所有快捷键绑定
   */
  getAllBindings(): KeyBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * 获取分类的快捷键
   */
  getBindingsByCategory(category: KeyBindingCategory): KeyBinding[] {
    return this.getAllBindings().filter(b => b.category === category);
  }

  /**
   * 更新快捷键
   */
  updateBinding(id: string, keys: string[]): boolean {
    const binding = this.bindings.get(id);
    if (!binding) return false;

    // 检查冲突
    const conflict = this.checkConflict(keys, id);
    if (conflict) {
      console.warn(`Key binding conflict with: ${conflict.name}`);
      return false;
    }

    binding.keys = keys;
    binding.isDefault = false;
    this.saveBindings();
    return true;
  }

  /**
   * 重置快捷键为默认
   */
  resetBinding(id: string): void {
    const defaultBinding = DEFAULT_KEY_BINDINGS.find(b => b.id === id);
    if (defaultBinding) {
      this.bindings.set(id, { ...defaultBinding });
      this.saveBindings();
    }
  }

  /**
   * 重置所有快捷键
   */
  resetAllBindings(): void {
    this.bindings.clear();
    DEFAULT_KEY_BINDINGS.forEach(binding => {
      this.bindings.set(binding.id, { ...binding });
    });
    localStorage.removeItem(this.storageKey);
  }

  /**
   * 启用/禁用快捷键
   */
  setBindingEnabled(id: string, enabled: boolean): void {
    const binding = this.bindings.get(id);
    if (binding) {
      binding.enabled = enabled;
      this.saveBindings();
    }
  }

  /**
   * 检查快捷键冲突
   */
  checkConflict(keys: string[], excludeId?: string): KeyBinding | null {
    for (const binding of this.bindings.values()) {
      if (excludeId && binding.id === excludeId) continue;
      if (!binding.enabled) continue;

      if (this.keysEqual(binding.keys, keys)) {
        return binding;
      }
    }
    return null;
  }

  private keysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const normalizedA = a.map(k => k.toLowerCase()).sort();
    const normalizedB = b.map(k => k.toLowerCase()).sort();
    return normalizedA.every((k, i) => k === normalizedB[i]);
  }

  /**
   * 全局启用/禁用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 格式化快捷键显示
   */
  formatKeys(keys: string[]): string {
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    
    return keys.map(key => {
      const lower = key.toLowerCase();
      if (lower === 'ctrl' || lower === 'control') return isMac ? '⌃' : 'Ctrl';
      if (lower === 'shift') return isMac ? '⇧' : 'Shift';
      if (lower === 'alt') return isMac ? '⌥' : 'Alt';
      if (lower === 'meta' || lower === 'cmd') return isMac ? '⌘' : 'Win';
      if (lower === 'arrowleft') return '←';
      if (lower === 'arrowright') return '→';
      if (lower === 'arrowup') return '↑';
      if (lower === 'arrowdown') return '↓';
      if (lower === 'space') return '␣';
      if (lower === 'escape') return 'Esc';
      if (lower === 'delete') return 'Del';
      return key.toUpperCase();
    }).join(isMac ? '' : '+');
  }
}

// ============ 单例导出 ============

export const keyboardManager = new KeyboardShortcutManager();

// ============ React Hook ============

/**
 * 使用快捷键的 Hook
 */
export function useKeyboardShortcut(
  action: string,
  handler: KeyHandler,
  deps: any[] = []
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const wrappedHandler: KeyHandler = (event) => {
      return handlerRef.current(event);
    };

    const unregister = keyboardManager.registerHandler(action, wrappedHandler);
    return unregister;
  }, [action, ...deps]);
}

/**
 * 使用多个快捷键的 Hook
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, KeyHandler>,
  deps: any[] = []
): void {
  useEffect(() => {
    const unregisters = Object.entries(shortcuts).map(([action, handler]) => 
      keyboardManager.registerHandler(action, handler)
    );

    return () => {
      unregisters.forEach(unregister => unregister());
    };
  }, deps);
}

// ============ 分类信息 ============

export const CATEGORY_INFO: Record<KeyBindingCategory, { name: string; icon: string }> = {
  general: { name: '通用', icon: '⚙️' },
  navigation: { name: '导航', icon: '🧭' },
  editing: { name: '编辑', icon: '✏️' },
  storyboard: { name: '分镜', icon: '🎬' },
  playback: { name: '播放', icon: '▶️' },
  view: { name: '视图', icon: '👁️' },
  tools: { name: '工具', icon: '🔧' }
};
