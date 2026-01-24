# 🔧 环境变量配置说明

## 快速开始

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# Windows
New-Item -Path .env.local -ItemType File

# Mac/Linux
touch .env.local
```

### 2. 复制以下内容到 .env.local

```env
# ============================================
# 应用配置
# ============================================
VITE_BASE_PATH=/

# ============================================
# AI API 配置（至少配置一个）
# ============================================

# DeepSeek API (推荐)
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com

# 火山引擎 API
VITE_VOLCENGINE_API_KEY=your_volcengine_api_key_here
VITE_VOLCENGINE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

# OpenAI API
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# 通义千问 API
VITE_QIANWEN_API_KEY=your_qianwen_api_key_here
VITE_QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1

# ============================================
# 功能开关
# ============================================
VITE_ENABLE_PERFORMANCE_MONITORING=false
VITE_ENABLE_ERROR_REPORTING=false
VITE_ENABLE_REACT_QUERY_DEVTOOLS=true

# ============================================
# 错误监控 (可选)
# ============================================
# Sentry DSN - 从 https://sentry.io 获取
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
VITE_APP_VERSION=1.0.0
```

### 3. 填入实际的API密钥

将 `your_xxx_api_key_here` 替换为你的实际API密钥。

**至少需要配置一个AI提供商的API密钥，否则AI功能无法使用！**

### 4. 测试配置

```bash
npm run dev
```

访问 http://localhost:5173，测试AI功能是否正常。

---

## 获取API密钥

### DeepSeek (推荐)
- 网址: https://platform.deepseek.com/
- 优点: 性价比高，适合大规模使用
- 价格: 便宜

### 火山引擎
- 网址: https://console.volcengine.com/
- 优点: 国内访问速度快
- 价格: 中等

### OpenAI
- 网址: https://platform.openai.com/
- 优点: 模型质量高
- 价格: 较贵

### 通义千问
- 网址: https://dashscope.aliyun.com/
- 优点: 阿里云服务，国内稳定
- 价格: 中等

### Sentry (错误监控，可选)
- 网址: https://sentry.io/
- 优点: 实时错误追踪，性能监控
- 价格: 免费版足够个人使用
- 配置步骤:
  1. 注册Sentry账号
  2. 创建新项目，选择React
  3. 复制DSN到 `VITE_SENTRY_DSN`
  4. 设置 `VITE_ENABLE_ERROR_REPORTING=true`

---

## 注意事项

1. ⚠️ **不要提交 .env.local 到Git**
   - 该文件已在 .gitignore 中
   - 包含敏感的API密钥

2. ⚠️ **至少配置一个AI提供商**
   - 否则AI功能无法使用

3. ⚠️ **定期更换API密钥**
   - 建议每3-6个月更换一次
   - 发现泄露立即更换

---

## 生产环境配置

生产环境使用 `.env.production` 文件，参考 `ENV_CONFIG_GUIDE.md` 和 `DOCKER_DEPLOYMENT.md`。

---

**最后更新**: 2026-01-19
