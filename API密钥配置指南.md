# 🔑 API 密钥配置指南

**重要**: 请按照以下步骤配置您的 API 密钥

---

## 📋 步骤 1: 获取 API 密钥

### 推荐：DeepSeek API（性价比最高）

1. 访问：https://platform.deepseek.com/
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制密钥（格式：sk-xxxxxxxxxxxxxxxx）

### 备选方案

**火山引擎**:
- 访问：https://console.volcengine.com/
- 获取 API Key

**OpenAI**:
- 访问：https://platform.openai.com/
- 获取 API Key

**通义千问**:
- 访问：https://dashscope.aliyun.com/
- 获取 API Key

---

## 📝 步骤 2: 配置到 .env.local

打开项目根目录的 `.env.local` 文件，填入您的 API 密钥：

```bash
# 应用配置
VITE_BASE_PATH=/
NODE_ENV=development

# ==========================================
# AI API 配置（至少配置一个）
# ==========================================

# DeepSeek API（推荐）
VITE_DEEPSEEK_API_KEY=sk-your-actual-deepseek-key-here

# 火山引擎 API（可选）
VITE_VOLCENGINE_API_KEY=

# OpenAI API（可选）
VITE_OPENAI_API_KEY=

# 通义千问 API（可选）
VITE_QIANWEN_API_KEY=

# ==========================================
# 功能开关
# ==========================================

VITE_ENABLE_PERFORMANCE_MONITORING=false
VITE_ENABLE_ERROR_REPORTING=false

# ==========================================
# 错误监控配置（可选）
# ==========================================

VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

---

## ✅ 步骤 3: 验证配置

配置完成后，运行以下命令验证：

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问
http://localhost:5173/

# 3. 测试 AI 功能
# - 创建新项目
# - 尝试使用 AI 生成剧本
# - 检查是否正常工作
```

---

## ⚠️ 注意事项

1. **不要提交 .env.local 到 Git**
   - 该文件已在 .gitignore 中
   - 包含敏感信息

2. **至少配置一个 AI 提供商**
   - 推荐 DeepSeek（性价比高）
   - 其他可选

3. **保护您的 API 密钥**
   - 不要分享给他人
   - 定期轮换密钥
   - 监控使用量

---

## 🎯 配置完成后

配置完成后，您可以：

✅ 使用 AI 剧本生成功能  
✅ 使用 AI 分镜生成功能  
✅ 使用智能对话分割  
✅ 使用剧本质量检查  

---

**配置完成后，请继续下一个任务！**
