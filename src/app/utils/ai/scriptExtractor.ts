/**
 * 剧本提取模块
 * 从 aiService.ts 拆分
 */
import type { ScriptScene, DirectorStyle, Dialogue } from '../../types';
import { generateId } from '../storage';
import { callDeepSeek, parseJSON } from '../volcApi';

// 剧本模式配置
export type ScriptMode = 'movie' | 'tv_drama' | 'short_video' | 'web_series';

const MODE_DESCRIPTIONS: Record<ScriptMode, string> = {
    movie: '电影剧本，标准三幕或四幕结构，场景较长，注重视觉叙事',
    tv_drama: '电视剧剧本，每集约45分钟，有明确的集数划分和幕间高潮',
    short_video: '短视频剧本，3分钟以内，节奏快，开场即高潮',
    web_series: '网络剧剧本，每集10-20分钟，注重悬念和钩子'
};

/**
 * 从原文提取剧本（专业版 - 支持导演风格）
 */
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

请严格按照以下 JSON 格式返回，不要包含 Markdown 格式标记：
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
        const result = await callDeepSeek([{ role: 'user', content: prompt }]);
        const scenes = parseJSON(result);

        // 补全 ID 等前端需要的字段
        return scenes.map((s: any, index: number) => ({
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
            action: s.action || '',
            beat: s.beat,
            dialogues: (s.dialogues || []).map((d: any) => ({
                id: generateId(),
                character: d.character,
                extension: d.extension,
                parenthetical: d.parenthetical,
                lines: d.lines,
                isFirstAppearance: d.isFirstAppearance || false,
                isContinued: d.isContinued || false,
                dual: d.dual
            })),
            transition: s.transition,
            estimatedDuration: s.estimatedDuration || 15,
            notes: s.notes
        }));
    } catch (error) {
        console.error('DeepSeek extractScript failed:', error);
        throw new Error('AI 剧本生成失败，请检查网络或 Key');
    }
}
