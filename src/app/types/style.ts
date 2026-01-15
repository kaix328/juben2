// 导演风格
export interface DirectorStyle {
    artStyle: string; // 艺术风格：写实、赛博朋克、水彩、油画等
    colorTone: string; // 色调：暖色调、冷色调、黑白、高饱和度等
    lightingStyle: string; // 光照风格：自然光、戏剧性光影、柔和光线等
    cameraStyle: string; // 镜头风格：电影感、纪实风格、梦幻风格等
    mood: string; // 情绪氛围：温馨、紧张、神秘、欢快等
    customPrompt: string; // 自定义提示词
    // 🆕 一致性相关
    negativePrompt?: string; // 负面提示词（避免变形、多手指等）
    // 🆕 画面比例
    aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16' | '21:9'; // 画面比例
    // 🆕 视频专属选项
    videoFrameRate?: '24' | '30' | '60'; // 帧率
    motionIntensity?: 'subtle' | 'normal' | 'dynamic'; // 运动强度
}

// 风格应用设置
export interface StyleApplicationSettings {
    mode: 'auto' | 'manual'; // 应用模式：自动/手动
    autoApplyToNew: boolean; // 新建资源时自动应用导演风格
    protectManualEdits: boolean; // 保护手动编辑过的提示词
    confirmBeforeApply: boolean; // 批量应用前显示确认对话框
    showPreview: boolean; // 应用前显示预览对比
}
