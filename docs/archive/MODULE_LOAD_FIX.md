# 模块加载失败 - 解决方案

## 🔧 快速修复步骤

### 方法 1：清除 Vite 缓存（推荐）

```bash
# 停止开发服务器（Ctrl+C）

# 删除缓存
rm -rf node_modules/.vite
# Windows PowerShell:
Remove-Item -Recurse -Force node_modules/.vite

# 重启开发服务器
npm run dev
```

### 方法 2：完全重启

```bash
# 停止开发服务器（Ctrl+C）

# 清除所有缓存
npm run clean
# 或手动删除：
rm -rf node_modules/.vite dist

# 重启
npm run dev
```

### 方法 3：浏览器强制刷新

1. 按 **Ctrl+Shift+R**（强制刷新）
2. 或者清除浏览器缓存：
   - 打开开发者工具（F12）
   - 右键点击刷新按钮
   - 选择"清空缓存并硬性重新加载"

---

## ✅ 验证修复

修复后，请验证：

1. **剧本编辑器** - 访问 `/projects/:id/script/:chapterId`
2. **分镜编辑器** - 访问 `/projects/:id/storyboard/:chapterId`
3. **资源库** - 访问 `/projects/:id/assets`

所有页面应该都能正常加载。

---

## 📝 如果问题仍然存在

请尝试：

1. **检查终端错误**
   - 查看运行 `npm run dev` 的终端
   - 是否有编译错误？

2. **检查文件编码**
   - 确保所有文件使用 UTF-8 编码
   - 特别是包含中文注释的文件

3. **重新安装依赖**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

---

**最可能的原因：** Vite 缓存了旧版本的文件

**最快的解决方案：** 删除 `node_modules/.vite` 文件夹并重启服务器
