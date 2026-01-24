# Project Diagnostics Skill

## 功能描述
全面诊断 React + Vite + TypeScript 项目的健康状况，检测常见问题并提供修复建议。

## 使用场景
- 开发服务器无法启动或频繁崩溃
- 编译错误或运行时错误
- 性能问题
- 依赖冲突
- 配置问题

## 诊断项目

### 1. 依赖检查
- 检查 package.json 中的依赖版本冲突
- 验证 node_modules 完整性
- 检查 peer dependencies

### 2. 配置文件验证
- vite.config.ts
- tsconfig.json
- tailwind.config.js
- package.json scripts

### 3. 代码质量检查
- TypeScript 类型错误
- ESLint 错误
- 未使用的导入
- 循环依赖

### 4. 运行时问题
- 内存泄漏
- 无限循环
- 未捕获的异常
- 资源加载失败

### 5. 性能问题
- 大型组件
- 过度渲染
- 未优化的依赖
- 缓存问题

## 输出格式
```json
{
  "status": "healthy" | "warning" | "critical",
  "issues": [
    {
      "category": "dependency" | "config" | "code" | "runtime" | "performance",
      "severity": "low" | "medium" | "high" | "critical",
      "message": "问题描述",
      "location": "文件路径或位置",
      "suggestion": "修复建议"
    }
  ],
  "summary": {
    "total": 10,
    "critical": 2,
    "high": 3,
    "medium": 4,
    "low": 1
  }
}
```

## 自动修复
对于常见问题，提供自动修复脚本：
- 清除缓存
- 重新安装依赖
- 修复配置文件
- 更新依赖版本
