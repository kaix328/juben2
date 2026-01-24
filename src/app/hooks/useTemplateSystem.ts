import { useState, useCallback } from 'react';
import type { Character, Scene, Prop, Costume } from '../types';

export type AssetType = 'character' | 'scene' | 'prop' | 'costume';

export interface AssetTemplate<T = any> {
  id: string;
  name: string;
  description: string;
  type: AssetType;
  category: string; // 如：现代都市、古装、科幻
  fields: Partial<T>;
  tags: string[];
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

// 内置模板
const BUILT_IN_TEMPLATES: AssetTemplate[] = [
  // 角色模板
  {
    id: 'tpl-char-modern-protagonist',
    name: '现代都市主角',
    description: '适用于现代都市题材的主角设定',
    type: 'character',
    category: '现代都市',
    fields: {
      personality: '坚韧、正义、有责任感',
      appearance: '身材匀称，气质干练',
      tags: ['主角', '现代', '都市'],
    },
    tags: ['现代', '都市', '主角'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
  },
  {
    id: 'tpl-char-ancient-hero',
    name: '古装英雄',
    description: '适用于古装武侠题材的英雄角色',
    type: 'character',
    category: '古装武侠',
    fields: {
      personality: '侠义、豪爽、重情重义',
      appearance: '剑眉星目，英姿飒爽',
      tags: ['英雄', '古装', '武侠'],
    },
    tags: ['古装', '武侠', '英雄'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
  },
  {
    id: 'tpl-char-scifi-scientist',
    name: '科幻科学家',
    description: '适用于科幻题材的科学家角色',
    type: 'character',
    category: '科幻',
    fields: {
      personality: '理性、严谨、富有好奇心',
      appearance: '戴眼镜，穿白大褂',
      tags: ['科学家', '科幻', '理性'],
    },
    tags: ['科幻', '科学家'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
  },
  // 场景模板
  {
    id: 'tpl-scene-modern-office',
    name: '现代办公室',
    description: '现代都市办公室场景',
    type: 'scene',
    category: '现代都市',
    fields: {
      location: '办公室',
      environment: '现代化办公环境，明亮整洁',
      tags: ['室内', '现代', '办公'],
    },
    tags: ['现代', '办公室', '室内'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
  },
  {
    id: 'tpl-scene-ancient-palace',
    name: '古代宫殿',
    description: '古装题材的宫殿场景',
    type: 'scene',
    category: '古装',
    fields: {
      location: '皇宫大殿',
      environment: '金碧辉煌，庄严肃穆',
      tags: ['室内', '古装', '宫殿'],
    },
    tags: ['古装', '宫殿', '室内'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
  },
  {
    id: 'tpl-scene-scifi-spaceship',
    name: '科幻飞船',
    description: '科幻题材的太空飞船内部',
    type: 'scene',
    category: '科幻',
    fields: {
      location: '太空飞船驾驶舱',
      environment: '高科技设备，蓝色灯光',
      tags: ['室内', '科幻', '飞船'],
    },
    tags: ['科幻', '飞船', '室内'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
  },
];

export function useTemplateSystem(projectId: string) {
  const [customTemplates, setCustomTemplates] = useState<AssetTemplate[]>([]);

  // 加载自定义模板
  const loadTemplates = useCallback(() => {
    try {
      const stored = localStorage.getItem(`templates_${projectId}`);
      if (stored) {
        const data = JSON.parse(stored) as AssetTemplate[];
        setCustomTemplates(data);
      }
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  }, [projectId]);

  // 保存自定义模板
  const saveTemplates = useCallback((templates: AssetTemplate[]) => {
    try {
      localStorage.setItem(`templates_${projectId}`, JSON.stringify(templates));
      setCustomTemplates(templates);
    } catch (error) {
      console.error('保存模板失败:', error);
    }
  }, [projectId]);

  // 获取所有模板
  const getAllTemplates = useCallback((type?: AssetType) => {
    const all = [...BUILT_IN_TEMPLATES, ...customTemplates];
    return type ? all.filter(t => t.type === type) : all;
  }, [customTemplates]);

  // 获取模板分类
  const getCategories = useCallback((type?: AssetType) => {
    const templates = getAllTemplates(type);
    const categories = new Set(templates.map(t => t.category));
    return Array.from(categories);
  }, [getAllTemplates]);

  // 创建模板
  const createTemplate = useCallback(<T,>(
    name: string,
    description: string,
    type: AssetType,
    category: string,
    fields: Partial<T>,
    tags: string[]
  ) => {
    const template: AssetTemplate<T> = {
      id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      type,
      category,
      fields,
      tags,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    const updated = [...customTemplates, template];
    saveTemplates(updated);
    return template;
  }, [customTemplates, saveTemplates]);

  // 更新模板
  const updateTemplate = useCallback((templateId: string, updates: Partial<AssetTemplate>) => {
    const updated = customTemplates.map(t =>
      t.id === templateId
        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
        : t
    );
    saveTemplates(updated);
  }, [customTemplates, saveTemplates]);

  // 删除模板
  const deleteTemplate = useCallback((templateId: string) => {
    const updated = customTemplates.filter(t => t.id !== templateId);
    saveTemplates(updated);
  }, [customTemplates, saveTemplates]);

  // 应用模板
  const applyTemplate = useCallback(<T,>(templateId: string, additionalFields?: Partial<T>): Partial<T> | null => {
    const template = getAllTemplates().find(t => t.id === templateId);
    if (!template) return null;

    // 增加使用次数
    if (!template.isBuiltIn) {
      updateTemplate(templateId, { usageCount: template.usageCount + 1 });
    }

    return {
      ...template.fields,
      ...additionalFields,
    } as Partial<T>;
  }, [getAllTemplates, updateTemplate]);

  // 从资产创建模板
  const createTemplateFromAsset = useCallback(<T extends Character | Scene | Prop | Costume>(
    asset: T,
    name: string,
    description: string,
    category: string,
    type: AssetType
  ) => {
    const { id, createdAt, usageCount, ...fields } = asset as any;
    
    return createTemplate(
      name,
      description,
      type,
      category,
      fields,
      asset.tags || []
    );
  }, [createTemplate]);

  // 导出模板
  const exportTemplate = useCallback((templateId: string) => {
    const template = getAllTemplates().find(t => t.id === templateId);
    if (!template) return;

    const dataStr = JSON.stringify(template, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${template.name}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getAllTemplates]);

  // 导入模板
  const importTemplate = useCallback((file: File): Promise<AssetTemplate | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const template = JSON.parse(e.target?.result as string) as AssetTemplate;
          
          // 验证模板数据
          if (!template.name || !template.type) {
            resolve(null);
            return;
          }

          // 生成新ID
          const imported: AssetTemplate = {
            ...template,
            id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isBuiltIn: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
          };

          const updated = [...customTemplates, imported];
          saveTemplates(updated);
          resolve(imported);
        } catch (error) {
          console.error('导入模板失败:', error);
          resolve(null);
        }
      };

      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  }, [customTemplates, saveTemplates]);

  // 搜索模板
  const searchTemplates = useCallback((
    keyword: string,
    type?: AssetType,
    category?: string
  ) => {
    let results = getAllTemplates(type);

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(lowerKeyword) ||
        t.description.toLowerCase().includes(lowerKeyword) ||
        t.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
      );
    }

    if (category) {
      results = results.filter(t => t.category === category);
    }

    return results;
  }, [getAllTemplates]);

  return {
    loadTemplates,
    getAllTemplates,
    getCategories,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    createTemplateFromAsset,
    exportTemplate,
    importTemplate,
    searchTemplates,
  };
}
