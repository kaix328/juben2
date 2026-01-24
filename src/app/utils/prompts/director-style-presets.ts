import type { DirectorStyle } from '../../types';

/**
 * 导演风格预设模板
 */
export const DIRECTOR_STYLE_PRESETS: Record<string, DirectorStyle> = {
    // ========== 经典日系动画 ==========
    '宫崎骏风格': {
        artStyle: '手绘动画',
        colorTone: '温暖柔和色调',
        lightingStyle: '自然柔和光线',
        cameraStyle: '电影级镜头',
        mood: '温馨治愈',
        customPrompt: 'Studio Ghibli style, hand-drawn animation, watercolor aesthetic, nature elements',
        negativePrompt: '写实风格, 3D渲染, 暗黑恐怖, 血腥暴力',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '新海诚风格': {
        artStyle: '唯美写实',
        colorTone: '高饱和度鲜艳色彩',
        lightingStyle: '戏剧性光影对比',
        cameraStyle: '广角镜头',
        mood: '浪漫忧郁',
        customPrompt: 'Makoto Shinkai style, detailed urban scenery, beautiful sky, lens flare, romantic atmosphere',
        negativePrompt: '卡通Q版, 粗糙线条, 暗沉色调',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'normal'
    },
    '今敏风格': {
        artStyle: '写实动画',
        colorTone: '高饱和度',
        lightingStyle: '戏剧性光影',
        cameraStyle: '快速剪辑',
        mood: '梦幻迷离',
        customPrompt: 'Satoshi Kon style, surreal transitions, dream-like, psychological thriller, anime realism, seamless reality shifts',
        negativePrompt: '简单卡通, 低细节, 平淡叙事',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'dynamic'
    },

    // ========== 西方经典导演 ==========
    '诺兰风格': {
        artStyle: '写实主义',
        colorTone: '冷色调去饱和',
        lightingStyle: '强对比戏剧光',
        cameraStyle: '史诗级IMAX镜头',
        mood: '紧张悬疑',
        customPrompt: 'Christopher Nolan style, realistic, IMAX cinematography, wide angle, dramatic lighting',
        negativePrompt: '卡通风格, 鲜艳色彩, 可爱元素',
        aspectRatio: '21:9',
        videoFrameRate: '24',
        motionIntensity: 'dynamic'
    },
    '昆汀风格': {
        artStyle: '复古胶片',
        colorTone: '鲜艳高饱和色彩',
        lightingStyle: '强烈对比光线',
        cameraStyle: '特写广角交替',
        mood: '暴力美学',
        customPrompt: 'Quentin Tarantino style, retro film grain, vibrant colors, extreme close-ups, stylized violence',
        negativePrompt: '温馨可爱, 柔和色调, 儿童向',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'dynamic'
    },
    '王家卫风格': {
        artStyle: '写实主义',
        colorTone: '温暖复古',
        lightingStyle: '霓虹灯光',
        cameraStyle: '手持摄影',
        mood: '孤独浪漫',
        customPrompt: 'Wong Kar-wai style, neon lights, handheld camera, nostalgic mood, motion blur, slow motion, urban melancholy',
        negativePrompt: '明亮温馨, 快节奏, 喜剧风格',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '韦斯·安德森风格': {
        artStyle: '对称构图',
        colorTone: '柔和复古色调',
        lightingStyle: '均匀平面照明',
        cameraStyle: '正面对称镜头',
        mood: '奇幻怀旧',
        customPrompt: 'Wes Anderson style, symmetrical composition, pastel colors, whimsical, vintage aesthetic, centered framing',
        negativePrompt: '不对称, 混乱构图, 暗黑风格',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '吉尔莫·德尔·托罗风格': {
        artStyle: '哥特式奇幻',
        colorTone: '冷色调',
        lightingStyle: '阴影对比',
        cameraStyle: '戏剧性构图',
        mood: '神秘阴郁',
        customPrompt: 'Guillermo del Toro style, gothic fantasy, creature design, dark fairy tale, ornate details, magical realism',
        negativePrompt: '明亮温馨, 简约风格, 卡通可爱',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'normal'
    },

    // ========== 视觉风格 ==========
    '赛博朋克': {
        artStyle: '赛博朋克',
        colorTone: '霓虹色彩',
        lightingStyle: '霓虹灯光效',
        cameraStyle: '未来科技镜头',
        mood: '神秘科技',
        customPrompt: 'cyberpunk style, neon lights, futuristic city, holographic elements, rain and reflections',
        negativePrompt: '自然田园, 古典风格, 暖色调',
        aspectRatio: '21:9',
        videoFrameRate: '30',
        motionIntensity: 'dynamic'
    },
    '黑色电影': {
        artStyle: '黑白胶片',
        colorTone: '黑白高对比',
        lightingStyle: '强烈阴影',
        cameraStyle: '经典胶片镜头',
        mood: '阴郁悬疑',
        customPrompt: 'film noir style, black and white, dramatic shadows, venetian blinds lighting, mystery atmosphere',
        negativePrompt: '彩色画面, 明亮温馨, 可爱卡通',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },

    // ========== AI漫剧爆款风格 ==========
    '古风仙侠': {
        artStyle: '国风水墨',
        colorTone: '青绿山水色调',
        lightingStyle: '柔和仙气光',
        cameraStyle: '飘逸镜头',
        mood: '仙气飘飘',
        customPrompt: '中国古典仙侠, 水墨画风格, 云雾缭绕, 仙鹤飞舞, 古典建筑, 飘逸衣袂, 唯美意境',
        negativePrompt: '现代元素, 西式建筑, 写实风格',
        aspectRatio: '9:16',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '都市甜宠': {
        artStyle: '唯美漫画',
        colorTone: '粉嫩甜美色调',
        lightingStyle: '柔焦梦幻光',
        cameraStyle: '浪漫镜头',
        mood: '甜蜜浪漫',
        customPrompt: '现代都市, 甜宠风格, 柔光效果, 梦幻氛围, 精致五官, 时尚穿搭, 浪漫场景',
        negativePrompt: '暗黑风格, 恐怖元素, 粗糙画风',
        aspectRatio: '9:16',
        videoFrameRate: '30',
        motionIntensity: 'normal'
    },
    '霸总虐恋': {
        artStyle: '写实漫画',
        colorTone: '冷暖对比色调',
        lightingStyle: '戏剧性侧光',
        cameraStyle: '电影级特写',
        mood: '虐恋情深',
        customPrompt: '现代都市, 霸道总裁风格, 高级感, 戏剧性光影, 情绪张力, 豪华场景, 西装革履',
        negativePrompt: '卡通风格, 低质量, 变形',
        aspectRatio: '9:16',
        videoFrameRate: '24',
        motionIntensity: 'normal'
    },
    '重生逆袭': {
        artStyle: '写实漫画',
        colorTone: '高对比鲜艳',
        lightingStyle: '高光打亮',
        cameraStyle: '快节奏剪辑',
        mood: '爽快逆袭',
        customPrompt: '重生题材, 逆袭风格, 表情夸张, 戏剧张力, 对比强烈, 高光时刻, 情绪饱满',
        negativePrompt: '平淡无奇, 暗沉色调',
        aspectRatio: '9:16',
        videoFrameRate: '30',
        motionIntensity: 'dynamic'
    },
    '玄幻修仙': {
        artStyle: '东方玄幻',
        colorTone: '金紫神秘色调',
        lightingStyle: '炫光特效',
        cameraStyle: '史诗级镜头',
        mood: '热血震撼',
        customPrompt: '玄幻修仙, 法阵符文, 金光闪耀, 灵气外溢, 飞剑法宝, 气势磅礴, 仙山福地',
        negativePrompt: '现代科技, 西方魔法, 低质量',
        aspectRatio: '9:16',
        videoFrameRate: '24',
        motionIntensity: 'dynamic'
    },
    '战神归来': {
        artStyle: '硬派写实',
        colorTone: '冷酷金属色调',
        lightingStyle: '硬朗光线',
        cameraStyle: '动作电影镜头',
        mood: '热血战斗',
        customPrompt: '战神题材, 硬汉风格, 军事元素, 肌肉线条, 冷峻表情, 战斗场景, 爆炸特效',
        negativePrompt: '软萌可爱, 女性化',
        aspectRatio: '9:16',
        videoFrameRate: '30',
        motionIntensity: 'dynamic'
    },
    '宫斗权谋': {
        artStyle: '古典华丽',
        colorTone: '宫廷富贵色调',
        lightingStyle: '烛光暖调',
        cameraStyle: '宫廷剧镜头',
        mood: '明争暗斗',
        customPrompt: '古代宫廷, 华丽服饰, 雕梁画栋, 勾心斗角, 美人如玉, 权谋深沉, 宫墙深院',
        negativePrompt: '现代元素, 简约风格',
        aspectRatio: '9:16',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '末世求生': {
        artStyle: '废土风格',
        colorTone: '灰暗荒凉色调',
        lightingStyle: '昏暗末日光',
        cameraStyle: '手持晃动镜头',
        mood: '紧张求生',
        customPrompt: '末世废土, 丧尸危机, 荒凉城市, 破败建筑, 求生装备, 紧张氛围, 危机四伏',
        negativePrompt: '明亮温馨, 可爱风格',
        aspectRatio: '16:9',
        videoFrameRate: '30',
        motionIntensity: 'dynamic'
    },
    '校园青春': {
        artStyle: '清新漫画',
        colorTone: '明亮清新色调',
        lightingStyle: '阳光明媚',
        cameraStyle: '青春活力镜头',
        mood: '青涩甜蜜',
        customPrompt: '校园青春, 阳光少年少女, 教室走廊, 樱花飘落, 制服穿搭, 纯真美好, 青春洋溢',
        negativePrompt: '暗黑成人内容, 暴力元素',
        aspectRatio: '9:16',
        videoFrameRate: '30',
        motionIntensity: 'normal'
    },
    '国风唯美': {
        artStyle: '国画工笔',
        colorTone: '水墨淡彩',
        lightingStyle: '中式柔光',
        cameraStyle: '诗意镜头',
        mood: '典雅诗意',
        customPrompt: '中国风, 工笔画风格, 汉服古装, 亭台楼阁, 山水意境, 梅兰竹菊, 诗情画意, 雅致唯美',
        negativePrompt: '西式风格, 现代元素, 粗糙线条',
        aspectRatio: '9:16',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },

    // ========== 影视公司风格 ==========
    '皮克斯风格': {
        artStyle: '3D动画',
        colorTone: '鲜艳明快',
        lightingStyle: '柔和光线',
        cameraStyle: '电影级构图',
        mood: '温馨治愈',
        customPrompt: 'Pixar style, 3D animation, vibrant colors, family-friendly, emotional storytelling, detailed textures',
        negativePrompt: '写实人物, 暗黑恐怖, 暴力血腥',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'normal'
    },
    '漫威风格': {
        artStyle: '超级英雄',
        colorTone: '高饱和度',
        lightingStyle: '强对比光',
        cameraStyle: 'IMAX大场面',
        mood: '史诗激动',
        customPrompt: 'Marvel cinematic style, epic action, superhero aesthetic, CGI effects, dramatic poses, heroic lighting',
        negativePrompt: '低成本, 简陋特效, 平淡日常',
        aspectRatio: '21:9',
        videoFrameRate: '24',
        motionIntensity: 'dynamic'
    },

    // ========== 地区风格 ==========
    '武侠风格': {
        artStyle: '古装写实',
        colorTone: '中国传统色',
        lightingStyle: '自然光',
        cameraStyle: '广角动作',
        mood: '侠义豪情',
        customPrompt: 'Chinese wuxia style, martial arts, traditional costume, ancient China, sword fighting, wire-fu action',
        negativePrompt: '现代元素, 西方魔法, 科幻风格',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'dynamic'
    },
    '宝莱坞风格': {
        artStyle: '印度电影',
        colorTone: '鲜艳饱满',
        lightingStyle: '明亮照明',
        cameraStyle: '歌舞镜头',
        mood: '欢快浪漫',
        customPrompt: 'Bollywood style, vibrant colors, dance sequences, romantic drama, elaborate costumes, festive atmosphere',
        negativePrompt: '暗黑压抑, 极简风格, 冷色调',
        aspectRatio: '16:9',
        videoFrameRate: '30',
        motionIntensity: 'dynamic'
    },

    // ========== 主题工厂风格 (Theme Factory) ==========
    '深海幽蓝': {
        artStyle: '写实主义',
        colorTone: '深海蓝绿色调',
        lightingStyle: '水下光线',
        cameraStyle: '沉浸式镜头',
        mood: '神秘宁静',
        customPrompt: 'deep ocean aesthetic, navy blue #1a2332, teal accents #2d8b8b, seafoam highlights #a8dadc, underwater atmosphere, bioluminescence, serene and mysterious',
        negativePrompt: '明亮阳光, 陆地场景, 暖色调',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '午夜星河': {
        artStyle: '梦幻奇幻',
        colorTone: '宇宙紫色调',
        lightingStyle: '星光闪烁',
        cameraStyle: '史诗级镜头',
        mood: '神秘浪漫',
        customPrompt: 'cosmic galaxy aesthetic, deep purple #2b1e3e, cosmic blue #4a4e8f, lavender accents #a490c2, silver highlights #e6e6fa, starfield, nebula, mystical atmosphere',
        negativePrompt: '日间场景, 暖色调, 简约风格',
        aspectRatio: '21:9',
        videoFrameRate: '24',
        motionIntensity: 'normal'
    },
    '金色时光': {
        artStyle: '复古温暖',
        colorTone: '秋日暖金色调',
        lightingStyle: '黄金时刻光',
        cameraStyle: '怀旧镜头',
        mood: '温馨怀旧',
        customPrompt: 'golden hour aesthetic, mustard yellow #f4a900, terracotta #c1666b, warm beige #d4b896, chocolate brown #4a403a, autumn warmth, nostalgic, cozy atmosphere',
        negativePrompt: '冷色调, 现代科技, 阴暗场景',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '森林秘境': {
        artStyle: '自然写实',
        colorTone: '森林绿色调',
        lightingStyle: '斑驳树影光',
        cameraStyle: '自然纪录镜头',
        mood: '宁静治愈',
        customPrompt: 'forest canopy aesthetic, forest green #2d4a2b, sage #7d8471, olive #a4ac86, ivory #faf9f6, dappled sunlight, nature, organic, peaceful woodland',
        negativePrompt: '城市场景, 人工照明, 鲜艳色彩',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '樱花物语': {
        artStyle: '日式唯美',
        colorTone: '樱花粉色调',
        lightingStyle: '柔和春光',
        cameraStyle: '浪漫镜头',
        mood: '浪漫唯美',
        customPrompt: 'cherry blossom aesthetic, soft pink, sakura petals falling, spring atmosphere, Japanese garden, romantic, dreamy soft focus, pastel colors',
        negativePrompt: '暗黑风格, 秋冬场景, 硬朗线条',
        aspectRatio: '9:16',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '极光幻境': {
        artStyle: '奇幻梦境',
        colorTone: '极光渐变色调',
        lightingStyle: '极光光效',
        cameraStyle: '广角全景',
        mood: '梦幻震撼',
        customPrompt: 'aurora borealis aesthetic, northern lights, gradient colors from green to purple to pink, icy landscape, magical atmosphere, ethereal glow',
        negativePrompt: '室内场景, 暖色调, 城市环境',
        aspectRatio: '21:9',
        videoFrameRate: '30',
        motionIntensity: 'normal'
    },
    '蒸汽朋克': {
        artStyle: '蒸汽朋克',
        colorTone: '铜锈复古色调',
        lightingStyle: '煤气灯光',
        cameraStyle: '维多利亚镜头',
        mood: '复古机械',
        customPrompt: 'steampunk aesthetic, brass and copper tones, Victorian era, gears and clockwork, steam-powered machinery, industrial revolution, sepia tones',
        negativePrompt: '现代科技, 简约风格, 明亮色彩',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'normal'
    },
    '水彩梦境': {
        artStyle: '水彩插画',
        colorTone: '柔和水彩色调',
        lightingStyle: '梦幻柔光',
        cameraStyle: '艺术构图',
        mood: '诗意梦幻',
        customPrompt: 'watercolor painting aesthetic, soft edges, color bleeding, artistic brushstrokes, dreamy atmosphere, pastel palette, ethereal, hand-painted look',
        negativePrompt: '写实风格, 硬边线条, 高对比度',
        aspectRatio: '16:9',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    },
    '霓虹都市': {
        artStyle: '都市夜景',
        colorTone: '霓虹炫彩色调',
        lightingStyle: '霓虹灯光',
        cameraStyle: '街拍镜头',
        mood: '潮流时尚',
        customPrompt: 'neon city aesthetic, vibrant neon signs, rain-slicked streets, reflections, urban nightlife, pink and blue neon, modern metropolis, cinematic',
        negativePrompt: '乡村场景, 自然光, 复古风格',
        aspectRatio: '9:16',
        videoFrameRate: '30',
        motionIntensity: 'dynamic'
    },
    '复古胶片': {
        artStyle: '胶片摄影',
        colorTone: '复古胶片色调',
        lightingStyle: '自然光',
        cameraStyle: '35mm胶片镜头',
        mood: '怀旧文艺',
        customPrompt: 'vintage film aesthetic, film grain, light leaks, faded colors, 35mm photography, nostalgic, analog warmth, Kodak Portra tones',
        negativePrompt: '数码清晰, 高饱和度, 现代感',
        aspectRatio: '4:3',
        videoFrameRate: '24',
        motionIntensity: 'subtle'
    }
};

/**
 * 默认负面提示词模板（统一中文）
 */
export const DEFAULT_NEGATIVE_PROMPT =
    '变形, 扭曲, 比例失调, 画工粗糙, 人体结构错误, ' +
    '多余肢体, 缺失肢体, 悬浮肢体, 断裂肢体, 畸变, 变异, ' +
    '丑陋, 恶心, 模糊, 截肢, 多余手指, 缺失手指, ' +
    '手部畸形, 三只手, 手指过多, 手指粘连, ' +
    '低分辨率, 质量差, 最差质量, 压缩失真, 水印, ' +
    '文字, 签名, 用户名, 画面裁切, 画面外内容';

/**
 * 预设分类（用于UI展示）
 */
export const PRESET_CATEGORIES = {
    '日系动画': ['宫崎骏风格', '新海诚风格', '今敏风格'],
    '西方导演': ['诺兰风格', '昆汀风格', '王家卫风格', '韦斯·安德森风格', '吉尔莫·德尔·托罗风格'],
    '视觉风格': ['赛博朋克', '黑色电影', '蒸汽朋克', '水彩梦境'],
    'AI漫剧爆款': ['古风仙侠', '都市甜宠', '霸总虐恋', '重生逆袭', '玄幻修仙', '战神归来', '宫斗权谋', '末世求生', '校园青春', '国风唯美'],
    '影视公司': ['皮克斯风格', '漫威风格'],
    '地区风格': ['武侠风格', '宝莱坞风格'],
    '主题工厂': ['深海幽蓝', '午夜星河', '金色时光', '森林秘境', '樱花物语', '极光幻境', '霓虹都市', '复古胶片'],
};
