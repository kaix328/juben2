/**
 * 视频生成专业技能库
 * 用于生成高质量的视频提示词
 */

// ============ 相机运动类型 ============

export const CAMERA_MOVEMENTS = {
  static: {
    name: '静止镜头',
    terms: ['static shot', 'locked camera', 'fixed frame', 'no movement'],
    description: '相机完全静止，画面稳定',
    use: '强调主体、建立场景、稳定构图',
  },
  dollyIn: {
    name: '推镜头',
    terms: ['dolly in', 'push in', 'track forward', 'move closer'],
    description: '相机向前移动，靠近主体',
    use: '聚焦细节、增强情感、引导注意力',
  },
  dollyOut: {
    name: '拉镜头',
    terms: ['dolly out', 'pull back', 'track backward', 'reveal environment'],
    description: '相机向后移动，远离主体',
    use: '展示环境、揭示全貌、营造距离感',
  },
  panLeft: {
    name: '左摇',
    terms: ['pan left', 'horizontal movement left', 'sweep left'],
    description: '相机水平向左旋转',
    use: '跟随动作、展示空间、连接场景',
  },
  panRight: {
    name: '右摇',
    terms: ['pan right', 'horizontal movement right', 'sweep right'],
    description: '相机水平向右旋转',
    use: '跟随动作、展示空间、连接场景',
  },
  tiltUp: {
    name: '上摇',
    terms: ['tilt up', 'vertical movement up', 'look up'],
    description: '相机垂直向上旋转',
    use: '展示高度、营造仰视感、揭示上方',
  },
  tiltDown: {
    name: '下摇',
    terms: ['tilt down', 'vertical movement down', 'look down'],
    description: '相机垂直向下旋转',
    use: '展示细节、营造俯视感、揭示下方',
  },
  trackLeft: {
    name: '左移',
    terms: ['track left', 'dolly left', 'lateral movement left'],
    description: '相机水平向左移动',
    use: '跟随主体、平行移动、展示侧面',
  },
  trackRight: {
    name: '右移',
    terms: ['track right', 'dolly right', 'lateral movement right'],
    description: '相机水平向右移动',
    use: '跟随主体、平行移动、展示侧面',
  },
  craneUp: {
    name: '升镜头',
    terms: ['crane up', 'boom up', 'vertical rise', 'ascending shot'],
    description: '相机垂直向上移动',
    use: '展示全景、营造宏大感、揭示环境',
  },
  craneDown: {
    name: '降镜头',
    terms: ['crane down', 'boom down', 'vertical descent', 'descending shot'],
    description: '相机垂直向下移动',
    use: '聚焦主体、营造压迫感、进入场景',
  },
  orbit: {
    name: '环绕镜头',
    terms: ['orbit shot', 'circular movement', '360 degree rotation', 'revolve around subject'],
    description: '相机围绕主体旋转',
    use: '全方位展示、营造动感、强调主体',
  },
  follow: {
    name: '跟随镜头',
    terms: ['follow shot', 'tracking subject', 'chase cam', 'moving with subject'],
    description: '相机跟随主体移动',
    use: '保持主体在画面中、营造动感、第一人称视角',
  },
  handheld: {
    name: '手持镜头',
    terms: ['handheld', 'shaky cam', 'documentary style', 'natural movement'],
    description: '手持相机，画面有自然晃动',
    use: '纪实感、紧张感、真实感',
  },
  steadicam: {
    name: '斯坦尼康',
    terms: ['steadicam', 'smooth tracking', 'fluid movement', 'stabilized shot'],
    description: '使用稳定器，流畅跟随',
    use: '流畅跟随、长镜头、复杂运动',
  },
  drone: {
    name: '无人机镜头',
    terms: ['drone shot', 'aerial view', 'bird\'s eye', 'flying camera'],
    description: '无人机拍摄，空中视角',
    use: '鸟瞰视角、大场景、动态飞行',
  },
  zoomIn: {
    name: '变焦推进',
    terms: ['zoom in', 'focal length increase', 'magnify'],
    description: '镜头焦距变长，画面放大',
    use: '快速聚焦、强调细节、视觉冲击',
  },
  zoomOut: {
    name: '变焦拉远',
    terms: ['zoom out', 'focal length decrease', 'wide view'],
    description: '镜头焦距变短，画面缩小',
    use: '展示环境、揭示全貌、视觉反差',
  },
};

// ============ 运动速度 ============

export const MOTION_SPEEDS = {
  verySlow: {
    name: '极慢速',
    terms: ['very slow motion', 'extreme slow-mo', '0.1x speed', 'ultra slow'],
    fps: '240-960fps',
    use: '极致细节、戏剧化、时间静止感',
  },
  slow: {
    name: '慢动作',
    terms: ['slow motion', 'slow-mo', '0.5x speed', 'half speed'],
    fps: '60-120fps',
    use: '强调动作、优雅感、情感渲染',
  },
  normal: {
    name: '正常速度',
    terms: ['normal speed', 'real-time', '1x speed', 'natural motion'],
    fps: '24-30fps',
    use: '自然流畅、真实感、标准叙事',
  },
  fast: {
    name: '快动作',
    terms: ['fast motion', 'speed up', '2x speed', 'accelerated'],
    fps: '12fps',
    use: '时间流逝、喜剧效果、节奏加快',
  },
  timelapse: {
    name: '延时摄影',
    terms: ['timelapse', 'time-lapse', 'compressed time', 'hours to seconds'],
    fps: '1-10fps',
    use: '时间流逝、云彩移动、日出日落',
  },
  hyperlapse: {
    name: '超延时',
    terms: ['hyperlapse', 'moving timelapse', 'dynamic timelapse'],
    fps: '1-10fps + movement',
    use: '移动延时、城市穿梭、空间变化',
  },
};

// ============ 运动曲线 ============

export const MOTION_CURVES = {
  linear: {
    name: '线性',
    terms: ['linear motion', 'constant speed', 'uniform movement'],
    description: '匀速运动，无加速减速',
    use: '机械感、稳定移动、技术展示',
  },
  easeIn: {
    name: '缓入',
    terms: ['ease in', 'slow start', 'accelerating', 'gradual beginning'],
    description: '慢速开始，逐渐加速',
    use: '自然启动、优雅开始、渐进式',
  },
  easeOut: {
    name: '缓出',
    terms: ['ease out', 'slow end', 'decelerating', 'gradual stop'],
    description: '快速开始，逐渐减速',
    use: '自然停止、优雅结束、平稳落地',
  },
  easeInOut: {
    name: '缓入缓出',
    terms: ['ease in-out', 'smooth curve', 'natural motion', 'S-curve'],
    description: '慢速开始和结束，中间加速',
    use: '最自然、流畅优雅、专业标准',
  },
  bounce: {
    name: '弹跳',
    terms: ['bounce', 'elastic', 'spring motion', 'rebound'],
    description: '到达终点后弹跳几次',
    use: '活泼感、卡通效果、趣味性',
  },
  elastic: {
    name: '弹性',
    terms: ['elastic', 'rubber band', 'overshoot', 'spring back'],
    description: '超过终点后弹回',
    use: '夸张效果、动态感、吸引注意',
  },
};

// ============ 相机参数 ============

export const CAMERA_PARAMS = {
  frameRate: {
    '24fps': {
      name: '电影标准',
      terms: ['24fps', 'cinematic frame rate', 'film standard'],
      use: '电影感、标准叙事',
    },
    '30fps': {
      name: '视频标准',
      terms: ['30fps', 'video standard', 'smooth motion'],
      use: '流畅视频、电视标准',
    },
    '60fps': {
      name: '高帧率',
      terms: ['60fps', 'high frame rate', 'ultra smooth'],
      use: '超流畅、慢动作素材',
    },
    '120fps': {
      name: '慢动作',
      terms: ['120fps', 'slow motion', 'high speed'],
      use: '慢动作回放、细节捕捉',
    },
  },
  shutterAngle: {
    '180deg': {
      name: '标准快门',
      terms: ['180° shutter angle', 'standard motion blur', 'natural blur'],
      use: '自然运动模糊、电影标准',
    },
    '90deg': {
      name: '低快门',
      terms: ['90° shutter angle', 'reduced motion blur', 'crisp action'],
      use: '清晰动作、减少模糊',
    },
    '360deg': {
      name: '高快门',
      terms: ['360° shutter angle', 'increased motion blur', 'dreamy effect'],
      use: '增强模糊、梦幻效果',
    },
  },
  rollingShutter: {
    none: {
      name: '无果冻效应',
      terms: ['no rolling shutter', 'global shutter', 'clean scan'],
      use: '快速运动、无变形',
    },
    slight: {
      name: '轻微果冻',
      terms: ['slight rolling shutter', 'minimal distortion'],
      use: '正常拍摄、可接受',
    },
    heavy: {
      name: '明显果冻',
      terms: ['heavy rolling shutter', 'jello effect', 'scan distortion'],
      use: '快速摇镜、特殊效果',
    },
  },
};

// ============ 过渡效果 ============

export const TRANSITIONS = {
  cut: {
    name: '切',
    terms: ['cut', 'hard cut', 'instant transition'],
    description: '直接切换，无过渡',
    use: '标准剪辑、快速节奏',
  },
  fade: {
    name: '淡入淡出',
    terms: ['fade', 'fade to black', 'fade in/out', 'dissolve to black'],
    description: '画面逐渐变黑或变亮',
    use: '时间流逝、场景转换、结束',
  },
  crossDissolve: {
    name: '交叉溶解',
    terms: ['cross dissolve', 'dissolve', 'blend transition'],
    description: '两个画面交叉淡入淡出',
    use: '柔和转换、时间流逝、梦境',
  },
  wipe: {
    name: '划像',
    terms: ['wipe', 'swipe transition', 'sliding transition'],
    description: '新画面从一侧划入',
    use: '动态转换、空间变化',
  },
  iris: {
    name: '圈入圈出',
    terms: ['iris in/out', 'circular wipe', 'spotlight transition'],
    description: '圆形扩大或缩小',
    use: '聚焦主体、复古风格',
  },
  push: {
    name: '推移',
    terms: ['push transition', 'slide', 'push out'],
    description: '新画面推出旧画面',
    use: '空间连续、方向感',
  },
  zoom: {
    name: '缩放',
    terms: ['zoom transition', 'scale transition', 'punch in/out'],
    description: '画面放大或缩小切换',
    use: '强调重点、视觉冲击',
  },
  morphing: {
    name: '变形',
    terms: ['morph', 'shape transition', 'fluid transformation'],
    description: '画面流体变形过渡',
    use: '创意转换、魔幻效果',
  },
};

// ============ 视频特效 ============

export const VIDEO_EFFECTS = {
  particles: {
    name: '粒子效果',
    terms: ['particles', 'dust particles', 'floating elements', 'atmospheric particles'],
    types: ['dust', 'snow', 'rain', 'sparks', 'embers', 'bokeh'],
    use: '增加氛围、空间感、魔幻感',
  },
  lightRays: {
    name: '光线效果',
    terms: ['light rays', 'god rays', 'volumetric lighting', 'light shafts'],
    description: '体积光、丁达尔效应',
    use: '神圣感、戏剧性、深度',
  },
  glitch: {
    name: '故障效果',
    terms: ['glitch effect', 'digital distortion', 'VHS glitch', 'data corruption'],
    description: '数字故障、画面撕裂',
    use: '科技感、故障美学、转场',
  },
  chromatic: {
    name: '色散效果',
    terms: ['chromatic aberration', 'RGB split', 'color separation'],
    description: 'RGB 通道分离',
    use: '科技感、视觉冲击、艺术效果',
  },
  bloom: {
    name: '辉光效果',
    terms: ['bloom', 'glow', 'light bloom', 'luminous'],
    description: '高光溢出、发光效果',
    use: '梦幻感、柔和光线、魔幻',
  },
  vhs: {
    name: 'VHS 效果',
    terms: ['VHS effect', 'retro video', 'analog distortion', 'tape artifacts'],
    description: '复古录像带效果',
    use: '怀旧感、80年代、复古',
  },
  datamosh: {
    name: '数据马赛克',
    terms: ['datamosh', 'compression artifacts', 'pixel sorting'],
    description: '数据压缩失真效果',
    use: '实验性、艺术感、转场',
  },
};

// ============ 焦点变化 ============

export const FOCUS_TRANSITIONS = {
  rackFocus: {
    name: '焦点转移',
    terms: ['rack focus', 'focus pull', 'shift focus', 'change focal plane'],
    description: '焦点从前景转到后景或相反',
    use: '引导注意力、叙事转换、揭示信息',
  },
  followFocus: {
    name: '跟焦',
    terms: ['follow focus', 'tracking focus', 'maintain sharpness'],
    description: '焦点跟随移动主体',
    use: '保持主体清晰、动态拍摄',
  },
  deepFocus: {
    name: '深焦',
    terms: ['deep focus', 'everything sharp', 'infinite depth'],
    description: '前后景都清晰',
    use: '展示空间、多层次叙事',
  },
  selectiveFocus: {
    name: '选择性对焦',
    terms: ['selective focus', 'shallow depth', 'isolated subject'],
    description: '只有主体清晰',
    use: '突出主体、虚化背景',
  },
};

// ============ 时间效果 ============

export const TIME_EFFECTS = {
  freeze: {
    name: '定格',
    terms: ['freeze frame', 'still frame', 'pause motion'],
    description: '画面静止',
    use: '强调瞬间、戏剧性停顿',
  },
  reverseMotion: {
    name: '倒放',
    terms: ['reverse motion', 'backward', 'rewind'],
    description: '时间倒流',
    use: '创意效果、时间操控',
  },
  speedRamp: {
    name: '速度渐变',
    terms: ['speed ramp', 'velocity change', 'dynamic speed'],
    description: '速度从慢到快或相反',
    use: '动作强调、节奏变化',
  },
  bulletTime: {
    name: '子弹时间',
    terms: ['bullet time', 'time slice', '360 freeze'],
    description: '环绕静止主体',
    use: '动作高潮、视觉奇观',
  },
};

// ============ 辅助函数 ============

/**
 * 根据情绪推荐相机运动
 */
export function getCameraMovementByMood(mood: string): string[] {
  const map: Record<string, string[]> = {
    '紧张': ['handheld', 'shaky cam', 'fast movement', 'erratic motion'],
    '平静': ['slow dolly', 'smooth tracking', 'gentle movement', 'stabilized'],
    '激动': ['fast pan', 'quick zoom', 'dynamic movement', 'energetic'],
    '悲伤': ['slow crane down', 'gentle pull back', 'static shot'],
    '欢快': ['orbit shot', 'dynamic tracking', 'upward movement'],
  };
  return map[mood] || ['smooth movement', 'natural motion'];
}

/**
 * 根据场景推荐帧率
 */
export function getFrameRateByScene(sceneType: string): string {
  const map: Record<string, string> = {
    '动作': '60fps for slow motion capability',
    '对话': '24fps cinematic standard',
    '运动': '120fps for extreme slow motion',
    '日常': '30fps smooth video',
  };
  return map[sceneType] || '24fps cinematic';
}

/**
 * 生成完整的视频参数描述
 */
export function generateVideoParams(options: {
  movement?: string;
  speed?: string;
  duration?: number;
  mood?: string;
  transition?: string;
  platform?: string; // 🆕 添加平台参数
}): string[] {
  const params: string[] = [];

  // 相机运动
  if (options.movement) {
    const movement = CAMERA_MOVEMENTS[options.movement as keyof typeof CAMERA_MOVEMENTS];
    if (movement) {
      params.push(...movement.terms);
    }
  }

  // 运动速度
  if (options.speed) {
    const speed = MOTION_SPEEDS[options.speed as keyof typeof MOTION_SPEEDS];
    if (speed) {
      params.push(...speed.terms);
    }
  }

  // 时长
  if (options.duration) {
    params.push(`${options.duration} seconds duration`);
  }

  // 情绪相关运动
  if (options.mood) {
    params.push(...getCameraMovementByMood(options.mood));
  }

  // 过渡效果
  if (options.transition) {
    const trans = TRANSITIONS[options.transition as keyof typeof TRANSITIONS];
    if (trans) {
      params.push(...trans.terms);
    }
  }

  // 🆕 根据平台添加特定参数
  const platform = options.platform?.toLowerCase();
  
  if (platform === 'runway') {
    params.push('cinematic motion', 'natural camera movement', 'realistic physics', 'high fidelity');
  } else if (platform === 'sora') {
    params.push('photorealistic', 'complex scene dynamics', 'accurate physics simulation', 'temporal consistency');
  } else if (platform === 'pika') {
    params.push('creative motion', 'stylized movement', 'dynamic transformation', 'artistic effects');
  } else if (platform === 'nanobanana-pro') {
    params.push('smooth animation', 'high quality motion', 'detailed movement', 'professional video production');
  } else if (platform === 'kling' || platform === 'kuaishou') {
    params.push('流畅运动', '自然过渡', '高质量视频', '专业摄影');
  } else {
    // 默认通用参数
    params.push('24fps', '180° shutter angle', 'smooth motion blur', 'professional cinematography');
  }

  return params;
}

export default {
  CAMERA_MOVEMENTS,
  MOTION_SPEEDS,
  MOTION_CURVES,
  CAMERA_PARAMS,
  TRANSITIONS,
  VIDEO_EFFECTS,
  FOCUS_TRANSITIONS,
  TIME_EFFECTS,
  getCameraMovementByMood,
  getFrameRateByScene,
  generateVideoParams,
};
