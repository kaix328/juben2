// 专业景别类型
export type ShotSize =
    | 'ECU'    // 大特写 (Extreme Close Up) - 眼睛、嘴唇等局部
    | 'CU'     // 特写 (Close Up) - 面部
    | 'MCU'    // 中近景 (Medium Close Up) - 头肩
    | 'MS'     // 中景 (Medium Shot) - 腰部以上
    | 'MWS'    // 中全景 (Medium Wide Shot) - 膝盖以上
    | 'WS'     // 全景 (Wide Shot) - 全身
    | 'EWS'    // 远景 (Extreme Wide Shot) - 环境建立
    | 'POV'    // 主观镜头 (Point of View)
    | 'OTS'    // 过肩镜头 (Over The Shoulder)
    | 'TWO'    // 双人镜头 (Two Shot)
    | 'GROUP'  // 群戏镜头 (Group Shot)
    | 'INSERT' // 插入镜头 (Insert Shot)
    | 'AERIAL' // 航拍镜头
    | 'CUSTOM';// 自定义

// 专业镜头运动类型
export type CameraMovementType =
    | 'STATIC'    // 静止
    | 'PAN_L'     // 左横摇
    | 'PAN_R'     // 右横摇
    | 'TILT_UP'   // 上纵摇
    | 'TILT_DOWN' // 下纵摇
    | 'DOLLY_IN'  // 推镜头
    | 'DOLLY_OUT' // 拉镜头
    | 'TRACK_L'   // 左跟踪
    | 'TRACK_R'   // 右跟踪
    | 'CRANE_UP'  // 升
    | 'CRANE_DOWN'// 降
    | 'ZOOM_IN'   // 变焦推
    | 'ZOOM_OUT'  // 变焦拉
    | 'HANDHELD'  // 手持
    | 'STEADICAM' // 斯坦尼康
    | 'DUTCH'     // 荷兰角
    | 'WHIP'      // 甩镜头
    | 'ARC'       // 弧形运动
    | 'FOLLOW'    // 跟随
    | 'CUSTOM';   // 自定义

// 景深类型
export type DepthOfFieldType = 'SHALLOW' | 'DEEP' | 'SELECTIVE' | 'NORMAL';

// 镜头角度类型
export type CameraAngleType =
    | 'EYE_LEVEL'   // 平视
    | 'HIGH'        // 俯视
    | 'LOW'         // 仰视
    | 'BIRDS_EYE'   // 鸟瞰
    | 'WORMS_EYE'   // 蚁视
    | 'DUTCH'       // 倾斜
    | 'CUSTOM';     // 自定义

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

// 分镜面板（专业版）
export interface StoryboardPanel {
    id: string;
    panelNumber: number;
    sceneId: string;
    description: string;
    dialogue?: string; // 对白内容
    shot: string; // 景别（兼容旧数据的字符串格式）
    angle: string; // 镜头角度
    cameraMovement?: string; // 镜头运动
    duration?: number; // 时长（秒）
    characters: string[];
    props: string[];
    notes: string;
    aiPrompt?: string; // AI绘画提示词
    aiVideoPrompt?: string; // AI视频提示词
    generatedImage?: string; // AI生成的图片URL
    isGenerating?: boolean; // 是否正在生成
    transition?: string; // 转场效果
    soundEffects?: string[]; // 音效列表
    music?: string; // 背景音乐
    keyFrames?: string[]; // 关键帧标记

    // 新增专业字段
    episodeNumber?: number;           // 所属集数
    shotSize?: ShotSize;              // 专业景别代码
    cameraAngle?: CameraAngleType;    // 专业角度代码
    movementType?: CameraMovementType;// 专业运动类型
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

    // 🆕 视频提示词增强字段
    startFrame?: string;              // 起始帧描述（如：角色站立，面向镜头）
    endFrame?: string;                // 结束帧描述（如：角色转身离开）
    motionSpeed?: 'slow' | 'normal' | 'fast' | 'timelapse'; // 运动速度
    environmentMotion?: string;       // 环境动态描述（如：风吹树叶）
    characterActions?: string[];      // 角色动作列表（如：["张三:转身", "李四:挥手"]）
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '21:9'; // 🆕 视频宽高比

    // 🆕 建议3：风格快照字段 - 用于追溯分镜生成时使用的风格
    appliedStyleHash?: string;   // 生成时导演风格的哈希值
    generatedAt?: string;        // 图片生成时间戳
}

// 分镜类型
export interface Storyboard {
    id: string;
    chapterId: string;
    panels: StoryboardPanel[];
    updatedAt: string;
    // 新增专业字段
    aspectRatio?: '16:9' | '2.39:1' | '4:3' | '1:1' | '9:16'; // 项目画幅比例
    targetPlatform?: 'cinema' | 'tv' | 'web' | 'mobile'; // 目标平台
}
