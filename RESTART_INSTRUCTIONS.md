# 🚨 必须完全重启服务器

## 问题

Vite 服务器缓存了旧版本的文件，导致 `504 (Outdated Optimize Dep)` 错误。

---

## ✅ 解决方案：完全重启

### 步骤 1：停止服务器

在运行 `npm run dev` 的终端窗口中：

1. **按 `Ctrl+C`** 停止服务器
2. **等待完全停止**（看到命令提示符）

### 步骤 2：清除所有缓存

```powershell
# 在项目目录执行
Remove-Item -Recurse -Force node_modules/.vite
```

### 步骤 3：重启服务器

```powershell
npm run dev
```

### 步骤 4：强制刷新浏览器

- 按 **`Ctrl+Shift+R`**（清空缓存并刷新）
- 或者按 **`F12`** 打开开发者工具，右键刷新按钮，选择"清空缓存并硬性重新加载"

---

## 🎯 预期结果

重启后应该看到：

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

浏览器应该能正常加载所有页面，不再有任何错误。

---

## ⚠️ 重要提示

**必须完全停止服务器**，不能只是刷新浏览器！

Vite 的热更新（HMR）在这种情况下无法正确更新，必须完全重启。

---

## 📝 如果还有问题

如果重启后还有错误，请执行：

```powershell
# 1. 停止服务器 (Ctrl+C)

# 2. 删除所有缓存
Remove-Item -Recurse -Force node_modules/.vite
Remove-Item -Recurse -Force .vite

# 3. 重新安装依赖（可选，如果上面还不行）
npm install

# 4. 重启
npm run dev
```

---

## 🎉 现在请执行

1. **停止服务器** (Ctrl+C)
2. **清除缓存** (上面的命令)
3. **重启服务器** (npm run dev)
4. **刷新浏览器** (Ctrl+Shift+R)

应该就完全正常了！
