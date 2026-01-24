# Sentry 错误监控集成指南

## 📋 概述

本指南介绍如何在项目中集成 Sentry 进行错误监控和性能追踪。

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install @sentry/react @sentry/tracing
```

### 2. 配置环境变量

在 `.env.local` 中添加：

```env
# Sentry配置
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_SENTRY_ENVIRONMENT=development
VITE_ENABLE_ERROR_REPORTING=true
```

### 3. 初始化Sentry

创建 `src/lib/sentry.ts`:

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  // 只在配置了DSN且启用错误上报时初始化
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const enabled = import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true';
  
  if (!dsn || !enabled) {
    console.log('Sentry未启用');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    
    // 集成性能监控
    integrations: [
      new BrowserTracing({
        // 路由追踪
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],

    // 性能监控采样率（0.0 - 1.0）
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // 错误采样率
    sampleRate: 1.0,

    // 发布版本
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // 忽略的错误
    ignoreErrors: [
      // 浏览器扩展错误
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // 网络错误
      'NetworkError',
      'Network request failed',
      // 取消的请求
      'AbortError',
      'Request aborted',
    ],

    // 在发送前处理事件
    beforeSend(event, hint) {
      // 开发环境打印错误
      if (import.meta.env.MODE === 'development') {
        console.error('Sentry Event:', event);
        console.error('Original Error:', hint.originalException);
      }

      // 过滤敏感信息
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }

      return event;
    },
  });

  console.log('Sentry已初始化');
}

// 手动捕获错误
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// 手动捕获消息
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// 设置用户信息
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

// 清除用户信息
export function clearUser() {
  Sentry.setUser(null);
}

// 添加面包屑
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

// 设置标签
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

// 设置上下文
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}
```

### 4. 在App中初始化

修改 `src/app/App.tsx`:

```typescript
import { useEffect } from 'react';
import { initSentry } from '../lib/sentry';
import * as Sentry from "@sentry/react";

export default function App() {
  useEffect(() => {
    // 初始化Sentry
    initSentry();
  }, []);

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">应用程序出错了</h1>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={resetError}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg"
            >
              重试
            </button>
          </div>
        </div>
      )}
      showDialog
    >
      {/* 你的应用内容 */}
    </Sentry.ErrorBoundary>
  );
}
```

---

## 🔧 高级配置

### 性能监控

```typescript
import * as Sentry from "@sentry/react";

// 创建性能事务
const transaction = Sentry.startTransaction({
  name: "AI剧本生成",
  op: "ai.generation",
});

try {
  // 执行操作
  const result = await generateScript();
  
  // 标记成功
  transaction.setStatus('ok');
} catch (error) {
  // 标记失败
  transaction.setStatus('internal_error');
  Sentry.captureException(error);
} finally {
  // 结束事务
  transaction.finish();
}
```

### 自定义错误边界

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from "@sentry/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CustomErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 发送到Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // 添加面包屑
    Sentry.addBreadcrumb({
      category: 'error-boundary',
      message: 'Component error caught',
      level: 'error',
      data: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-bold">组件错误</h3>
          <p className="text-red-600">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API错误追踪

```typescript
// src/app/services/aiService.ts
import { captureError, addBreadcrumb } from '../../lib/sentry';

export async function callAIAPI(params: any) {
  // 添加面包屑
  addBreadcrumb({
    category: 'api',
    message: 'AI API调用开始',
    level: 'info',
    data: { params },
  });

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }

    const data = await response.json();
    
    // 成功面包屑
    addBreadcrumb({
      category: 'api',
      message: 'AI API调用成功',
      level: 'info',
    });

    return data;
  } catch (error) {
    // 捕获错误
    captureError(error as Error, {
      api: 'ai',
      params,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}
```

### 用户反馈

```typescript
import * as Sentry from "@sentry/react";

function FeedbackButton() {
  const handleFeedback = () => {
    const eventId = Sentry.captureMessage('用户反馈');
    
    Sentry.showReportDialog({
      eventId,
      title: '遇到问题了吗？',
      subtitle: '我们的团队会尽快处理',
      subtitle2: '如果您愿意，可以告诉我们发生了什么',
      labelName: '姓名',
      labelEmail: '邮箱',
      labelComments: '问题描述',
      labelClose: '关闭',
      labelSubmit: '提交',
      errorGeneric: '提交时发生错误，请稍后重试',
      errorFormEntry: '某些字段无效，请更正后重试',
      successMessage: '感谢您的反馈！',
    });
  };

  return (
    <button onClick={handleFeedback}>
      报告问题
    </button>
  );
}
```

---

## 📊 监控最佳实践

### 1. 设置用户上下文

```typescript
// 用户登录后
import { setUser, setTag } from '../lib/sentry';

function handleLogin(user: User) {
  setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  setTag('user_type', user.type);
  setTag('subscription', user.subscription);
}

// 用户登出后
import { clearUser } from '../lib/sentry';

function handleLogout() {
  clearUser();
}
```

### 2. 业务流程追踪

```typescript
import { addBreadcrumb, setContext } from '../lib/sentry';

// 剧本生成流程
async function generateScriptWorkflow(chapterId: string) {
  addBreadcrumb({
    category: 'workflow',
    message: '开始剧本生成',
    level: 'info',
    data: { chapterId },
  });

  try {
    // 步骤1: 加载章节
    addBreadcrumb({
      category: 'workflow',
      message: '加载章节数据',
      level: 'info',
    });
    const chapter = await loadChapter(chapterId);

    // 步骤2: AI提取
    addBreadcrumb({
      category: 'workflow',
      message: 'AI提取剧本',
      level: 'info',
    });
    const script = await extractScript(chapter);

    // 步骤3: 保存
    addBreadcrumb({
      category: 'workflow',
      message: '保存剧本',
      level: 'info',
    });
    await saveScript(script);

    // 设置成功上下文
    setContext('workflow', {
      status: 'success',
      duration: Date.now() - startTime,
      sceneCount: script.scenes.length,
    });

  } catch (error) {
    // 设置失败上下文
    setContext('workflow', {
      status: 'failed',
      error: error.message,
    });

    throw error;
  }
}
```

### 3. 性能监控

```typescript
import * as Sentry from "@sentry/react";

// 监控组件性能
export const ScriptEditor = Sentry.withProfiler(
  function ScriptEditor() {
    // 组件代码
  },
  { name: 'ScriptEditor' }
);

// 监控函数性能
async function expensiveOperation() {
  const span = Sentry.getCurrentHub()
    .getScope()
    ?.getTransaction()
    ?.startChild({
      op: 'expensive.operation',
      description: '复杂计算',
    });

  try {
    // 执行操作
    const result = await doSomething();
    span?.setStatus('ok');
    return result;
  } catch (error) {
    span?.setStatus('internal_error');
    throw error;
  } finally {
    span?.finish();
  }
}
```

---

## 🐳 Docker部署配置

### 构建时注入DSN

```dockerfile
# Dockerfile
ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
```

### docker-compose配置

```yaml
# docker-compose.yml
services:
  juben:
    build:
      args:
        - VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
    environment:
      - VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
      - VITE_SENTRY_ENVIRONMENT=production
      - VITE_ENABLE_ERROR_REPORTING=true
```

---

## 📈 Sentry仪表板配置

### 1. 创建项目

1. 访问 https://sentry.io/
2. 创建新项目，选择 React
3. 复制 DSN

### 2. 配置告警

- **错误率告警**: 错误率 > 5%
- **性能告警**: P95响应时间 > 3秒
- **用户影响告警**: 受影响用户 > 10人

### 3. 集成通知

- Slack通知
- 邮件通知
- Webhook通知

---

## 🔒 安全和隐私

### 数据脱敏

```typescript
Sentry.init({
  beforeSend(event) {
    // 移除敏感数据
    if (event.request?.data) {
      const data = event.request.data;
      if (typeof data === 'object') {
        delete data.password;
        delete data.apiKey;
        delete data.token;
      }
    }

    // 脱敏URL参数
    if (event.request?.url) {
      event.request.url = event.request.url.replace(
        /apiKey=[^&]*/g,
        'apiKey=***'
      );
    }

    return event;
  },
});
```

### GDPR合规

```typescript
// 用户同意后才启用
function enableErrorReporting() {
  localStorage.setItem('error-reporting-consent', 'true');
  initSentry();
}

// 用户拒绝
function disableErrorReporting() {
  localStorage.setItem('error-reporting-consent', 'false');
  Sentry.close();
}
```

---

## 📝 测试

### 测试Sentry集成

```typescript
// 测试错误捕获
function testSentry() {
  try {
    throw new Error('测试错误');
  } catch (error) {
    captureError(error as Error, {
      test: true,
      timestamp: new Date().toISOString(),
    });
  }
}

// 测试性能监控
async function testPerformance() {
  const transaction = Sentry.startTransaction({
    name: '测试事务',
    op: 'test',
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  transaction.finish();
}
```

---

## 📚 相关资源

- [Sentry官方文档](https://docs.sentry.io/platforms/javascript/guides/react/)
- [React错误边界](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [性能监控最佳实践](https://docs.sentry.io/product/performance/best-practices/)

---

**最后更新**: 2026-01-19  
**状态**: ✅ 文档完成，待实施
