// 章节类型
export interface Chapter {
    id: string;
    projectId: string;
    title: string;
    orderIndex: number;
    originalText: string;
    createdAt: string;
}

// 剧本元数据（专业版）
export interface ScriptMetadata {
    title: string;                    // 剧本标题
    author?: string;                  // 编剧
    draft?: string;                   // 稿号（初稿/修改稿/定稿）
    draftDate?: string;               // 日期
    contact?: string;                 // 联系方式
    copyright?: string;               // 版权信息
    logline?: string;                 // 一句话故事摘要
    genre?: string;                   // 类型（动作/喜剧/爱情等）
    format?: 'FEATURE' | 'TV' | 'SHORT' | 'WEB'; // 剧本格式
}

// 剧本统计（专业版）
export interface ScriptStatistics {
    pageCount: number;                // 总页数（1页≈1分钟）
    estimatedRuntime: string;         // 预计时长（HH:MM）
    sceneCount: number;               // 场景数
    dialogueWordCount: number;        // 对白总字数
    actionWordCount: number;          // 动作描述总字数
    dialoguePercentage: number;       // 对白占比 (0-100)
    topCharacters: { name: string; lineCount: number; wordCount: number }[];
    locationBreakdown: { location: string; count: number }[];
    intExtRatio: { int: number; ext: number };
}

// 剧本场景
export interface ScriptScene {
    id: string;
    sceneNumber: number;
    episodeNumber: number; // 集数
    location: string;
    timeOfDay: string;
    sceneType: 'INT' | 'EXT'; // 内景/外景
    characters: string[];
    action: string; // 动作描述
    dialogues: Dialogue[]; // 对话列表
    transition?: string; // 转场，如"切至"、"淡出"等
    estimatedDuration?: number; // 预估时长（秒）
    // 新增专业字段
    slugline?: string;           // 自定义场景行（覆盖自动生成）
    subLocation?: string;        // 子场景（如：办公室 - 会议室）
    continuity?: 'CONTINUOUS' | 'LATER' | 'MOMENTS LATER' | 'SAME'; // 时间连续性
    dayNightNumber?: number;     // 日/夜序号（DAY 1, NIGHT 3）
    specialSceneType?: 'FLASHBACK' | 'DREAM' | 'FANTASY' | 'MONTAGE' | 'INSERT' | 'INTERCUT'; // 特殊场景类型
    pageStart?: number;          // 起始页码
    pageEnd?: number;            // 结束页码
    beat?: string;               // 节拍标记/情绪转折点
    notes?: string;              // 编剧备注
}

// 对话扩展类型
export type DialogueExtension = 'V.O.' | 'O.S.' | 'O.C.' | 'CONT\'D' | 'PRE-LAP' | 'FILTER' | 'SUBTITLE';

// 对话
export interface Dialogue {
    id: string;
    character: string; // 角色名
    parenthetical?: string; // 括号指示（对话方式）
    lines: string; // 台词内容
    // 新增专业字段
    extension?: DialogueExtension;   // 扩展标记（V.O.画外音/O.S.场外音等）
    isFirstAppearance?: boolean;     // 角色首次出场（需大写处理）
    dual?: 'LEFT' | 'RIGHT';         // 双人对白位置
    isContinued?: boolean;           // 是否为延续对白 (CONT'D)
}

// 剧本类型
export interface Script {
    id: string;
    chapterId: string;
    content: string;
    scenes: ScriptScene[];
    updatedAt: string;
    // 新增专业字段
    metadata?: ScriptMetadata;        // 剧本元数据
    statistics?: ScriptStatistics;    // 剧本统计
    mode?: 'movie' | 'tv_drama' | 'short_video' | 'web_series'; // 剧本模式
}
