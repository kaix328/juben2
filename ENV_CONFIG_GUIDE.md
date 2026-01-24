# 环境变量配置指南

## 📋 快速开始

### 1. 创建本地环境变量文件

```bash
# 复制示例文件
cp .env.example .env.local

# 编辑并填入你的API密钥
# Windows: notepad .env.local
# Mac/Linux: nano .env.local
```

### 2. 配置API密钥

在 `.env.local` 文件中填入你的API密钥：

```env
# DeepSeek API (推荐)
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 其他可选的AI提供商
VITE_VOLCENGINE_API_KEY=your_key_here
VITE_OPENAI_API_KEY=your_key_here
VITE_QIANWEN_API_KEY=your_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

---

## 🔧 环境变量说明

### 应用配置

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `VITE_BASE_PATH` | 应用基础路径 | `/` | `/`, `/juben/` |
| `NODE_ENV` | 运行环境 | `development` | `development`, `production` |

### AI API配置

#### DeepSeek (推荐)
```env
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
```
- 获取地址: https://platform.deepseek.com/
- 性价比高，适合大规模使用

#### 火山引擎 (VolcEngine)
```env
VITE_VOLCENGINE_API_KEY=your_key_here
VITE_VOLCENGINE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```
- 获取地址: https://console.volcengine.com/
- 国内访问速度快

#### OpenAI
```env
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```
- 获取地址: https://platform.openai.com/
- 模型质量高，价格较贵

#### 通义千问 (Qianwen)
```env
VITE_QIANWEN_API_KEY=your_key_here
VITE_QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1
```
- 获取地址: https://dashscope.aliyun.com/
- 阿里云服务，国内稳定

### 功能开关

```env
# 性能监控 (生产环境建议开启)
VITE_ENABLE_PERFORMANCE_MONITORING=false

# 错误上报 (需要配置Sentry)
VITE_ENABLE_ERROR_REPORTING=false

# React Query DevTools (开发环境)
VITE_ENABLE_REACT_QUERY_DEVTOOLS=true
```

### 错误监控 (可选)

```env
# Sentry配置
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
VITE_SENTRY_ENVIRONMENT=production
```
- 获取地址: https://sentry.io/
- 用于生产环境错误追踪

### 高级配置

```env
# API超时时间 (毫秒)
VITE_API_TIMEOUT=180000

# 最大重试次数
VITE_API_MAX_RETRIES=2

# 批量处理并发数
VITE_BATCH_CONCURRENT=2

# 图像生成默认尺寸
VITE_IMAGE_DEFAULT_WIDTH=1024
VITE_IMAGE_DEFAULT_HEIGHT=1024
```

---

## 🐳 Docker部署配置

### 方式1: 使用环境变量文件

创建 `.env.production` 文件：

```env
VITE_BASE_PATH=/
VITE_DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
VITE_VOLCENGINE_API_KEY=${VOLCENGINE_API_KEY}
```

在 `docker-compose.yml` 中引用：

```yaml
services:
  juben:
    env_file:
      - .env.production
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - VOLCENGINE_API_KEY=${VOLCENGINE_API_KEY}
```

### 方式2: 直接在docker-compose中配置

```yaml
services:
  juben:
    environment:
      - VITE_BASE_PATH=/
      - VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
      - VITE_VOLCENGINE_API_KEY=your_key_here
```

### 方式3: 使用Docker Secrets (推荐生产环境)

```yaml
services:
  juben:
    secrets:
      - deepseek_api_key
      - volcengine_api_key
    environment:
      - VITE_DEEPSEEK_API_KEY_FILE=/run/secrets/deepseek_api_key

secrets:
  deepseek_api_key:
    external: true
  volcengine_api_key:
    external: true
```

---

## 📝 .env.example 文件内容

创建 `.env.example` 文件（提交到Git）：

```env
# ============================================
# 环境变量配置示例
# ============================================
# 复制此文件为 .env.local 并填入实际值

# 应用配置
VITE_BASE_PATH=/
NODE_ENV=development

# AI API 配置
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com

VITE_VOLCENGINE_API_KEY=your_volcengine_api_key_here
VITE_VOLCENGINE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

VITE_QIANWEN_API_KEY=your_qianwen_api_key_here
VITE_QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1

# 功能开关
VITE_ENABLE_PERFORMANCE_MONITORING=false
VITE_ENABLE_ERROR_REPORTING=false
VITE_ENABLE_REACT_QUERY_DEVTOOLS=true

# 错误监控 (可选)
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development

# 高级配置
VITE_API_TIMEOUT=180000
VITE_API_MAX_RETRIES=2
VITE_BATCH_CONCURRENT=2
VITE_IMAGE_DEFAULT_WIDTH=1024
VITE_IMAGE_DEFAULT_HEIGHT=1024
```

---

## 🔒 安全最佳实践

### 1. 不要提交真实密钥到Git

```bash
# .gitignore 应包含:
.env.local
.env.production
.env.*.local
```

### 2. 使用环境变量注入

生产环境通过CI/CD或Docker注入：

```bash
# GitHub Actions
- name: Build
  env:
    VITE_DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
  run: npm run build

# Docker
docker run -e VITE_DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY juben
```

### 3. 定期轮换密钥

- 每3-6个月更换API密钥
- 发现泄露立即更换
- 使用密钥管理服务（AWS Secrets Manager、Azure Key Vault等）

### 4. 限制密钥权限

- 只授予必要的API权限
- 设置使用配额和速率限制
- 监控异常使用

---

## 🚀 部署检查清单

### 开发环境
- [ ] 创建 `.env.local` 文件
- [ ] 配置至少一个AI API密钥
- [ ] 运行 `npm run dev` 测试

### 生产环境
- [ ] 配置所有必需的环境变量
- [ ] 设置 `VITE_BASE_PATH` 为正确的路径
- [ ] 启用性能监控和错误上报
- [ ] 配置Sentry（可选）
- [ ] 测试API连接
- [ ] 检查构建输出

### Docker部署
- [ ] 创建 `.env.production` 或使用环境变量
- [ ] 配置 `docker-compose.yml`
- [ ] 测试容器启动
- [ ] 验证API密钥可用
- [ ] 检查健康检查状态

---

## 🆘 常见问题

### Q: API密钥不生效？
A: 检查以下几点：
1. 环境变量名称是否正确（必须以 `VITE_` 开头）
2. 是否重启了开发服务器
3. 浏览器控制台是否有错误信息

### Q: Docker部署时环境变量无效？
A: 确保：
1. 构建时传入环境变量：`docker build --build-arg VITE_DEEPSEEK_API_KEY=$KEY`
2. 或在运行时注入：`docker run -e VITE_DEEPSEEK_API_KEY=$KEY`
3. Vite在构建时会将环境变量打包进代码

### Q: 如何在代码中使用环境变量？
A: 使用 `import.meta.env`：
```typescript
const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
const basePath = import.meta.env.VITE_BASE_PATH;
```

### Q: 生产环境如何隐藏API密钥？
A: 
1. 使用后端代理API请求
2. 使用Serverless Functions
3. 使用环境变量注入，不要硬编码

---

**最后更新**: 2026-01-19  
**相关文档**: 
- [快速开始](./QUICK_START.md)
- [部署指南](./DEPLOYMENT.md)
- [Docker部署](./docker-compose.yml)
