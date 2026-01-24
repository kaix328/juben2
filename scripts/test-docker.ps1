#!/usr/bin/env pwsh
# Docker部署测试脚本
# 用于验证Docker配置和部署流程

Write-Host "🐳 开始Docker部署测试..." -ForegroundColor Cyan
Write-Host ""

# 测试结果统计
$script:passCount = 0
$script:failCount = 0
$script:warnCount = 0

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$SuccessMessage = "通过",
        [string]$FailMessage = "失败",
        [bool]$Critical = $true
    )
    
    Write-Host "📋 测试: $Name" -ForegroundColor Yellow
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  ✅ $SuccessMessage" -ForegroundColor Green
            $script:passCount++
            return $true
        } else {
            if ($Critical) {
                Write-Host "  ❌ $FailMessage" -ForegroundColor Red
                $script:failCount++
            } else {
                Write-Host "  ⚠️  $FailMessage" -ForegroundColor Yellow
                $script:warnCount++
            }
            return $false
        }
    } catch {
        if ($Critical) {
            Write-Host "  ❌ 错误: $_" -ForegroundColor Red
            $script:failCount++
        } else {
            Write-Host "  ⚠️  错误: $_" -ForegroundColor Yellow
            $script:warnCount++
        }
        return $false
    }
}

# 1. 检查Docker是否安装
Test-Step -Name "Docker是否已安装" -Test {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "    版本: $dockerVersion" -ForegroundColor Gray
        return $true
    }
    return $false
} -FailMessage "Docker未安装，请先安装Docker Desktop"

# 2. 检查Docker是否运行
Test-Step -Name "Docker服务是否运行" -Test {
    docker ps 2>$null | Out-Null
    return $?
} -FailMessage "Docker服务未运行，请启动Docker Desktop"

# 3. 检查docker-compose是否可用
Test-Step -Name "docker-compose是否可用" -Test {
    $composeVersion = docker compose version 2>$null
    if ($composeVersion) {
        Write-Host "    版本: $composeVersion" -ForegroundColor Gray
        return $true
    }
    return $false
} -FailMessage "docker-compose不可用"

# 4. 检查Dockerfile是否存在
Test-Step -Name "Dockerfile文件是否存在" -Test {
    Test-Path "Dockerfile"
} -FailMessage "Dockerfile文件不存在"

# 5. 检查docker-compose.yml是否存在
Test-Step -Name "docker-compose.yml文件是否存在" -Test {
    Test-Path "docker-compose.yml"
} -FailMessage "docker-compose.yml文件不存在"

# 6. 检查.env.production是否存在
Test-Step -Name ".env.production文件是否存在" -Test {
    Test-Path ".env.production"
} -FailMessage ".env.production文件不存在（可选）" -Critical $false

# 7. 检查package.json是否存在
Test-Step -Name "package.json文件是否存在" -Test {
    Test-Path "package.json"
} -FailMessage "package.json文件不存在"

# 8. 验证Dockerfile语法
Test-Step -Name "Dockerfile语法验证" -Test {
    $content = Get-Content "Dockerfile" -Raw
    # 检查必要的指令
    $hasFrom = $content -match "FROM"
    $hasWorkdir = $content -match "WORKDIR"
    $hasCopy = $content -match "COPY"
    $hasExpose = $content -match "EXPOSE"
    $hasCmd = $content -match "CMD"
    
    if ($hasFrom -and $hasWorkdir -and $hasCopy -and $hasExpose -and $hasCmd) {
        Write-Host "    包含所有必要指令" -ForegroundColor Gray
        return $true
    }
    return $false
} -FailMessage "Dockerfile缺少必要指令"

# 9. 验证docker-compose.yml语法
Test-Step -Name "docker-compose.yml语法验证" -Test {
    docker compose config 2>$null | Out-Null
    return $?
} -FailMessage "docker-compose.yml语法错误"

# 10. 检查端口80是否被占用
Test-Step -Name "端口80是否可用" -Test {
    $port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
    if ($port80) {
        Write-Host "    端口80已被占用，可能需要修改端口映射" -ForegroundColor Yellow
        return $false
    }
    return $true
} -FailMessage "端口80已被占用" -Critical $false

# 11. 检查磁盘空间
Test-Step -Name "磁盘空间是否充足" -Test {
    $drive = Get-PSDrive -Name C
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    Write-Host "    可用空间: ${freeSpaceGB}GB" -ForegroundColor Gray
    
    if ($freeSpaceGB -gt 5) {
        return $true
    }
    return $false
} -FailMessage "磁盘空间不足（需要至少5GB）" -Critical $false

# 12. 测试构建Docker镜像（不实际构建）
Write-Host ""
Write-Host "📦 Docker镜像构建测试" -ForegroundColor Cyan
Write-Host "   提示: 实际构建需要运行 'docker compose build'" -ForegroundColor Gray
Write-Host ""

# 13. 检查是否有旧的容器运行
Test-Step -Name "检查是否有旧容器运行" -Test {
    $containers = docker ps -a --filter "name=juben" --format "{{.Names}}" 2>$null
    if ($containers) {
        Write-Host "    发现旧容器: $containers" -ForegroundColor Yellow
        Write-Host "    提示: 运行 'docker compose down' 清理" -ForegroundColor Gray
        return $false
    }
    return $true
} -FailMessage "存在旧容器" -Critical $false

# 14. 检查是否有旧的镜像
Test-Step -Name "检查是否有旧镜像" -Test {
    $images = docker images --filter "reference=*juben*" --format "{{.Repository}}:{{.Tag}}" 2>$null
    if ($images) {
        Write-Host "    发现旧镜像: $images" -ForegroundColor Gray
        return $true
    }
    Write-Host "    未发现旧镜像" -ForegroundColor Gray
    return $true
} -Critical $false

# 15. 检查日志目录
Test-Step -Name "日志目录是否存在" -Test {
    if (!(Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
        Write-Host "    已创建logs目录" -ForegroundColor Gray
    }
    return Test-Path "logs"
} -FailMessage "无法创建logs目录" -Critical $false

# 16. 检查数据目录
Test-Step -Name "数据目录是否存在" -Test {
    if (!(Test-Path "data")) {
        New-Item -ItemType Directory -Path "data" -Force | Out-Null
        Write-Host "    已创建data目录" -ForegroundColor Gray
    }
    return Test-Path "data"
} -FailMessage "无法创建data目录" -Critical $false

# 输出测试总结
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 测试总结" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ 通过: $script:passCount" -ForegroundColor Green
Write-Host "  ❌ 失败: $script:failCount" -ForegroundColor Red
Write-Host "  ⚠️  警告: $script:warnCount" -ForegroundColor Yellow
Write-Host ""

# 给出建议
if ($script:failCount -eq 0) {
    Write-Host "🎉 所有关键测试通过！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 下一步操作:" -ForegroundColor Cyan
    Write-Host "  1. 确保.env.production文件已配置API密钥" -ForegroundColor White
    Write-Host "  2. 运行 'docker compose build' 构建镜像" -ForegroundColor White
    Write-Host "  3. 运行 'docker compose up -d' 启动容器" -ForegroundColor White
    Write-Host "  4. 访问 http://localhost 测试应用" -ForegroundColor White
    Write-Host "  5. 运行 'docker compose logs -f' 查看日志" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "⚠️  发现 $script:failCount 个关键问题，请先解决后再继续" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 常见问题解决:" -ForegroundColor Cyan
    Write-Host "  - Docker未安装: 访问 https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "  - Docker未运行: 启动Docker Desktop应用" -ForegroundColor White
    Write-Host "  - 端口被占用: 修改docker-compose.yml中的端口映射" -ForegroundColor White
    Write-Host ""
    exit 1
}
