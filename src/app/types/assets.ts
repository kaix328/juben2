// 角色
export interface Character {
    id: string;
    name: string;
    description: string;
    appearance: string;
    personality: string;
    avatar: string;
    // 全身正视图
    fullBodyPrompt?: string; // AI绘画提示词 - 全身正视图
    fullBodyPreview?: string; // 全身图预览URL
    isGeneratingFullBody?: boolean; // 是否正在生成全身图
    // 脸部正视图
    facePrompt?: string; // AI绘画提示词 - 脸部正视图
    facePreview?: string; // 脸部图预览URL
    isGeneratingFace?: boolean; // 是否正在生成脸部图
    // 保留旧字段以兼容
    aiPrompt?: string; // 废弃，保留以兼容旧数据
    // 新增字段
    tags?: string[]; // 标签
    createdAt?: string; // 创建时间
    usageCount?: number; // 使用次数（在分镜中的引用）

    // 🆕 角色一致性相关字段
    triggerWord?: string; // 角色触发词（如：char_zhangsan_001）
    standardAppearance?: string; // 标准化外貌描述（结构化格式）

    // 🆕 参考图与模型字段
    referenceImages?: string[]; // 参考图 URL/Base64 数组
    loraModel?: string; // LoRA 模型名称
    loraWeight?: number; // LoRA 权重 (0-1)
    ipAdapterWeight?: number; // IP-Adapter 权重 (0-1)
}

// 场景
export interface Scene {
    id: string;
    name: string;
    description: string;
    location: string;
    environment: string;
    image: string;
    aiPrompt?: string; // AI绘画提示词（保留以兼容）
    // 远景
    widePrompt?: string; // AI绘画提示词 - 远景
    widePreview?: string; // 远景图预览URL
    isGeneratingWide?: boolean; // 是否正在生成远景图
    // 中景
    mediumPrompt?: string; // AI绘画提示词 - 中景
    mediumPreview?: string; // 中景图预览URL
    isGeneratingMedium?: boolean; // 是否正在生成中景图
    // 特写
    closeupPrompt?: string; // AI绘画提示词 - 特写
    closeupPreview?: string; // 特写图预览URL
    isGeneratingCloseup?: boolean; // 是否正在生成特写图
    // 新增字段
    tags?: string[]; // 标签：室内/室外、现代/古代等
    timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk'; // 时间段
    weather?: string; // 天气
    createdAt?: string; // 创建时间
    usageCount?: number; // 使用次数
}

// 道具
export interface Prop {
    id: string;
    name: string;
    description: string;
    category: string;
    image: string;
    aiPrompt?: string; // AI绘画提示词
    preview?: string; // 图片预览URL
    isGenerating?: boolean; // 是否正在生成
    tags?: string[]; // 标签
    createdAt?: string; // 创建时间
    usageCount?: number; // 使用次数
}

// 服饰
export interface Costume {
    id: string;
    characterId: string;
    name: string;
    description: string;
    style: string;
    image: string;
    aiPrompt?: string; // AI绘画提示词
    preview?: string; // 图片预览URL
    isGenerating?: boolean; // 是否正在生成
    tags?: string[]; // 标签
    createdAt?: string; // 创建时间
    usageCount?: number; // 使用次数
}

// 项目资源库类型
export interface AssetLibrary {
    projectId: string;
    characters: Character[];
    scenes: Scene[];
    props: Prop[];
    costumes: Costume[];
}

// 角色关系
export interface CharacterRelation {
    id: string;
    projectId: string;
    fromCharacterId: string;
    toCharacterId: string;
    relationType: '主角' | '配角' | '反派' | '朋友' | '敌人' | '家人' | '恋人' | '师徒' | '其他';
    description: string;
}
