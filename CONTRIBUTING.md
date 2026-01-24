# 贡献指南

感谢您对剧本创作系统的关注！

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 本地开发

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/yourusername/screenplay-creator.git
cd screenplay-creator

# 2. 安装依赖
npm install

# 3. 复制环境变量配置
cp .env.example .env.local

# 4. 启动开发服务器
npm run dev
```

## 📝 开发规范

### 代码风格

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用函数式组件和 Hooks
- 组件使用 PascalCase 命名
- 文件使用 camelCase 命名

### 提交规范

使用语义化提交信息：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具链更新
```

示例：
```bash
git commit -m "feat: 添加分镜导出功能"
git commit -m "fix: 修复角色列表显示问题"
```

### 分支策略

- `main` - 生产环境分支
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支

## 🧪 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# 代码检查
npm run check
```

## 📦 提交 Pull Request

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加某个功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### PR 检查清单

- [ ] 代码通过 `npm run check`
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 提交信息符合规范
- [ ] 代码已经过自测

## 🐛 报告问题

使用 GitHub Issues 报告问题时，请包含：

- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（浏览器、操作系统等）
- 截图（如果适用）

## 💡 功能建议

欢迎提出新功能建议！请在 Issue 中详细描述：

- 功能描述
- 使用场景
- 预期效果
- 可能的实现方案

## 📄 许可证

提交代码即表示您同意将代码以 MIT 许可证发布。

## 🙏 感谢

感谢所有贡献者的付出！
