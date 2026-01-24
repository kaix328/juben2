/**
 * 描述增强工具
 * 将用户的简短描述智能扩展为更详细、更专业的描述
 */

// ============ 描述增强规则库 ============

/**
 * 角色描述增强规则
 */
const CHARACTER_ENHANCEMENT_RULES = {
  // 年龄相关
  age: {
    patterns: [/(\d+)岁/, /年轻/, /中年/, /老年/, /少年/, /青年/],
    enhancements: {
      '年轻': '年轻活力，充满朝气',
      '中年': '成熟稳重，经验丰富',
      '老年': '年迈沧桑，智慧深邃',
      '少年': '青春年少，朝气蓬勃',
      '青年': '风华正茂，意气风发',
    }
  },
  
  // 性别相关
  gender: {
    patterns: [/男性/, /女性/, /男/, /女/],
    enhancements: {
      '男性': '男性特征明显',
      '女性': '女性特征柔美',
    }
  },
  
  // 发型相关
  hair: {
    patterns: [/短发/, /长发/, /卷发/, /直发/, /光头/, /马尾/, /披肩/],
    enhancements: {
      '短发': '短发利落，精神干练',
      '长发': '长发飘逸，优雅动人',
      '卷发': '卷发蓬松，时尚个性',
      '直发': '直发顺滑，清爽自然',
      '光头': '光头造型，个性鲜明',
      '马尾': '马尾高扎，活力十足',
      '披肩': '披肩长发，温柔婉约',
    }
  },
  
  // 服装相关
  clothing: {
    patterns: [/西装/, /T恤/, /连衣裙/, /牛仔/, /运动/, /休闲/, /正装/],
    enhancements: {
      '西装': '西装笔挺，商务精英范',
      'T恤': 'T恤休闲，简约舒适',
      '连衣裙': '连衣裙优雅，女性魅力',
      '牛仔': '牛仔装扮，青春活力',
      '运动': '运动装束，健康阳光',
      '休闲': '休闲装扮，轻松自在',
      '正装': '正装得体，庄重大方',
    }
  },
  
  // 配饰相关
  accessories: {
    patterns: [/眼镜/, /帽子/, /围巾/, /手表/, /项链/, /耳环/],
    enhancements: {
      '眼镜': '戴眼镜，知性文雅',
      '帽子': '戴帽子，时尚个性',
      '围巾': '围围巾，温暖优雅',
      '手表': '戴手表，精致讲究',
      '项链': '戴项链，精致优雅',
      '耳环': '戴耳环，时尚精致',
    }
  },
  
  // 体型相关
  body: {
    patterns: [/高大/, /瘦小/, /强壮/, /苗条/, /魁梧/, /纤细/],
    enhancements: {
      '高大': '身材高大，气场强大',
      '瘦小': '身材瘦小，娇小玲珑',
      '强壮': '体格强壮，肌肉发达',
      '苗条': '身材苗条，曲线优美',
      '魁梧': '身材魁梧，威武雄壮',
      '纤细': '身材纤细，婀娜多姿',
    }
  },
  
  // 气质相关
  temperament: {
    patterns: [/开朗/, /冷静/, /温柔/, /严肃/, /活泼/, /沉稳/],
    enhancements: {
      '开朗': '性格开朗，笑容灿烂',
      '冷静': '性格冷静，沉着理智',
      '温柔': '性格温柔，和蔼可亲',
      '严肃': '性格严肃，一丝不苟',
      '活泼': '性格活泼，热情洋溢',
      '沉稳': '性格沉稳，成熟可靠',
    }
  },
};

/**
 * 场景描述增强规则
 */
const SCENE_ENHANCEMENT_RULES = {
  // 地点类型
  location: {
    patterns: [/办公室/, /咖啡厅/, /公园/, /街道/, /房间/, /教室/, /商场/],
    enhancements: {
      '办公室': '现代化办公室，明亮宽敞，办公桌椅整齐排列，落地窗采光充足',
      '咖啡厅': '温馨咖啡厅，木质装修，柔和灯光，咖啡香气弥漫',
      '公园': '城市公园，绿树成荫，鲜花盛开，小径蜿蜒',
      '街道': '城市街道，车水马龙，高楼林立，霓虹闪烁',
      '房间': '温馨房间，家具齐全，装饰温馨，光线柔和',
      '教室': '明亮教室，课桌整齐，黑板清晰，窗明几净',
      '商场': '繁华商场，人流如织，商品琳琅满目，灯光璀璨',
    }
  },
  
  // 时间氛围
  time: {
    patterns: [/白天/, /夜晚/, /黎明/, /黄昏/, /清晨/, /傍晚/],
    enhancements: {
      '白天': '白天时分，阳光明媚，光线充足，视野清晰',
      '夜晚': '夜幕降临，灯火通明，夜色迷人，氛围静谧',
      '黎明': '黎明时分，晨光初现，天边泛白，万物苏醒',
      '黄昏': '黄昏时刻，夕阳西下，金色余晖，温暖柔和',
      '清晨': '清晨时光，朝阳初升，空气清新，生机勃勃',
      '傍晚': '傍晚时分，暮色渐浓，华灯初上，宁静祥和',
    }
  },
  
  // 天气状况
  weather: {
    patterns: [/晴天/, /雨天/, /阴天/, /雪天/, /多云/],
    enhancements: {
      '晴天': '晴空万里，阳光灿烂，天空湛蓝，白云朵朵',
      '雨天': '细雨绵绵，雨滴飘落，空气湿润，地面湿滑',
      '阴天': '天空阴沉，云层密布，光线暗淡，气氛压抑',
      '雪天': '雪花飘飘，银装素裹，白雪皑皑，寒意袭人',
      '多云': '云层密布，时有阳光，光影交错，变化多端',
    }
  },
  
  // 环境氛围
  atmosphere: {
    patterns: [/安静/, /热闹/, /紧张/, /轻松/, /神秘/, /温馨/],
    enhancements: {
      '安静': '环境安静，静谧祥和，只闻细微声响',
      '热闹': '环境热闹，人声鼎沸，气氛活跃',
      '紧张': '气氛紧张，压抑沉重，令人不安',
      '轻松': '氛围轻松，舒适惬意，令人放松',
      '神秘': '气氛神秘，朦胧幽暗，充满未知',
      '温馨': '环境温馨，温暖舒适，令人愉悦',
    }
  },
};

/**
 * 道具描述增强规则
 */
const PROP_ENHANCEMENT_RULES = {
  // 电子产品
  electronics: {
    patterns: [/笔记本/, /手机/, /平板/, /相机/, /耳机/],
    enhancements: {
      '笔记本': '笔记本电脑，超薄设计，金属机身，屏幕清晰，键盘背光',
      '手机': '智能手机，全面屏设计，机身轻薄，摄像头突出，质感优秀',
      '平板': '平板电脑，大屏显示，轻薄便携，触控灵敏，边框窄小',
      '相机': '专业相机，镜头精良，机身厚重，按键丰富，质感出众',
      '耳机': '无线耳机，设计精巧，佩戴舒适，音质出色，充电盒精致',
    }
  },
  
  // 日常用品
  daily: {
    patterns: [/杯子/, /书/, /笔/, /包/, /钥匙/],
    enhancements: {
      '杯子': '精致杯子，造型优美，材质上乘，手感舒适，容量适中',
      '书': '精装书籍，封面精美，纸张优质，印刷清晰，装帧考究',
      '笔': '高档钢笔，笔身修长，材质精良，书写流畅，设计优雅',
      '包': '时尚包包，设计新颖，材质优质，容量充足，细节精致',
      '钥匙': '金属钥匙，造型独特，表面光滑，质感厚重，细节精致',
    }
  },
};

/**
 * 服饰描述增强规则
 */
const COSTUME_ENHANCEMENT_RULES = {
  // 服装类型
  type: {
    patterns: [/西装/, /连衣裙/, /T恤/, /衬衫/, /外套/, /裤子/, /裙子/],
    enhancements: {
      '西装': '修身西装，剪裁精良，面料高档，线条流畅，商务正式',
      '连衣裙': '优雅连衣裙，设计时尚，面料柔软，版型修身，女性魅力',
      'T恤': '休闲T恤，纯棉面料，版型宽松，印花精美，舒适透气',
      '衬衫': '正装衬衫，面料挺括，剪裁合身，纽扣精致，商务得体',
      '外套': '时尚外套，设计新颖，保暖舒适，版型修身，细节考究',
      '裤子': '修身裤子，面料舒适，版型合身，线条流畅，穿着得体',
      '裙子': '飘逸裙子，面料轻盈，设计优雅，长度适中，女性柔美',
    }
  },
  
  // 颜色
  color: {
    patterns: [/黑色/, /白色/, /红色/, /蓝色/, /灰色/, /粉色/],
    enhancements: {
      '黑色': '经典黑色，沉稳大气，百搭时尚',
      '白色': '纯净白色，清爽干净，简约优雅',
      '红色': '鲜艳红色，热情奔放，引人注目',
      '蓝色': '深邃蓝色，沉稳理智，商务专业',
      '灰色': '低调灰色，简约大方，百搭实用',
      '粉色': '温柔粉色，甜美可爱，少女气息',
    }
  },
  
  // 材质
  material: {
    patterns: [/棉/, /丝/, /皮/, /毛/, /麻/, /化纤/],
    enhancements: {
      '棉': '纯棉材质，柔软舒适，透气吸汗，亲肤自然',
      '丝': '真丝面料，光滑柔顺，质感高级，垂坠优雅',
      '皮': '真皮材质，质感厚重，耐用高档，光泽自然',
      '毛': '羊毛面料，保暖舒适，质地柔软，高档奢华',
      '麻': '亚麻材质，透气凉爽，质感自然，休闲舒适',
      '化纤': '化纤面料，易打理，不易皱，实用耐穿',
    }
  },
};

// ============ 描述增强函数 ============

/**
 * 增强角色描述
 */
export function enhanceCharacterDescription(description: string, appearance?: string): string {
  if (!description && !appearance) return '';
  
  const fullDesc = [description, appearance].filter(Boolean).join('，');
  const enhanced: string[] = [fullDesc];
  
  // 应用增强规则
  Object.values(CHARACTER_ENHANCEMENT_RULES).forEach(rule => {
    rule.patterns.forEach(pattern => {
      const match = fullDesc.match(pattern);
      if (match) {
        const key = match[0];
        const enhancement = rule.enhancements[key];
        if (enhancement && !enhanced.includes(enhancement)) {
          enhanced.push(enhancement);
        }
      }
    });
  });
  
  // 添加通用增强
  if (!fullDesc.includes('表情')) {
    enhanced.push('表情自然');
  }
  if (!fullDesc.includes('姿态')) {
    enhanced.push('姿态端正');
  }
  if (!fullDesc.includes('气质')) {
    enhanced.push('气质出众');
  }
  
  return enhanced.join('，');
}

/**
 * 增强场景描述
 */
export function enhanceSceneDescription(
  description: string,
  location?: string,
  environment?: string,
  timeOfDay?: string,
  weather?: string
): string {
  const parts: string[] = [];
  
  // 添加原始描述
  if (description) parts.push(description);
  if (location) parts.push(location);
  if (environment) parts.push(environment);
  
  const fullDesc = parts.join('，');
  const enhanced: string[] = [fullDesc];
  
  // 应用增强规则
  Object.values(SCENE_ENHANCEMENT_RULES).forEach(rule => {
    rule.patterns.forEach(pattern => {
      const match = fullDesc.match(pattern);
      if (match) {
        const key = match[0];
        const enhancement = rule.enhancements[key];
        if (enhancement && !enhanced.includes(enhancement)) {
          enhanced.push(enhancement);
        }
      }
    });
  });
  
  // 添加时间和天气增强
  if (timeOfDay) {
    const timeEnhancement = SCENE_ENHANCEMENT_RULES.time.enhancements[timeOfDay];
    if (timeEnhancement) enhanced.push(timeEnhancement);
  }
  
  if (weather) {
    const weatherEnhancement = SCENE_ENHANCEMENT_RULES.weather.enhancements[weather + '天'];
    if (weatherEnhancement) enhanced.push(weatherEnhancement);
  }
  
  // 添加通用增强
  if (!fullDesc.includes('光线') && !fullDesc.includes('照明')) {
    enhanced.push('光线适宜');
  }
  if (!fullDesc.includes('构图')) {
    enhanced.push('构图平衡');
  }
  
  return enhanced.join('，');
}

/**
 * 增强道具描述
 */
export function enhancePropDescription(description: string, category?: string): string {
  if (!description) return '';
  
  const fullDesc = [description, category].filter(Boolean).join('，');
  const enhanced: string[] = [fullDesc];
  
  // 应用增强规则
  Object.values(PROP_ENHANCEMENT_RULES).forEach(rule => {
    rule.patterns.forEach(pattern => {
      const match = fullDesc.match(pattern);
      if (match) {
        const key = match[0];
        const enhancement = rule.enhancements[key];
        if (enhancement && !enhanced.includes(enhancement)) {
          enhanced.push(enhancement);
        }
      }
    });
  });
  
  // 添加通用增强
  if (!fullDesc.includes('材质')) {
    enhanced.push('材质精良');
  }
  if (!fullDesc.includes('细节')) {
    enhanced.push('细节精致');
  }
  if (!fullDesc.includes('质感')) {
    enhanced.push('质感出众');
  }
  
  return enhanced.join('，');
}

/**
 * 增强服饰描述
 */
export function enhanceCostumeDescription(description: string, style?: string): string {
  if (!description) return '';
  
  const fullDesc = [description, style].filter(Boolean).join('，');
  const enhanced: string[] = [fullDesc];
  
  // 应用增强规则
  Object.values(COSTUME_ENHANCEMENT_RULES).forEach(rule => {
    rule.patterns.forEach(pattern => {
      const match = fullDesc.match(pattern);
      if (match) {
        const key = match[0];
        const enhancement = rule.enhancements[key];
        if (enhancement && !enhanced.includes(enhancement)) {
          enhanced.push(enhancement);
        }
      }
    });
  });
  
  // 添加通用增强
  if (!fullDesc.includes('剪裁')) {
    enhanced.push('剪裁精良');
  }
  if (!fullDesc.includes('版型')) {
    enhanced.push('版型合身');
  }
  if (!fullDesc.includes('细节')) {
    enhanced.push('细节考究');
  }
  
  return enhanced.join('，');
}

/**
 * 智能分析描述并提取关键信息
 */
export function analyzeDescription(description: string): {
  keywords: string[];
  category: string;
  style: string;
  mood: string;
} {
  const keywords: string[] = [];
  let category = '通用';
  let style = '写实';
  let mood = '中性';
  
  // 提取关键词
  const segments = description.split(/[，,。；;]/);
  segments.forEach(seg => {
    const trimmed = seg.trim();
    if (trimmed.length > 0 && trimmed.length < 20) {
      keywords.push(trimmed);
    }
  });
  
  // 分析类别
  if (/人物|角色|男|女|老|少/.test(description)) {
    category = '角色';
  } else if (/场景|地点|环境|室内|室外/.test(description)) {
    category = '场景';
  } else if (/道具|物品|工具|设备/.test(description)) {
    category = '道具';
  } else if (/服装|衣服|穿着|打扮/.test(description)) {
    category = '服饰';
  }
  
  // 分析风格
  if (/写实|真实|逼真/.test(description)) {
    style = '写实';
  } else if (/卡通|动漫|二次元/.test(description)) {
    style = '卡通';
  } else if (/油画|水彩|素描/.test(description)) {
    style = '艺术';
  } else if (/科幻|未来|赛博/.test(description)) {
    style = '科幻';
  }
  
  // 分析情绪
  if (/开心|快乐|欢乐|喜悦/.test(description)) {
    mood = '欢快';
  } else if (/悲伤|忧郁|沉重/.test(description)) {
    mood = '忧郁';
  } else if (/紧张|恐怖|惊悚/.test(description)) {
    mood = '紧张';
  } else if (/温馨|温暖|舒适/.test(description)) {
    mood = '温馨';
  }
  
  return { keywords, category, style, mood };
}
