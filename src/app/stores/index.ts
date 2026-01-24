/**
 * 全局状态管理中心
 * 使用 Zustand 实现轻量级状态管理
 * 
 * 统一导出所有 Store，避免目录混淆
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, DirectorStyle } from '../types';
import { projectStorage } from '../utils/storage';

// ============ API 配置状态 ============

interface ApiSettings {
  volcApiKey?: string;
  llmEndpointId?: string;
  imageEndpointId?: string;
}

interface ConfigState {
  apiSettings: ApiSettings;
  setApiSettings: (settings: ApiSettings) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      apiSettings: {
        volcApiKey: '',
        llmEndpointId: '',
        imageEndpointId: '',
      },
      setApiSettings: (settings) => set({ apiSettings: settings }),
    }),
    {
      name: 'comic-ai-config',
    }
  )
);

// ============ 当前项目状态（带异步加载） ============

interface ProjectStoreState {
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  loadProject: (id: string) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  clearProject: () => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  currentProject: null,
  isLoading: false,
  error: null,

  setCurrentProject: (project) => set({ currentProject: project }),

  loadProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectStorage.getById(id);
      if (project) {
        set({ currentProject: project, isLoading: false });
      } else {
        set({ error: '项目未找到', isLoading: false });
      }
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateProject: async (project) => {
    try {
      await projectStorage.save(project);
      set({ currentProject: project });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearProject: () => set({ currentProject: null, error: null }),
}));

// ============ UI 状态 ============

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  // 侧边栏
  sidebarCollapsed: boolean;
  sidebarOpen: boolean; // 移动端
  
  // 主题
  theme: 'light' | 'dark' | 'system';
  
  // 全局加载状态
  isLoading: boolean;
  loadingMessage: string;
  
  // 通知
  notifications: Notification[];
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLoading: (loading: boolean, message?: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,
      theme: 'light',
      isLoading: false,
      loadingMessage: '',
      notifications: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setSidebarOpen: (open) =>
        set({ sidebarOpen: open }),

      setTheme: (theme) =>
        set({ theme }),

      setLoading: (loading, message = '') =>
        set({ isLoading: loading, loadingMessage: message }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: `${Date.now()}-${Math.random()}` },
          ],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () =>
        set({ notifications: [] }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// ============ 编辑器状态 ============

interface EditorState {
  // 选中状态
  selectedPanelIds: string[];
  selectedSceneIds: string[];
  
  // 视图模式
  viewMode: 'list' | 'grid' | 'timeline';
  panelDensity: 'compact' | 'standard' | 'detailed';
  
  // 筛选
  selectedEpisode: number | 'all';
  searchQuery: string;
  
  // 剪贴板
  clipboard: {
    type: 'panel' | 'scene' | null;
    data: any[];
  };
  
  // Actions
  selectPanel: (id: string, multi?: boolean) => void;
  selectPanels: (ids: string[]) => void;
  clearPanelSelection: () => void;
  selectScene: (id: string, multi?: boolean) => void;
  selectScenes: (ids: string[]) => void;
  clearSceneSelection: () => void;
  setViewMode: (mode: 'list' | 'grid' | 'timeline') => void;
  setPanelDensity: (density: 'compact' | 'standard' | 'detailed') => void;
  setSelectedEpisode: (episode: number | 'all') => void;
  setSearchQuery: (query: string) => void;
  copyToClipboard: (type: 'panel' | 'scene', data: any[]) => void;
  clearClipboard: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      selectedPanelIds: [],
      selectedSceneIds: [],
      viewMode: 'grid',
      panelDensity: 'standard',
      selectedEpisode: 'all',
      searchQuery: '',
      clipboard: { type: null, data: [] },

      selectPanel: (id, multi = false) =>
        set((state) => ({
          selectedPanelIds: multi
            ? state.selectedPanelIds.includes(id)
              ? state.selectedPanelIds.filter((i) => i !== id)
              : [...state.selectedPanelIds, id]
            : [id],
        })),

      selectPanels: (ids) =>
        set({ selectedPanelIds: ids }),

      clearPanelSelection: () =>
        set({ selectedPanelIds: [] }),

      selectScene: (id, multi = false) =>
        set((state) => ({
          selectedSceneIds: multi
            ? state.selectedSceneIds.includes(id)
              ? state.selectedSceneIds.filter((i) => i !== id)
              : [...state.selectedSceneIds, id]
            : [id],
        })),

      selectScenes: (ids) =>
        set({ selectedSceneIds: ids }),

      clearSceneSelection: () =>
        set({ selectedSceneIds: [] }),

      setViewMode: (mode) =>
        set({ viewMode: mode }),

      setPanelDensity: (density) =>
        set({ panelDensity: density }),

      setSelectedEpisode: (episode) =>
        set({ selectedEpisode: episode }),

      setSearchQuery: (query) =>
        set({ searchQuery: query }),

      copyToClipboard: (type, data) =>
        set({ clipboard: { type, data } }),

      clearClipboard: () =>
        set({ clipboard: { type: null, data: [] } }),
    }),
    {
      name: 'editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
        panelDensity: state.panelDensity,
      }),
    }
  )
);

// ============ AI 生成状态 ============
// 注意：AI生成状态已移至各页面内部管理，不再使用全局store

// ============ 便捷 Hooks ============

/**
 * 获取当前主题
 */
export function useTheme() {
  const { theme, setTheme } = useUIStore();
  return { theme, setTheme };
}

/**
 * 获取侧边栏状态
 */
export function useSidebar() {
  const { sidebarCollapsed, sidebarOpen, toggleSidebar, setSidebarCollapsed, setSidebarOpen } =
    useUIStore();
  return { 
    collapsed: sidebarCollapsed, 
    open: sidebarOpen, 
    toggle: toggleSidebar, 
    setCollapsed: setSidebarCollapsed, 
    setOpen: setSidebarOpen 
  };
}

/**
 * 获取全局加载状态
 */
export function useGlobalLoading() {
  const { isLoading, loadingMessage, setLoading } = useUIStore();
  return { isLoading, message: loadingMessage, setLoading };
}

/**
 * 获取 AI 生成进度
 * 注意：此Hook已废弃，AI生成状态由各页面内部管理
 */

/**
 * 获取当前项目（简化版）
 */
export function useCurrentProject() {
  const { currentProject, isLoading, error, loadProject, updateProject, clearProject } = useProjectStore();
  return { 
    project: currentProject, 
    isLoading, 
    error, 
    load: loadProject, 
    update: updateProject,
    clear: clearProject 
  };
}

/**
 * 获取 API 配置
 */
export function useAPIConfig() {
  const { apiSettings, setApiSettings } = useConfigStore();
  return {
    settings: apiSettings,
    setSettings: setApiSettings,
    isConfigured: !!apiSettings.volcApiKey,
  };
}
