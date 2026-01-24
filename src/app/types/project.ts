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

// 分镜分析详尽统计
export interface StoryboardAnalytics {
    // 基础统计
    totalPanels: number;
    totalScenes: number;
    totalDuration: number;
    totalCharacters: number;

    // 进度统计
    completedPanels: number;
    panelsWithImages: number;
    panelsWithDialogue: number;
    completionRate: number;

    // 分布统计
    shotDistribution: Record<string, number>;
    angleDistribution: Record<string, number>;
    cameraMovementDistribution: Record<string, number>;
    durationDistribution: { short: number; medium: number; long: number };
    sceneDistribution: Record<string, number>;

    // 对白分析
    dialogueStats: {
        hasDialogue: number;
        silent: number;
        dialogueRatio: number;
    };

    // 质量指标
    averageDuration: number;
    durationVariance: number;
    rhythmScore: number;
    diversityScore: number;
}

// 分析建议
export interface AnalysisSuggestion {
    type: 'info' | 'warning' | 'success';
    category: string;
    message: string;
    action?: string;
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
