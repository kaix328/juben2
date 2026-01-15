import type { DirectorStyle } from './style';
import type { Chapter, Script } from './script';
import type { Storyboard } from './storyboard';
import type { AssetLibrary } from './assets';

// 项目统计
export interface ProjectStats {
    totalChapters: number;
    totalScenes: number;
    totalPanels: number;
    totalDuration: number; // 总时长（秒）
    charactersCount: number;
    scenesCount: number;
    propsCount: number;
    completionRate: number; // 完成度（0-100）
}

// 项目类型定义
export interface Project {
    id: string;
    title: string;
    cover: string;
    description: string;
    directorStyle?: DirectorStyle;
    createdAt: string;
    updatedAt: string;
    stats?: ProjectStats; // 项目统计
}

// 项目版本
export interface ProjectVersion {
    id: string;
    projectId: string;
    versionNumber: number;
    description: string;
    timestamp: string;
    data: {
        chapters: Chapter[];
        scripts: Script[];
        storyboards: Storyboard[];
        assetLibrary: AssetLibrary;
    };
}
