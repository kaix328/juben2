/**
 * 功能集成检查脚本
 * 自动检查新开发的功能是否已正确集成到主程序中
 */
const fs = require('fs');
const path = require('path');

// 需要检查的功能模块
const modules = [
  {
    name: '智能对话拆分',
    file: 'src/app/utils/ai/smartDialogueSplitter.ts',
    exportedFunctions: ['smartSplitDialogue'],
    shouldBeUsedIn: ['src/app/utils/ai/storyboardGenerator.ts']
  },
  {
    name: '批量处理系统',
    file: 'src/app/utils/ai/batchProcessor.ts',
    exportedFunctions: ['processScenesInBatches', 'splitIntoBatches'],
    shouldBeUsedIn: ['src/app/utils/ai/storyboardGenerator.ts']
  },
  {
    name: '质量检查系统',
    file: 'src/app/utils/ai/qualityChecker.ts',
    exportedFunctions: ['performQualityCheck', 'getIssueStatistics'],
    shouldBeUsedIn: ['src/app/utils/ai/storyboardGenerator.ts']
  },
  {
    name: '错误处理系统',
    file: 'src/app/services/errorHandler.ts',
    exportedFunctions: ['handleExtractError', 'createExtractError'],
    shouldBeUsedIn: ['src/app/utils/ai/storyboardGenerator.ts']
  },
  {
    name: '数量控制系统',
    file: 'src/app/utils/ai/panelCountController.ts',
    exportedFunctions: ['adjustPanelCount', 'calculateTargetRange'],
    shouldBeUsedIn: ['src/app/utils/ai/storyboardGenerator.ts']
  }
];

console.log('🔍 检查功能集成状态...\n');
console.log('='.repeat(60));
console.log('');

let allIntegrated = true;
let totalChecks = 0;
let passedChecks = 0;

modules.forEach((module, index) => {
  console.log(`${index + 1}. 检查: ${module.name}`);
  console.log('-'.repeat(60));
  
  totalChecks++;
  
  // 检查文件是否存在
  if (!fs.existsSync(module.file)) {
    console.log(`  ❌ 文件不存在: ${module.file}`);
    console.log('');
    allIntegrated = false;
    return;
  }
  console.log(`  ✅ 文件存在: ${module.file}`);
  
  // 检查是否被导入和使用
  let isIntegrated = false;
  let integrationDetails = [];
  
  module.shouldBeUsedIn.forEach(targetFile => {
    if (fs.existsSync(targetFile)) {
      const content = fs.readFileSync(targetFile, 'utf-8');
      
      // 检查导入
      const hasImport = module.exportedFunctions.some(func => {
        const importPattern = new RegExp(`import.*${func}.*from`, 'i');
        return importPattern.test(content);
      });
      
      // 检查使用
      const hasUsage = module.exportedFunctions.some(func => {
        const usagePattern = new RegExp(`${func}\\s*\\(`, 'g');
        const matches = content.match(usagePattern);
        return matches && matches.length > 0;
      });
      
      if (hasImport && hasUsage) {
        console.log(`  ✅ 已集成到: ${targetFile}`);
        
        // 统计使用次数
        module.exportedFunctions.forEach(func => {
          const usagePattern = new RegExp(`${func}\\s*\\(`, 'g');
          const matches = content.match(usagePattern);
          if (matches) {
            console.log(`     - ${func}: 使用 ${matches.length} 次`);
          }
        });
        
        isIntegrated = true;
        integrationDetails.push(targetFile);
      } else if (hasImport && !hasUsage) {
        console.log(`  ⚠️  已导入但未使用: ${targetFile}`);
        allIntegrated = false;
      } else if (!hasImport && hasUsage) {
        console.log(`  ⚠️  已使用但未导入: ${targetFile}`);
        allIntegrated = false;
      }
    }
  });
  
  if (!isIntegrated) {
    console.log(`  ❌ 未集成！需要在以下文件中使用:`);
    module.shouldBeUsedIn.forEach(f => console.log(`     - ${f}`));
    allIntegrated = false;
  } else {
    passedChecks++;
  }
  
  console.log('');
});

console.log('='.repeat(60));
console.log('');
console.log('📊 检查结果汇总:');
console.log(`   总检查项: ${totalChecks}`);
console.log(`   通过: ${passedChecks}`);
console.log(`   失败: ${totalChecks - passedChecks}`);
console.log(`   通过率: ${Math.round(passedChecks / totalChecks * 100)}%`);
console.log('');

if (allIntegrated) {
  console.log('✅ 所有功能已正确集成！');
  console.log('');
  console.log('🎉 集成检查通过，可以继续开发或部署。');
  process.exit(0);
} else {
  console.log('❌ 发现未集成或集成不完整的功能！');
  console.log('');
  console.log('⚠️  请立即修复集成问题：');
  console.log('   1. 检查导入语句是否正确');
  console.log('   2. 确认函数是否被调用');
  console.log('   3. 运行测试验证功能');
  console.log('   4. 查看 INTEGRATION_CHECKLIST.md 获取详细指导');
  console.log('');
  process.exit(1);
}
