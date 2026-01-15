/**
 * AI 提示词生成函数模块
 * 包含角色、场景、分镜等提示词的生成逻辑
 */

import type { DirectorStyle, Character, Scene, StoryboardPanel } from '../../types';
import {
    SOUND_PRESETS,
    MUSIC_PRESETS
} from './audio-presets';
import {
    DIRECTOR_STYLE_PRESETS,
    DEFAULT_NEGATIVE_PROMPT
} from './director-style-presets';
import {
    EMOTIONAL_CAMERA_PRESETS,
    SCENE_SHOOTING_PRESETS,
    PROFESSIONAL_CAMERA_TEMPLATES,
    CAMERA_SPEED_KEYWORDS,
    VISUAL_EFFECT_PRESETS,
    TIME_CONTROL_PRESETS
} from './camera-presets';

// ============ 辅助函数 ============

/**
 * 🆕 提示词权重控制辅助函数
 * 支持格式：(关键词:权重) 或 ((关键词)) 语法
 */
export function applyPromptWeight(text: string, weight: number = 1.2): string {
    if (weight === 1.0) return text;
    // 使用 (text:weight) 格式，兼容大多数 AI 模型
    return `(${text}:${weight.toFixed(1)})`;
}

/**
 * 🆕 批量应用权重到关键词
 */
export function applyWeightsToKeywords(
    prompt: string,
    keywords: { word: string; weight: number }[]
): string {
    let result = prompt;
    keywords.forEach(({ word, weight }) => {
        if (result.includes(word)) {
            result = result.replace(word, applyPromptWeight(word, weight));
        }
    });
    return result;
}

/**
 * 辅助函数：翻译常见英文风格词为中文
 */
function translateToChineseStyle(style: string): string {
    const translations: Record<string, string> = {
        'film noir': '黑色电影风格',
        'anime': '日系动漫风格',
        'realistic': '写实风格',
        'watercolor': '水彩风格',
        'oil painting': '油画风格',
        'cyberpunk': '赛博朋克风格',
        'fantasy': '奇幻风格',
        'horror': '恐怖风格',
        'romantic': '浪漫风格',
        'noir': '黑白电影风格'
    };

    const lowerStyle = style.toLowerCase();
    for (const [en, cn] of Object.entries(translations)) {
        if (lowerStyle.includes(en)) {
            return cn;
        }
    }
    return style.includes('风格') ? style : `${style}风格`;
}

// ============ 生成函数 ============

/**
 * 生成角色AI提示词
 */
export function generateCharacterPrompt(
    character: Character,
    directorStyle?: DirectorStyle
): string {
    const parts: string[] = [];

    // 基础描述
    if (character.name) {
        parts.push(character.name);
    }

    if (character.appearance) {
        parts.push(character.appearance);
    }

    // 🆕 详细属性（如有）
    const charAny = character as any;
    if (charAny.age) parts.push(`${charAny.age}岁`);
    if (charAny.gender) parts.push(charAny.gender);
    if (charAny.height) parts.push(`身高${charAny.height}`);
    if (charAny.bodyType) parts.push(charAny.bodyType);
    if (charAny.hairStyle) parts.push(charAny.hairStyle);
    if (charAny.hairColor) parts.push(`${charAny.hairColor}发色`);
    if (charAny.eyeColor) parts.push(`${charAny.eyeColor}眼睛`);
    if (charAny.clothing) parts.push(charAny.clothing);

    // 🆕 中文化性格描述
    if (character.personality) {
        parts.push(`性格特征：${character.personality}`);
    }

    // 应用导演风格（🆕 中文化）
    if (directorStyle) {
        if (directorStyle.artStyle) {
            parts.push(`${directorStyle.artStyle}风格`);
        }
        if (directorStyle.colorTone) {
            parts.push(`色调：${directorStyle.colorTone}`);
        }
        if (directorStyle.lightingStyle) {
            parts.push(`光影：${directorStyle.lightingStyle}`);
        }
        if (directorStyle.customPrompt) {
            parts.push(directorStyle.customPrompt);
        }
    }

    // 添加质量标签（🆕 中文化）
    parts.push('高品质', '精细刻画', '专业插画');

    return parts.filter(p => p).join(', ');
}

/**
 * 生成场景AI提示词
 */
export function generateScenePrompt(
    scene: Scene,
    directorStyle?: DirectorStyle
): string {
    const parts: string[] = [];

    // 基础描述
    if (scene.location) {
        parts.push(scene.location);
    }

    if (scene.environment) {
        parts.push(scene.environment);
    }

    if (scene.description) {
        parts.push(scene.description);
    }

    // 🆕 天气和季节（如有）
    const sceneAny = scene as any;
    if (sceneAny.weather) {
        const weatherMap: Record<string, string> = {
            '晴': '晴空万里', '阴': '阴云密布', '雨': '细雨绵绵',
            '雪': '白雪皑皑', '雾': '雾气弥漫', '风': '狂风呼啸'
        };
        parts.push(weatherMap[sceneAny.weather] || sceneAny.weather);
    }
    if (sceneAny.season) {
        const seasonMap: Record<string, string> = {
            '春': '春暖花开', '夏': '炎炎夏日', '秋': '金秋时节', '冬': '寒冬腊月'
        };
        parts.push(seasonMap[sceneAny.season] || sceneAny.season);
    }

    // 应用导演风格（🆕 中文化）
    if (directorStyle) {
        if (directorStyle.artStyle) {
            parts.push(`${directorStyle.artStyle}风格`);
        }
        if (directorStyle.colorTone) {
            parts.push(directorStyle.colorTone);
        }
        if (directorStyle.lightingStyle) {
            parts.push(directorStyle.lightingStyle);
        }
        if (directorStyle.mood) {
            parts.push(`${directorStyle.mood}氛围`);
        }
        if (directorStyle.customPrompt) {
            parts.push(directorStyle.customPrompt);
        }
    }

    // 添加质量标签（🆕 中文化）
    parts.push('电影感', '精细环境', '高品质');

    return parts.filter(p => p).join(', ');
}

/**
 * 生成分镜AI绘画提示词（专业增强版 v3）
 * 优化结构：镜头语言 > 角色触发词 > 主体内容 > 导演风格 > 质量标签
 */
export function generateStoryboardImagePrompt(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle
): string {
    // 分层结构
    const cameraLang: string[] = [];     // 镜头语言（最前面）
    const triggerWords: string[] = [];   // 角色触发词
    const subjects: string[] = [];       // 主体内容（压缩版）
    const styleWords: string[] = [];     // 导演风格（统一中文）
    const qualityTags: string[] = [];    // 质量标签

    // ========== 第一层：镜头语言（最重要，放最前面） ==========
    // 🆕 增强版镜头层级描述（含专业说明）
    const shotCodeMap: Record<string, string> = {
        'ECU': '大特写，极致聚焦主体微小局部，几乎排除环境干扰，制造强烈视觉冲击力',
        'CU': '特写，聚焦主体局部细节，弱化远景环境，突出细微动作如手势、眼神变化',
        'MCU': '近景，胸部以上入画，压缩环境空间，强化观众与主体近距离感',
        'MS': '中景，腰部以上入画，聚焦主体主要活动区域，兼顾动作细节和局部环境',
        'MWS': '中全景，膝部以上入画，主体与环境平衡呈现',
        'WS': '远景，全身入画，完整呈现主体全貌及周围核心环境',
        'EWS': '大远景，广阔场景取景，主体占比极小，重点呈现环境整体氛围，空间纵深感强',
        'POV': '主观视角，第一人称视角，观众代入角色所见',
        'OTS': '过肩镜头，前景人物虚化肩部入画，后景清晰呈现对话主体'
    };
    // 🆕 增强版角度描述
    const angleMap: Record<string, string> = {
        'EYE_LEVEL': '平视，与主体视线平齐，呈现客观中立视角',
        'HIGH': '俯拍，从高于主体视角向下拍摄，突出整体秩序或环境包围感',
        'LOW': '仰拍，从低于主体视角向上拍摄，传递主体权威感、力量感或压迫感',
        'DUTCH': '倾斜，画面倾斜构图，传递不安、紧张或戏剧性张力'
    };

    // 景别（🆕 智能默认）
    if (panel.shotSize && shotCodeMap[panel.shotSize]) {
        cameraLang.push(shotCodeMap[panel.shotSize]);
    } else {
        // 🆕 根据场景内容智能选择默认景别
        let defaultShot = '中景';

        // 有对白 → 近景（专注说话者）
        if (panel.dialogue && panel.dialogue.trim()) {
            defaultShot = '近景';
        }
        // 无角色或场景建立 → 远景
        else if (!panel.characters || panel.characters.length === 0) {
            defaultShot = '远景';
        }
        // 多角色 → 中全景（容纳多人）
        else if (panel.characters.length > 2) {
            defaultShot = '中全景';
        }
        // 情绪爆发 → 特写
        else if ((panel as any).emotionalBeat === 'CLIMAX' || (panel as any).emotionalBeat === 'SHOCK') {
            defaultShot = '特写';
        }

        cameraLang.push(defaultShot);
    }

    // 角度
    if (panel.angle && angleMap[panel.angle]) {
        cameraLang.push(angleMap[panel.angle]);
    }

    // 🆕 构图指导（根据景别自动添加）
    const shotSize = panel.shotSize || 'MS';
    const compositionGuide: Record<string, string> = {
        'ECU': '面部居中，极致细节',
        'CU': '面部居中，表情清晰',
        'MCU': '胸部以上，留白适中',
        'MS': '腰部以上，人物居中',
        'MWS': '膝部以上，环境可见',
        'WS': '全身入画，环境占比大',
        'EWS': '人物渺小，环境壮阔',
        'POV': '第一人称视角',
        'OTS': '前景虚化，后景清晰'
    };
    if (compositionGuide[shotSize]) {
        cameraLang.push(compositionGuide[shotSize]);
    }

    // ========== 第二层：角色触发词（🆕 权重控制 + 格式优化） ==========
    if (panel.characters && panel.characters.length > 0) {
        panel.characters.forEach((charName, index) => {
            const char = characters.find(c => c.name === charName);
            if (char?.triggerWord) {
                // 主角（第一个角色）权重更高
                const weight = index === 0 ? 1.5 : 1.2;
                // 🆕 移除尖括号，使用更通用的格式（兼容主流 AI 模型）
                triggerWords.push(applyPromptWeight(char.triggerWord, weight));
            }
        });
    }

    // ========== 第三层：主体内容（压缩版，≤50字） ==========
    // 角色简要描述（🆕 主角添加权重）
    if (panel.characters && panel.characters.length > 0) {
        const charNames = panel.characters.slice(0, 3).map((name, i) =>
            i === 0 ? applyPromptWeight(name, 1.3) : name
        ).join('、');
        subjects.push(charNames);
    }

    // 画面描述（🆕 智能截断：保留关键词）
    if (panel.description) {
        let desc = panel.description;

        // 如果超过 80 字，按逗号/句号分割保留前半部分
        if (desc.length > 80) {
            const parts = desc.split(/[，。,\.]/);
            desc = '';
            for (const part of parts) {
                if ((desc + part).length <= 70) {
                    desc += (desc ? '，' : '') + part.trim();
                } else {
                    break;
                }
            }
            if (!desc) {
                desc = panel.description.substring(0, 70);
            }
        }

        subjects.push(desc);
    }

    // ========== 场景光影（基于时间段） ==========
    const scene = scenes.find(s => s.id === panel.sceneId);
    if (scene?.timeOfDay) {
        const timeOfDayLighting: Record<string, string> = {
            '白天': '自然光', '日间': '自然光', '上午': '晨光',
            '中午': '顶光', '下午': '斜阳', '黄昏': '金色暖光',
            '傍晚': '暮光', '夜晚': '月光', '深夜': '暗调', '凌晨': '冷蓝光'
        };
        if (timeOfDayLighting[scene.timeOfDay]) {
            subjects.push(timeOfDayLighting[scene.timeOfDay]);
        }
    }

    // 情绪氛围
    if ((panel as any).atmosphere) {
        subjects.push((panel as any).atmosphere);
    }

    // ========== 第四层：导演风格（统一中文） ==========
    if (directorStyle) {
        // 艺术风格（翻译常见英文）
        if (directorStyle.artStyle) {
            const artStyleCN = translateToChineseStyle(directorStyle.artStyle);
            styleWords.push(artStyleCN);
        }
        // 色调
        if (directorStyle.colorTone) {
            styleWords.push(directorStyle.colorTone);
        }
        // 光影风格
        if (directorStyle.lightingStyle) {
            styleWords.push(directorStyle.lightingStyle);
        }
        // 🆕 镜头风格
        if (directorStyle.cameraStyle) {
            styleWords.push(directorStyle.cameraStyle);
        }
        // 情绪氛围
        if (directorStyle.mood) {
            styleWords.push(`${directorStyle.mood}氛围`);
        }
        // 自定义（仅中文部分）
        if (directorStyle.customPrompt) {
            // 过滤掉英文，只保留中文
            const chineseOnly = directorStyle.customPrompt.replace(/[a-zA-Z,\s]+/g, '').trim();
            if (chineseOnly) {
                styleWords.push(chineseOnly);
            }
        }
    }

    // ========== 第五层：质量标签（🆕 动态调整） ==========
    // 基础质量标签
    qualityTags.push('电影构图', '专业分镜', '高清');

    // 🆕 根据导演风格动态添加
    if (directorStyle?.artStyle) {
        const artStyle = directorStyle.artStyle;
        if (artStyle.includes('国风') || artStyle.includes('水墨') || artStyle.includes('工笔')) {
            qualityTags.push('东方美学', '中式意境');
        }
        if (artStyle.includes('赛博') || artStyle.includes('科幻')) {
            qualityTags.push('未来感', '科技质感');
        }
        if (artStyle.includes('动画') || artStyle.includes('二次元')) {
            qualityTags.push('动画风格', '精致线条');
        }
        if (artStyle.includes('写实') || artStyle.includes('真人')) {
            qualityTags.push('真实感', '细腻光影');
        }
    }

    // ========== 组装最终提示词 ==========
    const allParts = [
        ...cameraLang,
        ...triggerWords,
        ...subjects,
        ...styleWords,
        ...qualityTags
    ].filter(p => p);

    let result = allParts.join(', ');

    // 画面比例（使用导演风格设置，默认 16:9）
    const aspectRatio = directorStyle?.aspectRatio || '16:9';
    result += ` --ar ${aspectRatio}`;

    // 负面提示词（默认 + 自定义）
    const defaultNegative = '变形, 多手指, 模糊, 低质量';
    const negPrompt = directorStyle?.negativePrompt
        ? `${defaultNegative}, ${directorStyle.negativePrompt}`
        : defaultNegative;
    result += ` --neg ${negPrompt}`;

    return result;
}

/**
 * 视频生成平台类型
 */
export type VideoPlatform = 'generic' | 'runway' | 'pika' | 'kling' | 'comfyui';

/**
 * 生成分镜AI视频提示词（专业增强版 - 支持多平台 + 上下文感知）
 */
export function generateStoryboardVideoPrompt(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle,
    platform: VideoPlatform | any = 'generic', // 🆕 支持平台或prevPanel
    prevPanel?: StoryboardPanel  // 🆕 上一个分镜用于过渡
): string {
    const parts: string[] = [];

    // 🆕 兼容旧调用方式：如果第5个参数是对象，当作prevPanel处理
    const actualPrevPanel = typeof platform === 'object' ? platform : prevPanel;
    const actualPlatform = typeof platform === 'string' ? platform : 'generic';

    // 🆕 1. 上下文过渡描述（如果有上一镜）
    if (actualPrevPanel && actualPrevPanel.endFrame) {
        parts.push(`[过渡] 承接上一镜：${actualPrevPanel.endFrame}，画面自然延续`);
    }

    // 🆕 2. 转场效果描述
    if (panel.transition && panel.transition !== '切至') {
        const transitionMap: Record<string, string> = {
            '溶至': '画面溶解过渡，从前一镜渐变融入',
            '淡出': '画面淡出至黑，再淡入新镜',
            '淡入': '从黑色淡入画面',
            '闪白': '画面闪白过渡，强调冲击感',
            '擦除': '画面擦除过渡'
        };
        if (transitionMap[panel.transition]) {
            parts.push(`[转场] ${transitionMap[panel.transition]}`);
        }
    }

    // 🆕 景别描述（复用图像提示词的增强版）
    const videoShotCodeMap: Record<string, string> = {
        'ECU': '大特写，极致聚焦主体微小局部',
        'CU': '特写，聚焦主体局部细节',
        'MCU': '近景，胸部以上入画',
        'MS': '中景，腰部以上入画',
        'MWS': '中全景，膝部以上入画',
        'WS': '远景，全身入画',
        'EWS': '大远景，广阔场景',
        'POV': '主观视角，第一人称',
        'OTS': '过肩镜头'
    };

    // 🆕 角度描述
    const videoAngleMap: Record<string, string> = {
        'EYE_LEVEL': '平视角度',
        'HIGH': '俯拍角度',
        'LOW': '仰拍角度',
        'DUTCH': '倾斜角度'
    };

    // 🆕 添加景别
    if (panel.shotSize && videoShotCodeMap[panel.shotSize]) {
        parts.push(videoShotCodeMap[panel.shotSize]);
    }

    // 🆕 添加角度
    if (panel.cameraAngle && videoAngleMap[panel.cameraAngle]) {
        parts.push(videoAngleMap[panel.cameraAngle]);
    }

    // 镜头运动映射（中文）
    const movementMap: Record<string, string> = {
        '静止': '静态镜头',
        '推': '推镜头，向前移动',
        '拉': '拉镜头，向后移动',
        '摇': '摇镜头',
        '移': '移动跟拍',
        '跟': '跟随镜头',
        '升降': '升降镜头，垂直运动',
        '环绕': '环绕镜头，圆周运动'
    };

    // 🆕 专业运动代码映射（含参数描述）
    const movementCodeMap: Record<string, string> = {
        'STATIC': '静态镜头，画面保持稳定不动',
        'PAN_L': '向左摇镜，匀速水平摇动8秒扫过30米宽场景',
        'PAN_R': '向右摇镜，匀速水平摇动8秒扫过30米宽场景',
        'TILT_UP': '向上摇镜，快速急摇2秒内从地面摇至天空',
        'TILT_DOWN': '向下摇镜，2秒内从天空摇至地面',
        'DOLLY_IN': '推镜头，缓慢推进每秒15厘米，6秒内从全景推至近景',
        'DOLLY_OUT': '拉镜头，快速拉远0.5秒内从特写拉至全景',
        'TRACK_L': '向左横移，缓慢侧移与主体保持2米距离，每秒50厘米',
        'TRACK_R': '向右横移，缓慢侧移与主体保持2米距离，每秒50厘米',
        'CRANE_UP': '升镜头，缓慢升空从腰部升至10米高空，6秒内完成',
        'CRANE_DOWN': '降镜头，快速下降从20米高空直落至主体头顶1.5米处',
        'ZOOM_IN': '变焦拉近，焦距平滑变化聚焦细节',
        'ZOOM_OUT': '变焦拉远，焦距平滑变化展现全貌',
        'HANDHELD': '手持镜头，伴随轻微自然抖动，呈现真实感',
        'STEADICAM': '稳定器跟拍，与主体步行速度每秒1.2米完全同步',
        'FOLLOW': '跟随镜头，追踪主体移动',
        'ARC': '环绕镜头，以主体为圆心保持3米半径，每秒转动30度',
        'WHIP': '甩镜头，快速摇移1秒内完成360度翻转',
        'ORBIT': '环绕镜头，匀速环绕12秒完成一周始终正对主体'
    };

    // 优先使用专业代码
    if (panel.movementType && movementCodeMap[panel.movementType]) {
        parts.push(movementCodeMap[panel.movementType]);
    } else if (panel.cameraMovement && movementMap[panel.cameraMovement]) {
        parts.push(movementMap[panel.cameraMovement]);
    }

    // 🆕 接入情绪化运镜预设
    if (panel.cameraMovement && EMOTIONAL_CAMERA_PRESETS[panel.cameraMovement]) {
        parts.push(EMOTIONAL_CAMERA_PRESETS[panel.cameraMovement]);
    }

    // 🆕 接入专业运镜模版
    if (panel.cameraMovement && PROFESSIONAL_CAMERA_TEMPLATES[panel.cameraMovement]) {
        parts.push(PROFESSIONAL_CAMERA_TEMPLATES[panel.cameraMovement]);
    }

    // 🆕 接入视觉特效预设
    if (panel.cameraMovement && VISUAL_EFFECT_PRESETS[panel.cameraMovement]) {
        parts.push(VISUAL_EFFECT_PRESETS[panel.cameraMovement]);
    }

    // 🆕 接入时间控制预设
    if (panel.cameraMovement && TIME_CONTROL_PRESETS[panel.cameraMovement]) {
        parts.push(TIME_CONTROL_PRESETS[panel.cameraMovement]);
    }

    // 时长
    if (panel.duration) {
        parts.push(`${panel.duration}秒时长`);
    }

    // 🆕 动作提示（保留旧逻辑兼容）
    if (panel.actionCue) {
        if (panel.actionCue.startAction && panel.actionCue.endAction) {
            parts.push(`动作：从"${panel.actionCue.startAction}"到"${panel.actionCue.endAction}"`);
        } else if (panel.actionCue.startAction) {
            parts.push(`起始动作：${panel.actionCue.startAction}`);
        }
        if (panel.actionCue.direction) {
            parts.push(`方向：${panel.actionCue.direction}`);
        }
    }

    // 🆕 起止帧描述（运动层分离 - 最重要）
    if (panel.startFrame || panel.endFrame) {
        const frameParts: string[] = [];
        if (panel.startFrame) {
            frameParts.push(`【起始帧】${panel.startFrame}`);
        }
        if (panel.endFrame) {
            frameParts.push(`【结束帧】${panel.endFrame}`);
        }
        parts.push(frameParts.join(' → '));
    }

    // 🆕 运动速度
    if (panel.motionSpeed) {
        const speedMap: Record<string, string> = {
            'slow': '慢动作，0.5倍速',
            'normal': '正常速度',
            'fast': '快动作，2倍速',
            'timelapse': '延时摄影，加速运动'
        };
        parts.push(speedMap[panel.motionSpeed] || panel.motionSpeed);
    }

    // 🆕 角色动作列表（运动层分离 - 角色层）
    if (panel.characterActions && panel.characterActions.length > 0) {
        parts.push(`【角色动作】${panel.characterActions.join('；')}`);
    }

    // 🆕 环境动态描述（运动层分离 - 环境层）
    if (panel.environmentMotion) {
        parts.push(`【环境动态】${panel.environmentMotion}`);
    }

    // 场景环境
    const scene = scenes.find(s => s.id === panel.sceneId);
    if (scene) {
        if (scene.location) {
            parts.push(`场景：${scene.location}`);
        }
        if (scene.environment) {
            parts.push(scene.environment);
        }
    }

    // 动作描述
    if (panel.description) {
        parts.push(panel.description);
    }

    // 角色动作（基础角色信息）
    if (panel.characters && panel.characters.length > 0) {
        panel.characters.forEach(name => {
            const char = characters.find(c => c.name === name);
            if (char) {
                // 使用触发词增强一致性
                if (char.triggerWord) {
                    parts.push(`【${char.triggerWord}】${name}`);
                } else if (char.appearance) {
                    parts.push(`${name}（${char.appearance}）`);
                } else {
                    parts.push(name);
                }
            } else {
                parts.push(name);
            }
        });
    }

    // 对白
    if (panel.dialogue) {
        parts.push(`对白："${panel.dialogue}"`);
    }

    // 🆕 导演风格完整应用
    if (directorStyle) {
        // 艺术风格
        if (directorStyle.artStyle) {
            parts.push(`${directorStyle.artStyle}风格`);
        }
        // 色调
        if (directorStyle.colorTone) {
            parts.push(directorStyle.colorTone);
        }
        // 光影风格
        if (directorStyle.lightingStyle) {
            parts.push(directorStyle.lightingStyle);
        }
        // 镜头风格
        if (directorStyle.cameraStyle) {
            parts.push(directorStyle.cameraStyle);
        }
        // 情绪氛围
        if (directorStyle.mood) {
            parts.push(`${directorStyle.mood}氛围`);
        }
        // 自定义提示词
        if (directorStyle.customPrompt) {
            parts.push(directorStyle.customPrompt);
        }

        // 🆕 帧率设置
        if (directorStyle.videoFrameRate) {
            const frameRateMap: Record<string, string> = {
                '24': '24fps电影流畅',
                '30': '30fps标准流畅',
                '60': '60fps超流畅'
            };
            parts.push(frameRateMap[directorStyle.videoFrameRate] || `${directorStyle.videoFrameRate}fps`);
        }

        // 🆕 运动强度
        if (directorStyle.motionIntensity) {
            const intensityMap: Record<string, string> = {
                'subtle': '微动效果',
                'normal': '标准运动',
                'dynamic': '强烈动态'
            };
            parts.push(intensityMap[directorStyle.motionIntensity] || directorStyle.motionIntensity);
        }
    }

    // 🆕 宽高比（适配不同平台）
    if ((panel as any).aspectRatio) {
        const aspectMap: Record<string, string> = {
            '16:9': '横屏16:9电影比例',
            '9:16': '竖屏9:16手机比例',
            '1:1': '方形1:1社交媒体比例',
            '4:3': '经典4:3比例',
            '21:9': '超宽21:9电影比例'
        };
        parts.push(aspectMap[(panel as any).aspectRatio] || (panel as any).aspectRatio);
    }

    // 🆕 音效提示融入（增强视频氛围）
    if (panel.soundEffects && panel.soundEffects.length > 0) {
        parts.push(`【音效氛围】${panel.soundEffects.slice(0, 3).join('、')}`);
    }

    // 🆕 背景音乐提示
    if (panel.music) {
        parts.push(`【BGM】${panel.music}`);
    }

    // 🆕 动态视频质量标签（根据导演风格调整）
    const videoQualityTags = ['流畅运动', '电影级视频', '专业摄影', '高清画质'];
    if (directorStyle?.artStyle) {
        const styleQualityMap: Record<string, string[]> = {
            '水墨': ['东方美学', '写意风格'],
            '赛博朋克': ['未来感', '霓虹光效'],
            '复古': ['胶片质感', '年代感'],
            '写实': ['真实光影', '自然色彩'],
            '动漫': ['二次元', '日系风格'],
            '奇幻': ['魔幻光效', '梦幻氛围']
        };
        const extraTags = styleQualityMap[directorStyle.artStyle] || [];
        videoQualityTags.push(...extraTags);
    }
    parts.push(...videoQualityTags);

    // 🆕 根据平台格式化输出
    const formatForPlatform = (parts: string[], platform: VideoPlatform): string => {
        switch (platform) {
            case 'runway':
                // Runway Gen-3 格式：结构化标签
                return parts.map(p => {
                    if (p.startsWith('【')) return p.replace(/【(.+?)】/, '[$1]');
                    return p;
                }).join(', ') + ' --ar 16:9 --quality 4K';

            case 'pika':
                // Pika 格式：简洁自然语言
                return parts.filter(p => !p.includes('效果') && !p.includes('标签'))
                    .slice(0, 10).join('，') + '，高质量视频';

            case 'kling':
                // 可灵格式：中文描述 + 参数
                return parts.join('，') + ' #视频生成 #电影感';

            case 'comfyui':
                // ComfyUI 格式：节点参数风格
                return `positive_prompt: "${parts.filter(p => !p.startsWith('--')).join(', ')}"`;

            default:
                // 通用格式
                return parts.filter(p => p).join(', ');
        }
    };

    let result = formatForPlatform(parts, actualPlatform as VideoPlatform);

    // 🆕 负面提示词
    if (directorStyle?.negativePrompt) {
        if (actualPlatform === 'comfyui') {
            result += `, negative_prompt: "${directorStyle.negativePrompt}"`;
        } else {
            result += ` --neg ${directorStyle.negativePrompt}`;
        }
    }

    return result;
}

/**
 * 🆕 生成负面提示词
 */
export function generateNegativePrompt(
    directorStyle?: DirectorStyle
): string {
    if (directorStyle?.negativePrompt) {
        return directorStyle.negativePrompt;
    }
    return DEFAULT_NEGATIVE_PROMPT;
}

/**
 * 🆕 生成角色定义词（用于导出）
 */
export function generateCharacterDefinition(character: Character): string {
    const parts: string[] = [];

    // 触发词
    if (character.triggerWord) {
        parts.push(`[Trigger Word] ${character.triggerWord}`);
    }

    // 名字
    parts.push(`[Name] ${character.name}`);

    // 标准化外貌
    if (character.standardAppearance) {
        parts.push(`[Appearance] ${character.standardAppearance}`);
    } else if (character.appearance) {
        parts.push(`[Appearance] ${character.appearance}`);
    }

    // 性格（可选）
    if (character.personality) {
        parts.push(`[Personality] ${character.personality}`);
    }

    return parts.join('\n');
}

/**
 * 🆕 批量导出所有角色定义词
 */
export function exportAllCharacterDefinitions(characters: Character[]): string {
    return characters.map(char => {
        return `=== ${char.name} ===\n${generateCharacterDefinition(char)}`;
    }).join('\n\n');
}

/**
 * 🆕 导出目标平台类型
 */
export type ExportPlatform = 'generic' | 'midjourney' | 'comfyui' | 'runway' | 'pika';

/**
 * 🆕 平台特定参数
 */
const PLATFORM_PARAMS: Record<ExportPlatform, { suffix: string; format: string }> = {
    generic: { suffix: '', format: 'standard' },
    midjourney: { suffix: ' --ar 16:9 --style raw --v 6.1', format: 'midjourney' },
    comfyui: { suffix: '', format: 'comfyui_json' },
    runway: { suffix: ', high quality video, smooth motion', format: 'runway' },
    pika: { suffix: ', cinematic, detailed motion', format: 'pika' }
};

/**
 * 🆕 生成分镜提示词包（单个分镜）
 */
export function generatePanelPromptPack(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle,
    platform: ExportPlatform = 'generic'
): {
    imagePrompt: string;
    videoPrompt: string;
    negativePrompt: string;
    characterRefs: string[];
    metadata: {
        panelNumber: number;
        duration: number;
        transition: string;
        platform: string;
    };
} {
    const platformConfig = PLATFORM_PARAMS[platform];

    // 生成提示词
    let imagePrompt = generateStoryboardImagePrompt(panel, characters, scenes, directorStyle);
    let videoPrompt = generateStoryboardVideoPrompt(panel, characters, scenes, directorStyle, platform);

    // 添加平台特定参数
    if (platform === 'midjourney') {
        imagePrompt += platformConfig.suffix;
    } else if (platform === 'runway' || platform === 'pika') {
        videoPrompt += platformConfig.suffix;
    }

    // 收集相关角色定义
    const charRefs = (panel.characters || [])
        .map(name => characters.find(c => c.name === name))
        .filter((c): c is Character => c !== undefined)
        .map(c => generateCharacterDefinition(c));

    return {
        imagePrompt,
        videoPrompt,
        negativePrompt: generateNegativePrompt(directorStyle),
        characterRefs: charRefs,
        metadata: {
            panelNumber: panel.panelNumber,
            duration: panel.duration || 3,
            transition: panel.transition || '切至',
            platform: platform
        }
    };
}

/**
 * 🆕 批量导出所有分镜提示词包
 */
export function exportAllPanelPrompts(
    panels: StoryboardPanel[],
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle,
    platform: ExportPlatform = 'generic'
): string {
    const output: string[] = [];

    // 添加头部信息
    output.push(`# 分镜提示词导出`);
    output.push(`# 平台: ${platform}`);
    output.push(`# 导出时间: ${new Date().toISOString()}`);
    output.push(`# 总分镜数: ${panels.length}`);
    output.push('');

    // 导出负面提示词（通用）
    output.push('## 负面提示词 (Negative Prompt)');
    output.push(generateNegativePrompt(directorStyle));
    output.push('');

    // 导出角色定义
    output.push('## 角色定义 (Character Definitions)');
    output.push(exportAllCharacterDefinitions(characters));
    output.push('');

    // 导出每个分镜
    output.push('## 分镜提示词');
    panels.forEach((panel, index) => {
        const pack = generatePanelPromptPack(panel, characters, scenes, directorStyle, platform);

        output.push(`\n### 分镜 ${index + 1} (${pack.metadata.duration}秒)`);
        output.push(`**AI绘画提示词:**`);
        output.push(pack.imagePrompt);
        output.push('');
        output.push(`**AI视频提示词:**`);
        output.push(pack.videoPrompt);
        output.push('');
        if (pack.metadata.transition !== '切至') {
            output.push(`**转场:** ${pack.metadata.transition}`);
        }
        output.push('---');
    });

    return output.join('\n');
}
