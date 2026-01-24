# 🎬 剧本创作系统

> 现代化的剧本创作与分镜管理工具 - AI 辅助创作，让创意更高效

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()

[在线演示](https://kaix328.github.io/juben2/) | [功能文档](./docs/features/) | [部署指南](./docs/deployment/) | [更新日志](./CHANGELOG.md)

---

## ✨ 核心特性

### 🎯 剧本创作
- 📝 **智能编辑器** - Monaco Editor 支持，语法高亮
- 🤖 **AI 辅助创作** - 多模型支持（DeepSeek、OpenAI、千问等）
- 💾 **自动保存** - 实时保存，永不丢失
- 📊 **版本管理** - 完整的版本历史和回滚

### 🎬 分镜管理
- 🖼️ **可视化分镜** - 拖拽排序，直观管理
- 🎨 **AI 生成图片** - 自动生成分镜画面
- 📐 **专业参数** - 景别、镜头、转场等完整配置
- 🔄 **批量操作** - 批量编辑、导出、删除

### 📚 资源库
- 👥 **角色管理** - 角色库、关系图谱
- 🏞️ **场景管理** - 场景库、地点管理
- 🎭 **道具管理** - 道具库、分类管理
- 🔗 **关系图谱** - 可视化角色关系网络

### ⚡ 性能优化
- 🚀 **虚拟滚动** - 支持 10,000+ 项流畅滚动
- 🖼️ **图片懒加载** - 智能加载，节省带宽
- 💾 **本地存储** - IndexedDB 离线支持
- 📦 **代码分割** - 按需加载，快速启动

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/kaix328/juben2.git
cd juben2

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选）
cp .env.example .env.local
# 编辑 .env.local 填入 API 密钥

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:5173 开始使用！

---

## 📸 功能截图

### 剧本编辑器
![剧本编辑器](docs/screenshots/editor.png)

### 分镜管理
![分镜管理](docs/screenshots/storyboard.png)

### 资源库
![资源库](docs/screenshots/library.png)

### 关系图谱
![关系图谱](docs/screenshots/graph.png)

---

## 🛠️ 技术栈

### 前端框架
- **React 18.3** - UI 框架
- **TypeScript** - 类型安全
- **Vite 6.3** - 构建工具

### UI 组件
- **Radix UI** - 无障碍组件库
- **Tailwind CSS 4** - 样式框架
- **Lucide React** - 图标库
- **Motion** - 动画库

### 状态管理
- **Zustand** - 轻量级状态管理
- **React Query** - 服务端状态管理
- **Dexie** - IndexedDB 封装

### 开发工具
- **Vitest** - 单元测试
- **ESLint** - 代码检查
- **Prettier** - 代码格式化

---

## 📦 项目结构

```
screenplay-creator/
├── src/
│   ├── app/
│   │   ├── components/      # UI 组件
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # 业务服务
│   │   ├── store/           # 状态管理
│   │   ├── types/           # 类型定义
│   │   └── utils/           # 工具函数
│   ├── lib/                 # 第三方库配置
│   ├── styles/              # 样式文件
│   └── __tests__/           # 测试文件
├── docs/                    # 文档
│   ├── deployment/          # 部署文档
│   ├── features/            # 功能文档
│   └── development/         # 开发文档
├── public/                  # 静态资源
└── scripts/                 # 构建脚本
```

---

## 🔧 可用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览生产构建

# 测试
npm test                 # 运行测试
npm run test:ui          # 测试 UI
npm run test:coverage    # 测试覆盖率

# 代码质量
npm run check            # 代码检查
npm run lint             # ESLint 检查
npm run quality          # 质量检查

# 部署
npm run deploy           # 部署到 GitHub Pages
npm run verify           # 验证部署
```

---

## 🌐 部署

### GitHub Pages（推荐）

```bash
# 自动部署
npm run deploy
```

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kaix328/juben2)

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/kaix328/juben2)

### Docker

```bash
# 使用 Docker Compose
docker-compose up -d
```

详细部署指南请查看 [部署文档](./docs/deployment/)

---

## 📚 文档

- [快速开始](./QUICK_START.md) - 5分钟上手指南
- [功能文档](./docs/features/) - 详细功能说明
- [API 文档](./docs/api/) - API 接口文档
- [部署指南](./docs/deployment/) - 部署配置说明
- [开发指南](./docs/development/) - 开发规范和最佳实践
- [更新日志](./CHANGELOG.md) - 版本更新记录

---

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](./CONTRIBUTING.md)

### 贡献者

感谢所有贡献者的付出！

---

## 📄 许可证

本项目采用 [MIT](./LICENSE) 许可证

---

## 🙏 致谢

- [shadcn/ui](https://ui.shadcn.com/) - UI 组件灵感
- [Radix UI](https://www.radix-ui.com/) - 无障碍组件
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [Vite](https://vitejs.dev/) - 构建工具

---

## 📞 联系方式

- GitHub: [@kaix328](https://github.com/kaix328)
- Issues: [提交问题](https://github.com/kaix328/juben2/issues)
- Discussions: [参与讨论](https://github.com/kaix328/juben2/discussions)

---

## ⭐ Star History

如果这个项目对你有帮助，请给一个 Star ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=kaix328/juben2&type=Date)](https://star-history.com/#kaix328/juben2&Date)

---

**Made with ❤️ by kaix328**
