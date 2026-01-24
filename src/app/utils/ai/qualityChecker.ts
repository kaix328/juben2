/**
 * 分镜质量检查模块
 * 自动检测连贯性、时长、角色追踪等问题
 */

export enum IssueSeverity {
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info'
}

export enum IssueType {
    CONTINUITY = 'continuity',
    DURATION = 'duration',
    CHARACTER = 'character',
    SHOT = 'shot',
    DIALOGUE = 'dialogue',
    LOGIC = 'logic',
    PROMPT = 'prompt'
}

export interface QualityIssue {
    id: string;
    type: IssueType;
    severity: IssueSeverity;
    panelNumber: number;
    panelId: string;
    message: string;
    suggestion?: string;
    details?: any;
}

export interface QualityReport {
    totalPanels: number;
    totalIssues: number;
    errors: QualityIssue[];
    warnings: QualityIssue[];
    infos: QualityIssue[];
    summary: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
        qualityScore: number;
    };
    checkTime: string;
}

export interface QualityCheckConfig {
    checkContinuity?: boolean;
    checkDuration?: boolean;
    checkCharacter?: boolean;
    checkShot?: boolean;
    checkDialogue?: boolean;
    checkLogic?: boolean;
    checkPrompt?: boolean;
    minDuration?: number;
    maxDuration?: number;
    maxTotalDuration?: number;
}

export const DEFAULT_CHECK_CONFIG: Required<QualityCheckConfig> = {
    checkContinuity: true,
    checkDuration: true,
    checkCharacter: true,
    checkShot: true,
    checkDialogue: true,
    checkLogic: true,
    checkPrompt: true,
    minDuration: 1,
    maxDuration: 15,
    maxTotalDuration: 600
};

let issueIdCounter = 0;

function generateIssueId(type: IssueType, panelNumber: number): string {
    return `${type}-${panelNumber}-${Date.now()}-${issueIdCounter++}`;
}

function checkContinuity(panels: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const shotOrder = ['大远景', '远景', '全景', '中景', '近景', '特写', '大特写'];
    const shotIndexMap = new Map(shotOrder.map((shot, index) => [shot, index]));
    
    for (let i = 1; i < panels.length; i++) {
        const prev = panels[i - 1];
        const curr = panels[i];
        
        if (i >= 2) {
            const prevPrev = panels[i - 2];
            if (prevPrev.shot === prev.shot && prev.shot === curr.shot) {
                issues.push({
                    id: generateIssueId(IssueType.CONTINUITY, curr.panelNumber),
                    type: IssueType.CONTINUITY,
                    severity: IssueSeverity.WARNING,
                    panelNumber: curr.panelNumber,
                    panelId: curr.id,
                    message: `连续 3 个相同景别（${curr.shot}）`,
                    suggestion: '考虑变化景别以增加视觉节奏'
                });
            }
        }
        
        if (prev.sceneId === curr.sceneId) {
            if ((prev.angle === '左侧' && curr.angle === '右侧') ||
                (prev.angle === '右侧' && curr.angle === '左侧')) {
                issues.push({
                    id: generateIssueId(IssueType.CONTINUITY, curr.panelNumber),
                    type: IssueType.CONTINUITY,
                    severity: IssueSeverity.WARNING,
                    panelNumber: curr.panelNumber,
                    panelId: curr.id,
                    message: '可能存在轴线跳跃',
                    suggestion: '检查镜头角度是否符合 180 度规则'
                });
            }
        }
        
        const prevIndex = shotIndexMap.get(prev.shot) ?? -1;
        const currIndex = shotIndexMap.get(curr.shot) ?? -1;
        
        if (prevIndex !== -1 && currIndex !== -1) {
            const jump = Math.abs(currIndex - prevIndex);
            if (jump >= 4 && prev.sceneId === curr.sceneId) {
                issues.push({
                    id: generateIssueId(IssueType.CONTINUITY, curr.panelNumber),
                    type: IssueType.CONTINUITY,
                    severity: IssueSeverity.INFO,
                    panelNumber: curr.panelNumber,
                    panelId: curr.id,
                    message: `景别跳跃过大（${prev.shot} → ${curr.shot}）`,
                    suggestion: '考虑添加过渡镜头'
                });
            }
        }
    }
    
    return issues;
}

function checkDuration(panels: any[], config: Required<QualityCheckConfig>): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    if (panels.length === 0) return issues;
    
    let totalDuration = 0;
    
    panels.forEach(panel => {
        const duration = panel.duration || 0;
        totalDuration += duration;
        
        if (duration < config.minDuration) {
            issues.push({
                id: generateIssueId(IssueType.DURATION, panel.panelNumber),
                type: IssueType.DURATION,
                severity: IssueSeverity.WARNING,
                panelNumber: panel.panelNumber,
                panelId: panel.id,
                message: `时长过短（${duration}秒）`,
                suggestion: `建议至少 ${config.minDuration} 秒`
            });
        }
        
        if (duration > config.maxDuration) {
            issues.push({
                id: generateIssueId(IssueType.DURATION, panel.panelNumber),
                type: IssueType.DURATION,
                severity: IssueSeverity.WARNING,
                panelNumber: panel.panelNumber,
                panelId: panel.id,
                message: `时长过长（${duration}秒）`,
                suggestion: `建议不超过 ${config.maxDuration} 秒，考虑拆分`
            });
        }
        
        if (panel.dialogue && panel.dialogue.length > 0) {
            const dialogueLength = panel.dialogue.length;
            const estimatedDuration = Math.ceil(dialogueLength / 4);
            
            if (duration > 0 && duration < estimatedDuration * 0.8) {
                issues.push({
                    id: generateIssueId(IssueType.DURATION, panel.panelNumber),
                    type: IssueType.DURATION,
                    severity: IssueSeverity.WARNING,
                    panelNumber: panel.panelNumber,
                    panelId: panel.id,
                    message: `对话时长不足（${duration}秒，需要约${estimatedDuration}秒）`,
                    suggestion: '增加时长以匹配对话长度'
                });
            }
        }
    });
    
    if (totalDuration > config.maxTotalDuration) {
        issues.push({
            id: generateIssueId(IssueType.DURATION, 0),
            type: IssueType.DURATION,
            severity: IssueSeverity.INFO,
            panelNumber: 0,
            panelId: 'total',
            message: `总时长过长（${totalDuration}秒）`,
            suggestion: `建议不超过 ${config.maxTotalDuration} 秒（${Math.floor(config.maxTotalDuration / 60)}分钟）`
        });
    }
    
    if (totalDuration < 30) {
        issues.push({
            id: generateIssueId(IssueType.DURATION, 0),
            type: IssueType.DURATION,
            severity: IssueSeverity.INFO,
            panelNumber: 0,
            panelId: 'total',
            message: `总时长过短（${totalDuration}秒）`,
            suggestion: '考虑增加分镜或延长时长'
        });
    }
    
    return issues;
}

function checkCharacter(panels: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        
        if (panel.dialogue && (!panel.characters || panel.characters.length === 0)) {
            issues.push({
                id: generateIssueId(IssueType.CHARACTER, panel.panelNumber),
                type: IssueType.CHARACTER,
                severity: IssueSeverity.ERROR,
                panelNumber: panel.panelNumber,
                panelId: panel.id,
                message: '有对话但没有角色',
                suggestion: '添加说话的角色'
            });
        }
        
        if (i > 0) {
            const prev = panels[i - 1];
            const curr = panel;
            
            if (prev.sceneId !== curr.sceneId) continue;
            
            const prevChars = new Set(prev.characters || []);
            const currChars = new Set(curr.characters || []);
            
            if (prevChars.size > 0) {
                for (const char of prevChars) {
                    if (!currChars.has(char)) {
                        issues.push({
                            id: generateIssueId(IssueType.CHARACTER, curr.panelNumber),
                            type: IssueType.CHARACTER,
                            severity: IssueSeverity.WARNING,
                            panelNumber: curr.panelNumber,
                            panelId: curr.id,
                            message: `角色 "${char}" 突然消失`,
                            suggestion: '如果角色离开，建议添加离开镜头'
                        });
                    }
                }
            }
            
            if (currChars.size > 1) {
                for (const char of currChars) {
                    if (!prevChars.has(char)) {
                        issues.push({
                            id: generateIssueId(IssueType.CHARACTER, curr.panelNumber),
                            type: IssueType.CHARACTER,
                            severity: IssueSeverity.INFO,
                            panelNumber: curr.panelNumber,
                            panelId: curr.id,
                            message: `角色 "${char}" 突然出现`,
                            suggestion: '如果角色进入，建议添加进入镜头'
                        });
                    }
                }
            }
        }
    }
    
    return issues;
}

function checkShot(panels: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    const sceneGroups = new Map<string, any[]>();
    panels.forEach(panel => {
        if (!sceneGroups.has(panel.sceneId)) {
            sceneGroups.set(panel.sceneId, []);
        }
        sceneGroups.get(panel.sceneId)!.push(panel);
    });
    
    sceneGroups.forEach((scenePanels) => {
        const hasEstablishing = scenePanels.some(p => 
            p.shot === '远景' || p.shot === '全景' || p.shot === '大远景' ||
            (p.notes && p.notes.includes('建立'))
        );
        
        if (!hasEstablishing && scenePanels.length > 2) {
            const firstPanel = scenePanels[0];
            issues.push({
                id: generateIssueId(IssueType.SHOT, firstPanel.panelNumber),
                type: IssueType.SHOT,
                severity: IssueSeverity.WARNING,
                panelNumber: firstPanel.panelNumber,
                panelId: firstPanel.id,
                message: '场景缺少建立镜头',
                suggestion: '添加远景或全景建立镜头'
            });
        }
        
        scenePanels.forEach(panel => {
            if (!panel.description || panel.description.trim() === '') {
                issues.push({
                    id: generateIssueId(IssueType.SHOT, panel.panelNumber),
                    type: IssueType.SHOT,
                    severity: IssueSeverity.ERROR,
                    panelNumber: panel.panelNumber,
                    panelId: panel.id,
                    message: '缺少画面描述',
                    suggestion: '添加详细的画面描述'
                });
            }
            
            if (!panel.shot) {
                issues.push({
                    id: generateIssueId(IssueType.SHOT, panel.panelNumber),
                    type: IssueType.SHOT,
                    severity: IssueSeverity.ERROR,
                    panelNumber: panel.panelNumber,
                    panelId: panel.id,
                    message: '缺少景别',
                    suggestion: '指定镜头景别'
                });
            }
        });
    });
    
    return issues;
}

function checkDialogue(panels: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    panels.forEach(panel => {
        if (panel.dialogue) {
            const dialogueText = typeof panel.dialogue === 'string' 
                ? panel.dialogue 
                : (panel.dialogue as any).text || '';
            
            if (!dialogueText) return;
            
            if (dialogueText.length > 200) {
                issues.push({
                    id: generateIssueId(IssueType.DIALOGUE, panel.panelNumber),
                    type: IssueType.DIALOGUE,
                    severity: IssueSeverity.WARNING,
                    panelNumber: panel.panelNumber,
                    panelId: panel.id,
                    message: `对话过长（${dialogueText.length}字）`,
                    suggestion: '考虑拆分为多个分镜'
                });
            }
            
            if (!dialogueText.match(/[。！？!?…]/)) {
                issues.push({
                    id: generateIssueId(IssueType.DIALOGUE, panel.panelNumber),
                    type: IssueType.DIALOGUE,
                    severity: IssueSeverity.INFO,
                    panelNumber: panel.panelNumber,
                    panelId: panel.id,
                    message: '对话缺少标点符号',
                    suggestion: '添加适当的标点符号'
                });
            }
        }
    });
    
    return issues;
}

function checkLogic(panels: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    for (let i = 0; i < panels.length; i++) {
        if (panels[i].panelNumber !== i + 1) {
            issues.push({
                id: generateIssueId(IssueType.LOGIC, panels[i].panelNumber),
                type: IssueType.LOGIC,
                severity: IssueSeverity.ERROR,
                panelNumber: panels[i].panelNumber,
                panelId: panels[i].id,
                message: `分镜编号不连续（期望 ${i + 1}，实际 ${panels[i].panelNumber}）`,
                suggestion: '重新编号分镜'
            });
        }
    }
    
    const ids = new Set<string>();
    panels.forEach(panel => {
        if (ids.has(panel.id)) {
            issues.push({
                id: generateIssueId(IssueType.LOGIC, panel.panelNumber),
                type: IssueType.LOGIC,
                severity: IssueSeverity.ERROR,
                panelNumber: panel.panelNumber,
                panelId: panel.id,
                message: '分镜 ID 重复',
                suggestion: '生成新的唯一 ID'
            });
        }
        ids.add(panel.id);
    });
    
    return issues;
}

/**
 * 场景级连贯性检查
 * - 检查建立镜头
 * - 检查角色连贯性
 * - 检查环境一致性
 * - 检查时间连贯性
 */
function checkSceneLevelContinuity(panels: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    // 按场景分组
    const sceneGroups = new Map<string, any[]>();
    panels.forEach(panel => {
        if (!sceneGroups.has(panel.sceneId)) {
            sceneGroups.set(panel.sceneId, []);
        }
        sceneGroups.get(panel.sceneId)!.push(panel);
    });
    
    sceneGroups.forEach((scenePanels, sceneId) => {
        if (scenePanels.length === 0) return;
        
        // 1. 检查建立镜头
        const hasEstablishing = scenePanels.some(p => 
            p.shot === '远景' || p.shot === '全景' || p.shot === '大远景' ||
            (p.notes && p.notes.includes('建立'))
        );
        if (!hasEstablishing && scenePanels.length > 2) {
            issues.push({
                id: generateIssueId(IssueType.CONTINUITY, scenePanels[0].panelNumber),
                type: IssueType.CONTINUITY,
                severity: IssueSeverity.WARNING,
                panelNumber: scenePanels[0].panelNumber,
                panelId: scenePanels[0].id,
                message: '场景缺少建立镜头',
                suggestion: '在场景开始添加远景或全景镜头，建立空间感'
            });
        }
        
        // 2. 检查角色连贯性
        const allCharacters = new Set<string>();
        scenePanels.forEach(p => {
            if (p.characters && Array.isArray(p.characters)) {
                p.characters.forEach((c: string) => allCharacters.add(c));
            }
        });
        
        scenePanels.forEach((panel, index) => {
            if (index > 0 && index < scenePanels.length - 1) {
                const prevChars = new Set(scenePanels[index - 1].characters || []);
                const currChars = new Set(panel.characters || []);
                
                // 检查角色突然消失（不是场景结尾）
                prevChars.forEach(char => {
                    if (!currChars.has(char) && allCharacters.has(char)) {
                        // 检查后续镜头中是否还有这个角色
                        const appearsLater = scenePanels.slice(index + 1).some(p => 
                            p.characters && p.characters.includes(char)
                        );
                        if (appearsLater) {
                            issues.push({
                                id: generateIssueId(IssueType.CHARACTER, panel.panelNumber),
                                type: IssueType.CHARACTER,
                                severity: IssueSeverity.INFO,
                                panelNumber: panel.panelNumber,
                                panelId: panel.id,
                                message: `角色"${char}"在场景中途消失后又出现`,
                                suggestion: '保持角色在场景中的连续性，或添加离开/进入镜头'
                            });
                        }
                    }
                });
            }
        });
        
        // 3. 检查环境一致性
        const environments = scenePanels
            .map(p => p.environmentMotion)
            .filter(e => e && e.trim() !== '');
        
        if (environments.length > 0) {
            const uniqueEnvs = new Set(environments);
            if (uniqueEnvs.size > 3 && scenePanels.length < 10) {
                issues.push({
                    id: generateIssueId(IssueType.CONTINUITY, scenePanels[0].panelNumber),
                    type: IssueType.CONTINUITY,
                    severity: IssueSeverity.INFO,
                    panelNumber: scenePanels[0].panelNumber,
                    panelId: scenePanels[0].id,
                    message: '场景内环境变化过多',
                    suggestion: '保持场景内环境描述的一致性（如：始终有风吹树叶）'
                });
            }
        }
        
        // 4. 检查时间连贯性（通过场景对象）
        const firstPanel = scenePanels[0];
        if (firstPanel._scene || firstPanel.scene) {
            const sceneObj = firstPanel._scene || firstPanel.scene;
            const timeOfDay = sceneObj.timeOfDay;
            
            if (timeOfDay) {
                // 检查是否有不一致的时间描述
                scenePanels.forEach(panel => {
                    const desc = (panel.description || '').toLowerCase();
                    const conflictingTimes = [
                        { keyword: '夜晚', conflicts: ['day', 'dawn'] },
                        { keyword: '白天', conflicts: ['night', 'dusk'] },
                        { keyword: '黄昏', conflicts: ['day', 'night'] },
                        { keyword: '黎明', conflicts: ['night', 'dusk'] }
                    ];
                    
                    conflictingTimes.forEach(({ keyword, conflicts }) => {
                        if (desc.includes(keyword)) {
                            conflicts.forEach(conflict => {
                                if (timeOfDay.toLowerCase().includes(conflict)) {
                                    issues.push({
                                        id: generateIssueId(IssueType.CONTINUITY, panel.panelNumber),
                                        type: IssueType.CONTINUITY,
                                        severity: IssueSeverity.WARNING,
                                        panelNumber: panel.panelNumber,
                                        panelId: panel.id,
                                        message: `画面描述中的时间（${keyword}）与场景设定（${timeOfDay}）不一致`,
                                        suggestion: '统一场景内的时间描述'
                                    });
                                }
                            });
                        }
                    });
                });
            }
        }
        
        // 5. 检查镜头语言连贯性
        scenePanels.forEach((panel, index) => {
            if (index > 0) {
                const prev = scenePanels[index - 1];
                
                // 检查轴线跳跃
                if (prev.angle && panel.angle) {
                    const axisJump = (
                        (prev.angle.includes('左') && panel.angle.includes('右')) ||
                        (prev.angle.includes('右') && panel.angle.includes('左'))
                    );
                    
                    if (axisJump && !panel.axisNote) {
                        issues.push({
                            id: generateIssueId(IssueType.CONTINUITY, panel.panelNumber),
                            type: IssueType.CONTINUITY,
                            severity: IssueSeverity.WARNING,
                            panelNumber: panel.panelNumber,
                            panelId: panel.id,
                            message: '可能存在轴线跳跃',
                            suggestion: '检查镜头角度是否符合180度规则，或添加过渡镜头'
                        });
                    }
                }
            }
        });
    });
    
    return issues;
}

/**
 * 提示词质量检查
 * - 检查是否缺少提示词
 * - 检查提示词长度是否过短
 * - 检查提示词是否包含画面描述和主要角色
 */
function checkPrompt(panels: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];

    panels.forEach(panel => {
        const aiPrompt: string = (panel.aiPrompt || '').toString();
        const aiVideoPrompt: string = (panel.aiVideoPrompt || '').toString();
        const description: string = (panel.description || '').toString();
        const characters: string[] = Array.isArray(panel.characters) ? panel.characters : [];

        // 1. 绘画提示词缺失
        if (!aiPrompt.trim()) {
            issues.push({
                id: generateIssueId(IssueType.PROMPT, panel.panelNumber),
                type: IssueType.PROMPT,
                severity: IssueSeverity.WARNING,
                panelNumber: panel.panelNumber,
                panelId: panel.id,
                message: '缺少绘画提示词',
                suggestion: '点击“刷新提示词”或在分镜卡中补充绘画提示词，以便生成稳定的画面'
            });
        } else {
            // 2. 绘画提示词过短（信息可能不足）
            const promptLength = aiPrompt.length;
            if (promptLength < 40) {
                issues.push({
                    id: generateIssueId(IssueType.PROMPT, panel.panelNumber),
                    type: IssueType.PROMPT,
                    severity: IssueSeverity.INFO,
                    panelNumber: panel.panelNumber,
                    panelId: panel.id,
                    message: `绘画提示词可能过短（${promptLength} 字）`,
                    suggestion: '建议在提示词中加入更多关于环境、光线、情绪和构图的描述，以获得更稳定的生成效果'
                });
            }

            // 3. 提示词是否覆盖画面描述中的关键信息
            if (description) {
                const cleanDesc = description.replace(/[，。？！!?,、；;]/g, ' ');
                const keywords = cleanDesc.split(/\s+/).filter((w: string) => w.length >= 2).slice(0, 5);
                const lowerPrompt = aiPrompt.toLowerCase();
                if (keywords.length >= 2) {
                    const matched = keywords.filter((k: string) => lowerPrompt.includes(k.toLowerCase())).length;
                    if (matched === 0) {
                        issues.push({
                            id: generateIssueId(IssueType.PROMPT, panel.panelNumber),
                            type: IssueType.PROMPT,
                            severity: IssueSeverity.INFO,
                            panelNumber: panel.panelNumber,
                            panelId: panel.id,
                            message: '提示词未充分包含画面描述中的关键信息',
                            suggestion: '建议从画面描述中挑选地点、主体、关键动作等短语，加入到提示词中，以保证画面一致性'
                        });
                    }
                }
            }

            // 4. 提示词是否提及主要角色
            if (characters.length > 0) {
                const lowerPrompt = aiPrompt.toLowerCase();
                const missingChars = characters.filter((name: string) =>
                    name && !lowerPrompt.includes(name.toLowerCase())
                );
                if (missingChars.length === characters.length) {
                    issues.push({
                        id: generateIssueId(IssueType.PROMPT, panel.panelNumber),
                        type: IssueType.PROMPT,
                        severity: IssueSeverity.INFO,
                        panelNumber: panel.panelNumber,
                        panelId: panel.id,
                        message: `提示词中未提及当前镜头的角色（${characters.slice(0, 3).join('、')}）`,
                        suggestion: '建议在提示词中加入主要角色名称或触发词，以提高人物外观的一致性'
                    });
                }
            }
        }

        // 5. 视频提示词检查（可选，信息性提示）
        if (!aiVideoPrompt.trim() && (panel.duration || 0) >= 4) {
            issues.push({
                id: generateIssueId(IssueType.PROMPT, panel.panelNumber),
                type: IssueType.PROMPT,
                severity: IssueSeverity.INFO,
                panelNumber: panel.panelNumber,
                panelId: panel.id,
                message: '当前镜头未设置视频提示词',
                suggestion: '如需生成视频片段，可以在“提示词预览”中为该分镜补充视频提示词'
            });
        }
    });

    return issues;
}

function calculateQualityScore(
    totalPanels: number,
    errorCount: number,
    warningCount: number,
    infoCount: number
): number {
    if (totalPanels === 0) return 100;
    
    let score = 100;
    score -= errorCount * 10;
    score -= warningCount * 3;
    score -= infoCount * 1;
    
    return Math.max(0, score);
}

export function performQualityCheck(
    panels: any[],
    config: Partial<QualityCheckConfig> = {}
): QualityReport {
    const finalConfig = { ...DEFAULT_CHECK_CONFIG, ...config };
    const allIssues: QualityIssue[] = [];
    
    console.log(`[QualityCheck] 开始检查 ${panels.length} 个分镜`);
    
    if (finalConfig.checkContinuity) {
        const issues = checkContinuity(panels);
        allIssues.push(...issues);
        
        // 🆕 场景级连贯性检查
        const sceneIssues = checkSceneLevelContinuity(panels);
        allIssues.push(...sceneIssues);
        
        console.log(`[QualityCheck] 连贯性检查: ${issues.length + sceneIssues.length} 个问题（基础: ${issues.length}, 场景级: ${sceneIssues.length}）`);
    }
    
    if (finalConfig.checkDuration) {
        const issues = checkDuration(panels, finalConfig);
        allIssues.push(...issues);
        console.log(`[QualityCheck] 时长检查: ${issues.length} 个问题`);
    }
    
    if (finalConfig.checkCharacter) {
        const issues = checkCharacter(panels);
        allIssues.push(...issues);
        console.log(`[QualityCheck] 角色检查: ${issues.length} 个问题`);
    }
    
    if (finalConfig.checkShot) {
        const issues = checkShot(panels);
        allIssues.push(...issues);
        console.log(`[QualityCheck] 镜头检查: ${issues.length} 个问题`);
    }
    
    if (finalConfig.checkDialogue) {
        const issues = checkDialogue(panels);
        allIssues.push(...issues);
        console.log(`[QualityCheck] 对话检查: ${issues.length} 个问题`);
    }
    
    if (finalConfig.checkLogic) {
        const issues = checkLogic(panels);
        allIssues.push(...issues);
        console.log(`[QualityCheck] 逻辑检查: ${issues.length} 个问题`);
    }

    if (finalConfig.checkPrompt) {
        const issues = checkPrompt(panels);
        allIssues.push(...issues);
        console.log(`[QualityCheck] 提示词检查: ${issues.length} 个问题`);
    }
    
    const errors = allIssues.filter(i => i.severity === IssueSeverity.ERROR);
    const warnings = allIssues.filter(i => i.severity === IssueSeverity.WARNING);
    const infos = allIssues.filter(i => i.severity === IssueSeverity.INFO);
    
    const qualityScore = calculateQualityScore(
        panels.length,
        errors.length,
        warnings.length,
        infos.length
    );
    
    console.log(`[QualityCheck] 检查完成: ${allIssues.length} 个问题，质量分数: ${qualityScore}`);
    
    return {
        totalPanels: panels.length,
        totalIssues: allIssues.length,
        errors,
        warnings,
        infos,
        summary: {
            errorCount: errors.length,
            warningCount: warnings.length,
            infoCount: infos.length,
            qualityScore
        },
        checkTime: new Date().toISOString()
    };
}

export function getIssueStatistics(report: QualityReport): {
    byType: Record<IssueType, number>;
    bySeverity: Record<IssueSeverity, number>;
    topIssues: QualityIssue[];
} {
    const byType: Record<IssueType, number> = {
        [IssueType.CONTINUITY]: 0,
        [IssueType.DURATION]: 0,
        [IssueType.CHARACTER]: 0,
        [IssueType.SHOT]: 0,
        [IssueType.DIALOGUE]: 0,
        [IssueType.LOGIC]: 0,
        [IssueType.PROMPT]: 0
    };
    
    const bySeverity: Record<IssueSeverity, number> = {
        [IssueSeverity.ERROR]: report.errors.length,
        [IssueSeverity.WARNING]: report.warnings.length,
        [IssueSeverity.INFO]: report.infos.length
    };
    
    [...report.errors, ...report.warnings, ...report.infos].forEach(issue => {
        byType[issue.type]++;
    });
    
    const topIssues = [
        ...report.errors.slice(0, 3),
        ...report.warnings.slice(0, 2)
    ];
    
    return { byType, bySeverity, topIssues };
}

// 🆕 导出 qualityChecker 对象
export const qualityChecker = {
    checkStoryboard: performQualityCheck,
    getStatistics: getIssueStatistics,
};
