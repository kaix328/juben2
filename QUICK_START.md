# 🚀 快速启动指南

## 当前状态
✅ **开发服务器**: http://localhost:5173/ (运行中)  
✅ **测试服务器**: http://localhost:5174/ (运行中)

---

## 📋 常用命令

### 开发
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
```

### 测试
```bash
npm run test         # 运行测试
npm run test:ui      # 测试 UI 界面
npm run test:coverage # 测试覆盖率报告
```

### 诊断和修复（新增）
```bash
npm run diagnose     # 全面项目诊断
npm run fix          # 自动修复常见问题
npm run clean-cache  # 清除所有缓存
```

### 代码质量
```bash
npm run lint         # ESLint 检查
npm run check        # 代码检查
npm run quality      # 质量检查
```

---

## 🔧 故障排除

### 问题 1: 服务器无法启动
```bash
# 解决方案
npm run fix
npm run dev
```

### 问题 2: 端口被占用
```bash
# Windows
taskkill /F /IM node.exe

# 然后重启
npm run dev
```

### 问题 3: 编译错误
```bash
# 清除缓存并重新安装
npm run clean-cache
npm install
npm run dev
```

### 问题 4: 热更新不工作
```bash
# 清除 Vite 缓存
npm run clean-cache
# 硬刷新浏览器: Ctrl + Shift + R
```

---

## 📊 项目功能

### 核心功能
- 📚 **项目管理** - 创建和管理影视项目
- ✍️ **章节编辑** - 编辑原始文本
- 🎬 **剧本提取** - AI 自动提取剧本格式
- 🎨 **分镜生成** - 自动生成分镜图
- 📊 **五元素分析** - 故事结构分析
- 💾 **备份管理** - 自动备份和恢复

### AI 功能
- DeepSeek API 集成
- 智能剧本提取
- 质量检查
- 自动优化建议

---

## 🎯 快速测试流程

1. **访问应用**: http://localhost:5173/
2. **创建项目**: 点击"新建项目"
3. **添加章节**: 输入原始文本
4. **AI 提取**: 点击"AI 提取"生成剧本
5. **生成分镜**: 进入分镜编辑器
6. **导出**: 导出 PDF/HTML/Markdown

---

## 📁 重要文件

### 配置文件
- `vite.config.ts` - Vite 配置
- `tsconfig.json` - TypeScript 配置
- `package.json` - 项目配置
- `tailwind.config.js` - Tailwind CSS 配置

### 文档
- `README.md` - 项目说明
- `PROJECT_AUDIT_REPORT.md` - 审查报告
- `DIAGNOSTIC_COMPLETION_REPORT.md` - 诊断完成报告
- `diagnostic-report.json` - 诊断结果

### 脚本
- `scripts/diagnose-project.cjs` - 诊断脚本
- `scripts/fix-common-issues.cjs` - 修复脚本
- `scripts/clean-cache.cjs` - 清理脚本

---

## 🆘 需要帮助？

1. 运行诊断: `npm run diagnose`
2. 查看报告: `diagnostic-report.json`
3. 阅读文档: `PROJECT_AUDIT_REPORT.md`
4. 自动修复: `npm run fix`

---

**最后更新**: 2026-01-19  
**状态**: ✅ 所有系统正常运行
