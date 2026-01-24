#!/usr/bin/env node

/**
 * 自动修复常见问题
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, description) {
  log(`\n🔧 ${description}...`, 'cyan');
  try {
    execSync(command, { cwd: projectRoot, stdio: 'inherit' });
    log(`✓ ${description} 完成`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} 失败`, 'red');
    return false;
  }
}

function main() {
  log('🚀 开始自动修复常见问题...', 'cyan');
  
  // 1. 清除 Vite 缓存
  const viteCachePath = path.join(projectRoot, 'node_modules', '.vite');
  if (fs.existsSync(viteCachePath)) {
    log('\n🗑️  清除 Vite 缓存...', 'cyan');
    try {
      fs.rmSync(viteCachePath, { recursive: true, force: true });
      log('✓ Vite 缓存已清除', 'green');
    } catch (error) {
      log(`✗ 清除缓存失败: ${error.message}`, 'red');
    }
  }

  // 2. 清除 dist 目录
  const distPath = path.join(projectRoot, 'dist');
  if (fs.existsSync(distPath)) {
    log('\n🗑️  清除 dist 目录...', 'cyan');
    try {
      fs.rmSync(distPath, { recursive: true, force: true });
      log('✓ dist 目录已清除', 'green');
    } catch (error) {
      log(`✗ 清除 dist 失败: ${error.message}`, 'red');
    }
  }

  // 3. 检查并修复 package.json scripts
  log('\n📦 检查 package.json...', 'cyan');
  const packagePath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    let modified = false;
    
    // 添加清理脚本
    if (!pkg.scripts['clean-cache']) {
      pkg.scripts['clean-cache'] = 'node scripts/clean-cache.js';
      modified = true;
    }
    
    // 添加诊断脚本
    if (!pkg.scripts['diagnose']) {
      pkg.scripts['diagnose'] = 'node scripts/diagnose-project.js';
      modified = true;
    }
    
    // 添加修复脚本
    if (!pkg.scripts['fix']) {
      pkg.scripts['fix'] = 'node scripts/fix-common-issues.js';
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
      log('✓ package.json 已更新', 'green');
    } else {
      log('✓ package.json 无需更新', 'green');
    }
  }

  // 4. 验证依赖
  log('\n📚 验证依赖...', 'cyan');
  exec('npm install', '安装/更新依赖');

  // 5. 杀死占用端口的进程
  log('\n🔌 检查端口占用...', 'cyan');
  try {
    const result = execSync('netstat -ano | findstr :5173', { encoding: 'utf-8' });
    if (result.includes('LISTENING')) {
      log('  发现端口 5173 被占用，尝试释放...', 'yellow');
      
      // 提取 PID 并杀死进程
      const lines = result.trim().split('\n');
      const pids = [...new Set(lines.map(line => {
        const match = line.match(/\s+(\d+)\s*$/);
        return match ? match[1] : null;
      }).filter(Boolean))];
      
      pids.forEach(pid => {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          log(`  ✓ 已终止进程 ${pid}`, 'green');
        } catch (error) {
          log(`  ✗ 无法终止进程 ${pid}`, 'red');
        }
      });
    } else {
      log('  ✓ 端口 5173 未被占用', 'green');
    }
  } catch (error) {
    log('  ✓ 端口 5173 未被占用', 'green');
  }

  log('\n✨ 修复完成！', 'cyan');
  log('\n下一步:', 'cyan');
  log('1. 运行 npm run dev 启动开发服务器', 'blue');
  log('2. 如果问题仍然存在，运行 npm run diagnose 进行详细诊断', 'blue');
}

main();
