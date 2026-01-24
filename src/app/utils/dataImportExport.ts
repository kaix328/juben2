/**
 * 数据导入导出工具
 * 支持项目数据的完整备份和恢复
 */

import { projectStorage, chapterStorage, scriptStorage, storyboardStorage, assetStorage, imageStorage } from './storage';
import type { Project, Chapter, Script, Storyboard, AssetLibrary, DirectorStyle } from '../types';

// ============ 类型定义 ============

export interface ProjectBackup {
  version: string;
  exportedAt: string;
  project: Project;
  chapters: Chapter[];
  scripts: Script[];
  storyboards: Storyboard[];
  assetLibrary: AssetLibrary | null;
  directorStyle: DirectorStyle | null;
}

export interface ImportResult {
  success: boolean;
  projectId?: string;
  projectTitle?: string;
  error?: string;
  stats?: {
    chapters: number;
    scripts: number;
    storyboards: number;
    hasAssets: boolean;
    hasStyle: boolean;
  };
}

export interface ExportOptions {
  includeImages?: boolean;  // 是否包含图片 base64
  compress?: boolean;       // 是否压缩 JSON
}

// ============ 导出功能 ============

/**
 * 导出单个项目的完整数据
 */
export async function exportProjectBackup(
  projectId: string,
  options: ExportOptions = {}
): Promise<ProjectBackup | null> {
  try {
    // 获取项目
    const project = await projectStorage.getById(projectId);
    if (!project) {
      console.error('项目不存在:', projectId);
      return null;
    }

    // 获取所有章节
    const chapters = await chapterStorage.getByProjectId(projectId);

    // 获取所有剧本和分镜
    const scripts: Script[] = [];
    const storyboards: Storyboard[] = [];

    for (const chapter of chapters) {
      const script = await scriptStorage.getByChapterId(chapter.id);
      if (script) {
        scripts.push(script);
      }

      const storyboard = await storyboardStorage.getByChapterId(chapter.id);
      if (storyboard) {
        // 处理图片
        if (storyboard.panels) {
          for (const panel of storyboard.panels) {
            if (options.includeImages) {
              if (panel.generatedImage?.startsWith('blob:')) {
                panel.generatedImage = await imageStorage.get(panel.generatedImage) || '';
              }
              if (panel.referenceImage?.startsWith('blob:')) {
                panel.referenceImage = await imageStorage.get(panel.referenceImage) || '';
              }
            } else {
              // 移除图片
              if (panel.generatedImage?.startsWith('data:')) panel.generatedImage = '[IMAGE_REMOVED]';
              if (panel.generatedImage?.startsWith('blob:')) panel.generatedImage = '[IMAGE_REMOVED]';
            }
          }
        }
        storyboards.push(storyboard);
      }
    }

    // 获取资源库
    const assetLibrary = await assetStorage.getByProjectId(projectId) || null;
    if (assetLibrary && options.includeImages) {
      // 处理角色图片
      for (const char of assetLibrary.characters) {
        if (char.fullBodyPreview?.startsWith('blob:')) {
          char.fullBodyPreview = await imageStorage.get(char.fullBodyPreview) || '';
        }
        if (char.facePreview?.startsWith('blob:')) {
          char.facePreview = await imageStorage.get(char.facePreview) || '';
        }
        if (char.referenceImages) {
          for (let i = 0; i < char.referenceImages.length; i++) {
            if (char.referenceImages[i].startsWith('blob:')) {
              char.referenceImages[i] = await imageStorage.get(char.referenceImages[i]) || '';
            }
          }
        }
      }
      // 处理场景图片
      for (const scene of assetLibrary.scenes) {
        if (scene.widePreview?.startsWith('blob:')) {
          scene.widePreview = await imageStorage.get(scene.widePreview) || '';
        }
        if (scene.mediumPreview?.startsWith('blob:')) {
          scene.mediumPreview = await imageStorage.get(scene.mediumPreview) || '';
        }
        if (scene.closeupPreview?.startsWith('blob:')) {
          scene.closeupPreview = await imageStorage.get(scene.closeupPreview) || '';
        }
      }
      // 处理道具和服饰
      for (const prop of assetLibrary.props) {
        if (prop.preview?.startsWith('blob:')) {
          prop.preview = await imageStorage.get(prop.preview) || '';
        }
      }
      for (const costume of assetLibrary.costumes) {
        if (costume.preview?.startsWith('blob:')) {
          costume.preview = await imageStorage.get(costume.preview) || '';
        }
      }
    } else if (assetLibrary && !options.includeImages) {
      // 如果不包含图片，可以在这里清除资产库中的图片
    }

    // 获取导演风格（从 localStorage）
    let directorStyle: DirectorStyle | null = null;
    try {
      const styleKey = `director-style-${projectId}`;
      const storedStyle = localStorage.getItem(styleKey);
      if (storedStyle) {
        directorStyle = JSON.parse(storedStyle);
      }
    } catch (e) {
      console.warn('Failed to get director style:', e);
    }

    const backup: ProjectBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      project,
      chapters,
      scripts,
      storyboards,
      assetLibrary,
      directorStyle,
    };

    return backup;
  } catch (error) {
    console.error('导出项目失败:', error);
    return null;
  }
}

/**
 * 下载项目备份为 JSON 文件
 */
export async function downloadProjectBackup(
  projectId: string,
  options: ExportOptions = {}
): Promise<boolean> {
  const backup = await exportProjectBackup(projectId, options);
  if (!backup) return false;

  try {
    const jsonStr = options.compress
      ? JSON.stringify(backup)
      : JSON.stringify(backup, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.project.title}_备份_${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('下载备份失败:', error);
    return false;
  }
}

// ============ 导入功能 ============

/**
 * 验证备份数据格式
 */
export function validateBackup(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '无效的数据格式' };
  }

  if (!data.version) {
    return { valid: false, error: '缺少版本信息' };
  }

  if (!data.project || !data.project.id || !data.project.title) {
    return { valid: false, error: '缺少项目信息' };
  }

  if (!Array.isArray(data.chapters)) {
    return { valid: false, error: '缺少章节数据' };
  }

  return { valid: true };
}

/**
 * 从 JSON 文件导入项目
 */
export async function importProjectFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    return await importProjectBackup(data);
  } catch (error) {
    return {
      success: false,
      error: error instanceof SyntaxError ? '无效的 JSON 格式' : String(error),
    };
  }
}

/**
 * 导入项目备份数据
 */
export async function importProjectBackup(
  backup: ProjectBackup,
  options: {
    overwrite?: boolean;      // 是否覆盖同名项目
    generateNewIds?: boolean; // 是否生成新 ID
  } = {}
): Promise<ImportResult> {
  // 验证数据
  const validation = validateBackup(backup);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const { generateNewIds = true, overwrite = false } = options;

    // ID 映射表（用于关联数据）
    const idMap: Record<string, string> = {};

    // 生成新 ID 的辅助函数
    const mapId = (oldId: string): string => {
      if (!generateNewIds) return oldId;
      if (!idMap[oldId]) {
        idMap[oldId] = generateUniqueId();
      }
      return idMap[oldId];
    };

    // 1. 处理项目
    const newProjectId = mapId(backup.project.id);
    const existingProject = await projectStorage.getById(newProjectId);

    if (existingProject && !overwrite) {
      // 检查是否有同名项目
      const allProjects = await projectStorage.getAll();
      const sameName = allProjects.find(p => p.title === backup.project.title);
      if (sameName) {
        backup.project.title = `${backup.project.title} (导入)`;
      }
    }

    const newProject: Project = {
      ...backup.project,
      id: newProjectId,
      createdAt: backup.project.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await projectStorage.save(newProject);

    // 2. 处理章节
    const newChapters: Chapter[] = [];
    for (const chapter of backup.chapters) {
      const newChapter: Chapter = {
        ...chapter,
        id: mapId(chapter.id),
        projectId: newProjectId,
        createdAt: new Date(chapter.createdAt).toISOString(),
      };
      await chapterStorage.save(newChapter);
      newChapters.push(newChapter);
    }

    // 更新项目的章节列表（注意：Project 类型中没有 chapters 属性，这里删除或者根据实际情况处理）
    // newProject.chapters = newChapters;
    await projectStorage.save(newProject);
    // 3. 处理剧本
    for (const script of backup.scripts) {
      const newScript: Script = {
        ...script,
        id: mapId(script.id),
        chapterId: mapId(script.chapterId),
        scenes: script.scenes?.map(scene => ({
          ...scene,
          id: mapId(scene.id),
          dialogues: scene.dialogues?.map(d => ({
            ...d,
            id: mapId(d.id),
          })),
        })),
        updatedAt: new Date().toISOString(),
      };
      await scriptStorage.save(newScript);
    }

    // 4. 处理分镜
    for (const storyboard of backup.storyboards) {
      const newStoryboard: Storyboard = {
        ...storyboard,
        id: mapId(storyboard.id),
        chapterId: mapId(storyboard.chapterId),
        panels: storyboard.panels?.map(panel => ({
          ...panel,
          id: mapId(panel.id),
          sceneId: panel.sceneId ? mapId(panel.sceneId) : undefined!,
          // 恢复被移除的图片标记
          generatedImage: panel.generatedImage === '[IMAGE_REMOVED]' ? undefined : panel.generatedImage,
        })),
        updatedAt: new Date().toISOString(),
      };
      await storyboardStorage.save(newStoryboard);
    }

    // 5. 处理资源库
    if (backup.assetLibrary) {
      const newAssetLibrary: AssetLibrary = {
        ...backup.assetLibrary,
        projectId: newProjectId,
        characters: backup.assetLibrary.characters?.map(c => ({
          ...c,
          id: mapId(c.id),
        })),
        scenes: backup.assetLibrary.scenes?.map(s => ({
          ...s,
          id: mapId(s.id),
        })),
        props: backup.assetLibrary.props?.map(p => ({
          ...p,
          id: mapId(p.id),
        })),
        costumes: backup.assetLibrary.costumes?.map(c => ({
          ...c,
          id: mapId(c.id),
        })),
      };
      await assetStorage.save(newAssetLibrary);
    }

    // 6. 处理导演风格（存储到 localStorage）
    if (backup.directorStyle) {
      const newStyle: DirectorStyle = {
        ...backup.directorStyle,
      };
      const styleKey = `director-style-${newProjectId}`;
      localStorage.setItem(styleKey, JSON.stringify(newStyle));
    }

    return {
      success: true,
      projectId: newProjectId,
      projectTitle: newProject.title,
      stats: {
        chapters: newChapters.length,
        scripts: backup.scripts.length,
        storyboards: backup.storyboards.length,
        hasAssets: !!backup.assetLibrary,
        hasStyle: !!backup.directorStyle,
      },
    };
  } catch (error) {
    console.error('导入项目失败:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

// ============ 辅助函数 ============

function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * 读取文件为 JSON
 */
export function readFileAsJSON<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('无效的 JSON 格式'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}
