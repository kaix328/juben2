/**
 * 剧本提取模块
 * 从 aiService.ts 拆分
 */
import type { ScriptScene } from '../../types';
import { generateId } from '../storage';

import { callDeepSeek, parseJSON } from '../volcApi';
import { splitTextIntoChunks } from './utils';


// 剧本模式配置
export type ScriptMode = 'movie' | 'tv_drama' | 'short_video' | 'web_series';

const MODE_DESCRIPTIONS: Record<ScriptMode, string> = {
    movie: '电影剧本，标准三幕或四幕结构，场景较长，注重视觉叙事',
    tv_drama: '电视剧剧本，每集约45分钟，有明确的集数划分和幕间高潮',
    short_video: '短视频剧本，3分钟以内，节奏快，开场即高潮',
    web_series: '网络剧剧本，每集10-20分钟，注重悬念和钩子'
};

/**
 * 验证场景数据的完整性
 */
function validateScene(scene: any): boolean {
    return !!(
        scene &&
        typeof scene === 'object' &&
        scene.sceneNumber &&
        scene.location &&
        typeof scene.location === 'string' &&
        Array.isArray(scene.dialogues) &&
        scene.dialogues.every((d: any) =>
            d &&
            typeof d === 'object' &&
            d.character &&
            typeof d.character === 'string' &&
            d.lines !== undefined
        )
    );
}

/**
 * 验证所有场景数据
 */
function validateScenes(scenes: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(scenes)) {
        errors.push('返回数据不是数组');
        return { valid: false, errors };
    }

    if (scenes.length === 0) {
        errors.push('场景数组为空');
        return { valid: false, errors };
    }

    scenes.forEach((scene, index) => {
        if (!validateScene(scene)) {
            errors.push(`场景 ${index + 1} 数据不完整`);
        }

        // 检查对白数据
        if (Array.isArray(scene.dialogues)) {
            scene.dialogues.forEach((dialogue: any, dIndex: number) => {
                if (!dialogue.character) {
                    errors.push(`场景 ${index + 1} 对白 ${dIndex + 1} 缺少角色名`);
                }
                if (dialogue.lines === undefined || dialogue.lines === null) {
                    errors.push(`场景 ${index + 1} 对白 ${dIndex + 1} 缺少台词内容`);
                }
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * 修复不完整的场景数据
 */
function fixIncompleteScenes(scenes: any[]): any[] {
    return scenes.map((scene, index) => {
        const fixed = { ...scene };

        // 修复缺失的必需字段
        if (!fixed.sceneNumber) fixed.sceneNumber = index + 1;
        if (!fixed.location) fixed.location = '未知场景';
        if (!fixed.timeOfDay) fixed.timeOfDay = '白天';
        if (!fixed.sceneType) fixed.sceneType = 'INT';
        if (!Array.isArray(fixed.dialogues)) fixed.dialogues = [];
        if (!Array.isArray(fixed.characters)) fixed.characters = [];
        if (!fixed.action) fixed.action = '';

        // 修复对白数据
        fixed.dialogues = fixed.dialogues.map((d: any) => ({
            character: d.character || '未知角色',
            lines: d.lines || '',
            extension: d.extension,
            parenthetical: d.parenthetical,
            isFirstAppearance: d.isFirstAppearance || false,
            isContinued: d.isContinued || false,
        }));

        return fixed;
    });
}


/**
 * 去重场景（基于场景号和位置）
 */
function deduplicateScenes(scenes: ScriptScene[]): ScriptScene[] {
    const seen = new Set<string>();
    const unique: ScriptScene[] = [];

    for (const scene of scenes) {
        const key = `${scene.sceneNumber}-${scene.location}-${scene.timeOfDay}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(scene);
        }
    }

    // 重新编号
    return unique.map((scene, index) => ({
        ...scene,
        sceneNumber: index + 1,
    }));
}

/**
 * 清理剧本中的 AI 伪影
 */
function cleanScriptText(text: string): string {
    if (!text) return '';
    return text
        .replace(/isFirstAppearance\s*=\s*(true|false)/gi, '') // 移除 isFirstAppearance=true
        .replace(/isFirstAppearance\s*[:：]\s*(true|false)/gi, '') // 移除 isFirstAppearance:true
        .replace(/【.*?】/g, '') // 移除可能的标记
        .trim();
}

/**
 * 分段提取剧本生成器（支持暂停/恢复）
 */
export async function* extractScriptGenerator(
    originalText: string,
    mode: ScriptMode = 'tv_drama',
    directorStyle?: { artStyle?: string; mood?: string; customPrompt?: string },
    startIndex: number = 0
): AsyncGenerator<{ scenes: ScriptScene[]; chunkIndex: number; totalChunks: number }, void, boolean | void> {
    const MAX_CHUNK_SIZE = 8000;

    // 使用智能分块（基于场景）
    const chunks = splitTextIntoChunks(originalText, MAX_CHUNK_SIZE);

    console.log(`[scriptExtractor] Generator Start: Total ${chunks.length} chunks, starting from ${startIndex}`);

    for (let i = startIndex; i < chunks.length; i++) {
        console.log(`[scriptExtractor] Processing chunk ${i + 1}/${chunks.length}...`);

        try {
            const scenes = await extractScript(chunks[i], mode, directorStyle);

            // Yield results
            // Check if caller wants to stop (pass true to next()) - typical generator pattern involves checking yield return
            const shouldStop = yield { scenes, chunkIndex: i, totalChunks: chunks.length };

            if (shouldStop) {
                console.log('[scriptExtractor] Extraction stopped by user.');
                return;
            }

            // Rate limit
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error(`[scriptExtractor] Chunk ${i + 1} failed:`, error);
            // Optionally yield error status or empty scenes?
            // For now, let's just log and continue, or maybe re-throw?
            // Better to just continue for robustness, but maybe alert user?
            yield { scenes: [], chunkIndex: i, totalChunks: chunks.length };
        }
    }
}

/**
 * 分段提取剧本（旧版兼容接口）
 */
export async function extractScriptInChunks(
    originalText: string,
    mode: ScriptMode = 'tv_drama',
    directorStyle?: { artStyle?: string; mood?: string; customPrompt?: string },
    onProgress?: (current: number, total: number, message: string) => void
): Promise<ScriptScene[]> {
    const generator = extractScriptGenerator(originalText, mode, directorStyle, 0);
    const allScenes: ScriptScene[] = [];

    for await (const result of generator) {
        if (result.scenes.length > 0) {
            allScenes.push(...result.scenes);
        }
        if (onProgress) {
            onProgress(result.chunkIndex + 1, result.totalChunks, `正在提取第 ${result.chunkIndex + 1}/${result.totalChunks} 段...`);
        }
    }

    return deduplicateScenes(allScenes);
}
export async function extractScript(
    originalText: string,
    mode: ScriptMode = 'tv_drama',
    directorStyle?: { artStyle?: string; mood?: string; customPrompt?: string }
): Promise<ScriptScene[]> {
    const modeDesc = MODE_DESCRIPTIONS[mode];

    // 构建风格提示
    let styleHint = '';
    if (directorStyle) {
        const hints: string[] = [];
        if (directorStyle.artStyle) {
            if (directorStyle.artStyle.includes('赛博') || directorStyle.artStyle.includes('科幻')) {
                hints.push('对白风格：简洁干练，带有科技感和未来感');
            } else if (directorStyle.artStyle.includes('港片') || directorStyle.artStyle.includes('复古')) {
                hints.push('对白风格：干脆利落，经典港片风格，可适当使用经典台词结构');
            } else if (directorStyle.artStyle.includes('日系') || directorStyle.artStyle.includes('动画')) {
                hints.push('对白风格：情感细腻，可适当使用内心独白强化情感');
            }
        }
        if (directorStyle.mood) {
            hints.push(`整体氛围：${directorStyle.mood}`);
        }
        if (hints.length > 0) {
            styleHint = `\n\n【导演风格提示】\n${hints.join('\n')}`;
        }
    }

    const prompt = `你是一位拥有20年经验的专业编剧。请将以下文本改编为标准影视剧本格式。

【剧本类型】${modeDesc}${styleHint}

【输出规范】
1. 场景行格式：场景号. 内/外景. 地点 - 时间
2. 动作描述：现在时态，第三人称，简洁有力，视觉化表达
3. 角色首次出场：标记 isFirstAppearance=true，并提供简短外貌描述
4. 对白标记：
   - V.O. = 画外音（角色在画外说话）
   - O.S. = 场外音（角色在场景中但不在画面内）
   - CONT'D = 延续对白（同一角色连续说话被动作打断后继续）
5. 括号指示：仅用于必要的表演提示，如"（轻声地）"、"（怒视）"

【专业技巧】
- 每个场景应有明确的戏剧目的（推进剧情/揭示角色/制造冲突）
- 删除冗余的叙述性语言，只保留可视化内容
- 对白应自然、口语化，符合角色性格
- 适当添加转场指示（切至、淡出、溶至等）
- 估算每个场景的时长（秒）

【特殊场景类型】
- FLASHBACK: 闪回
- MONTAGE: 蒙太奇
- INSERT: 插入镜头
- INTERCUT: 交叉剪辑

【重要】请严格按照以下 JSON 格式返回：
- 必须返回有效的 JSON 数组
- 不要使用 Markdown 代码块包裹（不要用反引号包裹）
- 确保所有字符串值中的引号都被正确转义
- 确保所有对象都有完整的闭合括号
- 字符串中的换行请使用 \\n 转义

JSON 格式示例：
[
  {
    "sceneNumber": 1,
    "episodeNumber": 1,
    "location": "场景地点",
    "subLocation": "子场景（可选）",
    "timeOfDay": "白天/夜晚/黄昏/清晨",
    "sceneType": "INT/EXT",
    "continuity": "CONTINUOUS/LATER/SAME（可选）",
    "specialSceneType": "FLASHBACK/MONTAGE/INSERT（可选）",
    "action": "动作描述，现在时态，视觉化表达",
    "beat": "情绪节拍（可选，如：紧张升级、情感爆发）",
    "transition": "切至/淡出/溶至（可选）",
    "estimatedDuration": 30,
    "characters": ["角色A", "角色B"],
    "dialogues": [
      {
        "character": "角色A",
        "extension": "V.O./O.S.（可选）",
        "parenthetical": "表演提示（可选）",
        "lines": "台词内容",
        "isFirstAppearance": true/false,
        "isContinued": false
      }
    ],
    "notes": "编剧备注（可选）"
  }
]

文本内容：
${originalText.substring(0, 15000)}
`;

    try {
        console.log('[scriptExtractor] 开始调用 AI...');
        const result = await callDeepSeek([{ role: 'user', content: prompt }]);
        console.log('[scriptExtractor] AI 返回结果:', result?.substring(0, 500));

        let parsedData = parseJSON(result);

        // 兼容 parseJSON 可能返回 { scenes: [...] } 结构的情况
        let scenes: any[] = [];
        if (Array.isArray(parsedData)) {
            scenes = parsedData;
        } else if (parsedData && Array.isArray(parsedData.scenes)) {
            scenes = parsedData.scenes;
        } else {
            console.warn('[scriptExtractor] 无法从解析结果中提取场景数组:', parsedData);
            scenes = [];
        }

        console.log('[scriptExtractor] 解析后的场景数量:', scenes.length);

        if (scenes.length === 0) {
            console.error('[scriptExtractor] 解析结果为空！原始返回:', result);
            throw new Error('AI 返回的数据为空或格式错误');
        }

        // 🆕 验证数据完整性
        const validation = validateScenes(scenes);
        if (!validation.valid) {
            console.warn('[scriptExtractor] 数据验证失败:', validation.errors);
            console.log('[scriptExtractor] 尝试修复不完整的数据...');
        }

        // 🆕 修复不完整的数据
        const fixedScenes = fixIncompleteScenes(scenes);
        console.log('[scriptExtractor] 数据修复完成，场景数量:', fixedScenes.length);

        // 补全 ID 等前端需要的字段
        return fixedScenes.map((s: any, index: number) => ({
            id: generateId(),
            sceneNumber: s.sceneNumber || index + 1,
            episodeNumber: s.episodeNumber || 1,
            location: s.location || '未知场景',
            subLocation: s.subLocation,
            timeOfDay: s.timeOfDay || '白天',
            sceneType: s.sceneType || 'INT',
            continuity: s.continuity,
            specialSceneType: s.specialSceneType,
            dayNightNumber: s.dayNightNumber,
            characters: s.characters || [],
            action: cleanScriptText(s.action),
            beat: s.beat,
            dialogues: (s.dialogues || []).map((d: any) => ({
                id: generateId(),
                character: d.character,
                extension: d.extension,
                parenthetical: cleanScriptText(d.parenthetical),
                lines: cleanScriptText(d.lines),
                isFirstAppearance: d.isFirstAppearance || false,
                isContinued: d.isContinued || false,
                dual: d.dual
            })),
            transition: s.transition,
            estimatedDuration: s.estimatedDuration || 15,
            notes: cleanScriptText(s.notes)
        }));
    } catch (error) {
        console.error('DeepSeek extractScript failed:', error);
        throw new Error('AI 剧本生成失败，请检查网络或 Key');
    }
}
