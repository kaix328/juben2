# 🚀 项目改进路线图

**创建日期**: 2026-01-19  
**项目名称**: AI漫剧全流程网站  
**当前版本**: 0.0.1  
**目标版本**: 1.0.0

---

## 📋 改进任务清单

### 🔴 第一阶段：核心质量提升（1-2周）

#### 1. 测试覆盖率提升 ⭐⭐⭐⭐⭐
**优先级**: 最高  
**预计时间**: 5-7天  
**目标**: 测试覆盖率从 30% 提升到 70%+

**任务列表**:
- [ ] 为 StoryboardEditor 添加完整测试（50+ 测试用例）
- [ ] 为 ScriptEditor 添加完整测试（40+ 测试用例）
- [ ] 为 ChapterEditor 添加完整测试（30+ 测试用例）
- [ ] 为 AssetLibrary 添加完整测试（30+ 测试用例）
- [ ] 为所有自定义 Hooks 添加测试
- [ ] 添加集成测试（用户流程测试）
- [ ] 配置测试覆盖率报告

**实施步骤**:
```bash
# 1. 创建测试文件
touch src/__tests__/pages/StoryboardEditor.spec.tsx
touch src/__tests__/pages/ScriptEditor.spec.tsx
touch src/__tests__/pages/ChapterEditor.spec.tsx

# 2. 编写测试用例
# 参考现有测试文件的模式

# 3. 运行测试并查看覆盖率
npm run test:coverage

# 4. 修复失败的测试
npm test -- --watch
```

**验收标准**:
- ✅ 测试覆盖率 > 70%
- ✅ 所有测试通过
- ✅ 关键用户流程有集成测试

---

#### 2. 安全性加固 ⭐⭐⭐⭐⭐
**优先级**: 最高  
**预计时间**: 3-4天  
**目标**: 提升应用安全性，保护用户数据

**任务列表**:
- [ ] 改进 API Key 存储（使用加密）
- [ ] 添加输入验证（所有表单）
- [ ] 添加 CSP 头
- [ ] 实现 API 请求签名
- [ ] 添加 XSS 防护
- [ ] 添加 CSRF 防护
- [ ] 安全审计

**实施步骤**:

**2.1 加密 API Key 存储**
```typescript
// src/app/utils/secureStorage.ts
import { AES, enc } from 'crypto-js';

const ENCRYPTION_KEY = 'your-secret-key'; // 从环境变量获取

export const secureStorage = {
  setItem(key: string, value: string) {
    const encrypted = AES.encrypt(value, ENCRYPTION_KEY).toString();
    localStorage.setItem(key, encrypted);
  },
  
  getItem(key: string): string | null {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    try {
      const decrypted = AES.decrypt(encrypted, ENCRYPTION_KEY);
      return decrypted.toString(enc.Utf8);
    } catch {
      return null;
    }
  },
};
```

**2.2 添加输入验证**
```typescript
// src/app/utils/validation.ts
import { z } from 'zod';

export const panelSchema = z.object({
  shotNumber: z.number().int().positive(),
  description: z.string().min(1).max(500),
  dialogue: z.string().max(200).optional(),
  shotType: z.enum(['wide', 'medium', 'closeup', 'extreme-closeup']),
  cameraAngle: z.enum(['eye-level', 'high', 'low', 'overhead', 'dutch']),
});

export function validatePanel(data: unknown) {
  return panelSchema.safeParse(data);
}
```

**2.3 添加 CSP 头**
```html
<!-- public/index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self' data:;
        connect-src 'self' https://ark.cn-beijing.volces.com https://api.openai.com;
      ">
```

**验收标准**:
- ✅ API Key 加密存储
- ✅ 所有表单有输入验证
- ✅ CSP 头配置正确
- ✅ 通过安全审计工具检查

---

#### 3. 性能监控集成 ⭐⭐⭐⭐
**优先级**: 高  
**预计时间**: 2-3天  
**目标**: 实时监控应用性能和用户行为

**任务列表**:
- [ ] 集成 Web Vitals
- [ ] 添加自定义性能指标
- [ ] 集成用户行为分析
- [ ] 创建性能监控面板
- [ ] 设置性能告警

**实施步骤**:

**3.1 集成 Web Vitals**
```typescript
// src/app/utils/analytics.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // 发送到分析服务（如 Google Analytics）
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
  
  // 也可以发送到 Sentry
  if (window.Sentry) {
    window.Sentry.captureMessage(`Performance: ${metric.name}`, {
      level: 'info',
      extra: metric,
    });
  }
}

export function initPerformanceMonitoring() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

**3.2 添加自定义指标**
```typescript
// src/app/utils/customMetrics.ts
export const metrics = {
  trackStoryboardGeneration(duration: number, panelCount: number) {
    analytics.track('storyboard_generated', {
      duration,
      panelCount,
      avgTimePerPanel: duration / panelCount,
    });
  },
  
  trackAICall(provider: string, duration: number, tokens: number) {
    analytics.track('ai_call', {
      provider,
      duration,
      tokens,
      cost: calculateCost(provider, tokens),
    });
  },
  
  trackError(error: Error, context: string) {
    analytics.track('error_occurred', {
      message: error.message,
      context,
      stack: error.stack,
    });
  },
};
```

**验收标准**:
- ✅ Web Vitals 数据正常上报
- ✅ 自定义指标正常追踪
- ✅ 性能监控面板可用
- ✅ 性能告警配置完成

---

### 🟡 第二阶段：用户体验优化（2-3周）

#### 4. 可访问性改进 ⭐⭐⭐⭐
**优先级**: 中高  
**预计时间**: 4-5天  
**目标**: 符合 WCAG 2.1 AA 标准

**任务列表**:
- [ ] 为所有交互元素添加 ARIA 标签
- [ ] 完善键盘导航
- [ ] 检查并修复颜色对比度
- [ ] 添加屏幕阅读器支持
- [ ] 添加焦点管理
- [ ] 使用 axe-core 进行自动化测试

**实施步骤**:

**4.1 添加 ARIA 标签**
```typescript
// 修改前
<button onClick={handleGenerate}>
  生成分镜
</button>

// 修改后
<button
  onClick={handleGenerate}
  aria-label="生成分镜"
  aria-busy={isGenerating}
  aria-disabled={disabled}
  aria-describedby="generate-help"
>
  生成分镜
</button>
<span id="generate-help" className="sr-only">
  根据剧本内容自动生成分镜脚本
</span>
```

**4.2 完善键盘导航**
```typescript
// src/app/hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation(items: any[]) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((i) => Math.min(i + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // 触发选中项的操作
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);
  
  return { focusedIndex, setFocusedIndex };
}
```

**4.3 颜色对比度检查**
```bash
# 安装工具
npm install --save-dev axe-core @axe-core/react

# 在开发环境中启用
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

**验收标准**:
- ✅ 所有交互元素有 ARIA 标签
- ✅ 完整的键盘导航支持
- ✅ 颜色对比度 > 4.5:1
- ✅ 通过 axe-core 自动化测试

---

#### 5. 代码重构与优化 ⭐⭐⭐
**优先级**: 中  
**预计时间**: 5-6天  
**目标**: 减少代码重复，提高可维护性

**任务列表**:
- [ ] 提取通用组件（BaseView）
- [ ] 创建自定义 Hooks（useAICall）
- [ ] 重构相似代码
- [ ] 优化大型组件
- [ ] 统一错误处理模式
- [ ] 统一数据获取模式

**实施步骤**:

**5.1 提取通用组件**
```typescript
// src/app/components/BaseView.tsx
interface BaseViewProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  layout: 'grid' | 'list';
  loading?: boolean;
  empty?: React.ReactNode;
}

export function BaseView<T>({ 
  items, 
  renderItem, 
  layout,
  loading,
  empty 
}: BaseViewProps<T>) {
  if (loading) return <LoadingSkeleton />;
  if (items.length === 0) return empty || <EmptyState />;
  
  return (
    <div className={cn(
      layout === 'grid' && 'grid grid-cols-3 gap-4',
      layout === 'list' && 'flex flex-col gap-2'
    )}>
      {items.map(renderItem)}
    </div>
  );
}

// 使用
<BaseView
  items={panels}
  renderItem={(panel) => <ShotCard key={panel.id} panel={panel} />}
  layout="grid"
/>
```

**5.2 创建 AI 调用 Hook**
```typescript
// src/app/hooks/useAICall.ts
export function useAICall<T>(
  provider: AIProvider,
  params: AIParams,
  options?: UseQueryOptions<T>
) {
  return useQuery({
    queryKey: ['ai', provider, params],
    queryFn: async () => {
      const result = await aiService.call(provider, params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as T;
    },
    ...options,
  });
}

// 使用
const { data, isLoading, error } = useAICall(
  'volcengine',
  { prompt: '生成分镜' }
);
```

**5.3 优化大型组件**
```typescript
// 将 StoryboardEditor (150+ 行) 拆分为多个子组件
// src/app/pages/StoryboardEditor/index.tsx
export function StoryboardEditor() {
  return (
    <StoryboardProvider>
      <StoryboardHeader />
      <StoryboardToolbar />
      <StoryboardContent />
      <StoryboardSidebar />
    </StoryboardProvider>
  );
}
```

**验收标准**:
- ✅ 代码重复率 < 5%
- ✅ 单个组件 < 200 行
- ✅ 单个函数 < 50 行
- ✅ 通过 ESLint 检查

---

#### 6. 移动端优化 ⭐⭐⭐
**优先级**: 中  
**预计时间**: 4-5天  
**目标**: 提升移动端用户体验

**任务列表**:
- [ ] 优化响应式布局
- [ ] 添加触摸手势支持
- [ ] 优化移动端性能
- [ ] 添加 PWA 支持
- [ ] 优化移动端导航
- [ ] 测试各种设备

**实施步骤**:

**6.1 优化响应式布局**
```css
/* src/styles/mobile.css */
@media (max-width: 768px) {
  /* 单列布局 */
  .storyboard-grid {
    grid-template-columns: 1fr !important;
  }
  
  /* 隐藏侧边栏 */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s;
    z-index: 1000;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  /* 底部导航 */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    padding: 1rem;
    background: white;
    border-top: 1px solid #e5e7eb;
  }
}
```

**6.2 添加触摸手势**
```typescript
// src/app/hooks/useSwipeGesture.ts
import { useGesture } from '@use-gesture/react';

export function useSwipeGesture(onSwipe: (direction: 'left' | 'right') => void) {
  return useGesture({
    onSwipe: ({ direction: [dx] }) => {
      if (Math.abs(dx) > 0.5) {
        onSwipe(dx > 0 ? 'right' : 'left');
      }
    },
  });
}

// 使用
const bind = useSwipeGesture((direction) => {
  if (direction === 'right') openSidebar();
  else closeSidebar();
});

<div {...bind()}>内容</div>
```

**6.3 添加 PWA 支持**
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AI漫剧创作平台',
        short_name: '漫剧创作',
        description: 'AI驱动的漫剧创作全流程平台',
        theme_color: '#8b5cf6',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
```

**验收标准**:
- ✅ 在移动设备上流畅运行
- ✅ 触摸手势正常工作
- ✅ PWA 可以安装到主屏幕
- ✅ 离线功能正常

---

### 🟢 第三阶段：功能增强（3-4周）

#### 7. 国际化支持 ⭐⭐⭐
**优先级**: 中低  
**预计时间**: 5-7天  
**目标**: 支持中英文切换

**任务列表**:
- [ ] 集成 i18next
- [ ] 提取所有文本
- [ ] 创建翻译文件
- [ ] 添加语言切换器
- [ ] 测试翻译完整性

**实施步骤**:

**7.1 集成 i18next**
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

```typescript
// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhTranslations from './locales/zh.json';
import enTranslations from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zhTranslations },
      en: { translation: enTranslations },
    },
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

**7.2 创建翻译文件**
```json
// src/lib/locales/zh.json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑"
  },
  "storyboard": {
    "title": "分镜编辑器",
    "generate": "生成分镜",
    "export": "导出"
  }
}

// src/lib/locales/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "storyboard": {
    "title": "Storyboard Editor",
    "generate": "Generate",
    "export": "Export"
  }
}
```

**7.3 使用翻译**
```typescript
import { useTranslation } from 'react-i18next';

export function StoryboardHeader() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('storyboard.title')}</h1>
      <button>{t('storyboard.generate')}</button>
    </div>
  );
}
```

**验收标准**:
- ✅ 所有文本已提取
- ✅ 中英文翻译完整
- ✅ 语言切换正常
- ✅ 翻译质量良好

---

#### 8. E2E 测试 ⭐⭐⭐
**优先级**: 中低  
**预计时间**: 4-5天  
**目标**: 覆盖关键用户流程

**任务列表**:
- [ ] 集成 Playwright
- [ ] 编写关键流程测试
- [ ] 配置 CI/CD 集成
- [ ] 创建测试报告

**实施步骤**:

**8.1 集成 Playwright**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

**8.2 编写测试**
```typescript
// e2e/storyboard-generation.spec.ts
import { test, expect } from '@playwright/test';

test('完整的分镜生成流程', async ({ page }) => {
  // 1. 访问首页
  await page.goto('/');
  
  // 2. 创建新项目
  await page.click('text=新建项目');
  await page.fill('[name="title"]', '测试项目');
  await page.click('text=创建');
  
  // 3. 进入分镜编辑器
  await page.click('text=分镜编辑');
  
  // 4. 生成分镜
  await page.click('text=生成分镜');
  await page.waitForSelector('.panel-card', { timeout: 30000 });
  
  // 5. 验证结果
  const panels = await page.$$('.panel-card');
  expect(panels.length).toBeGreaterThan(0);
  
  // 6. 导出
  await page.click('text=导出');
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('.md');
});
```

**验收标准**:
- ✅ 关键流程有 E2E 测试
- ✅ 所有测试通过
- ✅ CI/CD 集成完成
- ✅ 测试报告可用

---

#### 9. 高级功能 ⭐⭐
**优先级**: 低  
**预计时间**: 10-15天  
**目标**: 增强 AI 能力和用户体验

**任务列表**:
- [ ] AI 模型微调
- [ ] 模板库扩展
- [ ] 智能推荐系统
- [ ] 实时协作功能
- [ ] 插件系统
- [ ] 高级导出功能

**实施步骤**:（详细规划待定）

---

## 📊 进度追踪

### 第一阶段（1-2周）
- [ ] 测试覆盖率提升（5-7天）
- [ ] 安全性加固（3-4天）
- [ ] 性能监控集成（2-3天）

### 第二阶段（2-3周）
- [ ] 可访问性改进（4-5天）
- [ ] 代码重构与优化（5-6天）
- [ ] 移动端优化（4-5天）

### 第三阶段（3-4周）
- [ ] 国际化支持（5-7天）
- [ ] E2E 测试（4-5天）
- [ ] 高级功能（10-15天）

---

## 🎯 里程碑

### v0.5.0 - 质量提升版（2周后）
- ✅ 测试覆盖率 > 70%
- ✅ 安全性加固完成
- ✅ 性能监控上线

### v0.8.0 - 体验优化版（5周后）
- ✅ 可访问性达标
- ✅ 代码重构完成
- ✅ 移动端优化完成

### v1.0.0 - 正式发布版（8周后）
- ✅ 国际化支持
- ✅ E2E 测试完整
- ✅ 所有核心功能完善

---

## 📝 注意事项

1. **优先级调整**: 根据实际情况可以调整任务优先级
2. **时间估算**: 时间估算仅供参考，实际可能有偏差
3. **持续集成**: 每完成一个任务都要合并到主分支
4. **文档更新**: 每个改进都要更新相关文档
5. **向后兼容**: 确保改进不破坏现有功能

---

**创建时间**: 2026-01-19  
**最后更新**: 2026-01-19  
**负责人**: 开发团队
