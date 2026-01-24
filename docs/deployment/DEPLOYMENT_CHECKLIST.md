# 🚀 快速部署检查清单

**最后更新**: 2026-01-19  
**项目状态**: ✅ 所有优化已完成

---

## ✅ 部署前检查清单

### 📋 第一步：环境准备

- [ ] **1.1 检查Node.js版本**
  ```bash
  node --version  # 应该 >= 18.0.0
  npm --version   # 应该 >= 9.0.0
  ```

- [ ] **1.2 检查Docker版本**（如果使用Docker）
  ```bash
  docker --version          # 应该 >= 20.10
  docker-compose --version  # 应该 >= 2.0
  ```

- [ ] **1.3 检查磁盘空间**
  ```bash
  # Windows
  wmic logicaldisk get size,freespace,caption
  
  # 至少需要 5GB 可用空间
  ```

---

### 📋 第二步：代码验证

- [ ] **2.1 运行项目诊断**
  ```bash
  npm run diagnose
  # 应该显示: ✅ 未发现问题！项目健康状况良好。
  ```

- [ ] **2.2 检查循环依赖**
  ```bash
  npx madge --circular --extensions ts,tsx src/
  # 应该显示: √ No circular dependency found!
  ```

- [ ] **2.3 运行测试**
  ```bash
  npm test -- --run
  # 应该显示: 110+ tests passing
  ```

- [ ] **2.4 检查代码质量**
  ```bash
  npm run check
  # 应该通过所有检查
  ```

- [ ] **2.5 检查集成**
  ```bash
  npm run check-integration
  # 应该显示: ✅ 所有功能已正确集成！
  ```

---

### 📋 第三步：环境变量配置

- [ ] **3.1 创建环境变量文件**
  ```bash
  # 开发环境
  # 创建 .env.local 文件，参考 ENV_CONFIG_GUIDE.md
  
  # 生产环境
  # 创建 .env.production 文件
  ```

- [ ] **3.2 配置必需的环境变量**
  ```env
  # 至少配置一个AI API密钥
  VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
  
  # 或其他提供商
  VITE_VOLCENGINE_API_KEY=your_key_here
  VITE_OPENAI_API_KEY=your_key_here
  VITE_QIANWEN_API_KEY=your_key_here
  ```

- [ ] **3.3 配置部署路径**
  ```env
  # Docker部署
  VITE_BASE_PATH=/
  
  # GitHub Pages
  VITE_BASE_PATH=/juben/
  
  # 其他平台
  VITE_BASE_PATH=/
  ```

- [ ] **3.4 验证环境变量**
  ```bash
  # 启动开发服务器，检查控制台是否有环境变量错误
  npm run dev
  ```

---

### 📋 第四步：本地测试

- [ ] **4.1 启动开发服务器**
  ```bash
  npm run dev
  # 应该在 http://localhost:5173 启动
  ```

- [ ] **4.2 测试核心功能**
  - [ ] 创建新项目
  - [ ] 添加章节
  - [ ] AI提取剧本
  - [ ] 编辑场景
  - [ ] 生成分镜
  - [ ] 导出功能

- [ ] **4.3 检查浏览器控制台**
  - [ ] 无错误信息
  - [ ] 无警告信息
  - [ ] API调用正常

- [ ] **4.4 测试性能**
  - [ ] 页面加载 < 3秒
  - [ ] 交互响应 < 100ms
  - [ ] 无内存泄漏

---

### 📋 第五步：构建验证

- [ ] **5.1 构建生产版本**
  ```bash
  npm run build
  # 应该成功构建到 dist/ 目录
  ```

- [ ] **5.2 检查构建输出**
  ```bash
  # 检查 dist/ 目录
  ls -lh dist/
  
  # 应该包含:
  # - index.html
  # - assets/ (JS和CSS文件)
  # - 其他静态资源
  ```

- [ ] **5.3 预览生产版本**
  ```bash
  npm run preview
  # 应该在 http://localhost:4173 启动
  ```

- [ ] **5.4 测试生产版本功能**
  - [ ] 所有功能正常
  - [ ] 无控制台错误
  - [ ] 性能良好

---

### 📋 第六步：Docker部署（可选）

- [ ] **6.1 准备Docker环境变量**
  ```bash
  # 创建 .env.production 文件
  # 或设置环境变量
  export VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
  export VITE_BASE_PATH=/
  ```

- [ ] **6.2 构建Docker镜像**
  ```bash
  docker-compose build
  # 应该成功构建镜像
  ```

- [ ] **6.3 启动Docker容器**
  ```bash
  docker-compose up -d
  # 应该成功启动容器
  ```

- [ ] **6.4 检查容器状态**
  ```bash
  docker-compose ps
  # 应该显示: Up (healthy)
  ```

- [ ] **6.5 检查健康状态**
  ```bash
  curl http://localhost/
  # 应该返回HTML内容
  ```

- [ ] **6.6 查看容器日志**
  ```bash
  docker-compose logs -f
  # 应该无错误信息
  ```

- [ ] **6.7 测试Docker部署功能**
  - [ ] 访问 http://localhost
  - [ ] 测试所有核心功能
  - [ ] 检查API调用

---

### 📋 第七步：生产环境部署

- [ ] **7.1 配置域名和SSL**（如果需要）
  - [ ] 配置DNS记录
  - [ ] 申请SSL证书
  - [ ] 配置反向代理

- [ ] **7.2 配置环境变量**
  - [ ] 使用环境变量注入
  - [ ] 不要硬编码密钥
  - [ ] 使用密钥管理服务

- [ ] **7.3 配置监控**（推荐）
  - [ ] 配置Sentry（参考 SENTRY_INTEGRATION_GUIDE.md）
  - [ ] 配置日志收集
  - [ ] 配置告警

- [ ] **7.4 配置备份**
  - [ ] 数据备份策略
  - [ ] 日志备份
  - [ ] 配置文件备份

- [ ] **7.5 安全检查**
  - [ ] 更新所有依赖
  - [ ] 检查安全漏洞
  - [ ] 配置防火墙
  - [ ] 限制API访问

---

### 📋 第八步：部署后验证

- [ ] **8.1 功能测试**
  - [ ] 所有页面可访问
  - [ ] 所有功能正常
  - [ ] API调用成功
  - [ ] 数据持久化正常

- [ ] **8.2 性能测试**
  - [ ] 页面加载时间
  - [ ] API响应时间
  - [ ] 并发用户测试
  - [ ] 资源使用监控

- [ ] **8.3 安全测试**
  - [ ] HTTPS正常
  - [ ] 安全头配置
  - [ ] XSS防护
  - [ ] CSRF防护

- [ ] **8.4 监控验证**
  - [ ] 错误监控正常
  - [ ] 性能监控正常
  - [ ] 日志收集正常
  - [ ] 告警配置正常

---

## 🔧 常见问题排查

### 问题1: 构建失败

**症状**: `npm run build` 失败

**排查步骤**:
```bash
# 1. 清理缓存
npm run clean-cache

# 2. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 3. 检查TypeScript错误
npx tsc --noEmit

# 4. 重新构建
npm run build
```

---

### 问题2: Docker容器无法启动

**症状**: `docker-compose up` 失败

**排查步骤**:
```bash
# 1. 查看详细日志
docker-compose logs

# 2. 检查端口占用
netstat -ano | findstr :80

# 3. 检查环境变量
docker-compose config

# 4. 重新构建
docker-compose build --no-cache
docker-compose up -d
```

---

### 问题3: API调用失败

**症状**: AI功能不工作

**排查步骤**:
```bash
# 1. 检查环境变量
echo $VITE_DEEPSEEK_API_KEY

# 2. 检查浏览器控制台
# 打开开发者工具，查看Network标签

# 3. 测试API密钥
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $VITE_DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'

# 4. 检查API配额
# 登录API提供商控制台查看
```

---

### 问题4: 性能问题

**症状**: 页面加载慢或卡顿

**排查步骤**:
```bash
# 1. 检查构建大小
npm run build
ls -lh dist/assets/

# 2. 分析打包
npm run build -- --mode analyze

# 3. 检查网络请求
# 使用浏览器开发者工具的Network标签

# 4. 检查内存使用
# 使用浏览器开发者工具的Performance标签
```

---

## 📚 相关文档

- [环境变量配置指南](./ENV_CONFIG_GUIDE.md)
- [Docker部署指南](./DOCKER_DEPLOYMENT.md)
- [Sentry集成指南](./SENTRY_INTEGRATION_GUIDE.md)
- [组件重构报告](./COMPONENT_REFACTORING_REPORT.md)
- [优化总结报告](./OPTIMIZATION_SUMMARY.md)

---

## 🎯 快速命令参考

```bash
# 开发
npm run dev              # 启动开发服务器
npm test                 # 运行测试
npm run check            # 代码检查

# 构建
npm run build            # 构建生产版本
npm run preview          # 预览生产版本

# 诊断
npm run diagnose         # 项目诊断
npm run check-integration # 集成检查
npm run clean-cache      # 清理缓存

# Docker
docker-compose build     # 构建镜像
docker-compose up -d     # 启动容器
docker-compose down      # 停止容器
docker-compose logs -f   # 查看日志
docker-compose ps        # 查看状态
```

---

## ✅ 部署成功标志

当你完成所有检查项后，应该看到：

- ✅ 项目诊断通过（0个问题）
- ✅ 所有测试通过（110+个测试）
- ✅ 构建成功（dist/目录生成）
- ✅ 预览正常（功能完整）
- ✅ Docker健康（容器运行正常）
- ✅ 功能测试通过（所有核心功能正常）
- ✅ 性能良好（加载快，响应快）
- ✅ 无错误日志（控制台干净）

---

**检查清单版本**: v1.0  
**最后更新**: 2026-01-19  
**适用项目**: AI漫剧全流程网站（剧本改12）

🎉 **祝部署顺利！** 🎉
