/**
 * Sentry使用示例
 * 展示如何在应用中使用Sentry进行错误监控和性能追踪
 */

import * as Sentry from '@sentry/react';
import {
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  setTag,
  setContext,
  startTransaction,
} from '../lib/sentry';

// ============================================
// 1. 捕获错误
// ============================================

/**
 * 示例：在try-catch中捕获错误
 */
async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // 捕获错误并上报到Sentry
    captureError(error as Error, {
      userId,
      endpoint: `/api/users/${userId}`,
      action: 'fetchUserData',
    });
    throw error;
  }
}

/**
 * 示例：捕获自定义错误
 */
function validateInput(input: string) {
  if (!input || input.length < 3) {
    const error = new Error('Input validation failed');
    captureError(error, {
      input,
      minLength: 3,
      actualLength: input?.length || 0,
    });
    throw error;
  }
}

// ============================================
// 2. 捕获消息
// ============================================

/**
 * 示例：记录重要事件
 */
function onUserLogin(username: string) {
  captureMessage(`User logged in: ${username}`, 'info');
}

/**
 * 示例：记录警告
 */
function onApiRateLimitWarning(remaining: number) {
  if (remaining < 10) {
    captureMessage(`API rate limit warning: ${remaining} requests remaining`, 'warning');
  }
}

// ============================================
// 3. 设置用户信息
// ============================================

/**
 * 示例：用户登录时设置用户信息
 */
function handleUserLogin(user: { id: string; email: string; username: string }) {
  setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
  
  // 设置额外的用户标签
  setTag('user_type', 'premium');
  setTag('user_region', 'cn');
}

/**
 * 示例：用户登出时清除用户信息
 */
function handleUserLogout() {
  clearUser();
}

// ============================================
// 4. 添加面包屑
// ============================================

/**
 * 示例：记录用户操作
 */
function onButtonClick(buttonName: string) {
  addBreadcrumb({
    category: 'ui.click',
    message: `User clicked ${buttonName}`,
    level: 'info',
    data: {
      buttonName,
      timestamp: Date.now(),
    },
  });
}

/**
 * 示例：记录导航
 */
function onNavigate(from: string, to: string) {
  addBreadcrumb({
    category: 'navigation',
    message: `Navigated from ${from} to ${to}`,
    level: 'info',
    data: { from, to },
  });
}

/**
 * 示例：记录API请求
 */
function onApiRequest(endpoint: string, method: string) {
  addBreadcrumb({
    category: 'http',
    message: `${method} ${endpoint}`,
    level: 'info',
    data: {
      endpoint,
      method,
      timestamp: Date.now(),
    },
  });
}

// ============================================
// 5. 设置标签和上下文
// ============================================

/**
 * 示例：设置项目相关标签
 */
function setProjectContext(projectId: string, projectName: string) {
  setTag('project_id', projectId);
  setContext('project', {
    id: projectId,
    name: projectName,
    createdAt: new Date().toISOString(),
  });
}

/**
 * 示例：设置设备信息
 */
function setDeviceContext() {
  setContext('device', {
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    userAgent: navigator.userAgent,
    language: navigator.language,
  });
}

// ============================================
// 6. 性能监控
// ============================================

/**
 * 示例：监控API请求性能
 */
async function monitoredApiRequest(endpoint: string) {
  return await Sentry.startSpan(
    {
      name: 'api.request',
      op: 'http',
      attributes: { endpoint },
    },
    async () => {
      try {
        const response = await fetch(endpoint);
        return await response.json();
      } catch (error) {
        captureError(error as Error, { endpoint });
        throw error;
      }
    }
  );
}

/**
 * 示例：监控组件渲染性能
 */
function monitorComponentRender(componentName: string, callback: () => void) {
  return Sentry.startSpan(
    {
      name: `render.${componentName}`,
      op: 'render',
    },
    () => {
      try {
        callback();
      } catch (error) {
        captureError(error as Error, { componentName });
        throw error;
      }
    }
  );
}

/**
 * 示例：监控数据处理性能
 */
async function monitorDataProcessing<T>(
  name: string,
  processor: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name: `process.${name}`,
      op: 'task',
    },
    async () => {
      try {
        return await processor();
      } catch (error) {
        captureError(error as Error, { taskName: name });
        throw error;
      }
    }
  );
}

// ============================================
// 7. React组件中使用
// ============================================

/**
 * 示例：在React组件中使用
 */
import { useEffect } from 'react';

function ExampleComponent() {
  useEffect(() => {
    // 记录组件挂载
    addBreadcrumb({
      category: 'ui.lifecycle',
      message: 'ExampleComponent mounted',
      level: 'info',
    });

    return () => {
      // 记录组件卸载
      addBreadcrumb({
        category: 'ui.lifecycle',
        message: 'ExampleComponent unmounted',
        level: 'info',
      });
    };
  }, []);

  const handleClick = async () => {
    try {
      // 记录用户操作
      addBreadcrumb({
        category: 'ui.click',
        message: 'Button clicked',
        level: 'info',
      });

      // 执行操作
      await someAsyncOperation();
    } catch (error) {
      // 捕获错误
      captureError(error as Error, {
        component: 'ExampleComponent',
        action: 'handleClick',
      });
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}

// ============================================
// 8. 最佳实践
// ============================================

/**
 * 最佳实践1：为关键操作添加面包屑
 */
function criticalOperation() {
  addBreadcrumb({
    category: 'operation',
    message: 'Starting critical operation',
    level: 'info',
  });

  try {
    // 执行操作
    performOperation();
    
    addBreadcrumb({
      category: 'operation',
      message: 'Critical operation completed',
      level: 'info',
    });
  } catch (error) {
    addBreadcrumb({
      category: 'operation',
      message: 'Critical operation failed',
      level: 'error',
    });
    captureError(error as Error);
    throw error;
  }
}

/**
 * 最佳实践2：为错误添加丰富的上下文
 */
async function processUserData(userId: string, data: any) {
  try {
    // 设置上下文
    setContext('operation', {
      type: 'processUserData',
      userId,
      dataSize: JSON.stringify(data).length,
      timestamp: Date.now(),
    });

    // 执行处理
    await process(data);
  } catch (error) {
    // 捕获错误时会自动包含上下文
    captureError(error as Error, {
      userId,
      dataKeys: Object.keys(data),
    });
    throw error;
  }
}

/**
 * 最佳实践3：使用性能监控优化关键路径
 */
async function optimizedDataLoad() {
  return await Sentry.startSpan(
    {
      name: 'data.load',
      op: 'task',
    },
    async (span) => {
      // 子操作1
      const userData = await Sentry.startSpan(
        {
          name: 'Fetch user data',
          op: 'db.query',
        },
        async () => await fetchUserData('123')
      );
      
      // 子操作2
      const processed = await Sentry.startSpan(
        {
          name: 'Process user data',
          op: 'process',
        },
        () => processData(userData)
      );
      
      return processed;
    }
  );
}

// 导出示例函数供参考
export {
  fetchUserData,
  validateInput,
  onUserLogin,
  handleUserLogin,
  handleUserLogout,
  onButtonClick,
  onNavigate,
  setProjectContext,
  monitoredApiRequest,
  monitorComponentRender,
  ExampleComponent,
};

// 辅助函数（示例用）
function someAsyncOperation() {
  return Promise.resolve();
}

function performOperation() {
  // 示例操作
}

function process(data: any) {
  return Promise.resolve(data);
}

function processData(data: any) {
  return data;
}
