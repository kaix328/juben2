/**
 * 分镜生成模块
 * 从 aiService.ts 拆分 - 包含 extractStoryboard 和 generateFallbackPanels
 */
import type { ScriptScene, Character, Scene, StoryboardPanel, DirectorStyle } from '../../types';
import { generateId } from '../storage';
import { callDeepSeek, parseJSON } from '../volcApi';
import { generateStoryboardImagePrompt, generateStoryboardVideoPrompt } from '../promptGenerator';
import { DENSITY_CONFIG, splitLongDialogue, type DensityMode } from '../../constants/densityConfig';
import { smartFillPanel } from './panelProcessor';
import { devLog, callWithRetry, checkCharacterConsistency } from './utils';

/**
 * 智能 Fallback 分镜生成
 */
export async function generateFallbackPanels(
    scenes: ScriptScene[],
    characters: Character[],
    assetsScenes: Scene[],
    densityMode: 'compact' | 'standard' | 'detailed',
    directorStyle?: DirectorStyle
): Promise<StoryboardPanel[]> {
    const allPanels: any[] = [];
    let panelNumber = 1;

    scenes.forEach((scene) => {
        const dialogueCount = scene.dialogues?.length || 0;
        const actionLength = (scene.action || '').length;

        devLog(`[Fallback 场景${scene.sceneNumber}] ${dialogueCount}句对白, ${actionLength}字动作`);

        // 1. 建立镜头
        allPanels.push({
            id: generateId(),
            panelNumber: panelNumber++,
            sceneId: scene.id,
            episodeNumber: scene.episodeNumber,
            description: `${scene.location || '场景'}，${scene.timeOfDay || '日'}。${(scene.action || '').substring(0, 80)}`,
            shot: '远景',
            angle: '平视',
            cameraMovement: '静止',
            duration: 4,
            characters: scene.characters || [],
            dialogue: '',
            props: [],
            notes: '建立场景',
            aiPrompt: '',
            aiVideoPrompt: ''
        });

        // 2. 对话分镜
        if (scene.dialogues && scene.dialogues.length > 0) {
            const config = DENSITY_CONFIG[densityMode as DensityMode] || DENSITY_CONFIG.standard;

            scene.dialogues.forEach((dialogue, idx) => {
                const fullDialogue = dialogue.lines || '';
                const character = dialogue.character;
                const dialogueChunks = splitLongDialogue(fullDialogue, config.longDialogueThreshold);

                dialogueChunks.forEach((chunk, chunkIdx) => {
                    const isFirst = idx === 0 && chunkIdx === 0;
                    allPanels.push({
                        id: generateId(),
                        panelNumber: panelNumber++,
                        sceneId: scene.id,
                        episodeNumber: scene.episodeNumber,
                        description: `${isFirst ? '近景' : '特写'}，${character}${dialogue.parenthetical ? `（${dialogue.parenthetical}）` : ''}说话，表情变化`,
                        shot: isFirst ? '近景' : '特写',
                        angle: '平视',
                        cameraMovement: '静止',
                        duration: Math.max(2, Math.ceil(chunk.length / 20)),
                        characters: [character],
                        dialogue: chunk,
                        props: [],
                        notes: dialogueChunks.length > 1 ? `对话 ${idx + 1}-${chunkIdx + 1}` : `对话 ${idx + 1}`,
                        aiPrompt: '',
                        aiVideoPrompt: ''
                    });
                });
            });
        }

        // 3. 动作分镜
        const config = DENSITY_CONFIG[densityMode as DensityMode] || DENSITY_CONFIG.standard;
        if (actionLength > config.actionCharsPerPanel / 2) {
            const actionParts = Math.ceil(actionLength / config.actionCharsPerPanel);
            for (let i = 0; i < Math.min(actionParts, 3); i++) {
                const actionText = (scene.action || '').substring(i * config.actionCharsPerPanel, (i + 1) * config.actionCharsPerPanel);
                if (actionText.trim()) {
                    allPanels.push({
                        id: generateId(),
                        panelNumber: panelNumber++,
                        sceneId: scene.id,
                        episodeNumber: scene.episodeNumber,
                        description: `中景，${actionText}`,
                        shot: '中景',
                        angle: '平视',
                        cameraMovement: i === 0 ? '静止' : '跟',
                        duration: 3,
                        characters: scene.characters || [],
                        dialogue: '',
                        props: [],
                        notes: '动作描写',
                        aiPrompt: '',
                        aiVideoPrompt: ''
                    });
                }
            }
        }
    });

    // 应用智能填充和生成提示词
    const filledPanels = allPanels.map((panel, index) => {
        const matchedScene = scenes.find(s => s.id === panel.sceneId);
        const prevPanel = index > 0 ? allPanels[index - 1] : undefined;
        const nextPanel = index < allPanels.length - 1 ? allPanels[index + 1] : undefined;
        const filledPanel = smartFillPanel(panel, matchedScene, prevPanel, nextPanel, allPanels);
        filledPanel.aiPrompt = generateStoryboardImagePrompt(filledPanel as StoryboardPanel, characters, assetsScenes, directorStyle);
        filledPanel.aiVideoPrompt = generateStoryboardVideoPrompt(filledPanel as StoryboardPanel, characters, assetsScenes, directorStyle, prevPanel);
        return filledPanel;
    });

    devLog(`[智能Fallback] 共生成 ${filledPanels.length} 个分镜（${scenes.length} 个场景）`);
    return filledPanels;
}

// 代码映射表
const SHOT_CODE_TO_CN: Record<string, string> = {
    'ECU': '大特写', 'CU': '特写', 'MCU': '近景',
    'MS': '中景', 'MWS': '全景', 'WS': '远景',
    'EWS': '大远景', 'POV': '中景', 'OTS': '中景',
    'TWO': '中景', 'GROUP': '全景', 'INSERT': '特写'
};

const ANGLE_CODE_TO_CN: Record<string, string> = {
    'EYE_LEVEL': '平视', 'HIGH': '俯视', 'LOW': '仰视',
    'BIRDS_EYE': '俯视', 'WORMS_EYE': '仰视', 'DUTCH': '平视'
};

const MOVEMENT_CODE_TO_CN: Record<string, string> = {
    'STATIC': '静止', 'PAN_L': '摇', 'PAN_R': '摇',
    'TILT_UP': '摇', 'TILT_DOWN': '摇',
    'DOLLY_IN': '推', 'DOLLY_OUT': '拉',
    'TRACK_L': '移', 'TRACK_R': '移',
    'CRANE_UP': '升降', 'CRANE_DOWN': '升降',
    'ZOOM_IN': '推', 'ZOOM_OUT': '拉',
    'HANDHELD': '移', 'STEADICAM': '移',
    'FOLLOW': '跟', 'ARC': '环绕', 'WHIP': '摇'
};

/**
 * 从剧本提取分镜（专业版）
 */
export async function extractStoryboard(
    scenes: ScriptScene[],
    characters: Character[] = [],
    assetsScenes: Scene[] = [],
    densityMode: 'compact' | 'standard' | 'detailed' = 'standard',
    directorStyle?: DirectorStyle
): Promise<StoryboardPanel[]> {
    // 场景数量限制检查
    const MAX_SCENES_FOR_AI = 15;
    if (scenes.length > MAX_SCENES_FOR_AI) {
        devLog(`[extractStoryboard] 场景数量 ${scenes.length} 超过限制 ${MAX_SCENES_FOR_AI}，直接使用智能 Fallback`);
        return generateFallbackPanels(scenes, characters, assetsScenes, densityMode, directorStyle);
    }

    // 构建场景数据
    const scenesData = scenes.map((s) => ({
        id: s.id,
        sceneNumber: s.sceneNumber,
        location: s.location,
        timeOfDay: s.timeOfDay,
        sceneType: s.sceneType,
        action: s.action,
        characters: s.characters,
        dialogues: s.dialogues?.map(d => ({
            character: d.character,
            lines: d.lines?.substring(0, 500)
        })),
        beat: s.beat,
        specialSceneType: s.specialSceneType
    }));

    const characterContext = characters.map(c => `- ${c.name}: ${c.appearance || c.description}`).join('\n');
    const sceneContext = assetsScenes.map(s => `- ${s.name}: ${s.environment || s.description}`).join('\n');

    const densityPrompt = DENSITY_CONFIG[densityMode as DensityMode]?.promptDescription
        || DENSITY_CONFIG.standard.promptDescription;

    const config = DENSITY_CONFIG[densityMode as DensityMode] || DENSITY_CONFIG.standard;
    let estimatedTotal = 0;
    scenes.forEach(scene => {
        const dialogueCount = scene.dialogues?.length || 0;
        const actionLength = (scene.action || '').length;
        estimatedTotal += config.basePerScene + Math.ceil(dialogueCount * config.panelsPerDialogue) + Math.ceil(actionLength / config.actionCharsPerPanel);
    });

    const prompt = `你是专业分镜设计师兼音效设计师，将剧本场景逐帧转换为精确的漫画分镜。

【⚠️ 核心约束 - 必须严格遵守】
1. **预估分镜数量：约 ${estimatedTotal} 个**，请确保生成数量接近此目标
2. **🔴 每句对话必须生成独立分镜**：一句对白 = 一个分镜，不可合并！
3. **每个场景开头必须有建立镜头**（远景/全景）
4. **长动作描写（>50字）必须拆分为多个动作镜头**

【密度要求】
${densityPrompt}

【角色与环境参考】
${characterContext ? `角色描述：\n${characterContext}\n` : ''}
${sceneContext ? `环境描述：\n${sceneContext}\n` : ''}
${directorStyle ? `导演风格：${directorStyle.artStyle || ''}, 氛围: ${directorStyle.mood || ''}\n` : ''}

【景别代码】ECU(大特写)/CU(特写)/MCU(近景)/MS(中景)/MWS(中全景)/WS(远景)/EWS(大远景)/POV(主观)/OTS(过肩)
【角度代码】EYE_LEVEL(平视)/HIGH(俯视)/LOW(仰视)/DUTCH(倾斜)
【运动代码】STATIC(静止)/PAN_L(左摇)/PAN_R(右摇)/DOLLY_IN(推)/DOLLY_OUT(拉)/TRACK_L(左移)/TRACK_R(右移)/FOLLOW(跟随)

【JSON 格式】
[{"sceneId":"场景ID","description":"画面描述（含光影）","shotSize":"MS","angle":"EYE_LEVEL","movementType":"STATIC","duration":3,"characters":["角色名"],"dialogue":"完整对白（如有）","soundEffects":["具体音效"],"music":"背景音乐","startFrame":"起始帧画面","endFrame":"结束帧画面","composition":"构图方式","shotIntent":"镜头意图","axisNote":"轴线备注","environmentMotion":"环境动态","characterActions":["角色名:动作"]}]

【剧本场景】
${JSON.stringify(scenesData)}
`;

    try {
        const result = await callWithRetry(
            () => callDeepSeek([{ role: 'user', content: prompt }]),
            3,
            1000
        );
        let shots = parseJSON(result);

        if (!shots) shots = [];
        if (!Array.isArray(shots)) {
            if (shots.panels) shots = shots.panels;
            else if (shots.shots) shots = shots.shots;
            else if (shots.storyboard) shots = shots.storyboard;
            else shots = [];
        }

        if (shots.length === 0) {
            console.warn('extractStoryboard: no shots extracted, using smart fallback');
            return generateFallbackPanels(scenes, characters, assetsScenes, densityMode, directorStyle);
        }

        // 映射回 StoryboardPanel 结构
        const allPanels = shots.map((shot: any, index: number) => {
            const matchedScene = scenes.find(s => s.id === shot.sceneId) || scenes[Math.floor(index / 3)];
            const rawShotSize = shot.shotSize || shot.shot || 'MS';
            const rawAngle = shot.angle || 'EYE_LEVEL';
            const rawMovement = shot.movementType || shot.cameraMovement || 'STATIC';

            return {
                id: generateId(),
                panelNumber: index + 1,
                sceneId: matchedScene?.id || generateId(),
                episodeNumber: matchedScene?.episodeNumber || 1,
                description: shot.description || '',
                dialogue: shot.dialogue || '',
                shot: SHOT_CODE_TO_CN[rawShotSize] || '中景',
                angle: ANGLE_CODE_TO_CN[rawAngle] || '平视',
                cameraMovement: MOVEMENT_CODE_TO_CN[rawMovement] || '静止',
                shotSize: rawShotSize,
                cameraAngle: rawAngle,
                movementType: rawMovement,
                duration: shot.duration || 4,
                characters: shot.characters || matchedScene?.characters || [],
                props: shot.props || [],
                notes: shot.notes || '',
                composition: shot.composition,
                shotIntent: shot.shotIntent,
                focusPoint: shot.focusPoint,
                axisNote: shot.axisNote,
                soundEffects: shot.soundEffects || [],
                transition: shot.transition || '切至',
                music: shot.music || '',
                startFrame: shot.startFrame || '',
                endFrame: shot.endFrame || '',
                motionSpeed: shot.motionSpeed || 'normal',
                environmentMotion: shot.environmentMotion || '',
                characterActions: shot.characterActions || [],
                keyFrames: [],
                _matchedScene: matchedScene
            };
        });

        // 应用智能填充
        const processedPanels = allPanels.map((panelData: any, index: number) => {
            const matchedScene = panelData._matchedScene;
            delete panelData._matchedScene;

            const prevPanel = index > 0 ? allPanels[index - 1] : undefined;
            const nextPanel = index < allPanels.length - 1 ? allPanels[index + 1] : undefined;

            const filledPanel = smartFillPanel(panelData, matchedScene, prevPanel, nextPanel, allPanels);
            const imagePrompt = generateStoryboardImagePrompt(filledPanel as StoryboardPanel, characters, assetsScenes, directorStyle);
            const videoPrompt = generateStoryboardVideoPrompt(filledPanel as StoryboardPanel, characters, assetsScenes, directorStyle, prevPanel);

            const unknownChars = checkCharacterConsistency(filledPanel.characters || [], characters);
            if (unknownChars.length > 0) {
                console.warn(`[分镜${index + 1}] ⚠️ 未知角色: ${unknownChars.join(', ')}`);
                filledPanel.notes = `${filledPanel.notes || ''} [警告: 未知角色 ${unknownChars.join(', ')}]`.trim();
            }

            filledPanel.aiPrompt = imagePrompt;
            filledPanel.aiVideoPrompt = videoPrompt;

            return filledPanel;
        });

        // 场景覆盖验证
        const coveredSceneIds = new Set(processedPanels.map((p: any) => p.sceneId));
        const missingScenes = scenes.filter(s => !coveredSceneIds.has(s.id));

        if (missingScenes.length > 0) {
            console.warn(`[extractStoryboard] ⚠️ AI 遗漏了 ${missingScenes.length} 个场景，使用 Fallback 补充`);

            let panelNumber = processedPanels.length + 1;
            const configForFallback = DENSITY_CONFIG[densityMode as DensityMode] || DENSITY_CONFIG.standard;

            missingScenes.forEach(scene => {
                const establishingPanel = {
                    id: generateId(),
                    panelNumber: panelNumber++,
                    sceneId: scene.id,
                    episodeNumber: scene.episodeNumber,
                    description: `${scene.location || '场景'}，${scene.timeOfDay || '日'}。${(scene.action || '').substring(0, 80)}`,
                    shot: '远景',
                    angle: '平视',
                    cameraMovement: '静止',
                    duration: 4,
                    characters: scene.characters || [],
                    dialogue: '',
                    props: [],
                    notes: '建立场景（AI遗漏补充）',
                    aiPrompt: '',
                    aiVideoPrompt: '',
                    soundEffects: [],
                    music: '',
                    startFrame: '',
                    endFrame: '',
                    composition: '三分法',
                    shotIntent: '建立空间'
                };

                const filledEstablishing = smartFillPanel(establishingPanel, scene, undefined, undefined, processedPanels);
                filledEstablishing.aiPrompt = generateStoryboardImagePrompt(filledEstablishing as StoryboardPanel, characters, assetsScenes, directorStyle);
                filledEstablishing.aiVideoPrompt = generateStoryboardVideoPrompt(filledEstablishing as StoryboardPanel, characters, assetsScenes, directorStyle, undefined);
                processedPanels.push(filledEstablishing);

                // 对话分镜
                if (scene.dialogues && scene.dialogues.length > 0) {
                    scene.dialogues.forEach((dialogue, idx) => {
                        const dialoguePanel = {
                            id: generateId(),
                            panelNumber: panelNumber++,
                            sceneId: scene.id,
                            episodeNumber: scene.episodeNumber,
                            description: `${idx === 0 ? '近景' : '特写'}，${dialogue.character}说话，表情变化`,
                            shot: idx === 0 ? '近景' : '特写',
                            angle: '平视',
                            cameraMovement: '静止',
                            duration: Math.max(2, Math.ceil((dialogue.lines || '').length / 20)),
                            characters: [dialogue.character],
                            dialogue: dialogue.lines || '',
                            props: [],
                            notes: `对话 ${idx + 1}（AI遗漏补充）`,
                            aiPrompt: '',
                            aiVideoPrompt: '',
                            soundEffects: [],
                            music: '',
                            startFrame: '',
                            endFrame: '',
                            composition: '三分法',
                            shotIntent: '展示情绪'
                        };

                        const filledDialogue = smartFillPanel(dialoguePanel, scene, undefined, undefined, processedPanels);
                        filledDialogue.aiPrompt = generateStoryboardImagePrompt(filledDialogue as StoryboardPanel, characters, assetsScenes, directorStyle);
                        filledDialogue.aiVideoPrompt = generateStoryboardVideoPrompt(filledDialogue as StoryboardPanel, characters, assetsScenes, directorStyle, undefined);
                        processedPanels.push(filledDialogue);
                    });
                }

                // 动作分镜
                const actionLength = (scene.action || '').length;
                if (actionLength > configForFallback.actionCharsPerPanel / 2) {
                    const actionParts = Math.ceil(actionLength / configForFallback.actionCharsPerPanel);
                    for (let i = 0; i < Math.min(actionParts, 3); i++) {
                        const actionText = (scene.action || '').substring(i * configForFallback.actionCharsPerPanel, (i + 1) * configForFallback.actionCharsPerPanel);
                        if (actionText.trim()) {
                            const actionPanel = {
                                id: generateId(),
                                panelNumber: panelNumber++,
                                sceneId: scene.id,
                                episodeNumber: scene.episodeNumber,
                                description: `中景，${actionText}`,
                                shot: '中景',
                                angle: '平视',
                                cameraMovement: i === 0 ? '静止' : '跟',
                                duration: 3,
                                characters: scene.characters || [],
                                dialogue: '',
                                props: [],
                                notes: '动作描写（AI遗漏补充）',
                                aiPrompt: '',
                                aiVideoPrompt: '',
                                soundEffects: [],
                                music: '',
                                startFrame: '',
                                endFrame: ''
                            };

                            const filledAction = smartFillPanel(actionPanel, scene, undefined, undefined, processedPanels);
                            filledAction.aiPrompt = generateStoryboardImagePrompt(filledAction as StoryboardPanel, characters, assetsScenes, directorStyle);
                            filledAction.aiVideoPrompt = generateStoryboardVideoPrompt(filledAction as StoryboardPanel, characters, assetsScenes, directorStyle, undefined);
                            processedPanels.push(filledAction);
                        }
                    }
                }
            });

            console.log(`[extractStoryboard] ✅ 场景覆盖补充完成，共 ${processedPanels.length} 个分镜`);
        }

        return processedPanels;
    } catch (error) {
        console.error('DeepSeek extractStoryboard failed:', error);
        throw new Error('AI 分镜生成失败');
    }
}
