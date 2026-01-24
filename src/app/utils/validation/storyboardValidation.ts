/**
 * 分镜数据验证模块
 * 使用 Zod 进行运行时类型验证
 */

import { z } from 'zod';
import { SHOT_TYPES, CAMERA_ANGLES, CAMERA_MOVEMENTS } from '../../constants/cinematography';

// ============ 基础 Schema ============

/**
 * 景别类型 Schema
 */
const ShotTypeSchema = z.enum(
    Object.keys(SHOT_TYPES) as [string, ...string[]],
    {
        errorMap: () => ({ message: '无效的景别类型' })
    }
);

/**
 * 角度类型 Schema
 */
const CameraAngleSchema = z.enum(
    Object.keys(CAMERA_ANGLES) as [string, ...string[]],
    {
        errorMap: () => ({ message: '无效的角度类型' })
    }
);

/**
 * 运动类型 Schema
 */
const CameraMovementSchema = z.enum(
    Object.keys(CAMERA_MOVEMENTS) as [string, ...string[]],
    {
        errorMap: () => ({ message: '无效的运动类型' })
    }
);

/**
 * 景深类型 Schema
 */
const DepthOfFieldSchema = z.enum(['SHALLOW', 'DEEP', 'SELECTIVE', 'NORMAL'], {
    errorMap: () => ({ message: '无效的景深类型' })
});

/**
 * 运动速度 Schema
 */
const MotionSpeedSchema = z.enum(['slow', 'normal', 'fast', 'timelapse'], {
    errorMap: () => ({ message: '无效的运动速度' })
});

/**
 * 宽高比 Schema
 */
const AspectRatioSchema = z.enum(['16:9', '9:16', '1:1', '4:3', '21:9'], {
    errorMap: () => ({ message: '无效的宽高比' })
});

/**
 * 灯光设计 Schema
 */
const LightingDesignSchema = z.object({
    keyLight: z.string().optional(),
    fillLight: z.string().optional(),
    backLight: z.string().optional(),
    mood: z.string().optional(),
    practicalLights: z.array(z.string()).optional(),
});

/**
 * 动作提示 Schema
 */
const ActionCueSchema = z.object({
    startAction: z.string().optional(),
    endAction: z.string().optional(),
    timing: z.string().optional(),
    direction: z.string().optional(),
});

// ============ 分镜面板 Schema ============

/**
 * 分镜面板完整验证 Schema
 */
export const StoryboardPanelSchema = z.object({
    // 必填字段
    id: z.string().min(1, '分镜 ID 不能为空'),
    panelNumber: z.number().int().positive('分镜编号必须为正整数'),
    sceneId: z.string().min(1, '场景 ID 不能为空'),
    description: z.string().min(1, '画面描述不能为空'),
    
    // 基础字段
    dialogue: z.string().optional(),
    shot: ShotTypeSchema,
    angle: CameraAngleSchema,
    movement: CameraMovementSchema,
    duration: z.number().min(0.5, '时长不能少于 0.5 秒').max(60, '时长不能超过 60 秒').optional(),
    characters: z.array(z.string()),
    props: z.array(z.string()),
    notes: z.string(),
    
    // 提示词字段
    imagePrompt: z.string().optional(),
    videoPrompt: z.string().optional(),
    generatedImageUrl: z.string().url('无效的图片 URL').or(z.literal('')).optional(),
    isImageGenerating: z.boolean().optional(),
    
    // 转场和音效
    transition: z.string().optional(),
    soundEffects: z.array(z.string()).optional(),
    music: z.string().optional(),
    keyFrames: z.array(z.string()).optional(),
    
    // 专业字段
    episodeNumber: z.number().int().positive().optional(),
    lens: z.string().optional(),
    fStop: z.string().optional(),
    lighting: LightingDesignSchema.optional(),
    composition: z.string().optional(),
    focusPoint: z.string().optional(),
    depthOfField: DepthOfFieldSchema.optional(),
    actionCue: ActionCueSchema.optional(),
    vfx: z.array(z.string()).optional(),
    colorGrade: z.string().optional(),
    referenceImage: z.string().url('无效的参考图片 URL').or(z.literal('')).optional(),
    shotIntent: z.string().optional(),
    setupShot: z.string().optional(),
    axisNote: z.string().optional(),
    
    // 视频提示词增强字段
    startFrame: z.string().optional(),
    endFrame: z.string().optional(),
    motionSpeed: MotionSpeedSchema.optional(),
    environmentMotion: z.string().optional(),
    characterActions: z.array(z.string()).optional(),
    aspectRatio: AspectRatioSchema.optional(),
    
    // 风格快照字段
    appliedStyleHash: z.string().optional(),
    generatedAt: z.string().optional(),
    
    // 锁定字段
    isLocked: z.boolean().optional(),
    
    // 提示词版本历史
    promptHistory: z.array(z.string()).optional(),
    videoPromptHistory: z.array(z.string()).optional(),
});

export type ValidatedStoryboardPanel = z.infer<typeof StoryboardPanelSchema>;

/**
 * 分镜面板基础验证 Schema（宽松模式，用于部分更新）
 */
export const StoryboardPanelPartialSchema = StoryboardPanelSchema.partial();

/**
 * 分镜对象 Schema
 */
export const StoryboardSchema = z.object({
    id: z.string().min(1, '分镜 ID 不能为空'),
    chapterId: z.string().min(1, '章节 ID 不能为空'),
    panels: z.array(StoryboardPanelSchema),
    updatedAt: z.string(),
    version: z.number().int().optional(),
    migratedAt: z.string().optional(),
    
    // 项目级别字段
    aspectRatio: z.enum(['16:9', '2.39:1', '4:3', '1:1', '9:16']).optional(),
    targetPlatform: z.enum(['cinema', 'tv', 'web', 'mobile']).optional(),
});

export type ValidatedStoryboard = z.infer<typeof StoryboardSchema>;

// ============ 验证函数 ============

/**
 * 验证单个分镜面板
 */
export function validatePanel(panel: unknown): {
    success: boolean;
    data?: ValidatedStoryboardPanel;
    errors?: Array<{ field: string; message: string }>;
} {
    const result = StoryboardPanelSchema.safeParse(panel);
    
    if (result.success) {
        return { success: true, data: result.data };
    } else {
        const errors = result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return { success: false, errors };
    }
}

/**
 * 验证分镜面板（宽松模式）
 */
export function validatePanelPartial(panel: unknown): {
    success: boolean;
    data?: Partial<ValidatedStoryboardPanel>;
    errors?: Array<{ field: string; message: string }>;
} {
    const result = StoryboardPanelPartialSchema.safeParse(panel);
    
    if (result.success) {
        return { success: true, data: result.data };
    } else {
        const errors = result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return { success: false, errors };
    }
}

/**
 * 验证分镜数组
 */
export function validatePanels(panels: unknown[]): {
    validPanels: ValidatedStoryboardPanel[];
    invalidPanels: Array<{
        index: number;
        panel: unknown;
        errors: Array<{ field: string; message: string }>;
    }>;
} {
    const validPanels: ValidatedStoryboardPanel[] = [];
    const invalidPanels: Array<{
        index: number;
        panel: unknown;
        errors: Array<{ field: string; message: string }>;
    }> = [];
    
    panels.forEach((panel, index) => {
        const result = validatePanel(panel);
        if (result.success && result.data) {
            validPanels.push(result.data);
        } else if (result.errors) {
            invalidPanels.push({ index, panel, errors: result.errors });
        }
    });
    
    return { validPanels, invalidPanels };
}

/**
 * 验证完整的分镜对象
 */
export function validateStoryboard(storyboard: unknown): {
    success: boolean;
    data?: ValidatedStoryboard;
    errors?: Array<{ field: string; message: string }>;
} {
    const result = StoryboardSchema.safeParse(storyboard);
    
    if (result.success) {
        return { success: true, data: result.data };
    } else {
        const errors = result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return { success: false, errors };
    }
}

/**
 * 生成验证报告
 */
export function generateValidationReport(
    validCount: number,
    invalidPanels: Array<{
        index: number;
        panel: unknown;
        errors: Array<{ field: string; message: string }>;
    }>
): string {
    const lines: string[] = [];
    
    lines.push('=== 分镜数据验证报告 ===');
    lines.push('');
    lines.push(`验证状态: ${invalidPanels.length === 0 ? '✅ 全部通过' : '⚠️ 存在错误'}`);
    lines.push(`有效数量: ${validCount}`);
    lines.push(`无效数量: ${invalidPanels.length}`);
    lines.push('');
    
    if (invalidPanels.length > 0) {
        lines.push('错误详情:');
        invalidPanels.forEach((item, idx) => {
            lines.push(`  ${idx + 1}. 分镜 #${item.index + 1}:`);
            item.errors.forEach(err => {
                lines.push(`     - ${err.field}: ${err.message}`);
            });
        });
    }
    
    return lines.join('\n');
}

/**
 * 快速验证（只检查关键字段）
 */
export function quickValidatePanel(panel: any): boolean {
    return !!(
        panel.id &&
        typeof panel.panelNumber === 'number' &&
        panel.sceneId &&
        panel.shot &&
        panel.angle &&
        panel.movement &&
        Array.isArray(panel.characters) &&
        Array.isArray(panel.props)
    );
}

/**
 * 修复常见的数据问题
 */
export function autoFixPanel(panel: any): any {
    const fixed = { ...panel };
    
    // 修复缺失的数组字段
    if (!Array.isArray(fixed.characters)) {
        fixed.characters = [];
    }
    if (!Array.isArray(fixed.props)) {
        fixed.props = [];
    }
    if (!Array.isArray(fixed.soundEffects)) {
        fixed.soundEffects = [];
    }
    if (!Array.isArray(fixed.vfx)) {
        fixed.vfx = [];
    }
    if (!Array.isArray(fixed.characterActions)) {
        fixed.characterActions = [];
    }
    
    // 修复缺失的字符串字段
    if (typeof fixed.notes !== 'string') {
        fixed.notes = '';
    }
    if (typeof fixed.description !== 'string') {
        fixed.description = '';
    }
    
    // 修复时长
    if (typeof fixed.duration !== 'number' || fixed.duration <= 0) {
        fixed.duration = 3; // 默认 3 秒
    }
    
    // 修复默认值
    if (!fixed.shot) {
        fixed.shot = 'MS';
    }
    if (!fixed.angle) {
        fixed.angle = 'EYE_LEVEL';
    }
    if (!fixed.movement) {
        fixed.movement = 'STATIC';
    }
    
    return fixed;
}
