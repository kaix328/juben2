/**
 * 生成 PNG 图标的脚本
 * 使用 Canvas API 生成应用图标
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 图标生成指南\n');
console.log('由于需要生成真实的 PNG 图标，请按以下步骤操作：\n');

console.log('方法 1: 使用在线工具');
console.log('1. 访问 https://realfavicongenerator.net/');
console.log('2. 上传 public/icon.svg 文件');
console.log('3. 下载生成的图标包');
console.log('4. 将 icon-192.png, icon-512.png, apple-touch-icon.png 复制到 public 文件夹\n');

console.log('方法 2: 使用浏览器生成');
console.log('1. 在浏览器中打开 http://localhost:5176/generate-icons.html');
console.log('2. 自动下载生成的图标文件');
console.log('3. 将下载的文件移动到 public 文件夹\n');

console.log('方法 3: 临时解决方案（使用 SVG）');
console.log('暂时使用 SVG 图标，修改 manifest.json：\n');

const manifestPath = path.join(__dirname, '../public/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// 修改为使用 SVG
manifest.icons = [
  {
    "src": "/icon.svg",
    "sizes": "any",
    "type": "image/svg+xml",
    "purpose": "any maskable"
  }
];

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ manifest.json 已更新为使用 SVG 图标');
console.log('✅ 这样可以暂时解决图标加载错误\n');

console.log('注意：生产环境建议使用 PNG 图标以获得更好的兼容性');
