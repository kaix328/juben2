/**
 * 专业调色预设库
 * Professional Color Grading Presets Library
 * 
 * 为 AI 图片/视频生成提供专业级调色方案
 */

// ============ 类型定义 ============

export interface ColorGradePreset {
    id: string;
    name: string;           // 中文名称
    nameEn: string;         // 英文名称
    description: string;    // 中文描述
    category: 'cinematic' | 'timeOfDay' | 'mood' | 'genre' | 'regional';
    moods: string[];        // 匹配的氛围关键词
    promptZh: string;       // 中文提示词
    promptEn: string;       // 英文提示词
    hex: {
        primary: string;      // 主色
        secondary: string;    // 副色
    };
}

// ============ 调色预设库 ============

export const COLOR_GRADE_PRESETS: Record<string, ColorGradePreset> = {
    // ========== 🎬 电影风格 (Cinematic) ==========
    'cinematic_teal_orange': {
        id: 'cinematic_teal_orange',
        name: '青橙对比',
        nameEn: 'Teal & Orange',
        description: '好莱坞大片标志性调色，肤色偏橙、阴影偏青',
        category: 'cinematic',
        moods: ['action', 'blockbuster', 'drama', 'adventure', '动作', '冒险', '剧情'],
        promptZh: '青橙色调, 电影级调色, 肤色暖调, 冷色阴影, 高对比度',
        promptEn: 'teal and orange color grading, cinematic LUT, warm skin tones, cool shadows, high contrast',
        hex: { primary: '#FF8C42', secondary: '#2A9D8F' }
    },
    'noir': {
        id: 'noir',
        name: '黑色电影',
        nameEn: 'Film Noir',
        description: '高对比黑白或低饱和，深邃阴影，侦探/悬疑',
        category: 'cinematic',
        moods: ['mystery', 'thriller', 'detective', 'suspense', '悬疑', '侦探', '黑暗'],
        promptZh: '黑色电影风格, 高对比度, 低饱和度, 深邃阴影, 明暗对比强烈',
        promptEn: 'film noir style, high contrast, low saturation, deep shadows, chiaroscuro lighting',
        hex: { primary: '#1A1A2E', secondary: '#E8E8E8' }
    },
    'blockbuster_warm': {
        id: 'blockbuster_warm',
        name: '商业大片暖调',
        nameEn: 'Blockbuster Warm',
        description: '温暖明亮的商业片调色，英雄主义',
        category: 'cinematic',
        moods: ['hero', 'epic', 'action', '英雄', '史诗', '热血'],
        promptZh: '商业大片调色, 温暖明亮, 金色高光, 英雄主义氛围',
        promptEn: 'blockbuster movie grading, warm bright tones, golden highlights, heroic atmosphere',
        hex: { primary: '#FFD700', secondary: '#FF6B35' }
    },
    'arthouse_muted': {
        id: 'arthouse_muted',
        name: '艺术电影沉静',
        nameEn: 'Arthouse Muted',
        description: '低饱和度、柔和对比，文艺片质感',
        category: 'cinematic',
        moods: ['art', 'indie', 'contemplative', '文艺', '独立', '沉思'],
        promptZh: '艺术电影调色, 低饱和度, 柔和对比, 沉静质感, 自然光',
        promptEn: 'arthouse film grading, muted colors, soft contrast, contemplative mood, natural lighting',
        hex: { primary: '#9B8B7A', secondary: '#D4C8BE' }
    },
    'vintage_film': {
        id: 'vintage_film',
        name: '复古胶片',
        nameEn: 'Vintage Film',
        description: '模拟旧胶片质感，带颗粒和褪色效果',
        category: 'cinematic',
        moods: ['retro', 'period', 'nostalgic', '复古', '年代', '怀旧'],
        promptZh: '复古胶片风格, 胶片颗粒, 褪色色彩, 35毫米胶片质感, 暖调偏黄',
        promptEn: 'vintage film look, film grain, faded colors, 35mm film aesthetic, warm yellow tint',
        hex: { primary: '#C9A66B', secondary: '#7D6B4C' }
    },

    // ========== 🌅 时段调色 (Time of Day) ==========
    'dawn': {
        id: 'dawn',
        name: '黎明微光',
        nameEn: 'Dawn',
        description: '柔和粉蓝渐变，新的开始',
        category: 'timeOfDay',
        moods: ['dawn', 'hope', 'new beginning', '黎明', '希望', '清晨'],
        promptZh: '黎明光线, 粉蓝渐变天空, 晨曦微光, 柔和自然光',
        promptEn: 'soft dawn lighting, pink and blue gradient sky, gentle morning glow, soft natural light',
        hex: { primary: '#FFB6C1', secondary: '#87CEEB' }
    },
    'golden_hour': {
        id: 'golden_hour',
        name: '黄金时刻',
        nameEn: 'Golden Hour',
        description: '温暖的日落色调，适合浪漫或回忆场景',
        category: 'timeOfDay',
        moods: ['romantic', 'nostalgic', 'warm', 'sunset', '浪漫', '怀旧', '日落'],
        promptZh: '黄金时刻光线, 温暖橙色光芒, 柔和镜头光晕, 金色氛围',
        promptEn: 'golden hour lighting, warm orange glow, soft lens flare, magic hour cinematography',
        hex: { primary: '#FFB347', secondary: '#FFCC99' }
    },
    'dusk': {
        id: 'dusk',
        name: '暮色渐深',
        nameEn: 'Dusk',
        description: '橙紫渐变，一天的结束',
        category: 'timeOfDay',
        moods: ['dusk', 'ending', 'melancholy', 'twilight', '黄昏', '落幕', '忧郁'],
        promptZh: '暮色氛围, 橙紫渐变, 黄昏电影感, 渐暗光线',
        promptEn: 'dusk atmosphere, orange to purple gradient, twilight cinematography, fading light',
        hex: { primary: '#FF7F50', secondary: '#9370DB' }
    },
    'moonlight_blue': {
        id: 'moonlight_blue',
        name: '月光蓝调',
        nameEn: 'Moonlit Night',
        description: '冷蓝色夜景调色，神秘或孤独氛围',
        category: 'timeOfDay',
        moods: ['night', 'lonely', 'mystery', 'moonlight', '夜晚', '孤独', '月光'],
        promptZh: '月光蓝调, 夜景调色, 冷色阴影, 深蓝色调, 银色月光',
        promptEn: 'moonlit blue tones, night color grading, cool shadows, deep blue hues, silver moonlight',
        hex: { primary: '#4A6FA5', secondary: '#1E3A5F' }
    },
    'harsh_noon': {
        id: 'harsh_noon',
        name: '正午烈日',
        nameEn: 'Harsh Noon',
        description: '强烈阳光直射，高对比度，适合紧张场景',
        category: 'timeOfDay',
        moods: ['noon', 'intense', 'tense', '正午', '紧张', '炎热'],
        promptZh: '正午强光, 高对比度, 短硬阴影, 炎热氛围',
        promptEn: 'harsh noon sunlight, high contrast, short hard shadows, intense heat atmosphere',
        hex: { primary: '#FFFACD', secondary: '#F0E68C' }
    },

    // ========== 🎭 情绪调色 (Mood) ==========
    'horror_green': {
        id: 'horror_green',
        name: '恐怖绿调',
        nameEn: 'Horror Green',
        description: '不安的绿色调，适合惊悚超自然场景',
        category: 'mood',
        moods: ['horror', 'unease', 'supernatural', 'creepy', '恐怖', '不安', '诡异'],
        promptZh: '病态绿色调, 恐怖电影调色, 诡异氛围, 阴森光线',
        promptEn: 'sickly green tint, horror movie color grading, eerie atmosphere, unsettling lighting',
        hex: { primary: '#2C5530', secondary: '#1A3320' }
    },
    'romantic_soft': {
        id: 'romantic_soft',
        name: '柔和浪漫',
        nameEn: 'Romantic Soft',
        description: '柔焦高光，粉调滤镜，梦幻氛围',
        category: 'mood',
        moods: ['romantic', 'dreamy', 'gentle', 'love', '浪漫', '梦幻', '柔情'],
        promptZh: '柔和浪漫调色, 柔焦高光, 淡粉色调, 梦幻氛围, 柔光',
        promptEn: 'soft romantic grading, diffused highlights, subtle pink tint, dreamy atmosphere, soft glow',
        hex: { primary: '#FFD1DC', secondary: '#FFF0F5' }
    },
    'desaturated_gritty': {
        id: 'desaturated_gritty',
        name: '去饱和沉郁',
        nameEn: 'Gritty Desaturated',
        description: '压低饱和度，增强质感，适合战争/末日题材',
        category: 'mood',
        moods: ['war', 'dystopia', 'gritty', 'apocalypse', '战争', '末日', '沉郁'],
        promptZh: '低饱和度调色, 粗粝质感, 暗沉色彩, 冷调阴影',
        promptEn: 'desaturated color grading, gritty texture, muted colors, cold undertones',
        hex: { primary: '#5C5C5C', secondary: '#8B8B8B' }
    },
    'vibrant_pop': {
        id: 'vibrant_pop',
        name: '鲜艳跳跃',
        nameEn: 'Vibrant Pop',
        description: '高饱和度明亮色彩，适合喜剧或青春题材',
        category: 'mood',
        moods: ['comedy', 'youth', 'energetic', 'happy', '喜剧', '青春', '活力'],
        promptZh: '鲜艳饱和色彩, 高调光线, 明亮活泼, 青春氛围',
        promptEn: 'vibrant saturated colors, high key lighting, pop color grading, bright and cheerful',
        hex: { primary: '#FF6B6B', secondary: '#4ECDC4' }
    },
    'melancholy_blue': {
        id: 'melancholy_blue',
        name: '忧郁蓝调',
        nameEn: 'Melancholy Blue',
        description: '冷蓝色调，低饱和，适合悲伤或反思',
        category: 'mood',
        moods: ['sad', 'melancholy', 'reflective', 'lonely', '悲伤', '忧郁', '反思'],
        promptZh: '忧郁蓝调, 低饱和度, 冷色调, 沉思氛围',
        promptEn: 'melancholy blue tones, low saturation, cold color palette, pensive atmosphere',
        hex: { primary: '#4682B4', secondary: '#5F9EA0' }
    },
    'rage_red': {
        id: 'rage_red',
        name: '愤怒红调',
        nameEn: 'Rage Red',
        description: '红色偏移，高对比，表达愤怒或危险',
        category: 'mood',
        moods: ['anger', 'rage', 'danger', 'violence', '愤怒', '危险', '暴力'],
        promptZh: '愤怒红调, 红色滤镜, 高对比度, 危险氛围',
        promptEn: 'rage red tint, red color shift, high contrast, dangerous atmosphere',
        hex: { primary: '#8B0000', secondary: '#FF4500' }
    },

    // ========== 🎬 类型片调色 (Genre) ==========
    'scifi_cyberpunk': {
        id: 'scifi_cyberpunk',
        name: '赛博朋克',
        nameEn: 'Cyberpunk',
        description: '霓虹色彩，紫青对比，未来都市感',
        category: 'genre',
        moods: ['scifi', 'cyberpunk', 'neon', 'future', '科幻', '赛博', '霓虹'],
        promptZh: '赛博朋克调色, 霓虹紫青, 未来都市, 霓虹灯光, 雨夜反射',
        promptEn: 'cyberpunk color grading, neon purple and cyan, futuristic city, neon lights, rain reflections',
        hex: { primary: '#FF00FF', secondary: '#00FFFF' }
    },
    'fantasy_ethereal': {
        id: 'fantasy_ethereal',
        name: '奇幻空灵',
        nameEn: 'Fantasy Ethereal',
        description: '梦幻紫蓝，光晕效果，魔法氛围',
        category: 'genre',
        moods: ['fantasy', 'magic', 'ethereal', 'mythical', '奇幻', '魔法', '空灵'],
        promptZh: '奇幻空灵调色, 梦幻紫蓝, 魔法光晕, 神秘氛围',
        promptEn: 'fantasy ethereal grading, dreamy purple blue, magical glow, mystical atmosphere',
        hex: { primary: '#9B59B6', secondary: '#3498DB' }
    },
    'western_sepia': {
        id: 'western_sepia',
        name: '西部棕褐',
        nameEn: 'Western Sepia',
        description: '复古棕褐色调，西部片经典风格',
        category: 'genre',
        moods: ['western', 'desert', 'cowboy', 'old west', '西部', '沙漠', '牛仔'],
        promptZh: '西部片调色, 棕褐复古, 沙漠黄土, 烈日风沙',
        promptEn: 'western movie sepia, dusty brown tones, desert yellow, harsh sunlight',
        hex: { primary: '#D2691E', secondary: '#F4A460' }
    },
    'thriller_cold': {
        id: 'thriller_cold',
        name: '惊悚冷调',
        nameEn: 'Thriller Cold',
        description: '冷蓝绿调，低饱和，紧张压抑',
        category: 'genre',
        moods: ['thriller', 'suspense', 'tension', 'crime', '惊悚', '悬疑', '犯罪'],
        promptZh: '惊悚冷调, 低饱和蓝绿, 紧张氛围, 压抑光线',
        promptEn: 'thriller cold grading, desaturated teal, tense atmosphere, oppressive lighting',
        hex: { primary: '#2F4F4F', secondary: '#708090' }
    },

    // ========== 🌏 地域风格 (Regional) ==========
    'chinese_ink': {
        id: 'chinese_ink',
        name: '水墨国风',
        nameEn: 'Chinese Ink',
        description: '水墨画风格，低饱和度，东方美学',
        category: 'regional',
        moods: ['chinese', 'traditional', 'ink', 'oriental', '国风', '水墨', '传统'],
        promptZh: '水墨国风调色, 低饱和度, 黑白灰为主, 东方美学, 留白意境',
        promptEn: 'Chinese ink wash style, low saturation, black white gray palette, oriental aesthetics, negative space',
        hex: { primary: '#2C2C2C', secondary: '#D3D3D3' }
    },
    'japanese_pastel': {
        id: 'japanese_pastel',
        name: '日系柔和',
        nameEn: 'Japanese Pastel',
        description: '清新柔和，高明度低饱和，日本动漫风',
        category: 'regional',
        moods: ['japanese', 'anime', 'soft', 'pastel', '日系', '动漫', '清新'],
        promptZh: '日系柔和调色, 高明度, 低饱和, 清新淡雅, 柔光氛围',
        promptEn: 'Japanese pastel grading, high brightness, low saturation, soft and delicate, soft light',
        hex: { primary: '#FFE4E1', secondary: '#E6E6FA' }
    },
    'korean_drama': {
        id: 'korean_drama',
        name: '韩剧唯美',
        nameEn: 'Korean Drama',
        description: '清透明亮，蓝调偏冷，韩剧经典风格',
        category: 'regional',
        moods: ['korean', 'drama', 'romance', 'clean', '韩剧', '唯美', '清透'],
        promptZh: '韩剧唯美调色, 清透明亮, 蓝调偏冷, 肤色白皙, 干净氛围',
        promptEn: 'Korean drama grading, clear and bright, cool blue tint, fair skin tones, clean atmosphere',
        hex: { primary: '#ADD8E6', secondary: '#F5F5F5' }
    },
    'bollywood_saturated': {
        id: 'bollywood_saturated',
        name: '宝莱坞艳丽',
        nameEn: 'Bollywood Saturated',
        description: '高饱和度鲜艳色彩，印度电影风格',
        category: 'regional',
        moods: ['bollywood', 'indian', 'colorful', 'festive', '印度', '节日', '艳丽'],
        promptZh: '宝莱坞调色, 高饱和度, 鲜艳色彩, 金色点缀, 节日氛围',
        promptEn: 'Bollywood color grading, high saturation, vivid colors, golden accents, festive atmosphere',
        hex: { primary: '#FF1493', secondary: '#FFD700' }
    },
    'nordic_cold': {
        id: 'nordic_cold',
        name: '北欧冷峻',
        nameEn: 'Nordic Cold',
        description: '冷灰蓝调，极简风格，斯堪的纳维亚美学',
        category: 'regional',
        moods: ['nordic', 'scandinavian', 'cold', 'minimal', '北欧', '极简', '冷峻'],
        promptZh: '北欧冷峻调色, 冷灰蓝调, 极简风格, 自然光线',
        promptEn: 'Nordic cold grading, cool gray blue tones, minimalist style, natural lighting',
        hex: { primary: '#B0C4DE', secondary: '#778899' }
    }
};

// ============ 辅助函数 ============

/**
 * 获取所有预设列表
 */
export function getAllColorPresets(): ColorGradePreset[] {
    return Object.values(COLOR_GRADE_PRESETS);
}

/**
 * 按类别分组获取预设
 */
export function getPresetsByCategory(): Record<string, ColorGradePreset[]> {
    const grouped: Record<string, ColorGradePreset[]> = {
        cinematic: [],
        timeOfDay: [],
        mood: [],
        genre: [],
        regional: []
    };

    Object.values(COLOR_GRADE_PRESETS).forEach(preset => {
        grouped[preset.category]?.push(preset);
    });

    return grouped;
}

/**
 * 根据氛围关键词匹配最佳调色
 */
export function matchColorByMood(mood: string, timeOfDay?: string, location?: string): string {
    const normalizedMood = (mood || '').toLowerCase();
    const normalizedTime = (timeOfDay || '').toLowerCase();
    const normalizedLocation = (location || '').toLowerCase();

    // 优先匹配时段
    if (normalizedTime.includes('黎明') || normalizedTime.includes('清晨') || normalizedTime.includes('dawn')) {
        return 'dawn';
    }
    if (normalizedTime.includes('黄昏') || normalizedTime.includes('日落') || normalizedTime.includes('sunset') || normalizedTime.includes('golden')) {
        return 'golden_hour';
    }
    if (normalizedTime.includes('暮') || normalizedTime.includes('傍晚') || normalizedTime.includes('dusk')) {
        return 'dusk';
    }
    if (normalizedTime.includes('夜') || normalizedTime.includes('深夜') || normalizedTime.includes('night')) {
        return 'moonlight_blue';
    }
    if (normalizedTime.includes('午') || normalizedTime.includes('noon')) {
        return 'harsh_noon';
    }

    // 匹配氛围
    for (const [id, preset] of Object.entries(COLOR_GRADE_PRESETS)) {
        for (const moodKeyword of preset.moods) {
            if (normalizedMood.includes(moodKeyword.toLowerCase())) {
                return id;
            }
        }
    }

    // 匹配场景
    if (normalizedLocation.includes('科幻') || normalizedLocation.includes('未来') || normalizedLocation.includes('霓虹')) {
        return 'scifi_cyberpunk';
    }
    if (normalizedLocation.includes('古') || normalizedLocation.includes('武侠') || normalizedLocation.includes('水墨')) {
        return 'chinese_ink';
    }
    if (normalizedLocation.includes('沙漠') || normalizedLocation.includes('西部')) {
        return 'western_sepia';
    }

    // 默认返回电影级青橙
    return 'cinematic_teal_orange';
}

/**
 * 获取调色提示词（支持中英文）
 */
export function getColorPrompt(colorGradeId: string, language: 'zh' | 'en' = 'zh'): string {
    const preset = COLOR_GRADE_PRESETS[colorGradeId];
    if (!preset) return '';

    return language === 'zh' ? preset.promptZh : preset.promptEn;
}

/**
 * 获取调色预设详情
 */
export function getColorPreset(colorGradeId: string): ColorGradePreset | undefined {
    return COLOR_GRADE_PRESETS[colorGradeId];
}

/**
 * 类别中文名映射
 */
export const CATEGORY_NAMES: Record<string, string> = {
    cinematic: '🎬 电影风格',
    timeOfDay: '🌅 时段调色',
    mood: '🎭 情绪氛围',
    genre: '🎥 类型片风格',
    regional: '🌏 地域风格'
};
