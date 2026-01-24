/**
 * 提示词引擎辅助函数
 * 提取公共逻辑，减少代码重复
 */

import type { Character, StoryboardPanel, LightingDesign } from '../../types';
import { getShotTypeByCode, getCameraAngleByCode, getCameraMovementByCode } from '../../constants/cinematography';

export interface PromptPart {
    type: 'subject' | 'appearance' | 'style' | 'lighting' | 'mood' | 'technical' | 'quality';
    value: string;
    weight?: number;
    language?: 'zh' | 'en' | 'mixed';
}

/**
 * 添加角色基础信息（名称 + 触发词）
 */
export function addCharacterBasicInfo(character: Character, parts: PromptPart[]): void {
    if (character.name) {
        parts.push({ 
            type: 'subject', 
            value: character.name, 
            weight: 1.2, 
            language: 'zh' 
        });
    }
    
    if (character.triggerWord) {
        parts.push({ 
            type: 'subject', 
            value: character.triggerWord, 
            weight: 1.3, 
            language: 'en' 
        });
    }
}

/**
 * 添加角色外观描述
 */
export function addCharacterAppearance(character: Character, parts: PromptPart[], brief: boolean = false): void {
    if (!character.appearance) return;
    
    let appearance = character.appearance;
    
    // 如果需要简短描述，只取第一句
    if (brief) {
        appearance = appearance.split(/[,，。]/)[0];
    }
    
    // 清理外观描述
    appearance = appearance.trim().replace(/^[,，]+|[,，]+$/g, '');
    
    // 避免重复名字
    if (appearance.startsWith(character.name)) {
        appearance = appearance.substring(character.name.length).replace(/^[:：,，]+/, '').trim();
    }
    
    if (appearance) {
        parts.push({ 
            type: 'appearance', 
            value: appearance, 
            weight: 1.1, 
            language: 'zh' 
        });
    }
}

/**
 * 添加技术参数（焦距、光圈、景深、焦点）
 */
export function addTechnicalParams(panel: StoryboardPanel, parts: PromptPart[]): void {
    if (!panel.lens && !panel.fStop && !panel.depthOfField && !panel.focusPoint) {
        return;
    }
    
    const techParts: string[] = [];
    
    if (panel.lens) {
        techParts.push(`${panel.lens} lens`);
    }
    if (panel.fStop) {
        techParts.push(`shot at ${panel.fStop}`);
    }
    if (panel.depthOfField) {
        const dofMap: Record<string, string> = {
            SHALLOW: 'shallow depth of field, blurred background',
            DEEP: 'deep focus, everything in focus',
            SELECTIVE: 'selective focus, subject isolated',
            NORMAL: 'natural depth of field',
        };
        const dofDesc = dofMap[panel.depthOfField];
        if (dofDesc) {
            techParts.push(dofDesc);
        }
    }
    if (panel.focusPoint) {
        techParts.push(`focus on ${panel.focusPoint}`);
    }
    
    if (techParts.length > 0) {
        parts.push({
            type: 'technical',
            value: techParts.join(', '),
            language: 'en',
        });
    }
}

/**
 * 添加灯光信息
 */
export function addLightingInfo(lighting: LightingDesign | undefined, parts: PromptPart[]): void {
    if (!lighting) return;
    
    if (lighting.mood) {
        parts.push({
            type: 'lighting',
            value: lighting.mood,
            language: 'zh',
        });
    }
    
    const lightingDetails: string[] = [];
    if (lighting.keyLight) {
        lightingDetails.push(`key light: ${lighting.keyLight}`);
    }
    if (lighting.fillLight) {
        lightingDetails.push(`fill light: ${lighting.fillLight}`);
    }
    if (lighting.backLight) {
        lightingDetails.push(`back light: ${lighting.backLight}`);
    }
    if (lighting.practicalLights && lighting.practicalLights.length > 0) {
        lightingDetails.push(`practical lights: ${lighting.practicalLights.join(', ')}`);
    }
    
    if (lightingDetails.length > 0) {
        parts.push({
            type: 'lighting',
            value: lightingDetails.join(', '),
            language: 'en',
        });
    }
}

/**
 * 添加景别和角度信息
 */
export function addShotAndAngle(panel: StoryboardPanel, parts: PromptPart[]): void {
    const shotInfo = getShotTypeByCode(panel.shot);
    if (shotInfo) {
        parts.push({ type: 'technical', value: shotInfo.cn, language: 'zh' });
        parts.push({ type: 'technical', value: shotInfo.promptEn, language: 'en' });
    }
    
    const angleInfo = getCameraAngleByCode(panel.angle);
    if (angleInfo) {
        parts.push({ type: 'technical', value: angleInfo.cn, language: 'zh' });
        parts.push({ type: 'technical', value: angleInfo.promptEn, language: 'en' });
    }
}

/**
 * 添加镜头运动信息
 */
export function addCameraMovement(panel: StoryboardPanel, parts: PromptPart[]): void {
    const movementInfo = getCameraMovementByCode(panel.movement);
    if (movementInfo) {
        parts.push({ type: 'technical', value: movementInfo.cn, language: 'zh' });
        parts.push({ type: 'technical', value: movementInfo.promptEn, language: 'en', weight: 1.2 });
    }
}

/**
 * 添加构图和镜头意图
 */
export function addCompositionAndIntent(panel: StoryboardPanel, parts: PromptPart[]): void {
    if (panel.composition) {
        parts.push({ type: 'style', value: panel.composition, language: 'zh' });
    }
    if (panel.shotIntent) {
        parts.push({
            type: 'style',
            value: `镜头意图：${panel.shotIntent}`,
            language: 'zh',
        });
    }
}

/**
 * 添加环境动态和特效
 */
export function addEnvironmentAndVFX(panel: StoryboardPanel, parts: PromptPart[]): void {
    if (panel.environmentMotion) {
        parts.push({
            type: 'appearance',
            value: `环境动态：${panel.environmentMotion}`,
            language: 'zh',
        });
    }
    if (panel.vfx && panel.vfx.length > 0) {
        parts.push({
            type: 'appearance',
            value: `visual effects: ${panel.vfx.join(', ')}`,
            language: 'en',
        });
    }
}

/**
 * 添加音效氛围（转为视觉气氛提示）
 */
export function addSoundAtmosphere(panel: StoryboardPanel, parts: PromptPart[]): void {
    if (panel.soundEffects && panel.soundEffects.length > 0) {
        parts.push({
            type: 'mood',
            value: `音效氛围：${panel.soundEffects.slice(0, 3).join('、')}`,
            language: 'zh',
        });
    }
    if (panel.music) {
        parts.push({
            type: 'mood',
            value: `background music: ${panel.music}`,
            language: 'en',
        });
    }
}

/**
 * 添加道具信息
 */
export function addProps(props: string[], parts: PromptPart[]): void {
    if (!props || props.length === 0) return;
    
    const validProps = props.filter(p => p && p.trim());
    if (validProps.length > 0) {
        parts.push({ type: 'appearance', value: `道具: ${validProps.join('、')}`, language: 'zh' });
        parts.push({ type: 'appearance', value: `props: ${validProps.join(', ')}`, language: 'en' });
    }
}

/**
 * 添加视频专用字段（起始帧、结束帧、运动速度）
 */
export function addVideoSpecificFields(panel: StoryboardPanel, parts: PromptPart[], prevPanel?: StoryboardPanel): void {
    // 上下文过渡
    if (prevPanel && prevPanel.endFrame) {
        parts.push({
            type: 'technical',
            value: `[过渡] 承接上一镜：${prevPanel.endFrame}，画面自然延续`,
            language: 'zh'
        });
    }
    
    // 转场效果
    if (panel.transition && panel.transition !== '切至') {
        const transitionMap: Record<string, string> = {
            '溶至': '画面溶解过渡，从前一镜渐变融入',
            '淡出': '画面淡出至黑，再淡入新镜',
            '淡入': '从黑色淡入画面',
            '闪白': '画面闪白过渡，强调冲击感',
            '擦除': '画面擦除过渡'
        };
        if (transitionMap[panel.transition]) {
            parts.push({ type: 'technical', value: `[转场] ${transitionMap[panel.transition]}`, language: 'zh' });
        }
    }
    
    // 时长
    if (panel.duration) {
        parts.push({ type: 'technical', value: `${panel.duration}秒`, language: 'zh' });
        parts.push({ type: 'technical', value: `${panel.duration} seconds duration`, language: 'en' });
    }
    
    // 起始帧 / 结束帧
    if (panel.startFrame) {
        parts.push({
            type: 'technical',
            value: `[起始帧] ${panel.startFrame}`,
            language: 'zh',
        });
    }
    if (panel.endFrame) {
        parts.push({
            type: 'technical',
            value: `[结束帧] ${panel.endFrame}`,
            language: 'zh',
        });
    }
    
    // 运动速度
    if (panel.motionSpeed && panel.motionSpeed !== 'normal') {
        const speedMap: Record<string, string> = {
            slow: '慢动作',
            fast: '快动作',
            timelapse: '延时摄影'
        };
        const speedDesc = speedMap[panel.motionSpeed];
        if (speedDesc) {
            parts.push({ type: 'technical', value: speedDesc, language: 'zh' });
        }
    }
}

/**
 * 添加角色动作列表
 */
export function addCharacterActions(panel: StoryboardPanel, characters: Character[], parts: PromptPart[]): void {
    if (!panel.characters || panel.characters.length === 0) return;
    
    // 优先使用分镜卡中的 characterActions
    if (panel.characterActions && panel.characterActions.length > 0) {
        const zhActions = panel.characterActions.join('；');
        parts.push({
            type: 'appearance',
            value: `【角色动作】${zhActions}`,
            language: 'zh',
        });
    } else {
        // 否则生成简单的"in motion"描述
        const charActions = panel.characters.map((name) => {
            const char = characters.find(c => c.name === name);
            return `${char?.triggerWord || name} in motion`;
        }).join(', ');
        parts.push({ type: 'subject', value: charActions, language: 'en', weight: 1.1 });
    }
}

/**
 * 合并提示词部分为最终字符串
 */
export function mergePromptParts(
    parts: PromptPart[],
    separateLanguages: boolean = true,
    useWeights: boolean = false
): string {
    const zhParts: string[] = [];
    const enParts: string[] = [];
    const mixedParts: string[] = [];
    
    parts.forEach((part) => {
        if (!part.value) return;
        
        const value = part.value.trim();
        if (!value) return;
        
        // 根据语言分类
        if (part.language === 'zh') {
            zhParts.push(value);
        } else if (part.language === 'en') {
            enParts.push(value);
        } else {
            mixedParts.push(value);
        }
    });
    
    // 构建最终提示词
    if (separateLanguages) {
        // 中文在前，英文在后
        return [...zhParts, ...mixedParts, ...enParts].join(', ');
    } else {
        // 混合排列
        return [...zhParts, ...enParts, ...mixedParts].join(', ');
    }
}

/**
 * 获取时间段描述
 */
export function getTimeOfDayDescription(timeOfDay: 'day' | 'night' | 'dawn' | 'dusk'): { zh: string; en: string } {
    const descriptions = {
        day: { zh: '白天，明亮的自然光', en: 'daytime, bright natural light, sunny' },
        night: { zh: '夜晚，月光或灯光照明', en: 'nighttime, moonlight, artificial lighting' },
        dawn: { zh: '黎明，柔和的晨光', en: 'dawn, soft morning light, sunrise' },
        dusk: { zh: '黄昏，温暖的夕阳光线', en: 'dusk, golden hour, warm sunset light' },
    };
    return descriptions[timeOfDay] || { zh: '', en: '' };
}

/**
 * 获取质量标签
 */
export function getQualityTags(level: 'basic' | 'professional' = 'professional'): PromptPart[] {
    const tags = {
        basic: {
            zh: ['高质量', '清晰'],
            en: ['high quality', 'detailed'],
        },
        professional: {
            zh: ['超高质量', '8K分辨率', '专业级', '精细细节', '完美构图'],
            en: ['masterpiece', 'best quality', '8k', 'ultra detailed', 'professional', 'perfect composition'],
        },
    };
    
    const selectedTags = tags[level];
    const parts: PromptPart[] = [];
    
    selectedTags.zh.forEach((tag) => {
        parts.push({ type: 'quality', value: tag, language: 'zh' });
    });
    
    selectedTags.en.forEach((tag) => {
        parts.push({ type: 'quality', value: tag, language: 'en' });
    });
    
    return parts;
}
