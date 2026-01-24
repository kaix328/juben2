/**
 * PDF 导出工具
 * 使用浏览器原生打印功能生成 PDF
 */

import type { Script, Chapter } from '../types';

/**
 * 生成标准剧本格式的 HTML
 */
function generateScriptHTML(chapter: Chapter, script: Script): string {
  const scenes = script.scenes.map((scene, index) => {
    const sceneHeading = `${scene.sceneNumber}. ${scene.sceneType}. ${scene.location} - ${scene.timeOfDay}`;
    
    const dialogues = scene.dialogues.map(dialogue => `
      <div class="dialogue">
        <div class="character">${dialogue.character}</div>
        ${dialogue.parenthetical ? `<div class="parenthetical">(${dialogue.parenthetical})</div>` : ''}
        <div class="lines">${dialogue.lines}</div>
      </div>
    `).join('');
    
    const transition = scene.transition && index < script.scenes.length - 1
      ? `<div class="transition">${scene.transition}：</div>`
      : '';
    
    return `
      <div class="scene">
        <div class="scene-heading">${sceneHeading}</div>
        ${scene.action ? `<div class="action">${scene.action}</div>` : ''}
        ${dialogues}
        ${transition}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${chapter.title} - 剧本</title>
  <style>
    @page {
      size: A4;
      margin: 2.54cm;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .scene {
        page-break-inside: avoid;
      }
      
      .no-print {
        display: none;
      }
    }
    
    body {
      font-family: "Courier New", Courier, monospace;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      max-width: 21cm;
      margin: 0 auto;
      padding: 2cm;
    }
    
    .title-page {
      text-align: center;
      margin-bottom: 4cm;
      page-break-after: always;
    }
    
    .title {
      font-size: 24pt;
      font-weight: bold;
      margin-top: 8cm;
      margin-bottom: 2cm;
      text-transform: uppercase;
    }
    
    .metadata {
      font-size: 12pt;
      margin-top: 1cm;
    }
    
    .scene {
      margin-bottom: 2em;
    }
    
    .scene-heading {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 1em;
    }
    
    .action {
      margin-bottom: 1em;
      white-space: pre-wrap;
    }
    
    .dialogue {
      margin-bottom: 1em;
    }
    
    .character {
      text-align: center;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 0.25em;
    }
    
    .parenthetical {
      text-align: center;
      font-style: italic;
      margin-bottom: 0.25em;
    }
    
    .lines {
      max-width: 10cm;
      margin: 0 auto;
      white-space: pre-wrap;
    }
    
    .transition {
      text-align: right;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 1em;
      margin-bottom: 1em;
    }
    
    .end {
      text-align: center;
      font-weight: bold;
      margin-top: 4em;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
    }
    
    .print-button:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">打印/保存为PDF</button>
  
  <div class="title-page">
    <div class="title">${chapter.title}</div>
    <div class="metadata">
      <div>剧本类型：${script.mode === 'movie' ? '电影剧本' : script.mode === 'tv_drama' ? '电视剧剧本' : script.mode === 'short_video' ? '短视频剧本' : '网络剧剧本'}</div>
      <div>创建日期：${script.metadata?.draftDate || new Date().toLocaleDateString('zh-CN')}</div>
      <div>版本：${script.metadata?.draft || '初稿'}</div>
      <div>场景数：${script.scenes.length}</div>
    </div>
  </div>
  
  ${scenes}
  
  <div class="end">剧终</div>
</body>
</html>
  `;
}

/**
 * 导出为 PDF（通过打印）
 */
export function exportScriptToPDF(chapter: Chapter, script: Script): void {
  const html = generateScriptHTML(chapter, script);
  
  // 创建新窗口
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('请允许弹出窗口以导出 PDF');
    return;
  }
  
  // 写入 HTML
  printWindow.document.write(html);
  printWindow.document.close();
  
  // 等待内容加载完成后触发打印
  printWindow.onload = () => {
    // 延迟一下确保样式加载完成
    setTimeout(() => {
      printWindow.focus();
      // 打印对话框会自动提供"保存为PDF"选项
    }, 100);
  };
}

/**
 * 导出为可打印的 HTML 文件
 */
export function exportScriptToHTML(chapter: Chapter, script: Script): string {
  return generateScriptHTML(chapter, script);
}

/**
 * 下载 HTML 文件
 */
export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
