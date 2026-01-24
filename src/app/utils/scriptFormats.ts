/**
 * 专业剧本格式支持
 * 支持 Final Draft XML、Fountain、PDF 等专业格式的导入导出
 */

// ============ 类型定义 ============

export type ScriptFormat = 'fountain' | 'fdx' | 'pdf' | 'json' | 'txt';

export interface ScriptElement {
  type: ScriptElementType;
  content: string;
  metadata?: Record<string, any>;
}

export type ScriptElementType = 
  | 'scene_heading'      // 场景标题
  | 'action'             // 动作描述
  | 'character'          // 角色名
  | 'dialogue'           // 对白
  | 'parenthetical'      // 括号说明
  | 'transition'         // 转场
  | 'shot'               // 镜头
  | 'note'               // 注释
  | 'section'            // 章节
  | 'synopsis'           // 概要
  | 'page_break'         // 分页
  | 'dual_dialogue';     // 双人对白

export interface ParsedScript {
  title: string;
  author?: string;
  contact?: string;
  draft?: string;
  date?: string;
  copyright?: string;
  elements: ScriptElement[];
  metadata: Record<string, any>;
}

export interface ExportOptions {
  format: ScriptFormat;
  includeNotes?: boolean;
  includeMetadata?: boolean;
  pageSize?: 'letter' | 'a4';
  fontSize?: number;
}

// ============ Fountain 解析器 ============

/**
 * Fountain 格式解析器
 * Fountain 是一种纯文本剧本格式
 */
export class FountainParser {
  private lines: string[] = [];
  private currentIndex = 0;

  /**
   * 解析 Fountain 文本
   */
  parse(text: string): ParsedScript {
    this.lines = text.split('\n');
    this.currentIndex = 0;

    const result: ParsedScript = {
      title: '',
      elements: [],
      metadata: {}
    };

    // 解析标题页
    this.parseTitlePage(result);

    // 解析正文
    while (this.currentIndex < this.lines.length) {
      const element = this.parseElement();
      if (element) {
        result.elements.push(element);
      }
    }

    return result;
  }

  private parseTitlePage(result: ParsedScript): void {
    // 检查是否有标题页（以 key: value 格式开始）
    const titlePagePattern = /^(Title|Credit|Author|Source|Draft date|Contact|Copyright|Notes):\s*(.*)$/i;
    
    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex].trim();
      
      if (line === '') {
        this.currentIndex++;
        continue;
      }

      const match = line.match(titlePagePattern);
      if (match) {
        const key = match[1].toLowerCase().replace(' ', '_');
        let value = match[2];

        // 处理多行值
        while (this.currentIndex + 1 < this.lines.length) {
          const nextLine = this.lines[this.currentIndex + 1];
          if (nextLine.startsWith('   ') || nextLine.startsWith('\t')) {
            value += '\n' + nextLine.trim();
            this.currentIndex++;
          } else {
            break;
          }
        }

        if (key === 'title') result.title = value;
        else if (key === 'author') result.author = value;
        else if (key === 'contact') result.contact = value;
        else if (key === 'draft_date') result.draft = value;
        else if (key === 'copyright') result.copyright = value;
        else result.metadata[key] = value;

        this.currentIndex++;
      } else {
        // 标题页结束
        break;
      }
    }
  }

  private parseElement(): ScriptElement | null {
    if (this.currentIndex >= this.lines.length) return null;

    const line = this.lines[this.currentIndex];
    const trimmedLine = line.trim();

    // 空行
    if (trimmedLine === '') {
      this.currentIndex++;
      return null;
    }

    // 场景标题 (INT./EXT. 或 . 开头强制)
    if (this.isSceneHeading(trimmedLine)) {
      this.currentIndex++;
      return {
        type: 'scene_heading',
        content: trimmedLine.startsWith('.') ? trimmedLine.slice(1) : trimmedLine
      };
    }

    // 转场 (> 开头或以 TO: 结尾)
    if (trimmedLine.startsWith('>') || /^[A-Z\s]+TO:$/.test(trimmedLine)) {
      this.currentIndex++;
      return {
        type: 'transition',
        content: trimmedLine.startsWith('>') ? trimmedLine.slice(1).trim() : trimmedLine
      };
    }

    // 章节 (# 开头)
    if (trimmedLine.startsWith('#')) {
      const level = trimmedLine.match(/^#+/)?.[0].length || 1;
      this.currentIndex++;
      return {
        type: 'section',
        content: trimmedLine.replace(/^#+\s*/, ''),
        metadata: { level }
      };
    }

    // 概要 (= 开头)
    if (trimmedLine.startsWith('=')) {
      this.currentIndex++;
      return {
        type: 'synopsis',
        content: trimmedLine.slice(1).trim()
      };
    }

    // 注释 ([[ ]] 包围)
    if (trimmedLine.startsWith('[[')) {
      let content = trimmedLine;
      while (!content.includes(']]') && this.currentIndex + 1 < this.lines.length) {
        this.currentIndex++;
        content += '\n' + this.lines[this.currentIndex];
      }
      this.currentIndex++;
      return {
        type: 'note',
        content: content.replace(/^\[\[|\]\]$/g, '').trim()
      };
    }

    // 角色名 (全大写，可能带 ^)
    if (this.isCharacter(trimmedLine)) {
      const isDual = trimmedLine.endsWith('^');
      const characterName = trimmedLine.replace(/\^$/, '').trim();
      this.currentIndex++;

      // 收集对白
      const dialogueElements: ScriptElement[] = [];
      
      while (this.currentIndex < this.lines.length) {
        const dialogueLine = this.lines[this.currentIndex].trim();
        
        if (dialogueLine === '') {
          break;
        }

        // 括号说明
        if (dialogueLine.startsWith('(') && dialogueLine.endsWith(')')) {
          dialogueElements.push({
            type: 'parenthetical',
            content: dialogueLine
          });
        } else {
          dialogueElements.push({
            type: 'dialogue',
            content: dialogueLine
          });
        }
        
        this.currentIndex++;
      }

      return {
        type: 'character',
        content: characterName,
        metadata: {
          isDual,
          dialogue: dialogueElements
        }
      };
    }

    // 镜头 (全大写以 SHOT 结尾或特定格式)
    if (/^[A-Z\s]+SHOT/.test(trimmedLine) || trimmedLine.startsWith('ANGLE ON')) {
      this.currentIndex++;
      return {
        type: 'shot',
        content: trimmedLine
      };
    }

    // 分页
    if (trimmedLine === '===') {
      this.currentIndex++;
      return {
        type: 'page_break',
        content: ''
      };
    }

    // 默认为动作描述
    let content = trimmedLine;
    this.currentIndex++;

    // 合并连续的动作行
    while (this.currentIndex < this.lines.length) {
      const nextLine = this.lines[this.currentIndex].trim();
      if (nextLine === '' || this.isSceneHeading(nextLine) || this.isCharacter(nextLine)) {
        break;
      }
      content += '\n' + nextLine;
      this.currentIndex++;
    }

    return {
      type: 'action',
      content
    };
  }

  private isSceneHeading(line: string): boolean {
    // 强制场景标题
    if (line.startsWith('.') && !line.startsWith('..')) return true;
    
    // 标准场景标题
    const scenePattern = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)/i;
    return scenePattern.test(line);
  }

  private isCharacter(line: string): boolean {
    // @ 开头强制角色
    if (line.startsWith('@')) return true;
    
    // 全大写（允许数字和一些标点）
    if (line === line.toUpperCase() && /^[A-Z][A-Z0-9\s\-'\.]+(\s*\^)?$/.test(line)) {
      // 排除一些常见的非角色全大写词
      const excluded = ['INT.', 'EXT.', 'CUT TO:', 'FADE IN:', 'FADE OUT:', 'THE END'];
      return !excluded.some(e => line.startsWith(e));
    }
    
    return false;
  }
}

// ============ Fountain 生成器 ============

export class FountainGenerator {
  /**
   * 生成 Fountain 格式文本
   */
  generate(script: ParsedScript): string {
    const lines: string[] = [];

    // 标题页
    if (script.title) lines.push(`Title: ${script.title}`);
    if (script.author) lines.push(`Author: ${script.author}`);
    if (script.contact) lines.push(`Contact: ${script.contact}`);
    if (script.draft) lines.push(`Draft date: ${script.draft}`);
    if (script.copyright) lines.push(`Copyright: ${script.copyright}`);
    
    if (lines.length > 0) {
      lines.push('', ''); // 标题页后空两行
    }

    // 正文
    for (const element of script.elements) {
      switch (element.type) {
        case 'scene_heading':
          lines.push('', element.content.toUpperCase());
          break;

        case 'action':
          lines.push('', element.content);
          break;

        case 'character':
          lines.push('', element.content.toUpperCase());
          if (element.metadata?.dialogue) {
            for (const d of element.metadata.dialogue) {
              if (d.type === 'parenthetical') {
                lines.push(d.content);
              } else {
                lines.push(d.content);
              }
            }
          }
          break;

        case 'transition':
          lines.push('', `> ${element.content}`);
          break;

        case 'section':
          const level = element.metadata?.level || 1;
          lines.push('', '#'.repeat(level) + ' ' + element.content);
          break;

        case 'synopsis':
          lines.push('', `= ${element.content}`);
          break;

        case 'note':
          lines.push('', `[[${element.content}]]`);
          break;

        case 'shot':
          lines.push('', element.content.toUpperCase());
          break;

        case 'page_break':
          lines.push('', '===');
          break;
      }
    }

    return lines.join('\n');
  }
}

// ============ Final Draft XML 解析器 ============

export class FDXParser {
  /**
   * 解析 Final Draft XML
   */
  parse(xml: string): ParsedScript {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const result: ParsedScript = {
      title: '',
      elements: [],
      metadata: {}
    };

    // 解析标题页
    const titlePage = doc.querySelector('TitlePage');
    if (titlePage) {
      const titleContent = titlePage.querySelector('Content[Type="Title"]');
      if (titleContent) {
        result.title = titleContent.textContent || '';
      }
      
      const authorContent = titlePage.querySelector('Content[Type="Author"]');
      if (authorContent) {
        result.author = authorContent.textContent || '';
      }
    }

    // 解析段落
    const paragraphs = doc.querySelectorAll('Paragraph');
    paragraphs.forEach(para => {
      const type = para.getAttribute('Type') || '';
      const text = para.querySelector('Text')?.textContent || '';

      const typeMap: Record<string, ScriptElementType> = {
        'Scene Heading': 'scene_heading',
        'Action': 'action',
        'Character': 'character',
        'Dialogue': 'dialogue',
        'Parenthetical': 'parenthetical',
        'Transition': 'transition',
        'Shot': 'shot'
      };

      const elementType = typeMap[type] || 'action';
      result.elements.push({
        type: elementType,
        content: text
      });
    });

    return result;
  }
}

// ============ Final Draft XML 生成器 ============

export class FDXGenerator {
  /**
   * 生成 Final Draft XML
   */
  generate(script: ParsedScript): string {
    const typeMap: Record<ScriptElementType, string> = {
      'scene_heading': 'Scene Heading',
      'action': 'Action',
      'character': 'Character',
      'dialogue': 'Dialogue',
      'parenthetical': 'Parenthetical',
      'transition': 'Transition',
      'shot': 'Shot',
      'note': 'Action',
      'section': 'Action',
      'synopsis': 'Action',
      'page_break': 'Action',
      'dual_dialogue': 'Dialogue'
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="3">
  <Content>
    <TitlePage>
      <Content Type="Title">${this.escapeXml(script.title)}</Content>
      ${script.author ? `<Content Type="Author">${this.escapeXml(script.author)}</Content>` : ''}
    </TitlePage>
`;

    for (const element of script.elements) {
      const fdxType = typeMap[element.type] || 'Action';
      xml += `    <Paragraph Type="${fdxType}">
      <Text>${this.escapeXml(element.content)}</Text>
    </Paragraph>
`;

      // 处理角色的对白
      if (element.type === 'character' && element.metadata?.dialogue) {
        for (const d of element.metadata.dialogue) {
          const dType = d.type === 'parenthetical' ? 'Parenthetical' : 'Dialogue';
          xml += `    <Paragraph Type="${dType}">
      <Text>${this.escapeXml(d.content)}</Text>
    </Paragraph>
`;
        }
      }
    }

    xml += `  </Content>
</FinalDraft>`;

    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// ============ 统一导出接口 ============

export class ScriptFormatConverter {
  private fountainParser = new FountainParser();
  private fountainGenerator = new FountainGenerator();
  private fdxParser = new FDXParser();
  private fdxGenerator = new FDXGenerator();

  /**
   * 导入剧本
   */
  import(content: string, format: ScriptFormat): ParsedScript {
    switch (format) {
      case 'fountain':
        return this.fountainParser.parse(content);
      case 'fdx':
        return this.fdxParser.parse(content);
      case 'json':
        return JSON.parse(content) as ParsedScript;
      case 'txt':
        return this.parseSimpleText(content);
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
  }

  /**
   * 导出剧本
   */
  export(script: ParsedScript, options: ExportOptions): string {
    switch (options.format) {
      case 'fountain':
        return this.fountainGenerator.generate(script);
      case 'fdx':
        return this.fdxGenerator.generate(script);
      case 'json':
        return JSON.stringify(script, null, 2);
      case 'txt':
        return this.generateSimpleText(script);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * 格式转换
   */
  convert(content: string, fromFormat: ScriptFormat, toFormat: ScriptFormat): string {
    const script = this.import(content, fromFormat);
    return this.export(script, { format: toFormat });
  }

  /**
   * 解析简单文本
   */
  private parseSimpleText(text: string): ParsedScript {
    const lines = text.split('\n');
    const elements: ScriptElement[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 简单启发式解析
      if (/^(INT\.|EXT\.|内景|外景)/.test(trimmed)) {
        elements.push({ type: 'scene_heading', content: trimmed });
      } else if (/^[A-Z\u4e00-\u9fa5]{2,}[:：]/.test(trimmed)) {
        // 角色对白
        const match = trimmed.match(/^([A-Z\u4e00-\u9fa5]+)[:：]\s*(.*)$/);
        if (match) {
          elements.push({ type: 'character', content: match[1] });
          elements.push({ type: 'dialogue', content: match[2] });
        }
      } else {
        elements.push({ type: 'action', content: trimmed });
      }
    }

    return {
      title: '未命名剧本',
      elements,
      metadata: {}
    };
  }

  /**
   * 生成简单文本
   */
  private generateSimpleText(script: ParsedScript): string {
    const lines: string[] = [];

    if (script.title) {
      lines.push(script.title, '');
    }

    let lastCharacter = '';

    for (const element of script.elements) {
      switch (element.type) {
        case 'scene_heading':
          lines.push('', element.content, '');
          break;
        case 'action':
          lines.push(element.content);
          break;
        case 'character':
          lastCharacter = element.content;
          break;
        case 'dialogue':
          lines.push(`${lastCharacter}：${element.content}`);
          break;
        case 'parenthetical':
          lines.push(`${element.content}`);
          break;
        case 'transition':
          lines.push('', element.content, '');
          break;
      }
    }

    return lines.join('\n');
  }

  /**
   * 检测格式
   */
  detectFormat(content: string): ScriptFormat {
    const trimmed = content.trim();

    // FDX (XML)
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<FinalDraft')) {
      return 'fdx';
    }

    // JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not JSON
      }
    }

    // Fountain (检查标题页或场景标题)
    if (/^(Title|Author|INT\.|EXT\.):/im.test(trimmed)) {
      return 'fountain';
    }

    // 默认纯文本
    return 'txt';
  }
}

// ============ 单例导出 ============

export const scriptConverter = new ScriptFormatConverter();

// ============ 辅助函数 ============

export const FORMAT_INFO: Record<ScriptFormat, { name: string; ext: string; mime: string }> = {
  fountain: { name: 'Fountain', ext: '.fountain', mime: 'text/plain' },
  fdx: { name: 'Final Draft', ext: '.fdx', mime: 'application/xml' },
  pdf: { name: 'PDF', ext: '.pdf', mime: 'application/pdf' },
  json: { name: 'JSON', ext: '.json', mime: 'application/json' },
  txt: { name: '纯文本', ext: '.txt', mime: 'text/plain' }
};

/**
 * 下载剧本文件
 */
export function downloadScript(script: ParsedScript, options: ExportOptions): void {
  const content = scriptConverter.export(script, options);
  const info = FORMAT_INFO[options.format];
  
  const blob = new Blob([content], { type: info.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${script.title || 'script'}${info.ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 从文件导入剧本
 */
export async function importScriptFromFile(file: File): Promise<ParsedScript> {
  const content = await file.text();
  const format = scriptConverter.detectFormat(content);
  return scriptConverter.import(content, format);
}
