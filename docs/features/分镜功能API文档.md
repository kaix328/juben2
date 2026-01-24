# 分镜功能 API 文档

## 📚 目录

1. [核心类型](#核心类型)
2. [常量和枚举](#常量和枚举)
3. [数据管理](#数据管理)
4. [AI 功能](#ai-功能)
5. [提示词引擎](#提示词引擎)
6. [质量检查](#质量检查)
7. [错误处理](#错误处理)
8. [性能优化](#性能优化)

---

## 核心类型

### StoryboardPanel

分镜面板的完整类型定义。

```typescript
interface StoryboardPanel {
    // 基础字段
    id: string;                      // 唯一标识符
    panelNumber: number;             // 分镜编号
    sceneId: string;                 // 所属场景 ID
    description: string;             // 画面描述
    dialogue?: string;               // 对白内容
    
    // 专业摄影字段
    shot: ShotTypeCode;              // 景别（MS, CU, WS 等）
    angle: CameraAngleCode;          // 角度（EYE_LEVEL, HIGH, LOW 等）
    movement: CameraMovementCode;    // 运动（STATIC, DOLLY_IN 等）
    
    duration?: number;               // 时长（秒）
    characters: string[];            // 角色列表
    props: string[];                 // 道具列表
    notes: string;                   // 备注
    
    // 提示词字段
    imagePrompt?: string;            // 图片生成提示词
    videoPrompt?: string;            // 视频生成提示词
    generatedImageUrl?: string;      // 生成的图片 URL
    isImageGenerating?: boolean;     // 是否正在生成
    
    // 更多字段...
}
```

**使用示例**:
```typescript
const panel: StoryboardPanel = {
    id: 'p-001',
    panelNumber: 1,
    sceneId: 's-001',
    description: '办公室，日。张三坐在办公桌前',
    shot: 'MS',
    angle: 'EYE_LEVEL',
    movement: 'STATIC',
    duration: 3,
    characters: ['张三'],
    props: ['办公桌', '电脑'],
    notes: '',
};
```

---

## 常量和枚举

### 景别类型 (SHOT_TYPES)

**位置**: `src/app/constants/cinematography.ts`

```typescript
const SHOT_TYPES = {
    ECU: { code: 'ECU', cn: '大特写', en: 'extreme close-up' },
    CU: { code: 'CU', cn: '特写', en: 'close-up' },
    MCU: { code: 'MCU', cn: '中近景', en: 'medium close-up' },
    MS: { code: 'MS', cn: '中景', en: 'medium shot' },
    // ... 更多
};
```

**辅助函数**:
```typescript
// 根据中文查找代码
const code = getShotTypeByCN('中景'); // 'MS'

// 根据代码查找信息
const info = getShotTypeByCode('MS');
console.log(info.cn);  // '中景'
console.log(info.en);  // 'medium shot'
```

### 镜头角度 (CAMERA_ANGLES)

```typescript
const CAMERA_ANGLES = {
    EYE_LEVEL: { code: 'EYE_LEVEL', cn: '平视', en: 'eye level' },
    HIGH: { code: 'HIGH', cn: '俯视', en: 'high angle' },
    LOW: { code: 'LOW', cn: '仰视', en: 'low angle' },
    // ... 更多
};
```

### 镜头运动 (CAMERA_MOVEMENTS)

```typescript
const CAMERA_MOVEMENTS = {
    STATIC: { code: 'STATIC', cn: '静止', en: 'static shot' },
    DOLLY_IN: { code: 'DOLLY_IN', cn: '推镜头', en: 'dolly in' },
    DOLLY_OUT: { code: 'DOLLY_OUT', cn: '拉镜头', en: 'dolly out' },
    // ... 更多
};
```

---

## 数据管理

### useStoryboard

获取章节的分镜数据（带自动迁移）。

**位置**: `src/app/hooks/queries/useStoryboard.ts`

```typescript
function useStoryboard(chapterId: string | undefined): {
    data: Storyboard | null;
    isLoading: boolean;
    error: Error | null;
}
```

**使用示例**:
```typescript
function MyComponent() {
    const { data: storyboard, isLoading } = useStoryboard(chapterId);
    
    if (isLoading) return <Loading />;
    if (!storyboard) return <Empty />;
    
    return <div>{storyboard.panels.length} 个分镜</div>;
}
```

### useSaveStoryboard

保存分镜数据。

```typescript
function useSaveStoryboard(): {
    mutate: (storyboard: Storyboard) => void;
    mutateAsync: (storyboard: Storyboard) => Promise<void>;
    isLoading: boolean;
}
```

**使用示例**:
```typescript
function MyComponent() {
    const saveStoryboard = useSaveStoryboard();
    
    const handleSave = async () => {
        await saveStoryboard.mutateAsync(updatedStoryboard);
        toast.success('保存成功');
    };
    
    return <button onClick={handleSave}>保存</button>;
}
```

### 数据迁移

**自动迁移**: 在 `useStoryboard` 中自动执行

**手动迁移**:
```typescript
import { migrateStoryboard } from '@/utils/migrations/storyboardMigrations';

const { storyboard: migrated, result } = migrateStoryboard(oldStoryboard);
console.log(`迁移了 ${result.migratedCount} 个分镜`);
```

---

## AI 功能

### extractStoryboard

从剧本提取分镜。

**位置**: `src/app/utils/ai/storyboardGenerator.ts`

```typescript
async function extractStoryboard(
    scenes: ScriptScene[],
    characters: Character[],
    assetsScenes: Scene[],
    densityMode: 'compact' | 'standard' | 'detailed',
    directorStyle?: DirectorStyle,
    onProgress?: ProgressCallback
): Promise<StoryboardPanel[]>
```

**参数**:
- `scenes`: 剧本场景列表
- `characters`: 角色库
- `assetsScenes`: 场景库
- `densityMode`: 密度模式（紧凑/标准/详细）
- `directorStyle`: 导演风格
- `onProgress`: 进度回调

**使用示例**:
```typescript
const panels = await extractStoryboard(
    script.scenes,
    assets.characters,
    assets.scenes,
    'standard',
    project.directorStyle,
    (progress) => {
        console.log(`${progress.stage}: ${progress.message}`);
    }
);
```

### generateFallbackPanels

智能 Fallback 分镜生成（当 AI 失败时）。

```typescript
async function generateFallbackPanels(
    scenes: ScriptScene[],
    characters: Character[],
    assetsScenes: Scene[],
    densityMode: 'compact' | 'standard' | 'detailed',
    directorStyle?: DirectorStyle,
    onProgress?: ProgressCallback
): Promise<StoryboardPanel[]>
```

**特点**:
- 基于规则引擎生成
- 不依赖 AI 服务
- 保证基本质量

---

## 提示词引擎

### PromptEngine

统一的提示词生成引擎。

**位置**: `src/app/utils/promptEngine.ts`

```typescript
class PromptEngine {
    constructor(
        style?: DirectorStyle,
        config?: Partial<EngineConfig>
    );
    
    // 角色提示词
    forCharacterFullBody(character: Character): AdvancedPrompt;
    forCharacterFace(character: Character): AdvancedPrompt;
    
    // 场景提示词
    forSceneWide(scene: Scene): AdvancedPrompt;
    forSceneMedium(scene: Scene): AdvancedPrompt;
    forSceneCloseup(scene: Scene): AdvancedPrompt;
    
    // 分镜提示词
    forStoryboardImage(
        panel: StoryboardPanel,
        characters: Character[],
        scenes: Scene[]
    ): AdvancedPrompt;
    
    forStoryboardVideo(
        panel: StoryboardPanel,
        characters: Character[],
        scenes?: Scene[],
        prevPanel?: StoryboardPanel
    ): AdvancedPrompt;
}
```

**使用示例**:
```typescript
const engine = new PromptEngine(directorStyle, {
    useProfessionalSkills: true,
    qualityTags: 'professional',
});

const result = engine.forStoryboardImage(panel, characters, scenes);
console.log(result.positive);  // 正面提示词
console.log(result.negative);  // 负面提示词
```

### 辅助函数

**位置**: `src/app/utils/promptEngineHelpers.ts`

```typescript
// 添加角色信息
addCharacterBasicInfo(character: Character, parts: PromptPart[]): void;
addCharacterAppearance(character: Character, parts: PromptPart[], brief?: boolean): void;

// 添加技术参数
addTechnicalParams(panel: StoryboardPanel, parts: PromptPart[]): void;
addShotAndAngle(panel: StoryboardPanel, parts: PromptPart[]): void;
addCameraMovement(panel: StoryboardPanel, parts: PromptPart[]): void;

// 添加灯光和构图
addLightingInfo(lighting: LightingDesign, parts: PromptPart[]): void;
addCompositionAndIntent(panel: StoryboardPanel, parts: PromptPart[]): void;

// 合并提示词
mergePromptParts(parts: PromptPart[], separateLanguages?: boolean): string;
```

**使用示例**:
```typescript
import { 
    addCharacterBasicInfo, 
    addTechnicalParams,
    mergePromptParts 
} from '@/utils/promptEngineHelpers';

const parts: PromptPart[] = [];
addCharacterBasicInfo(character, parts);
addTechnicalParams(panel, parts);
const prompt = mergePromptParts(parts);
```

---

## 质量检查

### performQualityCheck

执行分镜质量检查。

**位置**: `src/app/utils/ai/qualityChecker.ts`

```typescript
function performQualityCheck(
    panels: StoryboardPanel[],
    config?: Partial<QualityCheckConfig>
): QualityReport
```

**返回值**:
```typescript
interface QualityReport {
    totalPanels: number;
    totalIssues: number;
    errors: QualityIssue[];
    warnings: QualityIssue[];
    infos: QualityIssue[];
    summary: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
        qualityScore: number;  // 0-100
    };
    checkTime: string;
}
```

**检查类型**:
- 连贯性检查（景别跳跃、轴线）
- 时长检查（过短、过长）
- 角色追踪
- 景别合理性
- 对白完整性
- 逻辑一致性
- 提示词质量

**使用示例**:
```typescript
const report = performQualityCheck(panels);
console.log(`质量分数: ${report.summary.qualityScore}/100`);
console.log(`发现 ${report.errors.length} 个错误`);
```

---

## 错误处理

### StoryboardError

自定义错误类。

**位置**: `src/app/utils/errors/StoryboardError.ts`

```typescript
class StoryboardError extends Error {
    code: ErrorCode;
    details: ErrorDetails;
    suggestions: ErrorSuggestion[];
    
    // 静态工厂方法
    static timeout(context?: Record<string, any>): StoryboardError;
    static rateLimit(retryAfter?: number): StoryboardError;
    static validation(errors: Array<{field: string; message: string}>): StoryboardError;
    static network(originalError?: Error): StoryboardError;
    // ... 更多
}
```

**使用示例**:
```typescript
try {
    await extractStoryboard(...);
} catch (error) {
    const normalized = ErrorHandler.normalize(error);
    
    toast.error(normalized.message, {
        description: normalized.suggestions
            .map(s => `• ${s.title}`)
            .join('\n')
    });
    
    if (ErrorHandler.isRetryable(normalized)) {
        const delay = ErrorHandler.getRetryDelay(normalized, attemptNumber);
        setTimeout(() => retry(), delay);
    }
}
```

### ErrorHandler

错误处理辅助类。

```typescript
class ErrorHandler {
    // 规范化错误
    static normalize(error: unknown): StoryboardError;
    
    // 记录错误
    static log(error: StoryboardError): void;
    
    // 判断是否可重试
    static isRetryable(error: StoryboardError): boolean;
    
    // 获取重试延迟（指数退避）
    static getRetryDelay(error: StoryboardError, attemptNumber: number): number;
}
```

---

## 性能优化

### Context 拆分

**位置**: `src/app/pages/StoryboardEditor/context/StoryboardContextV2.tsx`

```typescript
// 数据层（不常变化）
const { storyboard, script, project, assets } = useStoryboardData();

// 操作层（稳定函数）
const { handleSave, handleUpdatePanel } = useStoryboardActions();

// UI 层（频繁变化）
const { viewMode, selectedPanels } = useStoryboardUI();
```

### 选择器 Hooks

```typescript
// 只订阅分镜数据
const panels = useStoryboardPanels();

// 只订阅单个分镜
const panel = useStoryboardPanel(panelId);

// 只订阅选中的分镜
const selectedPanels = useSelectedPanels();

// 只订阅过滤后的分镜
const filteredPanels = useFilteredPanels();

// 只订阅统计信息
const stats = useStoryboardStats();
```

### 虚拟滚动

**位置**: `src/app/pages/StoryboardEditor/components/ListViewOptimized.tsx`

```typescript
import { ListViewOptimized } from './components/ListViewOptimized';

<ListViewOptimized
    panels={panels}
    selectedPanels={selectedPanels}
    onPanelUpdate={handleUpdatePanel}
    // ... 其他 props
/>
```

**特点**:
- 只渲染可见区域
- 动态高度测量
- 预渲染（overscan）
- 支持 500+ 分镜

---

## 数据验证

### validatePanel

验证单个分镜。

**位置**: `src/app/utils/validation/storyboardValidation.ts`

```typescript
function validatePanel(panel: unknown): {
    success: boolean;
    data?: ValidatedStoryboardPanel;
    errors?: Array<{ field: string; message: string }>;
}
```

**使用示例**:
```typescript
const result = validatePanel(panel);
if (!result.success) {
    console.error('验证失败:', result.errors);
} else {
    console.log('验证通过:', result.data);
}
```

### autoFixPanel

自动修复常见问题。

```typescript
function autoFixPanel(panel: any): any
```

**修复内容**:
- 缺失的数组字段
- 缺失的字符串字段
- 无效的时长
- 缺失的默认值

---

## 最佳实践

### 1. 错误处理

```typescript
// ✅ 推荐
try {
    await operation();
} catch (error) {
    const normalized = ErrorHandler.normalize(error);
    ErrorHandler.log(normalized);
    toast.error(normalized.toUserMessage());
}

// ❌ 不推荐
try {
    await operation();
} catch (error) {
    console.error(error);
    toast.error('操作失败');
}
```

### 2. 性能优化

```typescript
// ✅ 推荐 - 使用选择器
function MyComponent({ panelId }: { panelId: string }) {
    const panel = useStoryboardPanel(panelId);
    return <div>{panel?.description}</div>;
}

// ❌ 不推荐 - 订阅所有数据
function MyComponent({ panelId }: { panelId: string }) {
    const { storyboard } = useStoryboardData();
    const panel = storyboard?.panels.find(p => p.id === panelId);
    return <div>{panel?.description}</div>;
}
```

### 3. 类型安全

```typescript
// ✅ 推荐 - 使用常量
import { SHOT_TYPES } from '@/constants/cinematography';

const panel: StoryboardPanel = {
    shot: 'MS',  // 类型安全
    // ...
};

// ❌ 不推荐 - 硬编码字符串
const panel = {
    shot: '中景',  // 可能出错
    // ...
};
```

---

**文档版本**: v2.0  
**最后更新**: 2025-01-24  
**维护者**: 开发团队
