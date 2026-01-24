# 自动备份脚本
# 使用方法：在 PowerShell 中运行 .\scripts\backup.ps1

$ErrorActionPreference = "Stop"

# 配置
$sourceDir = "D:\桌面\剧本改2 - 副本 (2)"
$backupBaseDir = "D:\备份\剧本改2"
$date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "$backupBaseDir\backup_$date"

# 排除的文件夹
$excludeDirs = @("node_modules", "dist", ".git")

Write-Host "🔄 开始备份..." -ForegroundColor Cyan
Write-Host "源目录: $sourceDir" -ForegroundColor Gray
Write-Host "备份到: $backupDir" -ForegroundColor Gray
Write-Host ""

# 创建备份目录
if (!(Test-Path $backupBaseDir)) {
    New-Item -Path $backupBaseDir -ItemType Directory -Force | Out-Null
    Write-Host "✅ 创建备份根目录" -ForegroundColor Green
}

# 复制文件（排除指定目录）
try {
    Write-Host "📦 正在复制文件..." -ForegroundColor Yellow
    
    # 使用 robocopy 进行高效复制
    $excludeParams = $excludeDirs | ForEach-Object { "/XD `"$_`"" }
    $robocopyCmd = "robocopy `"$sourceDir`" `"$backupDir`" /E /NFL /NDL /NJH /NJS /nc /ns /np $excludeParams"
    
    Invoke-Expression $robocopyCmd | Out-Null
    
    # 获取备份大小
    $backupSize = (Get-ChildItem -Path $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Host ""
    Write-Host "✅ 备份完成！" -ForegroundColor Green
    Write-Host "📁 备份位置: $backupDir" -ForegroundColor Cyan
    Write-Host "📊 备份大小: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Cyan
    
    # 清理旧备份（保留最近7天）
    Write-Host ""
    Write-Host "🧹 清理旧备份..." -ForegroundColor Yellow
    $oldBackups = Get-ChildItem -Path $backupBaseDir -Directory | 
                  Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-7) }
    
    if ($oldBackups.Count -gt 0) {
        $oldBackups | ForEach-Object {
            Remove-Item -Path $_.FullName -Recurse -Force
            Write-Host "  删除: $($_.Name)" -ForegroundColor Gray
        }
        Write-Host "✅ 已删除 $($oldBackups.Count) 个旧备份" -ForegroundColor Green
    } else {
        Write-Host "  无需清理" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "🎉 备份任务完成！" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ 备份失败: $_" -ForegroundColor Red
    exit 1
}
