#!/usr/bin/env node

/**
 * 清除所有缓存
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function removeDir(dirPath, name) {
  if (fs.existsSync(dirPath)) {
    log(`🗑️  清除 ${name}...`, 'cyan');
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      log(`✓ ${name} 已清除`, 'green');
      return true;
    } catch (error) {
      log(`✗ 清除 ${name} 失败: ${error.message}`, 'red');
      return false;
    }
  }
  return false;
}

function main() {
  log('🧹 开始清除缓存...', 'cyan');
  
  let cleaned = 0;
  
  // 清除 Vite 缓存
  if (removeDir(path.join(projectRoot, 'node_modules', '.vite'), 'Vite 缓存')) {
    cleaned++;
  }
  
  // 清除 dist
  if (removeDir(path.join(projectRoot, 'dist'), 'dist 目录')) {
    cleaned++;
  }
  
  // 清除 coverage
  if (removeDir(path.join(projectRoot, 'coverage'), 'coverage 目录')) {
    cleaned++;
  }
  
  // 清除 .turbo
  if (removeDir(path.join(projectRoot, '.turbo'), '.turbo 缓存')) {
    cleaned++;
  }
  
  if (cleaned === 0) {
    log('\n✨ 没有需要清除的缓存', 'green');
  } else {
    log(`\n✨ 已清除 ${cleaned} 个缓存目录`, 'green');
  }
}

main();
