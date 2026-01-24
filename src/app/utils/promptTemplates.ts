/**
 * 提示词模板系统
 * 提供标准化的提示词生成模板
 */

import type { StoryboardPanel, Character, Scene, DirectorStyle } from '../types';

/**
 * 提示词模板变量
 */
export interface PromptVariables {
    // 角色信息
    characterName?: string;
    characterTrigger?: string;
    characterAppearance?: string;
    characterAction?: string;
    
    // 场景信息
    location?: string;
    environment?: string;
    timeOfDay?: string;
    weather?: string;
    
    // 镜头信息
    shot?: string;
    angle?: string;
    movement?: string;
    duration?: string;
    
    // 技术参数
    lens?: string;
    fStop?: string;
    composition?: string;
    
    // 氛围和风格
    mood?: string;
    lighting?: string;
    colorGrade?: string;
    style?: string;
    
    // 动态信息
    startFrame?: string;
    endFrame?: string;
    environmentMotion?: string;
}

/**
 * 提示词模板
 */
export interface PromptTemplate {
    name: string;
    description: string;
    imageTemplate: string;
    videoTemplate: string;
    requiredVars: string[];
    optionalVars: string[];
}

/**
 * 预定义模板库
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
    // 标准模板
    standard: {
        name: '标准模板',
        description: '适用于大多数场景的通用模板',
        imageTemplate: '{characterName}({characterTrigger}), {characterAppearance}, {location}, {timeOfDay}, {shot}, {angle}, {composition}, {style}',
        videoTemplate: '{characterName}({characterTrigger}): {characterAction}, {location}, {environment}, {movement}, {duration}秒, [起始] {startFrame} → [结束] {endFrame}',
        requiredVars: ['characterName', 'location', 'shot'],
        optionalVars: ['characterTrigger', 'characterAppearance', 'timeOfDay', 'angle', 'style']
    },
    
    // 角色特写模板
    characterFocus: {
        name: '角色特写',
        description: '强调角色表情和情绪的模板',
        imageTemplate: '{characterName}({characterTrigger}), {characterAppearance}, {shot}特写, {mood}表情, {lighting}光影, {composition}构图',
        videoTemplate: '{characterName}({characterTrigger}): {characterAction}, 表情变化, {mood}情绪, [起始] {startFrame} → [结束] {endFrame}, {duration}秒',
        requiredVars: ['characterName', 'shot'],
        optionalVars: ['characterTrigger', 'characterAppearance', 'mood', 'lighting']
    },
    
    // 环境建立模板
    establishing: {
        name: '环境建立',
        description: '用于场景开始的建立镜头',
        imageTemplate: '{location}, {environment}, {timeOfDay}, {weather}, 远景建立镜头, {composition}构图, {style}风格',
        videoTemplate: '{location}全景, {environment}, {environmentMotion}, 建立空间感, [起始] {startFrame} → [结束] {endFrame}, {duration}秒',
        requiredVars: ['location'],
        optionalVars: ['environment', 'timeOfDay', 'weather', 'environmentMotion']
    },
    
    // 动作场景模板
    action: {
        name: '动作场景',
        description: '适用于动作戏和运动镜头',
        imageTemplate: '{characterName}({characterTrigger}), {characterAction}, {location}, {movement}运镜, 动态构图, 高速快门',
        videoTemplate: '{characterName}({characterTrigger}): {characterAction}, {movement}跟随, 快速运动, [起始] {startFrame} → [结束] {endFrame}, {duration}秒',
        requiredVars: ['characterName', 'characterAction'],
        optionalVars: ['characterTrigger', 'location', 'movement']
    },
    
    // 对话场景模板
    dialogue: {
        name: '对话场景',
        description: '适用于对话和交流场景',
        imageTemplate: '{characterName}({characterTrigger}), {characterAppearance}, 说话表情, {shot}, {angle}, 对话构图',
        videoTemplate: '{characterName}({characterTrigger}): 说话, 嘴唇动作, 表情变化, [起始] {startFrame} → [结束] {endFrame}, {duration}秒',
        requiredVars: ['characterName', 'shot'],
        optionalVars: ['characterTrigger', 'characterAppearance', 'angle']
    },
    
    // 情绪氛围模板
    emotional: {
        name: '情绪氛围',
        description: '强调情绪和氛围的模板',
        imageTemplate: '{characterName}({characterTrigger}), {mood}情绪, {lighting}光影, {colorGrade}调色, {composition}构图, 情感表达',
        videoTemplate: '{characterName}({characterTrigger}): {mood}情绪, 细微表情变化, {lighting}光影流动, [起始] {startFrame} → [结束] {endFrame}',
        requiredVars: ['characterName', 'mood'],
        optionalVars: ['characterTrigger', 'lighting', 'colorGrade']
    },
    
    // 技术展示模板
    technical: {
        name: '技术展示',
        description: '包含详细技术参数的模板',
        imageTemplate: '{characterName}({characterTrigger}), {location}, {shot}, {angle}, {lens}镜头, {fStop}光圈, {composition}构图, {lighting}',
        videoTemplate: '{characterName}({characterTrigger}): {characterAction}, {movement}运镜, {lens}, {duration}秒, [起始] {startFrame} → [结束] {endFrame}',
        requiredVars: ['characterName', 'shot', 'lens'],
        optionalVars: ['location', 'angle', 'fStop', 'movement']
    }
};

/**
 * 从分镜面板提取变量
 */
export function extractVariables(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[]
): PromptVariables {
    const variables: PromptVariables = {};
    
    // 角色信息
    if (panel.characters && panel.characters.length > 0) {
        const mainCharName = panel.characters[0];
        variables.characterName = mainCharName;
        
        const char = characters.find(c => c.name === mainCharName);
        if (char) {
            variables.characterTrigger = char.triggerWord || '';
            variables.characterAppearance = char.appearance || char.description || '';
        }
        
        if (panel.characterActions && panel.characterActions.length > 0) {
            variables.characterAction = panel.characterActions[0].split(':')[1] || panel.characterActions[0];
        }
    }
    
    // 场景信息
    const scene = scenes.find(s => s.id === panel.sceneId);
    if (scene) {
        variables.location = scene.location || scene.name || '';
        variables.environment = scene.environment || '';
        variables.timeOfDay = scene.timeOfDay || '';
        variables.weather = (scene as any).weather || '';
    }
    
    // 镜头信息
    variables.shot = panel.shot || '';
    variables.angle = panel.angle || '';
    variables.movement = panel.cameraMovement || '';
    variables.duration = panel.duration?.toString() || '';
    
    // 技术参数
    variables.lens = panel.lens || '';
    variables.fStop = panel.fStop || '';
    variables.composition = panel.composition || '';
    
    // 氛围和风格
    variables.mood = panel.shotIntent || '';
    variables.lighting = panel.lighting?.mood || '';
    variables.colorGrade = panel.colorGrade || '';
    
    // 动态信息
    variables.startFrame = panel.startFrame || '';
    variables.endFrame = panel.endFrame || '';
    variables.environmentMotion = panel.environmentMotion || '';
    
    return variables;
}

/**
 * 应用模板生成提示词
 */
export function applyTemplate(
    template: PromptTemplate,
    variables: PromptVariables,
    type: 'image' | 'video' = 'image'
): string {
    const templateStr = type === 'image' ? template.imageTemplate : template.videoTemplate;
    
    // 替换变量
    let result = templateStr;
    Object.entries(variables).forEach(([key, value]) => {
        if (value) {
            const placeholder = `{${key}}`;
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }
    });
    
    // 移除未填充的变量
    result = result.replace(/\{[^}]+\}/g, '');
    
    // 清理多余的标点和空格
    result = result
        .replace(/,\s*,/g, ',')
        .replace(/，\s*，/g, '，')
        .replace(/\s+/g, ' ')
        .replace(/,\s*$/g, '')
        .replace(/，\s*$/g, '')
        .trim();
    
    return result;
}

/**
 * 使用模板生成分镜提示词
 */
export function generateFromTemplate(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[],
    templateName: string = 'standard'
): { imagePrompt: string; videoPrompt: string } {
    const template = PROMPT_TEMPLATES[templateName];
    if (!template) {
        console.warn(`[Template] 模板 "${templateName}" 不存在，使用标准模板`);
        return generateFromTemplate(panel, characters, scenes, 'standard');
    }
    
    const variables = extractVariables(panel, characters, scenes);
    
    // 检查必需变量
    const missingVars = template.requiredVars.filter(varName => !variables[varName as keyof PromptVariables]);
    if (missingVars.length > 0) {
        console.warn(`[Template] 缺少必需变量: ${missingVars.join(', ')}`);
    }
    
    const imagePrompt = applyTemplate(template, variables, 'image');
    const videoPrompt = applyTemplate(template, variables, 'video');
    
    return { imagePrompt, videoPrompt };
}

/**
 * 智能选择模板
 */
export function selectTemplateAuto(panel: StoryboardPanel): string {
    // 根据分镜特征自动选择合适的模板
    
    // 对话场景
    if (panel.dialogue && panel.dialogue.length > 10) {
        return 'dialogue';
    }
    
    // 建立镜头
    if (panel.shot === '远景' || panel.shot === '大远景' || panel.notes?.includes('建立')) {
        return 'establishing';
    }
    
    // 角色特写
    if (panel.shot === '特写' || panel.shot === '大特写') {
        return 'characterFocus';
    }
    
    // 动作场景
    if (panel.cameraMovement && panel.cameraMovement !== '静止' && 
        (panel.characterActions && panel.characterActions.length > 0)) {
        return 'action';
    }
    
    // 情绪场景
    if (panel.shotIntent && (panel.shotIntent.includes('情绪') || panel.shotIntent.includes('氛围'))) {
        return 'emotional';
    }
    
    // 技术展示
    if (panel.lens && panel.fStop) {
        return 'technical';
    }
    
    // 默认使用标准模板
    return 'standard';
}

/**
 * 批量使用模板生成提示词
 */
export function batchGenerateFromTemplate(
    panels: StoryboardPanel[],
    characters: Character[],
    scenes: Scene[],
    templateName?: string
): StoryboardPanel[] {
    console.log(`[Template] 开始批量生成提示词...`);
    
    return panels.map(panel => {
        const selectedTemplate = templateName || selectTemplateAuto(panel);
        const { imagePrompt, videoPrompt } = generateFromTemplate(panel, characters, scenes, selectedTemplate);
        
        return {
            ...panel,
            aiPrompt: imagePrompt,
            aiVideoPrompt: videoPrompt
        };
    });
}

/**
 * 获取所有可用模板
 */
export function getAvailableTemplates(): Array<{ name: string; description: string }> {
    return Object.entries(PROMPT_TEMPLATES).map(([key, template]) => ({
        name: key,
        description: template.description
    }));
}

/**
 * 创建自定义模板
 */
export function createCustomTemplate(
    name: string,
    description: string,
    imageTemplate: string,
    videoTemplate: string,
    requiredVars: string[] = [],
    optionalVars: string[] = []
): PromptTemplate {
    return {
        name,
        description,
        imageTemplate,
        videoTemplate,
        requiredVars,
        optionalVars
    };
}
