// ============ 导入统一常量 ============
import type { ShotTypeCode, CameraAngleCode, CameraMovementCode } from '../constants/cinematography';

// 专业景别类型（使用统一常量）
export type ShotSize = ShotTypeCode;

// 专业镜头运动类型（使用统一常量）
export type CameraMovementType = CameraMovementCode;

// 景深类型
export type DepthOfFieldType = 'SHALLOW' | 'DEEP' | 'SELECTIVE' | 'NORMAL';

// 镜头角度类型（使用统一常量）
export type CameraAngleType = CameraAngleCode;

// 灯光设计
export interface LightingDesign {
    keyLight?: string;     // 主光描述
    fillLight?: string;    // 补光描述
    backLight?: string;    // 背光描述
    mood?: string;         // 光影氛围（如：高调/低调/自然光）
    practicalLights?: string[]; // 实景光源（如：台灯、窗光）
}

// 动作提示
export interface ActionCue {
    startAction?: string;  // 起始动作
    endAction?: string;    // 结束动作
    timing?: string;       // 动作节拍
    direction?: string;    // 动作方向
}

// 分镜面板（V2 统一版本）
export interface StoryboardPanel {
    // ============ 基础字段 ============
    id: string;
    panelNumber: number;
    sceneId: string;
    description: string;
    dialogue?: string; // 对白内容
    
    // ============ 统一的专业字段（V2）============
    shot: ShotSize;                   // 景别（统一使用专业代码）
    angle: CameraAngleType;           // 镜头角度（统一使用专业代码）
    movement: CameraMovementType;     // 镜头运动（统一使用专业代码）
    
    duration?: number; // 时长（秒）
    characters: string[];
    props: string[];
    notes: string;
    
    // ============ 提示词字段（V2 统一命名）============
    imagePrompt?: string;             // AI 绘画提示词（原 aiPrompt）
    videoPrompt?: string;             // AI 视频提示词（原 aiVideoPrompt）
    generatedImageUrl?: string;       // AI 生成的图片 URL（原 generatedImage）
    isImageGenerating?: boolean;      // 是否正在生成图片（原 isGenerating）
    
    // ============ 转场和音效 ============
    transition?: string;              // 转场效果
    soundEffects?: string[];          // 音效列表
    music?: string;                   // 背景音乐
    keyFrames?: string[];             // 关键帧标记

    // ============ 专业摄影字段 ============
    episodeNumber?: number;           // 所属集数
    lens?: string;                    // 镜头焦距（如：50mm, 24mm）
    fStop?: string;                   // 光圈值（如：f/2.8）
    lighting?: LightingDesign;        // 灯光设计
    composition?: string;             // 构图描述（三分法、对称等）
    focusPoint?: string;              // 焦点位置
    depthOfField?: DepthOfFieldType;  // 景深
    actionCue?: ActionCue;            // 动作提示
    vfx?: string[];                   // 视觉特效列表
    colorGrade?: string;              // 调色参考
    referenceImage?: string;          // 参考图片URL
    shotIntent?: string;              // 镜头意图/情绪目标
    setupShot?: string;               // A/B机位标记
    axisNote?: string;                // 轴线备注

    // ============ 视频提示词增强字段 ============
    startFrame?: string;              // 起始帧描述（如：角色站立，面向镜头）
    endFrame?: string;                // 结束帧描述（如：角色转身离开）
    motionSpeed?: 'slow' | 'normal' | 'fast' | 'timelapse'; // 运动速度
    environmentMotion?: string;       // 环境动态描述（如：风吹树叶）
    characterActions?: string[];      // 角色动作列表（如：["张三:转身", "李四:挥手"]）
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '21:9'; // 视频宽高比

    // ============ 风格快照字段 ============
    appliedStyleHash?: string;        // 生成时导演风格的哈希值
    generatedAt?: string;             // 图片生成时间戳

    // ============ 锁定字段 ============
    isLocked?: boolean;               // 是否锁定提示词

    // ============ 提示词版本历史 ============
    promptHistory?: string[];         // 绘画提示词历史栈
    videoPromptHistory?: string[];    // 视频提示词历史栈
}

// 分镜类型
export interface Storyboard {
    id: string;
    chapterId: string;
    panels: StoryboardPanel[];
    updatedAt: string;
    
    // 版本控制
    version?: number;                 // 数据版本号（V2 = 2）
    migratedAt?: string;              // 迁移时间戳
    
    // 项目级别字段
    aspectRatio?: '16:9' | '2.39:1' | '4:3' | '1:1' | '9:16'; // 项目画幅比例
    targetPlatform?: 'cinema' | 'tv' | 'web' | 'mobile'; // 目标平台
}
