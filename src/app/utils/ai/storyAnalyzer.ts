
/**
 * 故事五元素分析服务 - 完全重写版本
 * 确保所有返回值都是中文
 */

import type {
  StoryFiveElements,
  GenreAnalysis,
  Synopsis,
  CharacterBio,
  CharacterRelationship,
  PlotPoint,
  AnalysisRequest,
  AnalysisProgress,
  EmotionBeat,
  Theme,
  Symbol,
} from '../../types/story-analysis';
import { callDeepSeek } from '../volcApi';

import { generateId } from '../storage';
import { splitTextIntoChunks, splitScriptByScenes } from './utils';


type ProgressCallback = (progress: AnalysisProgress) => void;

/**
 * 超强容错的 JSON 解析器
 */
function safeParseJSON(text: string): any {
  console.log('[safeParseJSON] 开始解析，长度:', text.length);

  // 1. 清理文本
  let cleaned = text.trim();

  // 移除 Markdown 代码块
  cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // 替换中文标点
  cleaned = cleaned
    .replace(/"/g, '"').replace(/"/g, '"')
    .replace(/'/g, "'").replace(/'/g, "'")
    .replace(/，/g, ',')
    .replace(/：/g, ':');

  // 2. 尝试直接解析
  try {
    const result = JSON.parse(cleaned);
    console.log('[safeParseJSON] ✅ 解析成功');
    return result;
  } catch (e) {
    console.log('[safeParseJSON] ⚠️ 直接解析失败，尝试修复...');
  }

  // 3. 尝试提取 JSON 部分
  try {
    const startBrace = cleaned.indexOf('{');
    const startBracket = cleaned.indexOf('[');
    let start = -1;

    if (startBrace !== -1 && startBracket !== -1) {
      start = Math.min(startBrace, startBracket);
    } else if (startBrace !== -1) {
      start = startBrace;
    } else if (startBracket !== -1) {
      start = startBracket;
    }

    if (start !== -1) {
      cleaned = cleaned.substring(start);
      const endBrace = cleaned.lastIndexOf('}');
      const endBracket = cleaned.lastIndexOf(']');
      const end = Math.max(endBrace, endBracket);

      if (end !== -1) {
        cleaned = cleaned.substring(0, end + 1);
        const result = JSON.parse(cleaned);
        console.log('[safeParseJSON] ✅ 提取后解析成功');
        return result;
      }
    }
  } catch (e) {
    console.log('[safeParseJSON] ⚠️ 提取后解析失败');
  }

  // 4. 尝试修复常见错误
  try {
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    cleaned = cleaned.replace(/\n/g, ' ');
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

    const result = JSON.parse(cleaned);
    console.log('[safeParseJSON] ✅ 修复后解析成功');
    return result;
  } catch (e) {
    console.log('[safeParseJSON] ❌ 所有解析尝试失败');
  }

  return null;
}

/**
 * 故事五元素分析器
 */
export class StoryAnalyzer {
  private onProgress?: ProgressCallback;

  constructor(onProgress?: ProgressCallback) {
    this.onProgress = onProgress;
  }

  private updateProgress(progress: AnalysisProgress) {
    this.onProgress?.(progress);
  }

  /**
   * 完整分析
   */
  async analyzeAll(request: AnalysisRequest): Promise<StoryFiveElements> {
    const { projectId, chapterId, scriptContent } = request;

    try {
      console.log('🚀 [StoryAnalyzer] 开始五元素分析');

      // 1. 题材类型
      this.updateProgress({ step: 'genre', progress: 10, message: '分析题材类型...' });
      const genre = await this.analyzeGenre(scriptContent);
      console.log('✅ 题材分析完成:', genre);

      // 2. 故事梗概
      this.updateProgress({ step: 'synopsis', progress: 30, message: '生成故事梗概...' });
      const synopsis = await this.analyzeSynopsisMR(scriptContent);
      console.log('✅ 梗概分析完成:', synopsis.oneLine);

      // 3. 人物小传 (Map-Reduce)
      this.updateProgress({ step: 'characters', progress: 50, message: '全书扫描：分析人物小传...' });
      const characterBios = await this.analyzeCharactersMR(scriptContent, request.existingCharacters);
      console.log('✅ 人物分析完成，共', characterBios.length, '个');

      // 4. 人物关系 (Map-Reduce)
      this.updateProgress({ step: 'relationships', progress: 70, message: '全书扫描：分析人物关系...' });
      const relationships = await this.analyzeRelationshipsMR(scriptContent, characterBios);
      console.log('✅ 关系分析完成，共', relationships.length, '个');

      // 5. 大情节点
      this.updateProgress({ step: 'plotPoints', progress: 90, message: '梳理大情节点...' });
      const plotPoints = await this.analyzePlotPointsMR(scriptContent);

      console.log('✅ 情节分析完成，共', plotPoints.length, '个');

      // 6. 主题与意象
      this.updateProgress({ step: 'themes', progress: 95, message: '深度分析：主题与意象...' });
      const { themes, symbols } = await this.analyzeThemes(scriptContent);
      console.log('✅ 主题分析完成');

      this.updateProgress({ step: 'complete', progress: 100, message: '分析完成！' });

      const result: StoryFiveElements = {
        id: generateId(),
        projectId,
        chapterId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        genre,
        synopsis,
        characterBios,
        relationships,
        plotPoints,
        themes,
        symbols,
        analysisSource: 'ai',
        confidence: 85,
      };

      console.log('🎉 [StoryAnalyzer] 五元素分析全部完成！');
      return result;
    } catch (error) {
      console.error('❌ [StoryAnalyzer] 分析失败:', error);
      this.updateProgress({
        step: 'error',
        progress: 0,
        message: '分析失败: ' + (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 1. 分析题材类型 - 确保返回中文
   */
  async analyzeGenre(scriptContent: string): Promise<GenreAnalysis> {
    const prompt = `分析剧本题材类型，返回纯JSON（不要markdown标记）。

所有字段必须使用中文：
- era: 古代/现代/未来
- eraDetail: 详细时代描述（中文）
- style: 喜剧/悲剧/正剧/悬疑
- content: 数组，如["爱情","复仇","动作"]

JSON格式：
{"era":"古代","eraDetail":"古代背景","style":"正剧","content":["复仇","动作"],"coreConceptOneLine":"核心概念","creativeElements":["元素1"],"styleFeatures":["特点1"],"uniquePoints":["卖点1"]}

剧本：
${scriptContent.substring(0, 5000)}`;

    const response = await callDeepSeek([
      { role: 'system', content: '你是JSON生成器，只返回纯JSON，所有字段值必须使用中文。' },
      { role: 'user', content: prompt }
    ], 0.2, 4096);

    const parsed = safeParseJSON(response);

    return {
      era: parsed?.era || '现代',
      eraDetail: parsed?.eraDetail || '现代',
      style: parsed?.style || '正剧',
      content: Array.isArray(parsed?.content) ? parsed.content : ['成长'],
      coreConceptOneLine: parsed?.coreConceptOneLine || '待分析',
      creativeElements: Array.isArray(parsed?.creativeElements) ? parsed.creativeElements : [],
      styleFeatures: Array.isArray(parsed?.styleFeatures) ? parsed.styleFeatures : [],
      uniquePoints: Array.isArray(parsed?.uniquePoints) ? parsed.uniquePoints : [],
    };
  }

  /**
   * 2. 生成故事梗概 - 确保返回中文
   */
  async analyzeSynopsis(scriptContent: string): Promise<Synopsis> {
    const prompt = `生成剧本梗概，返回纯JSON（不要markdown标记）。

所有字段必须使用中文，不要使用英文引号包裹中文内容。

JSON格式：
{"oneLine":"一句话梗概","short":"简短梗概","full":"完整梗概","protagonist":"主角","goal":"目标","obstacle":"障碍","resolution":"解决方式","outcome":"结果"}

剧本：
${scriptContent.substring(0, 8000)}`;

    const response = await callDeepSeek([
      { role: 'system', content: '你是JSON生成器，只返回纯JSON，所有字段值必须使用中文。' },
      { role: 'user', content: prompt }
    ], 0.2, 8192);

    const parsed = safeParseJSON(response);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      console.warn('⚠️ 梗概解析失败');
      return {
        oneLine: '待分析',
        short: '待分析',
        full: '待分析',
        protagonist: '待分析',
        goal: '待分析',
        obstacle: '待分析',
        resolution: '待分析',
        outcome: '待分析',
      };
    }

    return {
      oneLine: parsed.oneLine || '待分析',
      short: parsed.short || '待分析',
      full: parsed.full || '待分析',
      protagonist: parsed.protagonist || '待分析',
      goal: parsed.goal || '待分析',
      obstacle: parsed.obstacle || '待分析',
      resolution: parsed.resolution || '待分析',
      outcome: parsed.outcome || '待分析',
    };
  }

  /**
   * 3. 分析人物小传
   */
  async analyzeCharacters(scriptContent: string, existingCharacters?: string[]): Promise<CharacterBio[]> {
    const hint = existingCharacters?.length ? `\n已知角色：${existingCharacters.join('、')}` : '';

    const prompt = `分析剧本主要角色（最多5个），返回纯JSON数组（不要markdown标记）。${hint}

JSON格式：
[{"name":"角色名","gender":"性别","age":"年龄","height":"身高","bodyType":"体型","identity":"身份","appearance":"外貌特征","hairStyle":"发型","hairColor":"发色","clothing":"服饰","accessories":"配饰","personality":["性格1"],"background":"背景","keyExperiences":["经历1"],"behaviorPattern":"行为模式","speechStyle":"语言风格","motivation":"动机","arc":{"start":"开始","change":"变化","end":"结束"},"isProtagonist":true}]

剧本：
${scriptContent.substring(0, 6000)}`;

    const response = await callDeepSeek([
      { role: 'system', content: '你是JSON生成器，只返回纯JSON数组，所有字段值必须使用中文。' },
      { role: 'user', content: prompt }
    ], 0.2, 12288);

    let parsed = safeParseJSON(response);

    if (parsed && !Array.isArray(parsed)) {
      parsed = parsed.characters || parsed.characterBios || [];
    }

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ 人物解析失败');
      return [];
    }

    return parsed.map((char: any, index: number) => ({
      id: generateId(),
      name: char.name || `角色${index + 1}`,
      gender: char.gender || '',
      age: char.age || '',
      height: char.height || '',
      bodyType: char.bodyType || '',
      identity: char.identity || '未知',
      appearance: char.appearance || '',
      hairStyle: char.hairStyle || '',
      hairColor: char.hairColor || '',
      clothing: char.clothing || '',
      accessories: char.accessories || '',
      personality: Array.isArray(char.personality) ? char.personality : [],
      background: char.background || '',
      keyExperiences: Array.isArray(char.keyExperiences) ? char.keyExperiences : [],
      behaviorPattern: char.behaviorPattern || '',
      speechStyle: char.speechStyle || '',
      motivation: char.motivation || '',
      arc: {
        start: char.arc?.start || '',
        change: char.arc?.change || '',
        end: char.arc?.end || '',
      },
      isProtagonist: char.isProtagonist || index === 0,
    }));
  }

  /**
   * 4. 分析人物关系
   */
  async analyzeRelationships(scriptContent: string, characters: CharacterBio[]): Promise<CharacterRelationship[]> {
    if (characters.length === 0) {
      return [];
    }

    const names = characters.map(c => c.name).join('、');

    const prompt = `分析角色关系，返回纯JSON数组（不要markdown标记）。

角色：${names}

JSON格式：
[{"fromCharacter":"角色A","toCharacter":"角色B","relationType":"enemy","relationLabel":"死敌","strength":"strong","tension":"conflict","description":"关系描述","development":"发展","isCore":true}]

类型：family/romance/friendship/rivalry/enemy/mentor/colleague/alliance/subordinate/other
强度：strong/medium/weak
张力：conflict/competition/complement/dependence/neutral

剧本：
${scriptContent.substring(0, 5000)}`;

    const response = await callDeepSeek([
      { role: 'system', content: '你是JSON生成器，只返回纯JSON数组。' },
      { role: 'user', content: prompt }
    ], 0.2, 8192);

    let parsed = safeParseJSON(response);

    if (parsed && !Array.isArray(parsed)) {
      parsed = parsed.relationships || [];
    }

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ 关系解析失败');
      return [];
    }

    return parsed.map((rel: any) => ({
      id: generateId(),
      fromCharacter: rel.fromCharacter || '',
      toCharacter: rel.toCharacter || '',
      relationType: rel.relationType || 'other',
      relationLabel: rel.relationLabel || '未知',
      strength: rel.strength || 'medium',
      tension: rel.tension || 'neutral',
      description: rel.description || '',
      development: rel.development || '',
      isCore: rel.isCore || false,
    }));
  }

  /**
   * 5. 梳理大情节点
   */
  async analyzePlotPoints(scriptContent: string): Promise<PlotPoint[]> {
    const prompt = `梳理主要情节点（8-12个），并尝试对应经典剧作结构节拍（如《救猫咪》）。

    返回纯JSON数组（不要markdown标记）：
    [
      {
        "order":1,
        "title":"情节点标题",
        "type":"setup",
        "stage":"early",
        "description":"描述",
        "characters":["角色1"],
        "consequence":"后果",
        "emotionalTone":"基调",
        "beat":"Inciting Incident"
      }
    ]

    beat (节拍): Opening Image, Theme Stated, Set-up, Catalyst (Inciting Incident), Debate, Break into Two, B Story, Fun and Games, Midpoint, Bad Guys Close In, All is Lost, Dark Night of the Soul, Break into Three, Finale, Final Image. 如果不确定，可填空字符串。

    类型：setup/development/turning/climax/resolution
    阶段：early/middle/late

    剧本：
    ${scriptContent.substring(0, 8000)}`;

    const response = await callDeepSeek([
      { role: 'system', content: '你是JSON生成器，只返回纯JSON数组。' },
      { role: 'user', content: prompt }
    ], 0.2, 8192);

    let parsed = safeParseJSON(response);

    if (parsed && !Array.isArray(parsed)) {
      parsed = parsed.plotPoints || [];
    }

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ 情节点解析失败');
      return [];
    }

    return parsed.map((point: any, index: number) => ({
      id: generateId(),
      order: point.order || index + 1,
      title: point.title || `情节点${index + 1}`,
      type: point.type || 'development',
      stage: point.stage || 'middle',
      description: point.description || '',
      characters: Array.isArray(point.characters) ? point.characters : [],
      consequence: point.consequence || '',
      emotionalTone: point.emotionalTone || '',
      beat: point.beat || '',
    }));
  }


  /**
   * 6. 分析情感节奏曲线
   */
  async analyzeEmotionCurve(scriptContent: string): Promise<EmotionBeat[]> {
    const contextLimit = 30000;
    const prompt = `分析剧本的场景情感节奏，返回纯JSON数组（不要markdown标记）。
请按场景顺序逐一分析每一个场景，不要遗漏。即使场景很短也要包含。
请确保数值有起伏变化，反映出故事的节奏感，不要全部返回相同的值。

JSON格式：
[{"sceneOrder":1,"sceneLocation":"场景地点","tension":5,"energy":5,"mood":"情感标签","description":"简短描述"}]

数值说明：
tension (紧张度): 0(平静) - 10(极度紧绷)
energy (能量值): 0(低沉/静止) - 10(爆发/激烈)

剧本：
${scriptContent.substring(0, contextLimit)}`;

    try {
      const response = await callDeepSeek([
        { role: 'system', content: '你是JSON生成器，只返回纯JSON数组。' },
        { role: 'user', content: prompt }
      ], 0.2, 8192);

      let parsed = safeParseJSON(response);

      if (parsed && !Array.isArray(parsed)) {
        parsed = parsed.beats || parsed.scenes || parsed.curve || [];
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        console.warn('⚠️ 情感曲线解析失败或为空，启用模拟生成');
        throw new Error('Parsed data is empty or invalid');
      }

      return parsed.map((beat: any, index: number) => ({
        sceneId: generateId(),
        sceneOrder: beat.sceneOrder || index + 1,
        sceneLocation: beat.sceneLocation || `场景${index + 1}`,
        tension: Number(beat.tension) || 5, // 确保转换为数字
        energy: Number(beat.energy) || 5,
        mood: beat.mood || '中性',
        description: beat.description || ''
      }));

    } catch (error) {
      console.error('情感分析失败，生成模拟数据:', error);

      // 模拟生成数据 (基于场景分割)
      const scenes = scriptContent.split(/第[一二三四五六七八九十0-9]+场/g).filter(s => s.trim().length > 10);
      const count = Math.max(scenes.length, 10);

      return Array.from({ length: count }).map((_, i) => {
        // 生成正弦波动的模拟数据
        const tension = 5 + Math.round(Math.sin(i * 0.5) * 3) + Math.round(Math.random() * 2);
        const energy = 5 + Math.round(Math.cos(i * 0.5) * 3) + Math.round(Math.random() * 2);

        return {
          sceneId: generateId(),
          sceneOrder: i + 1,
          sceneLocation: `场景${i + 1} (模拟)`,
          tension: Math.max(1, Math.min(10, tension)),
          energy: Math.max(1, Math.min(10, energy)),
          mood: '未分析',
          description: 'AI分析超时，使用模拟数据展示',
          isMock: true
        };
      });
    }
  }

  /**
   * 6b. 分析情感节奏曲线 - 智能 Map-Reduce 版
   * 用于处理超长剧本（超过 contextLimit）
   */
  async analyzeEmotionCurveMR(scriptContent: string): Promise<EmotionBeat[]> {
    const MAX_CHUNK_SIZE = 10000;

    // 如果剧本较短，直接分析
    if (scriptContent.length <= MAX_CHUNK_SIZE) {
      return this.analyzeEmotionCurve(scriptContent);
    }

    console.log(`[StoryAnalyzer] 剧本较长 (${scriptContent.length}字), 使用 Map-Reduce 分析情感曲线...`);

    // Map 阶段：分块分析
    const chunks = splitScriptByScenes(scriptContent, MAX_CHUNK_SIZE);
    const allBeats: EmotionBeat[] = [];
    let globalSceneOrder = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[StoryAnalyzer] Analyzing emotion chunk ${i + 1}/${chunks.length}...`);

      try {
        const chunkBeats = await this.analyzeEmotionCurve(chunk);

        // 调整场景序号，使其全局连续
        chunkBeats.forEach(beat => {
          globalSceneOrder++;
          beat.sceneOrder = globalSceneOrder;
        });

        allBeats.push(...chunkBeats);
      } catch (error) {
        console.warn(`[StoryAnalyzer] Chunk ${i + 1} 分析失败:`, error);
        // 继续处理下一个 chunk
      }
    }

    // 如果所有 chunk 都失败，返回模拟数据
    if (allBeats.length === 0) {
      console.warn('[StoryAnalyzer] 所有 chunk 分析失败，返回模拟数据');
      return this.generateMockEmotionBeats(scriptContent);
    }

    console.log(`[StoryAnalyzer] ✅ 情感曲线 Map-Reduce 完成，共 ${allBeats.length} 个节拍`);
    return allBeats;
  }

  /**
   * 生成模拟情感数据（fallback）
   */
  private generateMockEmotionBeats(scriptContent: string): EmotionBeat[] {
    const scenes = scriptContent.split(/第[一二三四五六七八九十0-9]+场/g).filter(s => s.trim().length > 10);
    const count = Math.max(scenes.length, 10);

    return Array.from({ length: count }).map((_, i) => {
      const tension = 5 + Math.round(Math.sin(i * 0.5) * 3) + Math.round(Math.random() * 2);
      const energy = 5 + Math.round(Math.cos(i * 0.5) * 3) + Math.round(Math.random() * 2);

      return {
        sceneId: generateId(),
        sceneOrder: i + 1,
        sceneLocation: `场景${i + 1} (模拟)`,
        tension: Math.max(1, Math.min(10, tension)),
        energy: Math.max(1, Math.min(10, energy)),
        mood: '未分析',
        description: 'AI分析超时，使用模拟数据展示',
        isMock: true
      };
    });
  }

  /**
   * 7. 分析主题与意象
   */
  async analyzeThemes(scriptContent: string): Promise<{ themes: Theme[], symbols: Symbol[] }> {
    const prompt = `分析剧本的核心主题（Themes）和关键意象/符号（Symbols/Motifs）。
    
    返回纯JSON对象（不要markdown标记）：
    {
      "themes": [
        {"name":"主题名","description":"描述","evidence":["体现1","体现2"]}
      ],
      "symbols": [
        {"name":"符号名","meaning":"象征意义","occurrences":["出现场景1"]}
      ]
    }
    
    剧本内容：
    ${scriptContent.substring(0, 15000)}`;

    try {
      const response = await callDeepSeek([
        { role: 'system', content: '你是JSON生成器' },
        { role: 'user', content: prompt }
      ], 0.2, 4096);

      const parsed = safeParseJSON(response);
      return {
        themes: Array.isArray(parsed?.themes) ? parsed.themes : [],
        symbols: Array.isArray(parsed?.symbols) ? parsed.symbols : []
      };
    } catch (e) {
      console.warn('主题分析失败', e);
      return { themes: [], symbols: [] };
    }
  }

  /* =========================================
   * Map-Reduce 增强版方法
   * ========================================= */

  /**
   * 2. 生成故事梗概 - 智能 Map-Reduce 版
   */
  async analyzeSynopsisMR(scriptContent: string): Promise<Synopsis> {
    const MAX_CHUNK_SIZE = 8000;

    // 如果剧本较短，直接分析
    if (scriptContent.length <= MAX_CHUNK_SIZE) {
      return this.analyzeSynopsisDirect(scriptContent);
    }

    // Map 阶段：分块摘要
    console.log(`[StoryAnalyzer] 剧本较长 (${scriptContent.length}字), 使用 Map-Reduce 分析梗概...`);
    const chunks = splitTextIntoChunks(scriptContent, 6000, 200);
    const chunkSummaries: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[StoryAnalyzer] Analyzing chunk ${i + 1}/${chunks.length}...`);

      const prompt = `请简要概括这段剧本内容（300字以内），保留核心情节和关键转折。
        
这段内容是全剧本的第 ${i + 1}/${chunks.length} 部分。

剧本片段：
${chunk.substring(0, 7000)}`;

      const summary = await callDeepSeek([
        { role: 'user', content: prompt }
      ], 0.2, 2048); // 快速模式

      chunkSummaries.push(`【第${i + 1}部分】：${summary}`);
    }

    // Reduce 阶段：汇总分析
    const combinedSummary = chunkSummaries.join('\n\n');
    console.log('[StoryAnalyzer] 汇总摘要完成，开始生成最终结果...');
    return this.analyzeSynopsisDirect(combinedSummary);
  }

  /**
   * 基础梗概分析（直接版）
   */
  private async analyzeSynopsisDirect(content: string): Promise<Synopsis> {
    const prompt = `生成剧本梗概，返回纯JSON（不要markdown标记）。

所有字段必须使用中文，不要使用英文引号包裹中文内容。

JSON格式：
{"oneLine":"一句话梗概","short":"简短梗概","full":"完整梗概","protagonist":"主角","goal":"目标","obstacle":"障碍","resolution":"解决方式","outcome":"结果"}

剧本/摘要内容：
${content.substring(0, 15000)}`;

    const response = await callDeepSeek([
      { role: 'system', content: '你是JSON生成器，只返回纯JSON，所有字段值必须使用中文。' },
      { role: 'user', content: prompt }
    ], 0.2, 8192);

    const parsed = safeParseJSON(response);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      console.warn('⚠️ 梗概解析失败');
      return {
        oneLine: '待分析',
        short: '待分析',
        full: '待分析',
        protagonist: '待分析',
        goal: '待分析',
        obstacle: '待分析',
        resolution: '待分析',
        outcome: '待分析',
      };
    }

    return {
      oneLine: parsed.oneLine || '待分析',
      short: parsed.short || '待分析',
      full: parsed.full || '待分析',
      protagonist: parsed.protagonist || '待分析',
      goal: parsed.goal || '待分析',
      obstacle: parsed.obstacle || '待分析',
      resolution: parsed.resolution || '待分析',
      outcome: parsed.outcome || '待分析',
    };
  }

  /**
   * 5. 梳理大情节点 - 智能 Map-Reduce 版
   */
  async analyzePlotPointsMR(scriptContent: string): Promise<PlotPoint[]> {
    const MAX_CHUNK_SIZE = 8000;

    if (scriptContent.length <= MAX_CHUNK_SIZE) {
      return this.analyzePlotPointsDirect(scriptContent);
    }

    // Map 阶段：分块提取事件流
    console.log(`[StoryAnalyzer] 剧本较长 (${scriptContent.length}字), 使用 Map-Reduce 分析情节点...`);
    const chunks = splitTextIntoChunks(scriptContent, 6000, 200);
    const eventStream: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const prompt = `提取这段剧本中的关键事件（Key Events），按发生顺序排列，简明扼要。
        
剧本片段 ${i + 1}/${chunks.length}：
${chunk.substring(0, 7000)}`;

      const events = await callDeepSeek([
        { role: 'user', content: prompt }
      ], 0.2, 2048);

      eventStream.push(`【片段 ${i + 1} 关键事件】：\n${events}`);
    }

    // Reduce 阶段：从完整事件流中提取大情节点
    const fullStream = eventStream.join('\n\n');
    console.log('[StoryAnalyzer] 事件流提取完成，开始梳理结构...');

    return this.analyzePlotPointsDirect(fullStream);
  }

  /**
   * 基础情节点分析（直接版）
   */
  private async analyzePlotPointsDirect(content: string): Promise<PlotPoint[]> {
    const prompt = `基于以下内容，梳理全剧的核心情节点（8-12个），确保覆盖开头、发展、高潮和结尾。返回纯JSON数组。

JSON格式：
[{"order":1,"title":"情节点标题","type":"setup","stage":"early","description":"描述","characters":["角色1"],"consequence":"后果","emotionalTone":"基调"}]

类型：setup/development/turning/climax/resolution
阶段：early/middle/late

内容：
${content.substring(0, 15000)}`;

    const response = await callDeepSeek([
      { role: 'system', content: '你是JSON生成器，只返回纯JSON数组。' },
      { role: 'user', content: prompt }
    ], 0.2, 8192);

    let parsed = safeParseJSON(response);

    if (parsed && !Array.isArray(parsed)) {
      parsed = parsed.plotPoints || [];
    }

    if (!Array.isArray(parsed)) {
      console.warn('⚠️ 情节点解析失败');
      return [];
    }

    return parsed.map((point: any, index: number) => ({
      id: generateId(),
      order: point.order || index + 1,
      title: point.title || `情节点${index + 1}`,
      type: point.type || 'development',
      stage: point.stage || 'middle',
      description: point.description || '',
      characters: Array.isArray(point.characters) ? point.characters : [],
      consequence: point.consequence || '',
      emotionalTone: point.emotionalTone || '',
    }));
  }
  /**
   * 3. 分析人物小传 - 智能 Map-Reduce 版
   */
  async analyzeCharactersMR(scriptContent: string, existingCharacters?: string[]): Promise<CharacterBio[]> {
    const MAX_CHUNK_SIZE = 8000;

    // 如果剧本较短，直接分析
    if (scriptContent.length <= MAX_CHUNK_SIZE) {
      return this.analyzeCharacters(scriptContent, existingCharacters);
    }

    console.log(`[StoryAnalyzer] 剧本较长 (${scriptContent.length}字), 使用 Map-Reduce 分析人物...`);

    // Map 阶段：分块提取角色
    const chunks = splitTextIntoChunks(scriptContent, 6000, 200);
    const chunkResults: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[StoryAnalyzer] Scanning characters in chunk ${i + 1}/${chunks.length}...`);

      const prompt = `扫描这段剧本，列出所有出现的"有名字的角色"。
        
        JSON格式：
        [{"name":"角色名","identity":"身份","isMajor":true/false,"actions":"本段简要行为"}]
        
        剧本片段：
        ${chunk.substring(0, 7000)}`;

      try {
        const response = await callDeepSeek([
          { role: 'user', content: prompt }
        ], 0.2, 2048); // Fast scan
        const result = safeParseJSON(response);
        if (Array.isArray(result)) {
          chunkResults.push(...result);
        }
      } catch (e) {
        console.warn(`Chunk ${i} character scan failed`, e);
      }
    }

    // Reduce 阶段：合并角色并生成完整小传
    console.log('[StoryAnalyzer] 汇总角色列表...');
    const uniqueChars: Record<string, { count: number, identities: Set<string>, actions: string[] }> = {};

    chunkResults.forEach(char => {
      if (!char || !char.name) return;
      const name = char.name.trim();

      if (!uniqueChars[name]) {
        uniqueChars[name] = { count: 0, identities: new Set(), actions: [] };
      }
      uniqueChars[name].count++;
      if (char.identity) uniqueChars[name].identities.add(char.identity);
      if (char.actions) uniqueChars[name].actions.push(char.actions);
    });

    // 筛选主要角色 (取前 8 个)
    const sortedChars = Object.entries(uniqueChars)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 8)
      .map(([name]) => name);

    console.log('[StoryAnalyzer] 生成主要角色详细小传:', sortedChars);

    const aggregatedInfo = sortedChars.map(name => {
      const info = uniqueChars[name];
      return `角色：${name}\n身份：${Array.from(info.identities).join('/')}\n全书行为摘要：${info.actions.join('; ')}`;
    }).join('\n\n');

    const finalPrompt = `基于以下全书角色行为汇总，生成详细的人物小传（纯JSON数组）。
    
    JSON格式：
    [{"name":"角色名","gender":"性别","age":"年龄","height":"身高","bodyType":"体型","identity":"身份","appearance":"外貌特征","hairStyle":"发型","hairColor":"发色","clothing":"服饰","accessories":"配饰","personality":["性格1"],"background":"背景","keyExperiences":["经历1"],"behaviorPattern":"行为模式","speechStyle":"语言风格","motivation":"动机","arc":{"start":"开始","change":"变化","end":"结束"},"isProtagonist":true}]
    
    角色行为汇总：
    ${aggregatedInfo}`;

    const finalResponse = await callDeepSeek([
      { role: 'system', content: '你是JSON生成器' },
      { role: 'user', content: finalPrompt }
    ], 0.2, 8192);

    let parsed = safeParseJSON(finalResponse);
    if (!Array.isArray(parsed)) parsed = [];

    return parsed.map((char: any, index: number) => ({
      id: generateId(),
      name: char.name || sortedChars[index] || `角色${index + 1}`,
      gender: char.gender || '',
      age: char.age || '',
      height: char.height || '',
      bodyType: char.bodyType || '',
      identity: char.identity || '未知',
      appearance: char.appearance || '',
      hairStyle: char.hairStyle || '',
      hairColor: char.hairColor || '',
      clothing: char.clothing || '',
      accessories: char.accessories || '',
      personality: Array.isArray(char.personality) ? char.personality : [],
      background: char.background || '',
      keyExperiences: Array.isArray(char.keyExperiences) ? char.keyExperiences : [],
      behaviorPattern: char.behaviorPattern || '',
      speechStyle: char.speechStyle || '',
      motivation: char.motivation || '',
      arc: {
        start: char.arc?.start || '',
        change: char.arc?.change || '',
        end: char.arc?.end || '',
      },
      isProtagonist: char.isProtagonist || index === 0,
    }));
  }

  /**
   * 4. 分析人物关系 - 智能 Map-Reduce 版
   */
  async analyzeRelationshipsMR(scriptContent: string, characters: CharacterBio[]): Promise<CharacterRelationship[]> {
    const MAX_CHUNK_SIZE = 8000;

    if (characters.length < 2) return [];

    // 如果剧本较短，直接分析
    if (scriptContent.length <= MAX_CHUNK_SIZE) {
      return this.analyzeRelationships(scriptContent, characters);
    }

    console.log('[StoryAnalyzer] 使用全书视角分析人物关系...');

    const contextLimit = 30000;
    const chunks = splitTextIntoChunks(scriptContent, 10000, 200);
    const interactions: string[] = [];

    const charNames = characters.map(c => c.name).join('、');

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let foundCount = 0;
      characters.forEach(c => {
        if (chunk.includes(c.name)) foundCount++;
      });

      if (foundCount < 2) continue;

      interactions.push(chunk.substring(0, 2000));
    }

    const context = interactions.join('\n...\n').substring(0, contextLimit);

    const prompt = `分析以下剧本片段中，这些角色之间的关系：${charNames}。
    
    返回纯JSON数组：
    [{"fromCharacter":"角色A","toCharacter":"角色B","relationType":"类型","relationLabel":"标签","strength":"strong/medium/weak","tension":"conflict/competition/neutral","description":"关系描述","development":"发展过程","isCore":true}]
    
    剧本采样片段：
    ${context}`;

    const response = await callDeepSeek([
      { role: 'system', content: '你是JSON生成器' },
      { role: 'user', content: prompt }
    ], 0.2, 8192);

    let parsed = safeParseJSON(response);
    if (!Array.isArray(parsed)) parsed = [];

    return parsed.map((rel: any) => ({
      id: generateId(),
      fromCharacter: rel.fromCharacter || '',
      toCharacter: rel.toCharacter || '',
      relationType: rel.relationType || 'other',
      relationLabel: rel.relationLabel || '未知',
      strength: rel.strength || 'medium',
      tension: rel.tension || 'neutral',
      description: rel.description || '',
      development: rel.development || '',
      isCore: rel.isCore || false,
    }));
  }
}

/**
 * 快捷分析函数
 */
export async function analyzeStoryFiveElements(
  request: AnalysisRequest,
  onProgress?: ProgressCallback
): Promise<StoryFiveElements> {
  const analyzer = new StoryAnalyzer(onProgress);
  return analyzer.analyzeAll(request);
}

/**
 * 格式化报告
 */
export function formatFiveElementsReport(analysis: StoryFiveElements): string {
  const { genre, synopsis, characterBios, relationships, plotPoints } = analysis;

  let report = `【故事五元素分析报告】\n\n`;

  // 1. 题材类型
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `一、题材类型与创意提炼\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  report += `【时代】${genre.eraDetail}\n`;
  report += `【风格】${genre.style}\n`;
  report += `【类型】${genre.content.join('、')}\n`;
  report += `【核心概念】${genre.coreConceptOneLine}\n`;
  if (genre.creativeElements.length > 0) {
    report += `【创意元素】${genre.creativeElements.join('、')}\n`;
  }
  if (genre.styleFeatures.length > 0) {
    report += `【风格特点】${genre.styleFeatures.join('、')}\n`;
  }
  if (genre.uniquePoints.length > 0) {
    report += `【独特卖点】${genre.uniquePoints.join('、')}\n`;
  }
  report += `\n`;

  // 2. 故事梗概
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `二、故事梗概\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  report += `【一句话】${synopsis.oneLine}\n\n`;
  report += `【简短梗概】\n${synopsis.short}\n\n`;
  report += `【完整梗概】\n${synopsis.full}\n\n`;
  report += `【主角】${synopsis.protagonist}\n`;
  report += `【目标】${synopsis.goal}\n`;
  report += `【障碍】${synopsis.obstacle}\n`;
  report += `【解决】${synopsis.resolution}\n`;
  report += `【结果】${synopsis.outcome}\n\n`;

  // 3. 人物小传
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `三、人物小传\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  characterBios.forEach((char, index) => {
    report += `【${index + 1}. ${char.name}】${char.isProtagonist ? '（主角）' : ''}\n`;
    report += `身份：${char.identity}\n`;
    if (char.personality.length > 0) {
      report += `性格：${char.personality.join('、')}\n`;
    }
    if (char.background) {
      report += `背景：${char.background}\n`;
    }
    if (char.motivation) {
      report += `动机：${char.motivation}\n`;
    }
    if (char.arc.start || char.arc.change || char.arc.end) {
      report += `弧线：${char.arc.start} → ${char.arc.change} → ${char.arc.end}\n`;
    }
    report += `\n`;
  });

  // 4. 人物关系
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `四、人物关系\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  relationships.forEach((rel, index) => {
    const coreTag = rel.isCore ? '【核心】' : '';
    report += `${index + 1}. ${rel.fromCharacter} ↔ ${rel.toCharacter}：${rel.relationLabel} ${coreTag}\n`;
    if (rel.description) {
      report += `   ${rel.description}\n`;
    }
    if (rel.development) {
      report += `   发展：${rel.development}\n`;
    }
    report += `\n`;
  });

  // 5. 大情节点
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `五、大情节点\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const stageLabels: Record<string, string> = { early: '【前期】', middle: '【中期】', late: '【后期】' };
  const typeLabels: Record<string, string> = {
    setup: '建立',
    development: '发展',
    turning: '转折',
    climax: '高潮',
    resolution: '结局'
  };

  plotPoints.forEach((point) => {
    report += `${point.order}. ${stageLabels[point.stage] || ''} ${point.title} [${typeLabels[point.type] || point.type}]\n`;
    if (point.description) {
      report += `   ${point.description}\n`;
    }
    if (point.characters.length > 0) {
      report += `   涉及：${point.characters.join('、')}\n`;
    }
    if (point.consequence) {
      report += `   影响：${point.consequence}\n`;
    }
    if (point.emotionalTone) {
      report += `   基调：${point.emotionalTone}\n`;
    }
    report += `\n`;
  });

  return report;
}
