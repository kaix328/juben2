/**
 * 电影摄影统一常量库
 * 集中管理景别、角度、运动等专业术语
 */

// ============ 景别类型 ============

export const SHOT_TYPES = {
    ECU: { 
        code: 'ECU', 
        cn: '大特写', 
        en: 'extreme close-up', 
        desc: '眼睛、嘴唇等局部',
        promptEn: 'extreme close up shot, ECU'
    },
    CU: { 
        code: 'CU', 
        cn: '特写', 
        en: 'close-up', 
        desc: '面部',
        promptEn: 'close up shot, CU'
    },
    MCU: { 
        code: 'MCU', 
        cn: '中近景', 
        en: 'medium close-up', 
        desc: '头肩',
        promptEn: 'medium close up shot, MCU'
    },
    MS: { 
        code: 'MS', 
        cn: '中景', 
        en: 'medium shot', 
        desc: '腰部以上',
        promptEn: 'medium shot, MS'
    },
    MWS: { 
        code: 'MWS', 
        cn: '中全景', 
        en: 'medium wide shot', 
        desc: '膝盖以上',
        promptEn: 'medium wide shot, MWS'
    },
    WS: { 
        code: 'WS', 
        cn: '全景', 
        en: 'wide shot', 
        desc: '全身',
        promptEn: 'wide shot, full body, WS'
    },
    EWS: { 
        code: 'EWS', 
        cn: '远景', 
        en: 'extreme wide shot', 
        desc: '环境建立',
        promptEn: 'extreme wide shot, establishing shot, EWS'
    },
    POV: { 
        code: 'POV', 
        cn: '主观镜头', 
        en: 'point of view', 
        desc: '角色视角',
        promptEn: 'POV shot, point of view, first person perspective'
    },
    OTS: { 
        code: 'OTS', 
        cn: '过肩镜头', 
        en: 'over the shoulder', 
        desc: '过肩拍摄',
        promptEn: 'over the shoulder shot, OTS'
    },
    TWO: { 
        code: 'TWO', 
        cn: '双人镜头', 
        en: 'two shot', 
        desc: '两人同框',
        promptEn: 'two shot, two people in frame'
    },
    GROUP: { 
        code: 'GROUP', 
        cn: '群戏镜头', 
        en: 'group shot', 
        desc: '多人场景',
        promptEn: 'group shot, multiple people'
    },
    INSERT: { 
        code: 'INSERT', 
        cn: '插入镜头', 
        en: 'insert shot', 
        desc: '细节特写',
        promptEn: 'insert shot, detail shot'
    },
    AERIAL: { 
        code: 'AERIAL', 
        cn: '航拍镜头', 
        en: 'aerial shot', 
        desc: '空中拍摄',
        promptEn: 'aerial shot, drone shot, birds eye view'
    },
    CUSTOM: { 
        code: 'CUSTOM', 
        cn: '自定义', 
        en: 'custom', 
        desc: '自定义景别',
        promptEn: 'custom shot'
    },
} as const;

export type ShotTypeCode = keyof typeof SHOT_TYPES;

// ============ 镜头角度 ============

export const CAMERA_ANGLES = {
    EYE_LEVEL: { 
        code: 'EYE_LEVEL', 
        cn: '平视', 
        en: 'eye level', 
        desc: '与视线平行',
        promptEn: 'eye level angle, straight on'
    },
    HIGH: { 
        code: 'HIGH', 
        cn: '俯视', 
        en: 'high angle', 
        desc: '从上往下',
        promptEn: 'high angle shot, looking down'
    },
    LOW: { 
        code: 'LOW', 
        cn: '仰视', 
        en: 'low angle', 
        desc: '从下往上',
        promptEn: 'low angle shot, looking up'
    },
    BIRDS_EYE: { 
        code: 'BIRDS_EYE', 
        cn: '鸟瞰', 
        en: "bird's eye view", 
        desc: '垂直俯视',
        promptEn: "bird's eye view, top down, overhead shot"
    },
    WORMS_EYE: { 
        code: 'WORMS_EYE', 
        cn: '蚁视', 
        en: "worm's eye view", 
        desc: '垂直仰视',
        promptEn: "worm's eye view, extreme low angle"
    },
    DUTCH: { 
        code: 'DUTCH', 
        cn: '荷兰角', 
        en: 'dutch angle', 
        desc: '倾斜拍摄',
        promptEn: 'dutch angle, tilted frame, canted angle'
    },
    CUSTOM: { 
        code: 'CUSTOM', 
        cn: '自定义', 
        en: 'custom', 
        desc: '自定义角度',
        promptEn: 'custom angle'
    },
} as const;

export type CameraAngleCode = keyof typeof CAMERA_ANGLES;

// ============ 镜头运动 ============

export const CAMERA_MOVEMENTS = {
    STATIC: { 
        code: 'STATIC', 
        cn: '静止', 
        en: 'static shot', 
        desc: '固定机位',
        promptEn: 'static shot, locked camera, no movement'
    },
    PAN_L: { 
        code: 'PAN_L', 
        cn: '左横摇', 
        en: 'pan left', 
        desc: '水平向左',
        promptEn: 'pan left, horizontal camera movement to the left'
    },
    PAN_R: { 
        code: 'PAN_R', 
        cn: '右横摇', 
        en: 'pan right', 
        desc: '水平向右',
        promptEn: 'pan right, horizontal camera movement to the right'
    },
    TILT_UP: { 
        code: 'TILT_UP', 
        cn: '上纵摇', 
        en: 'tilt up', 
        desc: '垂直向上',
        promptEn: 'tilt up, vertical camera movement upward'
    },
    TILT_DOWN: { 
        code: 'TILT_DOWN', 
        cn: '下纵摇', 
        en: 'tilt down', 
        desc: '垂直向下',
        promptEn: 'tilt down, vertical camera movement downward'
    },
    DOLLY_IN: { 
        code: 'DOLLY_IN', 
        cn: '推镜头', 
        en: 'dolly in', 
        desc: '向前推进',
        promptEn: 'dolly in, push in, camera moving forward'
    },
    DOLLY_OUT: { 
        code: 'DOLLY_OUT', 
        cn: '拉镜头', 
        en: 'dolly out', 
        desc: '向后拉远',
        promptEn: 'dolly out, pull back, camera moving backward'
    },
    TRACK_L: { 
        code: 'TRACK_L', 
        cn: '左跟踪', 
        en: 'track left', 
        desc: '横向跟随',
        promptEn: 'tracking left, lateral movement to the left'
    },
    TRACK_R: { 
        code: 'TRACK_R', 
        cn: '右跟踪', 
        en: 'track right', 
        desc: '横向跟随',
        promptEn: 'tracking right, lateral movement to the right'
    },
    CRANE_UP: { 
        code: 'CRANE_UP', 
        cn: '升', 
        en: 'crane up', 
        desc: '摇臂上升',
        promptEn: 'crane up, jib up, vertical rise'
    },
    CRANE_DOWN: { 
        code: 'CRANE_DOWN', 
        cn: '降', 
        en: 'crane down', 
        desc: '摇臂下降',
        promptEn: 'crane down, jib down, vertical descent'
    },
    ZOOM_IN: { 
        code: 'ZOOM_IN', 
        cn: '变焦推', 
        en: 'zoom in', 
        desc: '镜头变焦',
        promptEn: 'zoom in, lens zoom closer'
    },
    ZOOM_OUT: { 
        code: 'ZOOM_OUT', 
        cn: '变焦拉', 
        en: 'zoom out', 
        desc: '镜头变焦',
        promptEn: 'zoom out, lens zoom wider'
    },
    HANDHELD: { 
        code: 'HANDHELD', 
        cn: '手持', 
        en: 'handheld', 
        desc: '手持拍摄',
        promptEn: 'handheld camera, shaky cam, documentary style'
    },
    STEADICAM: { 
        code: 'STEADICAM', 
        cn: '斯坦尼康', 
        en: 'steadicam', 
        desc: '稳定器',
        promptEn: 'steadicam shot, smooth gliding movement'
    },
    DUTCH: { 
        code: 'DUTCH', 
        cn: '荷兰角', 
        en: 'dutch angle', 
        desc: '倾斜角度',
        promptEn: 'dutch angle, tilted frame'
    },
    WHIP: { 
        code: 'WHIP', 
        cn: '甩镜头', 
        en: 'whip pan', 
        desc: '快速横摇',
        promptEn: 'whip pan, swish pan, fast horizontal movement'
    },
    ARC: { 
        code: 'ARC', 
        cn: '弧形运动', 
        en: 'arc shot', 
        desc: '弧线移动',
        promptEn: 'arc shot, curved camera movement, circular tracking'
    },
    FOLLOW: { 
        code: 'FOLLOW', 
        cn: '跟随', 
        en: 'follow shot', 
        desc: '跟随主体',
        promptEn: 'follow shot, tracking subject, moving with character'
    },
    CUSTOM: { 
        code: 'CUSTOM', 
        cn: '自定义', 
        en: 'custom', 
        desc: '自定义运动',
        promptEn: 'custom camera movement'
    },
} as const;

export type CameraMovementCode = keyof typeof CAMERA_MOVEMENTS;

// ============ 辅助函数 ============

/**
 * 根据中文名称查找景别代码
 */
export function getShotTypeByCN(cn: string): ShotTypeCode | undefined {
    const entry = Object.entries(SHOT_TYPES).find(([_, v]) => v.cn === cn);
    return entry?.[0] as ShotTypeCode | undefined;
}

/**
 * 根据代码查找景别信息
 */
export function getShotTypeByCode(code: string): typeof SHOT_TYPES[ShotTypeCode] | undefined {
    return SHOT_TYPES[code as ShotTypeCode];
}

/**
 * 根据中文名称查找角度代码
 */
export function getCameraAngleByCN(cn: string): CameraAngleCode | undefined {
    const entry = Object.entries(CAMERA_ANGLES).find(([_, v]) => v.cn === cn);
    return entry?.[0] as CameraAngleCode | undefined;
}

/**
 * 根据代码查找角度信息
 */
export function getCameraAngleByCode(code: string): typeof CAMERA_ANGLES[CameraAngleCode] | undefined {
    return CAMERA_ANGLES[code as CameraAngleCode];
}

/**
 * 根据中文名称查找运动代码
 */
export function getCameraMovementByCN(cn: string): CameraMovementCode | undefined {
    const entry = Object.entries(CAMERA_MOVEMENTS).find(([_, v]) => v.cn === cn);
    return entry?.[0] as CameraMovementCode | undefined;
}

/**
 * 根据代码查找运动信息
 */
export function getCameraMovementByCode(code: string): typeof CAMERA_MOVEMENTS[CameraMovementCode] | undefined {
    return CAMERA_MOVEMENTS[code as CameraMovementCode];
}

// ============ 选项列表（用于 UI 下拉框）============

/**
 * 景别选项列表
 */
export const SHOT_TYPE_OPTIONS = Object.values(SHOT_TYPES).map(shot => ({
    value: shot.code,
    label: shot.cn,
    description: shot.desc,
}));

/**
 * 角度选项列表
 */
export const CAMERA_ANGLE_OPTIONS = Object.values(CAMERA_ANGLES).map(angle => ({
    value: angle.code,
    label: angle.cn,
    description: angle.desc,
}));

/**
 * 运动选项列表
 */
export const CAMERA_MOVEMENT_OPTIONS = Object.values(CAMERA_MOVEMENTS).map(movement => ({
    value: movement.code,
    label: movement.cn,
    description: movement.desc,
}));

// ============ 质量检查用的顺序 ============

/**
 * 景别顺序（用于连贯性检查）
 * 从远到近
 */
export const SHOT_ORDER: ShotTypeCode[] = ['EWS', 'WS', 'MWS', 'MS', 'MCU', 'CU', 'ECU'];

/**
 * 获取景别在顺序中的索引
 */
export function getShotOrderIndex(code: ShotTypeCode): number {
    return SHOT_ORDER.indexOf(code);
}

/**
 * 计算两个景别之间的跳跃距离
 */
export function calculateShotJump(from: ShotTypeCode, to: ShotTypeCode): number {
    const fromIndex = getShotOrderIndex(from);
    const toIndex = getShotOrderIndex(to);
    if (fromIndex === -1 || toIndex === -1) return 0;
    return Math.abs(toIndex - fromIndex);
}
