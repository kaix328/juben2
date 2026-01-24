/**
 * 故事五元素分析类型定义
 * 基于 story-five-elements skill
 */

// 题材类型
export type GenreEra = 'ancient' | 'modern' | 'future';
export type GenreStyle = 'comedy' | 'tragedy' | 'drama' | 'suspense';
export type GenreContent = 'romance' | 'revenge' | 'growth' | 'adventure' | 'mystery' | 'action';

// 题材类型与创意提炼
export interface GenreAnalysis {
  era: GenreEra;                    // 时代分类
  eraDetail: string;                // 时代细分（如：古装、玄幻、都市）
  style: GenreStyle;                // 风格分类
  content: GenreContent[];          // 内容分类（可多选）
  coreConceptOneLine: string;       // 一句话核心概念
  creativeElements: string[];       // 创意元素
  styleFeatures: string[];          // 风格特点
  uniquePoints: string[];           // 独特卖点
}

// 故事梗概
export interface Synopsis {
  oneLine: string;                  // 一句话梗概（30-50字）
  short: string;                    // 简短梗概（150-200字）
  full: string;                     // 完整梗概（300-500字）
  protagonist: string;              // 主角是谁
  goal: string;                     // 主角想要什么
  obstacle: string;                 // 什么在阻碍主角
  resolution: string;               // 主角如何克服
  outcome: string;                  // 最终结果
}

// 人物小传
export interface CharacterBio {
  id: string;
  name: string;                     // 姓名
  age?: string;                     // 年龄
  identity: string;                 // 身份
  gender?: string;                  // 性别
  height?: string;                  // 身高
  bodyType?: string;                // 体型
  hairStyle?: string;               // 发型
  hairColor?: string;               // 发色
  clothing?: string;                // 服饰
  accessories?: string;             // 配饰
  appearance: string;               // 外貌特征
  personality: string[];            // 性格特点
  background: string;               // 背景故事
  keyExperiences: string[];         // 重要经历
  behaviorPattern: string;          // 行为模式
  speechStyle: string;              // 语言风格
  motivation: string;               // 核心动机
  arc: {                            // 人物弧线
    start: string;                  // 故事开始时的状态
    change: string;                 // 故事中的成长变化
    end: string;                    // 故事结束时的状态
  };
  isProtagonist: boolean;           // 是否主角
}

// 人物关系类型
export type RelationType =
  | 'family'      // 亲情
  | 'romance'     // 爱情
  | 'friendship'  // 友情
  | 'rivalry'     // 竞争
  | 'enemy'       // 敌对
  | 'mentor'      // 师徒
  | 'colleague'   // 同事
  | 'alliance'    // 同盟
  | 'subordinate' // 上下级
  | 'other';      // 其他

// 关系强度
export type RelationStrength = 'strong' | 'medium' | 'weak';

// 关系张力
export type RelationTension = 'conflict' | 'competition' | 'complement' | 'dependence' | 'neutral';

// 人物关系
export interface CharacterRelationship {
  id: string;
  fromCharacter: string;            // 角色A
  toCharacter: string;              // 角色B
  relationType: RelationType;       // 关系类型
  relationLabel: string;            // 关系标签（如：父子、恋人、死敌）
  strength: RelationStrength;       // 关系强度
  tension: RelationTension;         // 关系张力
  description: string;              // 关系描述
  development: string;              // 关系发展
  isCore: boolean;                  // 是否核心关系
}

// 情节点类型
export type PlotPointType =
  | 'setup'       // 建立情节点
  | 'development' // 发展情节点
  | 'turning'     // 转折情节点
  | 'climax'      // 高潮情节点
  | 'resolution'; // 结局情节点

// 情节点阶段
export type PlotPointStage = 'early' | 'middle' | 'late';

// 大情节点
export interface PlotPoint {
  id: string;
  order: number;                    // 顺序
  title: string;                    // 情节点标题
  type: PlotPointType;              // 情节点类型
  stage: PlotPointStage;            // 所属阶段
  description: string;              // 情节描述
  characters: string[];             // 涉及角色
  consequence: string;              // 后果/影响
  emotionalTone: string;            // 情感基调
  sceneIds?: string[];              // 关联场景ID
  beat?: string;                    // 对应经典节拍 (e.g. Save the Cat)
}

// 情感节奏点
export interface EmotionBeat {
  sceneId: string;      // 场景ID (如果是剧本分析阶段，可能是临时ID或顺序号)
  sceneLocation: string;// 场景地点
  sceneOrder: number;   // 场景顺序
  tension: number;      // 紧张度 (0-10)
  energy: number;       // 能量值 (0-10)
  mood: string;         // 情感标签（如：喜悦、恐惧）
  description: string;  // 简短描述
  isMock?: boolean;     // 是否为模拟数据
}

// 主题
export interface Theme {
  name: string;             // 主题名称
  description: string;      // 描述
  evidence: string[];       // 依据
}

// 关键意象/符号
export interface Symbol {
  name: string;             // 符号名称
  meaning: string;          // 象征意义
  occurrences: string[];    // 出现场景
}

// 完整的五元素分析结果
export interface StoryFiveElements {
  id: string;
  projectId: string;
  chapterId?: string;               // 可选，针对特定章节
  createdAt: string;
  updatedAt: string;

  // 五大元素
  genre: GenreAnalysis;             // 1. 题材类型与创意提炼
  synopsis: Synopsis;               // 2. 故事梗概
  characterBios: CharacterBio[];    // 3. 人物小传
  relationships: CharacterRelationship[]; // 4. 人物关系
  plotPoints: PlotPoint[];          // 5. 大情节点
  emotionCurve?: EmotionBeat[];     // 6. 情感节奏曲线
  themes?: Theme[];                 // 7. 主题
  symbols?: Symbol[];               // 8. 意象

  // 元数据
  analysisSource: 'ai' | 'manual';  // 分析来源
  confidence?: number;              // AI分析置信度 (0-100)
  notes?: string;                   // 备注
}

// 分析请求参数
export interface AnalysisRequest {
  projectId: string;
  chapterId?: string;
  scriptContent: string;            // 剧本内容
  existingCharacters?: string[];    // 已有角色列表
  focusElements?: ('genre' | 'synopsis' | 'characters' | 'relationships' | 'plotPoints')[]; // 聚焦分析的元素
}

// 分析进度
export interface AnalysisProgress {
  step: 'idle' | 'genre' | 'synopsis' | 'characters' | 'relationships' | 'plotPoints' | 'themes' | 'complete' | 'error';
  progress: number;                 // 0-100
  message: string;
  error?: string;
}
