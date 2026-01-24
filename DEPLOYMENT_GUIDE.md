# 🚀 GitHub 部署完成指南

## 📋 已完成的准备工作

### ✅ 第一步：安全问题修复
- [x] 更新 `.gitignore` - 添加了 dist/, logs/, .env 等
- [x] 创建 `.env.example` - API 密钥配置模板
- [x] 修复 `Dockerfile` - 移除硬编码的 API 密钥
- [x] 修复 `docker-compose.yml` - 移除 API 密钥配置

### ✅ 第二步：项目配置优化
- [x] 更新 `package.json` - 项目信息、仓库地址
- [x] 创建 `LICENSE` - MIT 许可证
- [x] 创建 `CONTRIBUTING.md` - 贡献指南
- [x] 创建 `.github/workflows/ci.yml` - CI/CD 自动化

### ✅ 第三步：文档整理
- [x] 创建文档目录结构 (docs/)
- [x] 移动文档到对应目录
- [x] 优化 `README.md` - 简洁专业的项目介绍

---

## 🎯 下一步：提交到 GitHub

### 方案 A：全新仓库（推荐）

如果您的仓库是空的或想重新开始：

```bash
# 1. 进入项目目录
cd "d:/桌面/剧本改21"

# 2. 初始化 Git（如果还没有）
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "feat: 初始提交 - 剧本创作系统 v1.0.0

- 完整的剧本编辑功能
- 分镜管理系统
- 资源库（角色、场景、道具）
- AI 辅助创作
- 关系图谱可视化
- 性能优化（虚拟滚动、懒加载）
- 完整的测试覆盖
- Docker 部署支持"

# 5. 添加远程仓库
git remote add origin https://github.com/kaix328/juben2.git

# 6. 推送到 GitHub（强制推送，覆盖远程）
git push -u origin main --force
```

### 方案 B：保留现有提交历史

如果您想保留现有的 Git 历史：

```bash
# 1. 进入项目目录
cd "d:/桌面/剧本改21"

# 2. 检查当前状态
git status

# 3. 添加所有更改
git add .

# 4. 提交更改
git commit -m "chore: 优化项目配置，准备部署

- 更新 README.md
- 完善 .gitignore
- 添加 LICENSE 和 CONTRIBUTING.md
- 修复安全问题（API 密钥）
- 整理文档结构
- 配置 GitHub Actions"

# 5. 确认远程仓库
git remote -v

# 6. 推送到 GitHub
git push origin main
```

---

## 🔧 配置 GitHub Pages

### 步骤 1：启用 GitHub Pages

1. 访问 https://github.com/kaix328/juben2/settings/pages
2. 在 "Source" 下选择 "GitHub Actions"
3. 保存设置

### 步骤 2：触发自动部署

推送代码后，GitHub Actions 会自动：
- 运行测试
- 构建项目
- 部署到 GitHub Pages

查看部署状态：https://github.com/kaix328/juben2/actions

### 步骤 3：访问网站

部署完成后，访问：
- **主站**: https://kaix328.github.io/juben2/

---

## 🔐 配置 API 密钥（重要）

### 本地开发

```bash
# 1. 复制环境变量模板
cp .env.example .env.local

# 2. 编辑 .env.local，填入真实的 API 密钥
# 注意：.env.local 不会被提交到 Git
```

### GitHub Pages 部署

⚠️ **重要提示**：前端应用不应该直接包含 API 密钥！

**推荐方案**：创建后端 API 服务

```javascript
// 前端调用自己的后端
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  body: JSON.stringify({ prompt })
});

// 后端服务器保存密钥
// server.js
app.post('/api/ai/generate', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  // 调用 AI 服务...
});
```

**临时方案**：使用 GitHub Secrets（不推荐用于前端）

1. 访问 https://github.com/kaix328/juben2/settings/secrets/actions
2. 添加 Secrets（但前端仍会暴露）

---

## ✅ 部署检查清单

### 提交前检查

- [x] `.gitignore` 已更新
- [x] API 密钥已移除
- [x] `package.json` 信息已更新
- [x] `README.md` 已优化
- [x] `LICENSE` 已添加
- [ ] 本地测试通过

### 本地测试

```bash
# 1. 清理缓存
npm run clean-cache

# 2. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 3. 运行检查
npm run check

# 4. 构建项目
npm run build

# 5. 本地预览
npm run preview
```

### 提交到 GitHub

```bash
# 1. 检查状态
git status

# 2. 添加文件
git add .

# 3. 提交
git commit -m "feat: 初始提交 - 剧本创作系统 v1.0.0"

# 4. 推送
git push origin main
```

---

## 🎉 部署完成后

### 验证部署

1. ✅ 访问 https://kaix328.github.io/juben2/
2. ✅ 检查功能是否正常
3. ✅ 查看 GitHub Actions 构建日志
4. ✅ 测试核心功能

### 分享项目

- 📝 在 README 中添加项目截图
- 🌟 邀请朋友给项目 Star
- 📢 在社交媒体分享
- 💬 在 GitHub Discussions 与用户交流

---

## 🐛 常见问题

### Q1: 推送失败 "rejected"

```bash
# 如果远程有不同的提交历史
git pull origin main --rebase
git push origin main

# 或者强制推送（会覆盖远程）
git push origin main --force
```

### Q2: GitHub Pages 404 错误

检查 `vite.config.ts` 中的 `base` 配置：

```javascript
export default defineConfig({
  base: '/juben2/', // 必须与仓库名一致
})
```

### Q3: 构建失败

查看 GitHub Actions 日志：
https://github.com/kaix328/juben2/actions

常见原因：
- Node 版本不匹配
- 依赖安装失败
- 测试未通过

### Q4: API 密钥问题

前端不应该包含 API 密钥！请：
1. 创建后端服务
2. 或使用无需密钥的功能

---

## 📞 需要帮助？

- 📖 查看 [GitHub 文档](https://docs.github.com/)
- 💬 在 [Issues](https://github.com/kaix328/juben2/issues) 提问
- 🔍 搜索 [Stack Overflow](https://stackoverflow.com/)

---

## 🎊 恭喜！

您的项目已经准备好部署到 GitHub 了！

**下一步**：
1. 运行本地测试
2. 提交到 GitHub
3. 等待自动部署
4. 访问您的网站

**预计时间**：10-15 分钟

祝您部署顺利！🚀

---

**文档创建时间**: 2026-01-25  
**版本**: v1.0
