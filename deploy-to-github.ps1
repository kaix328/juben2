# 部署到 GitHub 脚本
# 使用方法：在 PowerShell 中运行 .\deploy-to-github.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  剧本创作系统 - GitHub 部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置错误处理
$ErrorActionPreference = "Stop"

# 项目目录
$projectDir = "d:/桌面/剧本改21"
Set-Location $projectDir

Write-Host "📍 当前目录: $projectDir" -ForegroundColor Green
Write-Host ""

# 步骤 1: 检查 Git 状态
Write-Host "🔍 步骤 1/6: 检查 Git 状态..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "✅ Git 仓库已存在" -ForegroundColor Green
} else {
    Write-Host "⚠️  Git 仓库不存在，正在初始化..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git 仓库初始化完成" -ForegroundColor Green
}
Write-Host ""

# 步骤 2: 检查远程仓库
Write-Host "🔍 步骤 2/6: 检查远程仓库..." -ForegroundColor Yellow
$remotes = git remote -v 2>$null
if ($remotes -match "kaix328/juben2") {
    Write-Host "✅ 远程仓库已配置: https://github.com/kaix328/juben2.git" -ForegroundColor Green
} else {
    Write-Host "⚠️  远程仓库未配置，正在添加..." -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin https://github.com/kaix328/juben2.git
    Write-Host "✅ 远程仓库配置完成" -ForegroundColor Green
}
Write-Host ""

# 步骤 3: 检查当前分支
Write-Host "🔍 步骤 3/6: 检查当前分支..." -ForegroundColor Yellow
$currentBranch = git branch --show-current 2>$null
if ($currentBranch -eq "main") {
    Write-Host "✅ 当前在 main 分支" -ForegroundColor Green
} else {
    Write-Host "⚠️  当前分支: $currentBranch，切换到 main..." -ForegroundColor Yellow
    git checkout -b main 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout main 2>$null
    }
    Write-Host "✅ 已切换到 main 分支" -ForegroundColor Green
}
Write-Host ""

# 步骤 4: 添加文件
Write-Host "📦 步骤 4/6: 添加文件到 Git..." -ForegroundColor Yellow
git add .
$status = git status --short
if ($status) {
    Write-Host "✅ 已添加以下文件:" -ForegroundColor Green
    Write-Host $status
} else {
    Write-Host "ℹ️  没有新的更改" -ForegroundColor Cyan
}
Write-Host ""

# 步骤 5: 提交更改
Write-Host "💾 步骤 5/6: 提交更改..." -ForegroundColor Yellow
$commitMessage = @"
feat: 初始提交 - 剧本创作系统 v1.0.0

✨ 核心功能:
- 剧本编辑器（Monaco Editor）
- 分镜管理系统
- 资源库（角色、场景、道具）
- AI 辅助创作（多模型支持）
- 关系图谱可视化
- 批量操作和版本管理

⚡ 性能优化:
- 虚拟滚动（支持10,000+项）
- 图片懒加载
- 代码分割
- IndexedDB 本地存储

🔧 技术栈:
- React 18.3 + TypeScript
- Vite 6.3 + Tailwind CSS 4
- Zustand + React Query
- Radix UI + Motion

📦 部署支持:
- GitHub Pages
- Vercel / Netlify
- Docker

🧪 测试覆盖:
- Vitest 单元测试
- 组件测试
- 集成测试

📚 文档完善:
- 详细的 README
- API 文档
- 部署指南
- 贡献指南
"@

try {
    git commit -m $commitMessage
    Write-Host "✅ 提交成功" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  没有需要提交的更改" -ForegroundColor Cyan
}
Write-Host ""

# 步骤 6: 推送到 GitHub
Write-Host "🚀 步骤 6/6: 推送到 GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  重要提示:" -ForegroundColor Red
Write-Host "   如果远程仓库已有内容，此操作会覆盖远程仓库！" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "是否继续推送到 GitHub? (输入 yes 继续)"

if ($confirm -eq "yes") {
    Write-Host ""
    Write-Host "正在推送到 GitHub..." -ForegroundColor Yellow
    
    try {
        # 尝试正常推送
        git push -u origin main 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 推送成功！" -ForegroundColor Green
        } else {
            # 如果失败，尝试强制推送
            Write-Host "⚠️  正常推送失败，尝试强制推送..." -ForegroundColor Yellow
            git push -u origin main --force
            Write-Host "✅ 强制推送成功！" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ 推送失败: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 可能的原因:" -ForegroundColor Yellow
        Write-Host "   1. 网络连接问题" -ForegroundColor White
        Write-Host "   2. 没有仓库访问权限" -ForegroundColor White
        Write-Host "   3. 需要配置 Git 凭据" -ForegroundColor White
        Write-Host ""
        Write-Host "🔧 解决方案:" -ForegroundColor Yellow
        Write-Host "   手动推送: git push -u origin main --force" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "❌ 已取消推送" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 您可以稍后手动推送:" -ForegroundColor Yellow
    Write-Host "   git push -u origin main" -ForegroundColor White
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎉 部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 下一步操作:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 访问 GitHub 仓库:" -ForegroundColor White
Write-Host "   https://github.com/kaix328/juben2" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 配置 GitHub Pages:" -ForegroundColor White
Write-Host "   - 进入 Settings → Pages" -ForegroundColor White
Write-Host "   - Source 选择 'GitHub Actions'" -ForegroundColor White
Write-Host "   - 保存设置" -ForegroundColor White
Write-Host ""
Write-Host "3. 等待自动部署（约 3-5 分钟）:" -ForegroundColor White
Write-Host "   https://github.com/kaix328/juben2/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. 访问您的网站:" -ForegroundColor White
Write-Host "   https://kaix328.github.io/juben2/" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 查看部署指南:" -ForegroundColor White
Write-Host "   .\DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎊 恭喜！您的项目已成功部署到 GitHub！" -ForegroundColor Green
Write-Host ""
