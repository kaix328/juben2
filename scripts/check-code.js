import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检查关键文件是否完整
const criticalFiles = [
  'src/app/components/storyboard/ShotCard.tsx',
  'src/app/pages/StoryboardEditor/index.tsx',
  'src/app/components/storyboard/StoryboardHeader.tsx',
  'src/app/components/storyboard/BatchActionBar.tsx',
];

const requiredPatterns = {
  'ShotCard.tsx': [
    '第1行：画面描述',
    '第2行：景别',
    '第3行：角色',
    '第4行：转场',
    '第5行：镜头焦距',
    '第6行：备注',
    '第7行：绘画提示词',
  ],
  'index.tsx': [
    'StoryboardHeader',
    'BatchActionBar',
    'TimelineView',
    'ResourceSidebar',
  ]
};

function checkFile(filePath) {
  const fullPath = path.join(path.dirname(__dirname), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const fileName = path.basename(filePath);
  const patterns = requiredPatterns[fileName];
  
  if (!patterns) {
    console.log(`⚪ ${fileName} (无检查规则)`);
    return true;
  }
  
  const missing = patterns.filter(p => !content.includes(p));
  
  if (missing.length > 0) {
    console.error(`❌ ${fileName} 缺失以下内容:`);
    missing.forEach(m => console.error(`   - ${m}`));
    return false;
  }
  
  console.log(`✅ ${fileName} 检查通过`);
  return true;
}

// 执行检查
console.log('🔍 开始检查关键文件完整性...\n');

let allPassed = true;
criticalFiles.forEach(file => {
  if (!checkFile(file)) allPassed = false;
});

console.log('\n' + '='.repeat(50));

if (!allPassed) {
  console.error('\n⚠️  代码完整性检查失败！');
  console.error('请检查上述缺失的内容，或从备份恢复。\n');
  process.exit(1);
}

console.log('\n✅ 所有关键文件检查通过！\n');
process.exit(0);
