#!/usr/bin/env node

/**
 * 代码质量预检查脚本
 * 在构建前自动检查常见问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始代码质量检查...\n');

let hasErrors = false;
let hasWarnings = false;

// 检查项目配置
function checkProjectConfig() {
  console.log('📋 检查项目配置...');
  
  // 检查 tsconfig.json
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    const hasPathAlias = tsconfig.compilerOptions?.paths?.['@/*'];
    
    if (hasPathAlias) {
      console.log('  ⚠️  检测到路径别名配置 @/*');
      console.log('  💡 建议：检查所有导入是否使用相对路径');
      hasWarnings = true;
    } else {
      console.log('  ✅ 未配置路径别名，使用相对路径');
    }
  }
  console.log('');
}

// 检查导入路径
function checkImportPaths() {
  console.log('📦 检查导入路径...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllTsxFiles(srcDir);
  
  let aliasImportCount = 0;
  const filesWithAliasImports = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // 检查 @/ 别名导入
      if (line.includes('from \'@/') || line.includes('from "@/')) {
        aliasImportCount++;
        filesWithAliasImports.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          content: line.trim()
        });
      }
    });
  });
  
  if (aliasImportCount > 0) {
    console.log(`  ❌ 发现 ${aliasImportCount} 处使用路径别名 @/`);
    console.log('  📝 问题文件：');
    filesWithAliasImports.slice(0, 5).forEach(item => {
      console.log(`     ${item.file}:${item.line}`);
      console.log(`     ${item.content}`);
    });
    if (filesWithAliasImports.length > 5) {
      console.log(`     ... 还有 ${filesWithAliasImports.length - 5} 处`);
    }
    console.log('  💡 解决方案：将 @/ 替换为相对路径 ../ 或 ../../');
    hasErrors = true;
  } else {
    console.log('  ✅ 所有导入使用相对路径');
  }
  console.log('');
}

// 检查接口定义
function checkInterfaceUsage() {
  console.log('🔧 检查组件接口...');
  
  const componentsDir = path.join(process.cwd(), 'src/app/components');
  if (!fs.existsSync(componentsDir)) {
    console.log('  ⚪ 跳过：components 目录不存在');
    console.log('');
    return;
  }
  
  const files = getAllTsxFiles(componentsDir);
  let complexInterfaceCount = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    // 检查是否有复杂的回调函数签名
    const complexCallbackPattern = /on\w+:\s*\([^)]+\)\s*=>\s*\{[^}]+\}/g;
    const matches = content.match(complexCallbackPattern);
    
    if (matches && matches.length > 2) {
      complexInterfaceCount++;
      console.log(`  ⚠️  ${path.relative(process.cwd(), file)}`);
      console.log(`     发现 ${matches.length} 个复杂回调函数签名`);
      hasWarnings = true;
    }
  });
  
  if (complexInterfaceCount === 0) {
    console.log('  ✅ 组件接口设计合理');
  } else {
    console.log(`  💡 建议：简化 ${complexInterfaceCount} 个组件的接口设计`);
  }
  console.log('');
}

// 检查未使用的导入
function checkUnusedImports() {
  console.log('🧹 检查未使用的导入...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllTsxFiles(srcDir);
  
  let unusedCount = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // 简单检查：导入但未在代码中使用
    lines.forEach((line, index) => {
      if (line.includes('import') && line.includes('from')) {
        const importMatch = line.match(/import\s+\{([^}]+)\}/);
        if (importMatch) {
          const imports = importMatch[1].split(',').map(s => s.trim());
          imports.forEach(imp => {
            const name = imp.split(' as ')[0].trim();
            // 检查是否在后续代码中使用
            const restContent = lines.slice(index + 1).join('\n');
            if (!restContent.includes(name)) {
              unusedCount++;
            }
          });
        }
      }
    });
  });
  
  if (unusedCount > 0) {
    console.log(`  ⚠️  可能存在 ${unusedCount} 个未使用的导入`);
    console.log('  💡 建议：运行 IDE 的优化导入功能');
    hasWarnings = true;
  } else {
    console.log('  ✅ 未发现明显的未使用导入');
  }
  console.log('');
}

// 检查常见错误模式
function checkCommonMistakes() {
  console.log('🐛 检查常见错误...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllTsxFiles(srcDir);
  
  let issueCount = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);
    
    // 检查 1: 条件性调用 Hook
    if (content.match(/if\s*\([^)]+\)\s*\{[^}]*use[A-Z]\w+\(/)) {
      console.log(`  ⚠️  ${relativePath}`);
      console.log('     可能存在条件性调用 Hook');
      issueCount++;
    }
    
    // 检查 2: 在循环中调用 Hook
    if (content.match(/\.(map|forEach|filter)\([^)]*use[A-Z]\w+\(/)) {
      console.log(`  ⚠️  ${relativePath}`);
      console.log('     可能在循环中调用 Hook');
      issueCount++;
    }
    
    // 检查 3: 缺少依赖项
    const effectMatches = content.match(/useEffect\([^,]+,\s*\[([^\]]*)\]/g);
    if (effectMatches) {
      effectMatches.forEach(match => {
        if (match.includes('[]') && match.length > 50) {
          // 空依赖数组但 effect 很长，可能遗漏依赖
          console.log(`  ⚠️  ${relativePath}`);
          console.log('     useEffect 可能缺少依赖项');
          issueCount++;
        }
      });
    }
  });
  
  if (issueCount === 0) {
    console.log('  ✅ 未发现常见错误模式');
  } else {
    console.log(`  💡 发现 ${issueCount} 个潜在问题，请仔细检查`);
    hasWarnings = true;
  }
  console.log('');
}

// 辅助函数：递归获取所有 .tsx 和 .ts 文件
function getAllTsxFiles(dir) {
  let results = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 dist
      if (!file.includes('node_modules') && !file.includes('dist')) {
        results = results.concat(getAllTsxFiles(filePath));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  
  return results;
}

// 执行所有检查
try {
  checkProjectConfig();
  checkImportPaths();
  checkInterfaceUsage();
  checkUnusedImports();
  checkCommonMistakes();
  
  console.log('==================================================\n');
  
  if (hasErrors) {
    console.log('❌ 发现严重问题，请修复后再构建！\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  发现一些警告，建议修复以提高代码质量\n');
    console.log('✅ 允许继续构建\n');
    process.exit(0);
  } else {
    console.log('✅ 所有检查通过！\n');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ 检查过程出错:', error.message);
  console.log('⚠️  跳过质量检查，继续构建\n');
  process.exit(0);
}
