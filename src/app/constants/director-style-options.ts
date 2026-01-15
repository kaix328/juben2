/**
 * 导演风格编辑器选项常量
 * 从 DirectorStyleEditor.tsx 提取的硬编码选项数据
 */

export interface StyleOption {
    value: string;
    label: string;
}

// 艺术风格选项
export const ART_STYLE_OPTIONS: StyleOption[] = [
    { value: '写实主义', label: '写实主义' },
    { value: '手绘动画', label: '手绘动画' },
    { value: '唯美写实', label: '唯美写实' },
    { value: '赛博朋克', label: '赛博朋克' },
    { value: '复古胶片', label: '复古胶片' },
    { value: '黑白胶片', label: '黑白胶片' },
    { value: '水彩风格', label: '水彩风格' },
    { value: '油画风格', label: '油画风格' },
    { value: '漫画风格', label: '漫画风格' },
    { value: '像素艺术', label: '像素艺术' },
];

// 色调选项
export const COLOR_TONE_OPTIONS: StyleOption[] = [
    { value: '温暖色调', label: '温暖色调' },
    { value: '冷色调', label: '冷色调' },
    { value: '中性色调', label: '中性色调' },
    { value: '高饱和度', label: '高饱和度' },
    { value: '低饱和度', label: '低饱和度' },
    { value: '霓虹色彩', label: '霓虹色彩' },
    { value: '黑白高对比', label: '黑白高对比' },
    { value: '柔和色彩', label: '柔和色彩' },
    { value: '复古色调', label: '复古色调' },
];

// 光照风格选项
export const LIGHTING_STYLE_OPTIONS: StyleOption[] = [
    { value: '自然光', label: '自然光' },
    { value: '柔和光线', label: '柔和光线' },
    { value: '戏剧性光影', label: '戏剧性光影' },
    { value: '强对比光', label: '强对比光' },
    { value: '霓虹灯光', label: '霓虹灯光' },
    { value: '黄金时刻', label: '黄金时刻（Golden Hour）' },
    { value: '蓝调时刻', label: '蓝调时刻（Blue Hour）' },
    { value: '强烈阴影', label: '强烈阴影' },
    { value: '均匀照明', label: '均匀照明' },
];

// 镜头风格选项
export const CAMERA_STYLE_OPTIONS: StyleOption[] = [
    { value: '电影感', label: '电影感（Cinematic）' },
    { value: '纪实风格', label: '纪实风格（Documentary）' },
    { value: '梦幻风格', label: '梦幻风格（Dreamy）' },
    { value: 'IMAX', label: 'IMAX 大画幅' },
    { value: '手持摄影', label: '手持摄影（Handheld）' },
    { value: '稳定器', label: '稳定器拍摄（Gimbal）' },
    { value: '广角镜头', label: '广角镜头' },
    { value: '长焦镜头', label: '长焦镜头' },
    { value: '鱼眼镜头', label: '鱼眼镜头' },
];

// 情绪氛围选项
export const MOOD_OPTIONS: StyleOption[] = [
    { value: '温馨', label: '温馨' },
    { value: '紧张', label: '紧张' },
    { value: '神秘', label: '神秘' },
    { value: '欢快', label: '欢快' },
    { value: '悲伤', label: '悲伤' },
    { value: '浪漫', label: '浪漫' },
    { value: '恐怖', label: '恐怖' },
    { value: '史诗', label: '史诗感' },
    { value: '忧郁', label: '忧郁' },
    { value: '激动', label: '激动人心' },
    { value: '宁静', label: '宁静' },
];

// 画面比例选项
export const ASPECT_RATIO_OPTIONS: StyleOption[] = [
    { value: '16:9', label: '16:9（电影/横屏）' },
    { value: '4:3', label: '4:3（传统电视）' },
    { value: '1:1', label: '1:1（方形/社交媒体）' },
    { value: '9:16', label: '9:16（竖屏/短视频）' },
    { value: '21:9', label: '21:9（超宽屏/电影院）' },
];

// 视频帧率选项
export const FRAME_RATE_OPTIONS: StyleOption[] = [
    { value: '24', label: '24 fps（电影标准）' },
    { value: '30', label: '30 fps（电视/网络）' },
    { value: '60', label: '60 fps（流畅/游戏）' },
];

// 运动强度选项
export const MOTION_INTENSITY_OPTIONS: StyleOption[] = [
    { value: 'subtle', label: '微妙（细腻动作）' },
    { value: 'normal', label: '正常（标准运动）' },
    { value: 'dynamic', label: '强烈（动态激烈）' },
];

// 运动强度显示名称映射
export const MOTION_INTENSITY_LABELS: Record<string, string> = {
    'subtle': '微妙',
    'normal': '正常',
    'dynamic': '强烈',
};
