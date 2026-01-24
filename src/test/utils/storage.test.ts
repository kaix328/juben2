/**
 * 存储工具函数测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateId } from '../../app/utils/storage';
import { 
  exportScriptToMarkdown, 
  exportScriptToText, 
  downloadText,
  generateFriendlyFilename 
} from '../../app/utils/exportUtils';
import type { Chapter, Script } from '../../app/types';

describe('存储工具函数', () => {
  describe('generateId', () => {
    it('应该生成唯一ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('生成的ID应该是字符串', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('生成的ID长度应该合理', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(8);
    });
  });
});

describe('导出工具函数', () => {
  const mockChapter: Chapter = {
    id: 'chapter-1',
    title: '第一章 相遇',
    content: '这是章节内容',
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockScript: Script = {
    id: 'script-1',
    chapterId: 'chapter-1',
    scenes: [
      {
        id: 'scene-1',
        sceneNumber: 1,
        episodeNumber: 1,
        sceneType: '内景',
        location: '咖啡厅',
        timeOfDay: '下午',
        action: '温馨的咖啡厅场景',
        characters: ['李明'],
        dialogues: [
          {
            id: 'dialogue-1',
            character: '李明',
            lines: '你好，很高兴认识你。',
            parenthetical: '微笑',
          },
        ],
        estimatedDuration: 30,
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('exportScriptToMarkdown', () => {
    it('应该生成包含章节标题的Markdown', () => {
      const result = exportScriptToMarkdown(mockChapter, mockScript);
      expect(result).toContain('第一章 相遇');
    });

    it('应该包含场景信息', () => {
      const result = exportScriptToMarkdown(mockChapter, mockScript);
      expect(result).toContain('咖啡厅');
    });

    it('应该包含对白内容', () => {
      const result = exportScriptToMarkdown(mockChapter, mockScript);
      expect(result).toContain('李明');
      expect(result).toContain('你好，很高兴认识你');
    });
  });

  describe('exportScriptToText', () => {
    it('应该生成纯文本格式', () => {
      const result = exportScriptToText(mockChapter, mockScript);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('应该包含场景描述', () => {
      const result = exportScriptToText(mockChapter, mockScript);
      expect(result).toContain('咖啡厅');
    });
  });

  describe('downloadText', () => {
    it('应该创建下载链接', () => {
      // Mock document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      
      downloadText('测试内容', 'test.txt');
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      
      // 清理
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});

describe('文件名生成', () => {
  describe('generateFriendlyFilename', () => {
    it('应该生成包含项目名的文件名', () => {
      const result = generateFriendlyFilename('我的项目', '分镜', 'txt');
      expect(result).toContain('我的项目');
      expect(result).toContain('分镜');
    });

    it('应该包含正确的扩展名', () => {
      const result = generateFriendlyFilename('项目', '导出', 'csv');
      expect(result).toMatch(/\.csv$/);
    });

    it('应该包含时间戳', () => {
      const result = generateFriendlyFilename('项目', '导出', 'txt');
      // 检查是否包含日期格式 (YYYYMMDD)
      expect(result).toMatch(/\d{8}/); // 8位日期
    });
  });
});
