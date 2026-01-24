/**
 * 资产提取模块 - 优化版
 * 从 aiService.ts 拆分，增强了数据分类和错误处理
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
 * 优化版：增强了数据分类逻辑，即使 JSON 不完整也能正确识别
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

    // 🆕 增加文本截取长度到 30000 字符
    const contextText = originalText.substring(0, 30000);

    // 🆕 优化 Prompt，要求 AI 返回严格的 JSON 格式，并确保字段名与类型定义一致
    const prompt = `你是一个专业的剧本分析助手。请严格按照以下 JSON Schema 提取信息，确保字段名完全一致。

**JSON Schema（必须严格遵守）：**
{
  "characters": [
    {
      "name": "角色名（必填）",
      "gender": "性别（男/女/其他，选填）",
      "age": "年龄（如：25岁，选填）",
      "height": "身高（如：180cm，选填）",
      "bodyType": "体型（如：健壮/纤瘦/匀称，选填）",
      "hairStyle": "发型（如：短发/长发/卷发，选填）",
      "hairColor": "发色（如：黑色/棕色/金色，选填）",
      "facialFeatures": "五官特征（如：剑眉星目，选填）",
      "clothing": "典型服饰（如：黑色长袍，选填）",
      "accessories": "配饰（如：玉佩，选填）",
      "appearance": "完整外貌描述（必填）",
      "personality": "性格特征（必填）",
      "description": "角色综合描述（必填）"
    }
  ],
  "scenes": [
    {
      "name": "场景名（必填）",
      "location": "地点（必填）",
      "spaceType": "室内/室外（选填）",
      "lighting": "光线（如：明亮/昏暗，选填）",
      "era": "时代（如：现代/古代，选填）",
      "atmosphere": "氛围（如：紧张/温馨，选填）",
      "environment": "环境详细描述（必填）",
      "description": "场景综合描述（必填）"
    }
  ],
  "props": [
    {
      "name": "道具名（必填）",
      "category": "类别（如：武器/工具，选填）",
      "material": "材质（如：金属/木质，选填）",
      "description": "详细描述（必填）",
      "significance": "重要性（选填）"
    }
  ],
  "costumes": [
    {
      "characterName": "所属角色（必填）",
      "name": "服装名（必填）",
      "style": "款式（如：古装/现代，选填）",
      "color": "颜色（选填）",
      "material": "材质（选填）",
      "description": "详细描述（必填）"
    }
  ]
}

**重要规则：**
1. 必须返回纯 JSON，不要使用 Markdown 代码块
2. 字段名必须与 Schema 完全一致（如：hairStyle 而非 hair）
3. 选填字段如果没有信息，填空字符串 ""
4. 不要填写"不详"、"未提及"、"未知"等占位符
5. 字符串中不要包含换行符，用空格代替
6. 必须包含 characters、scenes、props、costumes 四个数组

**示例输出：**
{"characters":[{"name":"张三","gender":"男","age":"25岁","height":"180cm","bodyType":"健壮","hairStyle":"短发","hairColor":"黑色","facialFeatures":"剑眉星目","clothing":"黑色长袍","accessories":"玉佩","appearance":"25岁男性，身高180cm，健壮体型，黑色短发，剑眉星目，身穿黑色长袍，佩戴玉佩","personality":"沉稳冷静，武艺高强","description":"主角，江湖侠客"}],"scenes":[{"name":"客栈大堂","location":"江南某客栈","spaceType":"室内","lighting":"昏暗","era":"古代","atmosphere":"热闹","environment":"木质结构，红灯笼高挂，人声鼎沸","description":"江南某客栈的大堂，木质结构，红灯笼高挂，人声鼎沸"}],"props":[{"name":"长剑","category":"武器","material":"精钢","description":"三尺青锋，寒光闪烁","significance":"主角的随身武器"}],"costumes":[{"characterName":"张三","name":"黑色长袍","style":"古装","color":"黑色","material":"丝绸","description":"黑色丝绸长袍，绣有暗纹"}]}

已知角色：${Array.from(characterNames).join('、') || '待提取'}

文本内容：
${contextText}

请严格按照 Schema 返回完整的 JSON 对象。`;

    try {
        // 🆕 增加 maxTokens 到 16384，确保长文本的 JSON 输出不被截断
        // 🔧 降低 temperature 到 0.1，让输出更稳定、更结构化
        const result = await callDeepSeek([{ role: 'user', content: prompt }], 0.1, 16384);
        let data = parseJSON(result);

        console.log('🔍 [extractAssets] 原始解析结果类型:', Array.isArray(data) ? 'Array' : typeof data);
        console.log('🔍 [extractAssets] 原始数据:', data);

        // 🆕 自适应数据结构 - 增强版
        if (Array.isArray(data)) {
            console.log('📦 [extractAssets] AI 返回了数组结构，正在尝试自动归类...');
            const reconstructed: any = { characters: [], scenes: [], props: [], costumes: [] };

            data.forEach((item: any, index: number) => {
                console.log(`  - 项目 ${index + 1}:`, item);

                if (!item || !item.name) {
                    console.log(`    ⚠️ 跳过无效项目`);
                    return;
                }

                // 更智能的分类逻辑
                // 角色识别：有 age, hair, facialFeatures, personality, appearance 等字段
                if (item.age || item.hair || item.facialFeatures || item.personality || item.appearance || item.gender) {
                    console.log(`    ✅ 识别为角色: ${item.name}`);
                    reconstructed.characters.push(item);
                }
                // 场景识别：有 location, spaceType, lighting, atmosphere, environment 等字段
                else if (item.location || item.spaceType || item.lighting || item.atmosphere || item.environment) {
                    console.log(`    ✅ 识别为场景: ${item.name}`);
                    reconstructed.scenes.push(item);
                }
                // 服装识别：有 characterName 字段
                else if (item.characterName || (item.material && item.style && item.color)) {
                    console.log(`    ✅ 识别为服装: ${item.name}`);
                    reconstructed.costumes.push(item);
                }
                // 道具识别：有 category, material, significance 等字段
                else if (item.category || item.significance || (item.material && !item.style)) {
                    console.log(`    ✅ 识别为道具: ${item.name}`);
                    reconstructed.props.push(item);
                }
                // 无法明确分类，根据描述和名称推断
                else {
                    console.log(`    ⚠️ 无法明确分类，根据内容推断: ${item.name}`);
                    const desc = (item.description || '').toLowerCase();
                    const name = (item.name || '').toLowerCase();

                    // 场景关键词
                    if (desc.includes('室内') || desc.includes('室外') || desc.includes('场景') ||
                        desc.includes('大厅') || desc.includes('房间') || desc.includes('街道') ||
                        name.includes('场') || name.includes('室') || name.includes('厅')) {
                        console.log(`      → 推断为场景`);
                        reconstructed.scenes.push(item);
                    }
                    // 道具关键词
                    else if (desc.includes('武器') || desc.includes('道具') || desc.includes('物品') ||
                        desc.includes('剑') || desc.includes('盒') || desc.includes('卷轴') ||
                        name.includes('剑') || name.includes('盒') || name.includes('卷')) {
                        console.log(`      → 推断为道具`);
                        reconstructed.props.push(item);
                    }
                    // 默认作为角色
                    else {
                        console.log(`      → 默认为角色`);
                        reconstructed.characters.push(item);
                    }
                }
            });

            console.log('📊 [extractAssets] 归类结果:', {
                characters: reconstructed.characters.length,
                scenes: reconstructed.scenes.length,
                props: reconstructed.props.length,
                costumes: reconstructed.costumes.length
            });

            data = reconstructed;
        }

        // 🆕 确保数据结构完整
        if (!data.characters) data.characters = [];
        if (!data.scenes) data.scenes = [];
        if (!data.props) data.props = [];
        if (!data.costumes) data.costumes = [];

        // 构建角色名到ID的映射
        const characterIdMap = new Map<string, string>();
        const characterNamesExtracted = new Set<string>();

        const characters = (data.characters || []).map((c: any) => {
            const id = generateId();

            // 🔧 清理名称：只保留第一个引号前的内容
            let cleanName = String(c.name || '未命名');
            const quoteIndex = cleanName.indexOf('"');
            if (quoteIndex > 0) {
                cleanName = cleanName.substring(0, quoteIndex).trim();
            }

            console.log('🧹 [清理名称] 原始:', c.name, '→ 清理后:', cleanName);

            characterIdMap.set(cleanName, id);
            characterNamesExtracted.add(cleanName);

            const namePinyin = cleanName.split('').map((char: string) => char.charCodeAt(0) > 255 ? 'c' : char.toLowerCase()).join('').substring(0, 8);
            const triggerWord = `char_${namePinyin}_${id.slice(-4)}`;

            // 🔧 过滤掉无效值（"不详"、"未提及"、空字符串）
            const isValidValue = (val: any) => {
                if (!val) return false;
                const str = String(val).trim();
                return str && str !== '不详' && str !== '未提及' && str !== '未知' && str !== 'N/A';
            };

            // 🔧 字段映射：支持旧字段名（hair）映射到新字段名（hairStyle）
            const hairStyle = c.hairStyle || c.hair || '';
            const hairColor = c.hairColor || '';

            const standardParts: string[] = [];
            if (isValidValue(c.gender)) standardParts.push(c.gender);
            if (isValidValue(c.age)) standardParts.push(c.age);
            if (isValidValue(c.height)) standardParts.push(c.height);
            if (isValidValue(c.bodyType)) standardParts.push(c.bodyType);
            if (isValidValue(hairStyle)) standardParts.push(hairStyle);
            if (isValidValue(hairColor)) standardParts.push(hairColor);
            if (isValidValue(c.facialFeatures)) standardParts.push(c.facialFeatures);
            if (isValidValue(c.clothing)) standardParts.push(c.clothing);
            const standardAppearance = standardParts.length > 0 ? standardParts.join(', ') : '';

            // 🔧 构建 description
            let description = '';
            if (isValidValue(c.description)) {
                description = c.description;
            } else {
                description = standardParts.join('，') || '待补充角色描述';
            }

            // 🔧 构建 appearance
            let appearance = '';
            if (isValidValue(c.appearance)) {
                appearance = c.appearance;
            } else {
                const appearParts: string[] = [];
                if (isValidValue(hairStyle)) appearParts.push(hairStyle);
                if (isValidValue(hairColor)) appearParts.push(hairColor);
                if (isValidValue(c.facialFeatures)) appearParts.push(c.facialFeatures);
                if (isValidValue(c.bodyType)) appearParts.push(c.bodyType);
                if (isValidValue(c.clothing)) appearParts.push(c.clothing);
                if (isValidValue(c.accessories)) appearParts.push(c.accessories);
                appearance = appearParts.length > 0 ? appearParts.join('，') : '待补充外貌特征';
            }

            const charObj = {
                id,
                name: cleanName,
                gender: isValidValue(c.gender) ? c.gender : '',
                age: isValidValue(c.age) ? c.age : '',
                height: isValidValue(c.height) ? c.height : '',
                bodyType: isValidValue(c.bodyType) ? c.bodyType : '',
                hairStyle: isValidValue(hairStyle) ? hairStyle : '',
                hairColor: isValidValue(hairColor) ? hairColor : '',
                clothing: isValidValue(c.clothing) ? c.clothing : '',
                accessories: isValidValue(c.accessories) ? c.accessories : '',
                description,
                appearance,
                personality: isValidValue(c.personality) ? c.personality : '待补充性格特征',
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

                // 🔧 清理场景名称
                let cleanSceneName = String(s.name || '未命名场景');
                const quoteIndex = cleanSceneName.indexOf('"');
                if (quoteIndex > 0) {
                    cleanSceneName = cleanSceneName.substring(0, quoteIndex).trim();
                }

                console.log('🧹 [清理场景名] 原始:', s.name, '→ 清理后:', cleanSceneName);

                const sceneObj = {
                    id,
                    name: cleanSceneName,
                    description: s.description || s.environment || s.environmentDescription,
                    location: s.location || cleanSceneName,
                    environment: s.environment || s.environmentDescription || `${s.spaceType || ''}, ${s.lighting || ''}, ${s.atmosphere || ''}, ${s.era || ''}`.trim(),
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

                // 🔧 清理道具名称
                let cleanPropName = String(p.name || '未命名道具');
                const quoteIndex = cleanPropName.indexOf('"');
                if (quoteIndex > 0) {
                    cleanPropName = cleanPropName.substring(0, quoteIndex).trim();
                }

                console.log('🧹 [清理道具名] 原始:', p.name, '→ 清理后:', cleanPropName);

                const propObj = {
                    id,
                    name: cleanPropName,
                    description: p.description || `${p.material || ''} ${cleanPropName}, ${p.significance || ''}`.trim(),
                    category: p.category,
                    image: '',
                    aiPrompt: ''
                };

                propObj.aiPrompt = engine.forProp(propObj as any).positive;

                return propObj;
            }),
            costumes: (data.costumes || []).map((c: any) => {
                const id = generateId();

                // 🔧 清理角色名和服装名
                let cleanCharName = String(c.characterName || '');
                let cleanCostumeName = String(c.name || '未命名服装');

                const charQuoteIndex = cleanCharName.indexOf('"');
                if (charQuoteIndex > 0) {
                    cleanCharName = cleanCharName.substring(0, charQuoteIndex).trim();
                }

                const costumeQuoteIndex = cleanCostumeName.indexOf('"');
                if (costumeQuoteIndex > 0) {
                    cleanCostumeName = cleanCostumeName.substring(0, costumeQuoteIndex).trim();
                }

                console.log('🧹 [清理服装] 角色:', c.characterName, '→', cleanCharName, '服装:', c.name, '→', cleanCostumeName);

                const charId = characterIdMap.get(cleanCharName) || generateId();
                const character = characters.find((char: any) => char.id === charId);

                const costumeObj = {
                    id,
                    characterId: charId,
                    characterName: cleanCharName,
                    name: cleanCostumeName,
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
        console.error('❌ [extractAssets] DeepSeek 提取失败:', error);
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
