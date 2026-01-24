# 🚀 GitHub Pages 配置指南

## 📋 配置步骤

### 步骤 1：访问仓库设置

1. 打开浏览器，访问您的 GitHub 仓库：
   ```
   https://github.com/kaix328/juben2
   ```

2. 点击页面右上角的 **"Settings"**（设置）标签

### 步骤 2：进入 Pages 设置

1. 在左侧菜单中找到 **"Pages"** 选项
2. 或直接访问：
   ```
   https://github.com/kaix328/juben2/settings/pages
   ```

### 步骤 3：配置部署源

1. 在 **"Build and deployment"** 部分
2. 找到 **"Source"** 下拉菜单
3. 选择 **"GitHub Actions"**
4. 点击 **"Save"**（保存）

### 步骤 4：等待自动部署

部署会自动开始，您可以：

1. 查看部署进度：
   ```
   https://github.com/kaix328/juben2/actions
   ```

2. 等待约 **3-5 分钟**

3. 看到绿色 ✅ 表示部署成功

### 步骤 5：访问您的网站

部署完成后，访问：
```
https://kaix328.github.io/juben2/
```

---

## 🎯 配置截图说明

### 1. Settings 页面
```
GitHub 仓库页面
├── Code (代码)
├── Issues (问题)
├── Pull requests (拉取请求)
├── Actions (操作)
└── Settings (设置) ← 点击这里
```

### 2. Pages 设置页面
```
Settings 左侧菜单
├── General (常规)
├── Access (访问)
├── Collaborators (协作者)
├── ...
└── Pages (页面) ← 点击这里
```

### 3. Source 配置
```
Build and deployment
├── Source: [下拉菜单]
│   ├── Deploy from a branch
│   └── GitHub Actions ← 选择这个
└── [Save] 按钮
```

---

## ✅ 验证部署

### 检查 Actions 状态

1. 访问：https://github.com/kaix328/juben2/actions

2. 您应该看到一个名为 **"CI/CD"** 或 **"pages build and deployment"** 的工作流

3. 状态图标：
   - 🟡 黄色圆圈 = 正在运行
   - ✅ 绿色勾号 = 部署成功
   - ❌ 红色叉号 = 部署失败

### 检查部署日志

点击工作流名称可以查看详细日志：
- **测试和构建** - 运行测试、构建项目
- **部署到 GitHub Pages** - 上传到 Pages

---

## 🔧 常见问题

### Q1: 找不到 Pages 选项？

**原因**：仓库可能是私有的

**解决方案**：
1. 进入 Settings → General
2. 滚动到底部 "Danger Zone"
3. 点击 "Change visibility"
4. 选择 "Make public"

### Q2: 部署失败怎么办？

**检查步骤**：
1. 查看 Actions 日志
2. 确认 `.github/workflows/ci.yml` 文件存在
3. 确认 `vite.config.ts` 中 base 路径正确

**常见错误**：
```javascript
// vite.config.ts
export default defineConfig({
  base: '/juben2/', // 必须与仓库名一致
})
```

### Q3: 网站显示 404？

**原因**：base 路径配置错误

**解决方案**：
1. 检查 `vite.config.ts`
2. 确保 `base: '/juben2/'`
3. 重新构建并推送

### Q4: 部署成功但页面空白？

**可能原因**：
1. JavaScript 加载失败
2. 路径配置错误

**解决方案**：
1. 打开浏览器控制台（F12）
2. 查看 Console 错误信息
3. 检查 Network 标签的请求

---

## 📊 部署时间线

```
推送代码 → GitHub Actions 触发 → 构建项目 → 部署到 Pages → 网站可用
   ↓              ↓                  ↓              ↓            ↓
  完成          30秒              2-3分钟        30秒         完成
```

**总时间**：约 3-5 分钟

---

## 🎨 自定义域名（可选）

如果您有自己的域名：

### 步骤 1：添加自定义域名

1. 在 Pages 设置页面
2. 找到 **"Custom domain"** 部分
3. 输入您的域名（如：`www.example.com`）
4. 点击 **"Save"**

### 步骤 2：配置 DNS

在您的域名提供商处添加 DNS 记录：

**CNAME 记录**：
```
类型: CNAME
名称: www
值: kaix328.github.io
```

**A 记录**（根域名）：
```
类型: A
名称: @
值: 185.199.108.153
值: 185.199.109.153
值: 185.199.110.153
值: 185.199.111.153
```

### 步骤 3：启用 HTTPS

1. 等待 DNS 生效（可能需要 24 小时）
2. 在 Pages 设置中勾选 **"Enforce HTTPS"**

---

## 🔄 更新网站

每次更新代码后：

```bash
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "feat: 添加新功能"

# 3. 推送到 GitHub
git push origin main

# 4. GitHub Actions 会自动重新部署
```

---

## 📱 移动端访问

您的网站支持移动端访问：
- 📱 响应式设计
- 🎨 移动端优化
- ⚡ 快速加载

---

## 🎯 下一步

配置完成后：

1. ✅ 访问您的网站
2. ✅ 测试所有功能
3. ✅ 分享给朋友
4. ✅ 收集反馈

---

## 📞 需要帮助？

- 📖 [GitHub Pages 官方文档](https://docs.github.com/pages)
- 💬 [GitHub Community](https://github.community/)
- 🔍 [Stack Overflow](https://stackoverflow.com/questions/tagged/github-pages)

---

## 🎊 恭喜！

您的剧本创作系统即将上线！

**网站地址**: https://kaix328.github.io/juben2/

---

**配置指南版本**: v1.0  
**最后更新**: 2026-01-25  
**状态**: ✅ 准备就绪
