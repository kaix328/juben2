#!/usr/bin/env node

/**
 * 项目诊断脚本
 * 全面检查项目健康状况
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const issues = [];

// 颜色输出
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

function addIssue(category, severity, message, location, suggestion) {
  issues.push({ category, severity, message, location, suggestion });
}

// 1. 检查 package.json
function checkPackageJson() {
  log('\n📦 检查 package.json...', 'cyan');
  
  const packagePath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packagePath)) {
    addIssue('config', 'critical', 'package.json 不存在', packagePath, '创建 package.json 文件');
    return;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    // 检查必需的依赖
    const requiredDeps = ['react', 'react-dom', 'vite'];
    const missingDeps = requiredDeps.filter(dep => 
      !pkg.dependencies?.[dep] && !pkg.peerDependencies?.[dep] && !pkg.devDependencies?.[dep]
    );
    
    if (missingDeps.length > 0) {
      addIssue('dependency', 'critical', 
        `缺少必需依赖: ${missingDeps.join(', ')}`,
        packagePath,
        `运行: npm install ${missingDeps.join(' ')}`
      );
    }

    // 检查 scripts
    if (!pkg.scripts?.dev) {
      addIssue('config', 'high', '缺少 dev script', packagePath, '添加 "dev": "vite" 到 scripts');
    }

    log('✓ package.json 检查完成', 'green');
  } catch (error) {
    addIssue('config', 'critical', `package.json 解析失败: ${error.message}`, packagePath, '修复 JSON 语法错误');
  }
}

// 2. 检查 node_modules
function checkNodeModules() {
  log('\n📚 检查 node_modules...', 'cyan');
  
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    addIssue('dependency', 'critical', 'node_modules 不存在', nodeModulesPath, '运行: npm install');
    return;
  }

  // 检查关键依赖是否存在
  const criticalDeps = ['react', 'react-dom', 'vite'];
  for (const dep of criticalDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      addIssue('dependency', 'critical', `依赖 ${dep} 未安装`, depPath, '运行: npm install');
    }
  }

  log('✓ node_modules 检查完成', 'green');
}

// 3. 检查 Vite 配置
function checkViteConfig() {
  log('\n⚡ 检查 Vite 配置...', 'cyan');
  
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
  if (!fs.existsSync(viteConfigPath)) {
    addIssue('config', 'high', 'vite.config.ts 不存在', viteConfigPath, '创建基本的 Vite 配置文件');
    return;
  }

  try {
    const content = fs.readFileSync(viteConfigPath, 'utf-8');
    
    // 检查必需的插件
    if (!content.includes('@vitejs/plugin-react')) {
      addIssue('config', 'high', 'Vite 配置缺少 React 插件', viteConfigPath, '添加 @vitejs/plugin-react');
    }

    log('✓ Vite 配置检查完成', 'green');
  } catch (error) {
    addIssue('config', 'high', `Vite 配置读取失败: ${error.message}`, viteConfigPath, '检查文件权限');
  }
}

// 4. 检查 TypeScript 配置
function checkTsConfig() {
  log('\n📘 检查 TypeScript 配置...', 'cyan');
  
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    addIssue('config', 'medium', 'tsconfig.json 不存在', tsconfigPath, '创建 TypeScript 配置文件');
    return;
  }

  try {
    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    // 移除注释后解析
    const jsonContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    const tsconfig = JSON.parse(jsonContent);
    
    // 检查必需的编译选项
    if (!tsconfig.compilerOptions?.jsx) {
      addIssue('config', 'high', 'TypeScript 配置缺少 jsx 选项', tsconfigPath, '添加 "jsx": "react-jsx"');
    }

    log('✓ TypeScript 配置检查完成', 'green');
  } catch (error) {
    addIssue('config', 'medium', `TypeScript 配置解析失败: ${error.message}`, tsconfigPath, '修复 JSON 语法错误');
  }
}

// 5. 检查入口文件
function checkEntryFiles() {
  log('\n🚪 检查入口文件...', 'cyan');
  
  const indexHtml = path.join(projectRoot, 'index.html');
  const mainTsx = path.join(projectRoot, 'src', 'main.tsx');
  
  if (!fs.existsSync(indexHtml)) {
    addIssue('code', 'critical', 'index.html 不存在', indexHtml, '创建 index.html 入口文件');
  }
  
  if (!fs.existsSync(mainTsx)) {
    addIssue('code', 'critical', 'src/main.tsx 不存在', mainTsx, '创建 React 入口文件');
  } else {
    const content = fs.readFileSync(mainTsx, 'utf-8');
    if (!content.includes('createRoot') && !content.includes('render')) {
      addIssue('code', 'high', 'main.tsx 缺少 React 渲染代码', mainTsx, '添加 ReactDOM.createRoot 调用');
    }
  }

  log('✓ 入口文件检查完成', 'green');
}

// 6. 检查 Vite 缓存
function checkViteCache() {
  log('\n🗑️  检查 Vite 缓存...', 'cyan');
  
  const viteCachePath = path.join(projectRoot, 'node_modules', '.vite');
  if (fs.existsSync(viteCachePath)) {
    const stats = fs.statSync(viteCachePath);
    const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    
    if (ageInDays > 7) {
      addIssue('performance', 'low', 'Vite 缓存较旧', viteCachePath, '清除缓存: npm run clean-cache');
    }
    
    log(`  缓存年龄: ${ageInDays.toFixed(1)} 天`, 'blue');
  }

  log('✓ Vite 缓存检查完成', 'green');
}

// 7. 检查端口占用
function checkPortUsage() {
  log('\n🔌 检查端口占用...', 'cyan');
  
  try {
    const result = execSync('netstat -ano | findstr :5173', { encoding: 'utf-8' });
    if (result.includes('LISTENING')) {
      const lines = result.trim().split('\n');
      log(`  端口 5173 正在被使用 (${lines.length} 个连接)`, 'yellow');
      
      // 提取 PID
      const pids = lines.map(line => {
        const match = line.match(/\s+(\d+)\s*$/);
        return match ? match[1] : null;
      }).filter(Boolean);
      
      if (pids.length > 0) {
        log(`  进程 ID: ${[...new Set(pids)].join(', ')}`, 'blue');
      }
    }
  } catch (error) {
    log('  端口 5173 未被占用', 'green');
  }

  log('✓ 端口检查完成', 'green');
}

// 8. 检查大文件
function checkLargeFiles() {
  log('\n📏 检查大文件...', 'cyan');
  
  const srcPath = path.join(projectRoot, 'src');
  const largeFiles = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
        const sizeInKB = stat.size / 1024;
        if (sizeInKB > 50) {
          largeFiles.push({ path: filePath, size: sizeInKB });
        }
      }
    }
  }
  
  if (fs.existsSync(srcPath)) {
    scanDirectory(srcPath);
    
    if (largeFiles.length > 0) {
      largeFiles.sort((a, b) => b.size - a.size);
      largeFiles.slice(0, 5).forEach(file => {
        const relativePath = path.relative(projectRoot, file.path);
        addIssue('performance', 'medium', 
          `大文件: ${file.size.toFixed(1)} KB`,
          relativePath,
          '考虑拆分组件或提取逻辑'
        );
        log(`  ${relativePath}: ${file.size.toFixed(1)} KB`, 'yellow');
      });
    }
  }

  log('✓ 大文件检查完成', 'green');
}

// 9. 检查循环依赖（简化版）
function checkCircularDependencies() {
  log('\n🔄 检查潜在的循环依赖...', 'cyan');
  
  // 这里只做简单检查，完整的循环依赖检测需要更复杂的工具
  log('  提示: 使用 madge 工具进行完整的循环依赖检测', 'blue');
  log('  运行: npx madge --circular --extensions ts,tsx src/', 'blue');
  
  log('✓ 循环依赖检查完成', 'green');
}

// 10. 生成报告
function generateReport() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 诊断报告', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const summary = {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };

  log(`\n总问题数: ${summary.total}`, 'blue');
  if (summary.critical > 0) log(`  🔴 严重: ${summary.critical}`, 'red');
  if (summary.high > 0) log(`  🟠 高: ${summary.high}`, 'yellow');
  if (summary.medium > 0) log(`  🟡 中: ${summary.medium}`, 'yellow');
  if (summary.low > 0) log(`  🟢 低: ${summary.low}`, 'green');

  if (issues.length === 0) {
    log('\n✅ 未发现问题！项目健康状况良好。', 'green');
    return;
  }

  log('\n详细问题列表:', 'cyan');
  log('-'.repeat(60), 'cyan');

  issues.forEach((issue, index) => {
    const severityColor = {
      critical: 'red',
      high: 'yellow',
      medium: 'yellow',
      low: 'green'
    }[issue.severity];

    log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`, severityColor);
    log(`   类别: ${issue.category}`, 'blue');
    log(`   位置: ${issue.location}`, 'blue');
    log(`   建议: ${issue.suggestion}`, 'green');
  });

  // 保存报告到文件
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    issues
  };

  const reportPath = path.join(projectRoot, 'diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 详细报告已保存到: ${reportPath}`, 'cyan');

  // 生成修复脚本
  if (summary.critical > 0 || summary.high > 0) {
    log('\n🔧 建议的修复步骤:', 'cyan');
    log('1. 清除缓存: npm run clean-cache (或手动删除 node_modules/.vite)', 'blue');
    log('2. 重新安装依赖: npm install', 'blue');
    log('3. 检查并修复配置文件', 'blue');
    log('4. 重启开发服务器: npm run dev', 'blue');
  }
}

// 主函数
function main() {
  log('🔍 开始项目诊断...', 'cyan');
  log(`项目路径: ${projectRoot}\n`, 'blue');

  checkPackageJson();
  checkNodeModules();
  checkViteConfig();
  checkTsConfig();
  checkEntryFiles();
  checkViteCache();
  checkPortUsage();
  checkLargeFiles();
  checkCircularDependencies();
  
  generateReport();
  
  log('\n✨ 诊断完成！', 'cyan');
  
  // 返回退出码
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  process.exit(criticalIssues > 0 ? 1 : 0);
}

main();
