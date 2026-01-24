/**
 * 测试工具函数
 * 提供常用的测试辅助函数
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * 创建测试用的QueryClient
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * 自定义渲染函数，包含常用的Provider
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // 设置初始路由
  window.location.hash = initialRoute;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <HashRouter>{children}</HashRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * 等待异步操作完成
 */
export const waitFor = async (callback: () => void, timeout = 3000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error('Timeout waiting for condition');
};

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
}

/**
 * Mock fetch响应
 */
export function mockFetchResponse(data: any, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
  } as Response);
}

/**
 * 创建Mock项目数据
 */
export function createMockProject(overrides = {}) {
  return {
    id: 'test-project-1',
    title: '测试项目',
    description: '这是一个测试项目',
    coverImage: '/test-cover.jpg',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    chapters: [],
    directorStyle: {
      visualStyle: '现代简约',
      pacing: '中等',
      mood: '轻松愉快',
    },
    ...overrides,
  };
}

/**
 * 创建Mock章节数据
 */
export function createMockChapter(overrides = {}) {
  return {
    id: 'test-chapter-1',
    projectId: 'test-project-1',
    title: '第一章',
    content: '这是第一章的内容',
    order: 1,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    ...overrides,
  };
}

/**
 * 创建Mock场景数据
 */
export function createMockScene(overrides = {}) {
  return {
    id: 'test-scene-1',
    chapterId: 'test-chapter-1',
    sceneNumber: 1,
    location: '室内-客厅',
    timeOfDay: '白天',
    characters: ['角色A', '角色B'],
    description: '场景描述',
    dialogue: '对话内容',
    action: '动作描述',
    ...overrides,
  };
}

/**
 * 创建Mock分镜数据
 */
export function createMockShot(overrides = {}) {
  return {
    id: 'test-shot-1',
    sceneId: 'test-scene-1',
    shotNumber: 1,
    shotType: '中景',
    cameraAngle: '平视',
    cameraMovement: '固定',
    duration: 5,
    description: '分镜描述',
    imageUrl: '/test-shot.jpg',
    ...overrides,
  };
}

/**
 * 延迟函数
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 触发文件上传
 */
export function createMockFile(
  name = 'test.jpg',
  size = 1024,
  type = 'image/jpeg'
): File {
  const blob = new Blob(['test'], { type });
  return new File([blob], name, { type });
}

/**
 * Mock console方法
 */
export function mockConsole() {
  const originalConsole = { ...console };
  
  return {
    mock: () => {
      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();
      console.info = vi.fn();
    },
    restore: () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
    },
  };
}

// 导入vi用于mock
import { vi } from 'vitest';

// 重新导出testing-library的所有工具
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
