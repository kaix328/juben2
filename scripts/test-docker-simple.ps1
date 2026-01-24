#!/usr/bin/env pwsh
# Docker Deployment Test Script

Write-Host "Docker Deployment Test Starting..." -ForegroundColor Cyan
Write-Host ""

$passCount = 0
$failCount = 0
$warnCount = 0

function Test-Item {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [bool]$Critical = $true
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  PASS" -ForegroundColor Green
            $script:passCount++
            return $true
        } else {
            if ($Critical) {
                Write-Host "  FAIL" -ForegroundColor Red
                $script:failCount++
            } else {
                Write-Host "  WARN" -ForegroundColor Yellow
                $script:warnCount++
            }
            return $false
        }
    } catch {
        if ($Critical) {
            Write-Host "  ERROR: $_" -ForegroundColor Red
            $script:failCount++
        } else {
            Write-Host "  WARN: $_" -ForegroundColor Yellow
            $script:warnCount++
        }
        return $false
    }
}

# Test 1: Docker installed
Test-Item -Name "Docker Installation" -Test {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "    Version: $dockerVersion" -ForegroundColor Gray
        return $true
    }
    return $false
}

# Test 2: Docker running
Test-Item -Name "Docker Service Running" -Test {
    docker ps 2>$null | Out-Null
    return $?
}

# Test 3: Docker Compose available
Test-Item -Name "Docker Compose Available" -Test {
    $composeVersion = docker compose version 2>$null
    if ($composeVersion) {
        Write-Host "    Version: $composeVersion" -ForegroundColor Gray
        return $true
    }
    return $false
}

# Test 4: Dockerfile exists
Test-Item -Name "Dockerfile Exists" -Test {
    Test-Path "Dockerfile"
}

# Test 5: docker-compose.yml exists
Test-Item -Name "docker-compose.yml Exists" -Test {
    Test-Path "docker-compose.yml"
}

# Test 6: .env.production exists
Test-Item -Name ".env.production Exists" -Test {
    Test-Path ".env.production"
} -Critical $false

# Test 7: package.json exists
Test-Item -Name "package.json Exists" -Test {
    Test-Path "package.json"
}

# Test 8: Validate Dockerfile
Test-Item -Name "Dockerfile Syntax" -Test {
    $content = Get-Content "Dockerfile" -Raw
    $hasFrom = $content -match "FROM"
    $hasWorkdir = $content -match "WORKDIR"
    $hasCopy = $content -match "COPY"
    $hasExpose = $content -match "EXPOSE"
    $hasCmd = $content -match "CMD"
    
    return ($hasFrom -and $hasWorkdir -and $hasCopy -and $hasExpose -and $hasCmd)
}

# Test 9: Validate docker-compose.yml
Test-Item -Name "docker-compose.yml Syntax" -Test {
    docker compose config 2>$null | Out-Null
    return $?
}

# Test 10: Check port 80
Test-Item -Name "Port 80 Available" -Test {
    $port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
    if ($port80) {
        Write-Host "    Port 80 is in use" -ForegroundColor Yellow
        return $false
    }
    return $true
} -Critical $false

# Test 11: Disk space
Test-Item -Name "Disk Space" -Test {
    $drive = Get-PSDrive -Name C
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    Write-Host "    Free space: ${freeSpaceGB}GB" -ForegroundColor Gray
    
    return ($freeSpaceGB -gt 5)
} -Critical $false

# Test 12: Check old containers
Test-Item -Name "Old Containers Check" -Test {
    $containers = docker ps -a --filter "name=juben" --format "{{.Names}}" 2>$null
    if ($containers) {
        Write-Host "    Found old containers: $containers" -ForegroundColor Yellow
        return $false
    }
    return $true
} -Critical $false

# Test 13: Create logs directory
Test-Item -Name "Logs Directory" -Test {
    if (!(Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    }
    return Test-Path "logs"
} -Critical $false

# Test 14: Create data directory
Test-Item -Name "Data Directory" -Test {
    if (!(Test-Path "data")) {
        New-Item -ItemType Directory -Path "data" -Force | Out-Null
    }
    return Test-Path "data"
} -Critical $false

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PASS: $passCount" -ForegroundColor Green
Write-Host "  FAIL: $failCount" -ForegroundColor Red
Write-Host "  WARN: $warnCount" -ForegroundColor Yellow
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "All critical tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Configure .env.production with API keys" -ForegroundColor White
    Write-Host "  2. Run 'docker compose build' to build image" -ForegroundColor White
    Write-Host "  3. Run 'docker compose up -d' to start container" -ForegroundColor White
    Write-Host "  4. Visit http://localhost to test" -ForegroundColor White
    Write-Host "  5. Run 'docker compose logs -f' to view logs" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "Found $failCount critical issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Cyan
    Write-Host "  - Docker not installed: Visit https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "  - Docker not running: Start Docker Desktop" -ForegroundColor White
    Write-Host "  - Port in use: Modify port mapping in docker-compose.yml" -ForegroundColor White
    Write-Host ""
    exit 1
}
