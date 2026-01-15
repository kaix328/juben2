/**
 * 资产提取模块
 * 从 aiService.ts 拆分
 */
import type { DirectorStyle, Character, Scene, Prop, Costume } from '../../types';
import { generateId } from '../storage';
import { callDeepSeek, parseJSON } from '../volcApi';
import { PromptEngine } from '../promptEngine';

export interface ExtractedAssets {
    characters: any[];
    scenes: any[];
    props: any[];
    costumes: any[];
}

/**
 * 从剧本中提取资产（角色、场景、道具、服装）
 */
export async function extractAssets(
    originalText: string,
    scenesCount: any[],
    directorStyle?: DirectorStyle
): Promise<ExtractedAssets> {
    const characterNames = new Set<string>();
    scenesCount.forEach((scene: any) => {
        if (scene.characters && Array.isArray(scene.characters)) {
            scene.characters.forEach((name: string) => characterNames.add(name));
        }
        scene.dialogues?.forEach((d: any) => characterNames.add(d.character));
    });

    // 初始化提示词引擎
    const engine = new PromptEngine(directorStyle, { includeNegative: false });

    // 故事文本截取长度
    const contextText = originalText.substring(0, 15000);

    const prompt = `你是一位拥有15年经验的资深影视美术总监，曾参与多部大型电影和电视剧的前期视觉开发。

【任务】分析以下故事文本，提取所有视觉资产，为后续的美术制作和AI图像生成提供详尽的参考资料。

【角色提取要求】
- 名字：角色全名或昵称
- 年龄段：如"20多岁"、"中年"、"老年"
- 体型：如"高大魁梧"、"纤细娇小"、"中等身材"
- 发型发色：具体描述，如"黑色长发披肩"、"银白短发"
- 五官特征：眼睛、鼻子、嘴唇的特点
- 标志性特点：疤痕、胎记、配饰等独特识别特征
- 性格：简短性格描述

【场景提取要求】
- 地点名称：场景的名称
- 空间类型：室内/室外/半开放
- 光线条件：自然光/人工光/混合光，以及光线氛围（明亮/昏暗/戏剧性）
- 时代特征：古代/近代/现代/未来
- 氛围描述：情感氛围，如"阴森压抑"、"温馨舒适"
- 关键物件：场景中的重要道具和陈设

【道具提取要求】
- 名称：道具名称
- 类别：武器/日用品/交通工具/食物/文件/珠宝/其他
- 材质：如"青铜"、"木质"、"玻璃"
- 时代特征：与故事背景匹配
- 功能/意义：在剧情中的作用

【服装提取要求】
- 归属角色：穿戴这套服装的角色名
- 服装名称：如"婚纱"、"铠甲"、"校服"
- 款式描述：剪裁、版型
- 颜色：主色调和配色
- 材质：如"丝绸"、"皮革"、"棉麻"
- 风格：如"华丽宫廷风"、"简约现代风"

请严格按照以下 JSON 对象格式返回，不要包含 Markdown 标记：
{
  "characters": [{ "name": "角色名", "age": "年龄段", "bodyType": "体型描述", "hair": "发型发色", "facialFeatures": "五官特征", "appearance": "完整外貌描述", "distinguishingFeatures": "标志性特点", "personality": "性格描述" }],
  "scenes": [{ "name": "场景名称", "location": "具体地点", "spaceType": "室内/室外", "lighting": "光线条件", "era": "时代特征", "atmosphere": "氛围描述", "environment": "完整环境描述", "keyObjects": ["物件1"] }],
  "props": [{ "name": "道具名称", "category": "类别", "material": "材质", "era": "时代特征", "description": "详细描述", "significance": "剧情意义" }],
  "costumes": [{ "characterName": "角色名", "name": "服装名称", "style": "款式", "color": "颜色", "material": "材质", "description": "服装描述" }]
}

已知角色名单（请优先使用这些名字）：${Array.from(characterNames).join('、') || '待提取'}

故事文本：
${contextText}
`;

    try {
        const result = await callDeepSeek([{ role: 'user', content: prompt }]);
        let data = parseJSON(result);

        // 自适应数据结构
        if (Array.isArray(data)) {
            console.log('extractAssets: AI 返回了数组结构，正在尝试自动归类...');
            const reconstructed: any = { characters: [], scenes: [], props: [], costumes: [] };
            data.forEach((item: any) => {
                if (item.age || item.hair || item.facialFeatures) reconstructed.characters.push(item);
                else if (item.lighting || item.spaceType || item.atmosphere) reconstructed.scenes.push(item);
                else if (item.material && item.characterName) reconstructed.costumes.push(item);
                else if (item.material || item.category) reconstructed.props.push(item);
            });
            data = reconstructed;
        }

        // 构建角色名到ID的映射
        const characterIdMap = new Map<string, string>();
        const characterNamesExtracted = new Set<string>();

        const characters = (data.characters || []).map((c: any) => {
            const id = generateId();
            characterIdMap.set(c.name, id);
            characterNamesExtracted.add(c.name);

            const namePinyin = c.name.split('').map((char: string) => char.charCodeAt(0) > 255 ? 'c' : char.toLowerCase()).join('').substring(0, 8);
            const triggerWord = `char_${namePinyin}_${id.slice(-4)}`;

            const standardParts: string[] = [];
            if (c.age) standardParts.push(c.age);
            if (c.bodyType) standardParts.push(c.bodyType);
            if (c.hair) standardParts.push(c.hair);
            if (c.facialFeatures) standardParts.push(c.facialFeatures);
            const standardAppearance = standardParts.join(', ');

            const charObj = {
                id,
                name: c.name,
                description: c.description || `${c.age || ''} ${c.bodyType || ''} ${c.facialFeatures || ''}`.trim(),
                appearance: c.appearance || `${c.hair || ''}, ${c.facialFeatures || ''}, ${c.bodyType || ''}, ${c.distinguishingFeatures || ''}`.trim(),
                personality: c.personality,
                avatar: '',
                triggerWord,
                standardAppearance,
                fullBodyPrompt: '',
                facePrompt: ''
            };

            // 预填绘图提示词
            const fullBody = engine.forCharacterFullBody(charObj as any);
            const face = engine.forCharacterFace(charObj as any);
            charObj.fullBodyPrompt = fullBody.positive;
            charObj.facePrompt = face.positive;

            return charObj;
        });

        // 角色兜底
        characterNames.forEach(name => {
            if (!characterNamesExtracted.has(name)) {
                const id = generateId();
                characterIdMap.set(name, id);
                characters.push({
                    id,
                    name,
                    description: '从剧本自动识别的角色',
                    appearance: '待进一步详细描述',
                    personality: '待设定',
                    avatar: '',
                    triggerWord: `char_gen_${id.slice(-4)}`,
                    standardAppearance: '默认外貌'
                });
            }
        });

        return {
            characters,
            scenes: (data.scenes || []).map((s: any) => {
                const id = generateId();
                const sceneObj = {
                    id,
                    name: s.name,
                    description: s.description || s.environment,
                    location: s.location || s.name,
                    environment: s.environment || `${s.spaceType || ''}, ${s.lighting || ''}, ${s.atmosphere || ''}, ${s.era || ''}`.trim(),
                    image: '',
                    widePrompt: '',
                    mediumPrompt: '',
                    closeupPrompt: ''
                };

                sceneObj.widePrompt = engine.forSceneWide(sceneObj as any).positive;
                sceneObj.mediumPrompt = engine.forSceneMedium(sceneObj as any).positive;
                sceneObj.closeupPrompt = engine.forSceneCloseup(sceneObj as any).positive;

                return sceneObj;
            }),
            props: (data.props || []).map((p: any) => {
                const id = generateId();
                const propObj = {
                    id,
                    name: p.name,
                    description: p.description || `${p.material || ''} ${p.name}, ${p.significance || ''}`.trim(),
                    category: p.category,
                    image: '',
                    aiPrompt: ''
                };

                propObj.aiPrompt = engine.forProp(propObj as any).positive;

                return propObj;
            }),
            costumes: (data.costumes || []).map((c: any) => {
                const id = generateId();
                const charId = characterIdMap.get(c.characterName) || generateId();
                const character = characters.find((char: any) => char.id === charId);

                const costumeObj = {
                    id,
                    characterId: charId,
                    characterName: c.characterName,
                    name: c.name,
                    description: c.description || `${c.style || ''}, ${c.color || ''}, ${c.material || ''}`.trim(),
                    style: c.style || '默认',
                    image: '',
                    aiPrompt: ''
                };

                costumeObj.aiPrompt = engine.forCostume(costumeObj as any, character as any).positive;

                return costumeObj;
            })
        };
    } catch (error) {
        console.error('DeepSeek extractAssets failed:', error);
        const fallbackCharacters = Array.from(characterNames).map(name => {
            const id = generateId();
            return {
                id,
                name,
                description: '从剧本自动识别的角色(提取失败回退)',
                appearance: '待设定',
                personality: '待设定',
                avatar: '',
                triggerWord: `char_fb_${id.slice(-4)}`,
                standardAppearance: '默认外貌'
            };
        });
        return { characters: fallbackCharacters, scenes: [], props: [], costumes: [] };
    }
}
