#!/usr/bin/env node

/**
 * 部署验证脚本
 * 自动检查项目是否准备好部署
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const checks = [];
let passedChecks = 0;
let totalChecks = 0;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addCheck(name, passed, message) {
  totalChecks++;
  if (passed) {
    passedChecks++;
    checks.push({ name, passed: true, message });
    log(`  ✓ ${name}`, 'green');
  } else {
    checks.push({ name, passed: false, message });
    log(`  ✗ ${name}`, 'red');
    if (message) {
      log(`    ${message}`, 'yellow');
    }
  }
}

// 1. 检查Node.js版本
function checkNodeVersion() {
  log('\n📦 检查Node.js环境...', 'cyan');
  
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    addCheck(
      'Node.js版本',
      majorVersion >= 18,
      majorVersion >= 18 ? `版本: ${nodeVersion}` : `需要 >= 18.0.0，当前: ${nodeVersion}`
    );
  } catch (error) {
    addCheck('Node.js版本', false, error.message);
  }
}

// 2. 检查依赖安装
function checkDependencies() {
  log('\n📚 检查依赖安装...', 'cyan');
  
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  addCheck(
    'node_modules存在',
    fs.existsSync(nodeModulesPath),
    fs.existsSync(nodeModulesPath) ? '依赖已安装' : '请运行: npm install'
  );
  
  // 检查关键依赖
  const criticalDeps = ['react', 'react-dom', 'vite'];
  for (const dep of criticalDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    addCheck(
      `依赖: ${dep}`,
      fs.existsSync(depPath),
      fs.existsSync(depPath) ? '已安装' : '缺失'
    );
  }
}

// 3. 检查配置文件
function checkConfigFiles() {
  log('\n⚙️  检查配置文件...', 'cyan');
  
  const configFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'docker-compose.yml',
    'Dockerfile',
    'nginx.conf',
  ];
  
  for (const file of configFiles) {
    const filePath = path.join(projectRoot, file);
    addCheck(
      file,
      fs.existsSync(filePath),
      fs.existsSync(filePath) ? '存在' : '缺失'
    );
  }
}

// 4. 检查环境变量文档
function checkEnvDocs() {
  log('\n📄 检查环境变量文档...', 'cyan');
  
  const envDocs = [
    'ENV_CONFIG_GUIDE.md',
    '.env.example',
  ];
  
  for (const doc of envDocs) {
    const docPath = path.join(projectRoot, doc);
    addCheck(
      doc,
      fs.existsSync(docPath),
      fs.existsSync(docPath) ? '存在' : '建议创建'
    );
  }
  
  // 检查是否有.env.local（开发环境）
  const envLocalPath = path.join(projectRoot, '.env.local');
  const hasEnvLocal = fs.existsSync(envLocalPath);
  addCheck(
    '.env.local (开发环境)',
    hasEnvLocal,
    hasEnvLocal ? '已配置' : '建议创建并配置API密钥'
  );
}

// 5. 检查新创建的组件
function checkNewComponents() {
  log('\n🧩 检查重构后的组件...', 'cyan');
  
  const components = [
    'src/app/pages/ScriptEditor/components/ScriptEditorHeader.tsx',
    'src/app/pages/ScriptEditor/components/ScriptEditorToolbar.tsx',
    'src/app/pages/ScriptEditor/components/ScriptEditorDialogs.tsx',
    'src/app/pages/ScriptEditor/components/ScriptEditorSceneList.tsx',
    'src/app/pages/ScriptEditor/index.refactored.tsx',
  ];
  
  for (const component of components) {
    const componentPath = path.join(projectRoot, component);
    addCheck(
      path.basename(component),
      fs.existsSync(componentPath),
      fs.existsSync(componentPath) ? '已创建' : '缺失'
    );
  }
}

// 6. 检查文档完整性
function checkDocumentation() {
  log('\n📚 检查文档完整性...', 'cyan');
  
  const docs = [
    'ENV_CONFIG_GUIDE.md',
    'DOCKER_DEPLOYMENT.md',
    'COMPONENT_REFACTORING_REPORT.md',
    'SENTRY_INTEGRATION_GUIDE.md',
    'OPTIMIZATION_SUMMARY.md',
    'DEPLOYMENT_CHECKLIST.md',
  ];
  
  for (const doc of docs) {
    const docPath = path.join(projectRoot, doc);
    addCheck(
      doc,
      fs.existsSync(docPath),
      fs.existsSync(docPath) ? '存在' : '缺失'
    );
  }
}

// 7. 运行测试（可选）
function runTests() {
  log('\n🧪 运行测试...', 'cyan');
  
  try {
    execSync('npm test -- --run --reporter=dot', {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 60000,
    });
    addCheck('测试套件', true, '所有测试通过');
  } catch (error) {
    addCheck('测试套件', false, '部分测试失败，请检查');
  }
}

// 8. 检查构建
function checkBuild() {
  log('\n🏗️  检查构建能力...', 'cyan');
  
  try {
    log('  正在构建...（这可能需要一些时间）', 'blue');
    execSync('npm run build', {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 120000,
    });
    
    const distPath = path.join(projectRoot, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    addCheck('构建成功', fs.existsSync(distPath), '构建产物已生成');
    addCheck('index.html存在', fs.existsSync(indexPath), 'HTML文件已生成');
    
    // 检查构建大小
    if (fs.existsSync(distPath)) {
      const stats = fs.statSync(distPath);
      log(`  构建目录: dist/`, 'blue');
    }
  } catch (error) {
    addCheck('构建成功', false, '构建失败，请检查错误信息');
  }
}

// 9. 检查Docker配置
function checkDockerConfig() {
  log('\n🐳 检查Docker配置...', 'cyan');
  
  const dockerComposePath = path.join(projectRoot, 'docker-compose.yml');
  const dockerfilePath = path.join(projectRoot, 'Dockerfile');
  
  if (fs.existsSync(dockerComposePath)) {
    const content = fs.readFileSync(dockerComposePath, 'utf-8');
    addCheck(
      'docker-compose.yml配置',
      content.includes('VITE_BASE_PATH') && content.includes('env_file'),
      '包含环境变量配置'
    );
  }
  
  if (fs.existsSync(dockerfilePath)) {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    addCheck(
      'Dockerfile配置',
      content.includes('ARG VITE_BASE_PATH') && content.includes('ENV VITE_BASE_PATH'),
      '支持构建参数'
    );
  }
}

// 10. 生成报告
function generateReport() {
  log('\n============================================================', 'cyan');
  log('📊 部署验证报告', 'cyan');
  log('============================================================', 'cyan');
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  
  log(`\n总检查项: ${totalChecks}`, 'blue');
  log(`通过: ${passedChecks}`, 'green');
  log(`失败: ${totalChecks - passedChecks}`, 'red');
  log(`通过率: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');
  
  if (percentage === 100) {
    log('\n✅ 恭喜！项目已准备好部署！', 'green');
    log('\n下一步:', 'cyan');
    log('  1. 配置环境变量（.env.local 或 .env.production）', 'blue');
    log('  2. 运行 npm run dev 测试开发环境', 'blue');
    log('  3. 运行 docker-compose up -d 部署Docker', 'blue');
    log('  4. 访问 http://localhost 验证部署', 'blue');
  } else if (percentage >= 80) {
    log('\n⚠️  项目基本准备就绪，但有一些建议改进', 'yellow');
    log('\n建议:', 'cyan');
    const failedChecks = checks.filter(c => !c.passed);
    failedChecks.forEach(check => {
      log(`  - ${check.name}: ${check.message}`, 'yellow');
    });
  } else {
    log('\n❌ 项目还未准备好部署，请解决以下问题:', 'red');
    const failedChecks = checks.filter(c => !c.passed);
    failedChecks.forEach(check => {
      log(`  - ${check.name}: ${check.message}`, 'red');
    });
  }
  
  // 保存报告
  const report = {
    timestamp: new Date().toISOString(),
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    percentage,
    checks: checks.map(c => ({
      name: c.name,
      passed: c.passed,
      message: c.message,
    })),
  };
  
  const reportPath = path.join(projectRoot, 'deployment-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 详细报告已保存到: deployment-verification-report.json`, 'cyan');
  
  log('\n✨ 验证完成！\n', 'cyan');
  
  // 返回退出码
  process.exit(percentage === 100 ? 0 : 1);
}

// 主函数
function main() {
  log('🚀 开始部署验证...', 'cyan');
  log(`项目路径: ${projectRoot}\n`, 'blue');
  
  try {
    checkNodeVersion();
    checkDependencies();
    checkConfigFiles();
    checkEnvDocs();
    checkNewComponents();
    checkDocumentation();
    checkDockerConfig();
    
    // 可选检查（耗时较长）
    const skipTests = process.argv.includes('--skip-tests');
    const skipBuild = process.argv.includes('--skip-build');
    
    if (!skipTests) {
      runTests();
    } else {
      log('\n🧪 跳过测试（使用 --skip-tests）', 'yellow');
    }
    
    if (!skipBuild) {
      checkBuild();
    } else {
      log('\n🏗️  跳过构建（使用 --skip-build）', 'yellow');
    }
    
    generateReport();
  } catch (error) {
    log(`\n❌ 验证过程出错: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行
main();
