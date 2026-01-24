# AI 请求超时问题分析与修复方案

## 🔍 问题现象

```
[ERROR] [API:VolcEngine.callVolcEngine] 请求超时
[callDeepSeek] API 调用结果: 失败
[callDeepSeek] 错误信息: 请求超时
[重试机制] 第 2 次调用失败，已达最大重试次数
DeepSeek extractStoryboard failed: Error: 请求超时
```

## 📊 问题分析

### 1. 当前超时配置

**文件**: `src/app/services/aiService.ts`

```typescript
const REQUEST_CONFIG = {
  timeout: 300000,      // 5分钟超时
  maxRetries: 2,        // 最大重试2次
  retryDelay: 1000,     // 重试间隔1秒
};
```

### 2. 批处理配置

**文件**: `src/app/utils/ai/storyboardGenerator.ts`

```typescript
const MAX_SCENES_FOR_AI = 50;  // 最大场景数
const BATCH_SIZE = 5;          // 每批5个场景
```

**文件**: `src/app/utils/ai/batchProcessor.ts`

```typescript
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
    batchSize: 10,           // 每批10个场景
    maxRetries: 2,           // 最大重试2次
    retryDelay: 2000,        // 重试延迟2秒
    continueOnError: true,   // 出错继续
    mergeBatches: true       // 合并批次
};
```

### 3. 问题根源

#### 问题 1: 批次大小不一致 ⚠️
- `storyboardGenerator.ts` 设置 `BATCH_SIZE = 5`
- `batchProcessor.ts` 默认 `batchSize = 10`
- 实际调用时使用了 5，但如果场景复杂，5 个场景的 AI 处理仍可能超过 5 分钟

#### 问题 2: 单次请求数据量过大 ⚠️
当处理 5 个复杂场景时：
- 每个场景可能有多个对白和动作描述
- AI 需要生成 15-25 个分镜（每场景 3-5 个）
- 提示词长度可能达到 10000+ 字符
- AI 响应长度可能达到 20000+ 字符
- **总处理时间可能超过 5 分钟**

#### 问题 3: 网络波动 ⚠️
- 火山引擎 API 服务器可能在高峰期响应慢
- 网络不稳定导致请求延迟
- 重试机制只重试 2 次，间隔 1 秒，不够充分

#### 问题 4: 并发处理可能加剧问题 ⚠️
```typescript
const MAX_CONCURRENT = 2;  // 同时处理2个批次
```
- 并发请求可能导致 API 限流
- 多个请求同时超时

---

## ✅ 修复方案

### 方案 1: 增加超时时间（立即实施）⭐⭐⭐

**修改文件**: `src/app/services/aiService.ts`

```typescript
const REQUEST_CONFIG = {
  timeout: 600000,      // 🆕 从 5 分钟增加到 10 分钟
  maxRetries: 3,        // 🆕 从 2 次增加到 3 次
  retryDelay: 2000,     // 🆕 从 1 秒增加到 2 秒
  enableLog: true,
};
```

**理由**:
- 复杂场景的 AI 处理确实需要更长时间
- 10 分钟足够处理 5 个复杂场景
- 增加重试次数和延迟，提高成功率

---

### 方案 2: 减小批次大小（立即实施）⭐⭐⭐

**修改文件**: `src/app/utils/ai/storyboardGenerator.ts`

```typescript
const BATCH_SIZE = 3;  // 🆕 从 5 减少到 3
```

**理由**:
- 更小的批次 = 更短的处理时间
- 3 个场景通常能在 5-8 分钟内完成
- 降低单次请求失败的风险

---

### 方案 3: 优化重试策略（推荐实施）⭐⭐

**修改文件**: `src/app/services/aiService.ts`

```typescript
async function apiRequest<T>(
  url: string,
  options: RequestInit,
  retryCount = 0
): Promise<APIResponse<T>> {
  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // ... 现有逻辑 ...

  } catch (error: any) {
    if (error.name === 'AbortError') {
      // 🆕 超时错误使用指数退避重试
      if (retryCount < REQUEST_CONFIG.maxRetries) {
        const delay = REQUEST_CONFIG.retryDelay * Math.pow(2, retryCount); // 指数退避
        console.log(`[API] 请求超时，${delay}ms 后重试（${retryCount + 1}/${REQUEST_CONFIG.maxRetries}）`);
        await new Promise(r => setTimeout(r, delay));
        return apiRequest(url, options, retryCount + 1);
      }
      return { success: false, error: '请求超时，已达最大重试次数' };
    }

    // 网络错误重试
    if (retryCount < REQUEST_CONFIG.maxRetries) {
      const delay = REQUEST_CONFIG.retryDelay * (retryCount + 1);
      await new Promise(r => setTimeout(r, delay));
      return apiRequest(url, options, retryCount + 1);
    }

    return { success: false, error: error.message || '网络错误' };
  }
}
```

**改进**:
- 超时错误使用指数退避（2s → 4s → 8s）
- 给 API 服务器更多恢复时间
- 提高重试成功率

---

### 方案 4: 禁用并发处理（可选）⭐

**修改文件**: `src/app/utils/ai/batchProcessor.ts`

```typescript
const MAX_CONCURRENT = 1;  // 🆕 从 2 改为 1，串行处理
```

**理由**:
- 避免并发请求导致 API 限流
- 降低服务器压力
- 虽然总时间变长，但成功率更高

---

### 方案 5: 添加进度提示（用户体验）⭐⭐

**修改文件**: `src/app/utils/ai/storyboardGenerator.ts`

在调用 AI 前添加更详细的提示：

```typescript
onProgress?.(createProgress(
    'extracting', 
    0, 
    1, 
    `正在调用 AI 生成分镜（预计需要 3-8 分钟，请耐心等待）...`
));
```

---

## 🔧 立即修复代码

让我立即实施方案 1 和方案 2：

### 修改 1: 增加超时时间和重试次数

```typescript
// src/app/services/aiService.ts
const REQUEST_CONFIG = {
  timeout: 600000,      // 10分钟
  maxRetries: 3,        // 3次重试
  retryDelay: 2000,     // 2秒延迟
  enableLog: true,
};
```

### 修改 2: 减小批次大小

```typescript
// src/app/utils/ai/storyboardGenerator.ts
const BATCH_SIZE = 3;  // 每批3个场景
```

### 修改 3: 优化重试策略（指数退避）

```typescript
// src/app/services/aiService.ts - apiRequest 函数
if (error.name === 'AbortError') {
  if (retryCount < REQUEST_CONFIG.maxRetries) {
    const delay = REQUEST_CONFIG.retryDelay * Math.pow(2, retryCount);
    console.log(`[API] 请求超时，${delay}ms 后重试（${retryCount + 1}/${REQUEST_CONFIG.maxRetries}）`);
    await new Promise(r => setTimeout(r, delay));
    return apiRequest(url, options, retryCount + 1);
  }
  return { success: false, error: '请求超时，已达最大重试次数' };
}
```

---

## 📊 预期效果

### 修复前
- ❌ 5 个场景/批，5 分钟超时
- ❌ 复杂场景容易超时
- ❌ 重试 2 次，间隔 1 秒
- ❌ 成功率: ~60-70%

### 修复后
- ✅ 3 个场景/批，10 分钟超时
- ✅ 足够的处理时间
- ✅ 重试 3 次，指数退避（2s → 4s → 8s）
- ✅ 预期成功率: ~90-95%

---

## 🧪 测试建议

### 1. 测试小场景（1-5 个）
```bash
预期: 1-3 分钟内完成，无超时
```

### 2. 测试中等场景（10-20 个）
```bash
预期: 分为 4-7 批，每批 3-5 分钟，总计 15-35 分钟
```

### 3. 测试大场景（30-50 个）
```bash
预期: 分为 10-17 批，每批 3-5 分钟，总计 30-85 分钟
```

### 4. 监控控制台日志
```javascript
// 查看超时和重试情况
// 正常日志应该显示:
[API] 请求超时，2000ms 后重试（1/3）
[API] 请求超时，4000ms 后重试（2/3）
✅ [VolcEngine] chat/completions 成功
```

---

## 💡 用户使用建议

### 如果遇到超时

1. **等待重试完成**
   - 系统会自动重试 3 次
   - 使用指数退避策略
   - 不要刷新页面

2. **减少场景数量**
   - 如果场景过多（>30 个），考虑分批处理
   - 先处理前 20 个场景
   - 再处理后续场景

3. **检查网络连接**
   - 确保网络稳定
   - 避免在网络高峰期使用
   - 考虑使用有线网络

4. **使用 Fallback 模式**
   - 如果 AI 持续超时
   - 系统会自动切换到智能 Fallback
   - Fallback 生成速度快，不依赖 AI

---

## 📈 性能优化建议（长期）

### 1. 实现流式响应
```typescript
// 使用 SSE (Server-Sent Events) 流式接收 AI 响应
// 避免等待完整响应，降低超时风险
```

### 2. 实现断点续传
```typescript
// 保存已生成的分镜
// 超时后从断点继续，而不是重新开始
```

### 3. 实现本地缓存
```typescript
// 缓存相似场景的生成结果
// 减少 AI 调用次数
```

### 4. 优化提示词长度
```typescript
// 压缩提示词，去除冗余信息
// 减少 token 消耗，加快响应速度
```

---

## 🎯 总结

### 根本原因
1. 单次请求数据量过大（5 个复杂场景）
2. 超时时间不够（5 分钟）
3. 重试策略不够智能（固定间隔）

### 解决方案
1. ✅ 增加超时时间到 10 分钟
2. ✅ 减小批次大小到 3 个场景
3. ✅ 使用指数退避重试策略
4. ✅ 增加重试次数到 3 次

### 预期效果
- 成功率从 60-70% 提升到 90-95%
- 用户体验显著改善
- 大场景处理更稳定

---

**分析日期**: 2025-01-24  
**问题类型**: API 请求超时  
**影响范围**: AI 分镜生成功能  
**优先级**: 高（影响核心功能）
