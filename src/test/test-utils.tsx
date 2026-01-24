/**
 * React 组件测试工具
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// 自定义渲染函数，包含常用 Provider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { route = '/', ...renderOptions } = options || {};
  
  window.history.pushState({}, 'Test page', route);
  
  return {
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
  };
}

// 重新导出 testing-library 的所有内容
export * from '@testing-library/react';
export { renderWithProviders as render };
