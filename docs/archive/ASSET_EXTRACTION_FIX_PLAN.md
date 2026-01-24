# 🎯 资产提取功能完整修复方案

**创建时间**: 2026-01-19  
**问题**: 章节编辑器资产分析只显示角色，缺少场景和道具  
**状态**: 修复中

---

## ✅ 已完成的修复

### 1. 修复描述显示截断问题 ✓

**文件**: `src/app/pages/ChapterEditor/components/AnalysisSidebar.tsx`

**修改内容**:
```tsx
// 修改前
<p className="text-xs text-slate-500 line-clamp-2">{asset.description}</p>

// 修改后
<p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
    {asset.description}
</p>
```

**效果**: 资产描述现在可以完整显示，不再被截断

---

### 2. 添加调试日志 ✓

**文件**: `src/app/pages/ChapterEditor/hooks/useScriptAnalysis.ts`

**添加的日志**:
- 🔍 开始分析文本
- 📦 提取结果统计
- 📋 详细数据
- ✅ 转换后的预览数据

**效果**: 可以在浏览器控制台追踪整个分析流程

---

### 3. 改进提示信息 ✓

**修改内容**:
```typescript
// 修改前
toast.success(`识别到 ${previews.length} 个潜在资产`);

// 修改后
const summary = [];
if (counts.characters > 0) summary.push(`${counts.characters}个角色`);
if (counts.scenes > 0) summary.push(`${counts.scenes}个场景`);
if (counts.props > 0) summary.push(`${counts.props}个道具`);

if (summary.length > 0) {
    toast.success(`识别到 ${summary.join('、')}`);
} else {
    toast.warning('未识别到资产，请检查文本内容或稍后重试');
}
```

**效果**: 用户可以清楚看到识别到的各类型资产数量

---

## 🔍 问题根源分析

经过代码审查，发现可能的问题原因：

### 原因 1: AI Prompt 可能不够明确

**位置**: `src/app/utils/ai/assetExtractor.ts`

**问题**: 
- Prompt 虽然详细，但 AI 可能更倾向于识别角色
- 场景和道具的识别权重可能不够
- 缺少具体的场景和道具示例

**影响**: 高

---

### 原因 2: 文本内容不够详细

**问题**:
- 如果文本只是简单的对话，缺少场景描述
- 道具没有明确提及
- 场景转换不明显

**影响**: 中

---

### 原因 3: AI 模型的固有限制

**问题**:
- AI 模型可能对场景和道具的理解不如角色
- 不同的文本风格可能导致不同的识别效果
- 需要更多的上下文才能准确识别

**影响**: 中

---

## 🛠️ 进一步的修复方案

### 方案 1: 优化 AI Prompt（推荐）

**优先级**: 🔴 高  
**预计时间**: 2-3小时  
**难度**: 中

**实施步骤**:

1. **增强场景识别提示**

```typescript
【场景提取要求 - 增强版】
场景是故事发生的地点和环境，请特别注意以下线索：
- 地点转换词：如"走进"、"来到"、"离开"、"前往"
- 环境描述：如"夜幕降临"、"阳光明媚"、"阴暗潮湿"
- 建筑物：如"城堡"、"咖啡厅"、"办公室"、"街道"
- 自然环境：如"森林"、"海边"、"山顶"、"河流"

即使文本中没有明确说明，也要根据上下文推断场景。

示例：
- "李明走进咖啡厅" → 场景：咖啡厅（室内，现代，温馨氛围）
- "夜幕降临，古堡矗立在山顶" → 场景：山顶古堡（室外，古代，神秘氛围）
```

2. **增强道具识别提示**

```typescript
【道具提取要求 - 增强版】
道具是角色使用或提及的重要物品，请特别注意：
- 武器：剑、枪、匕首等
- 文件：信件、卷轴、书籍等
- 日用品：手机、笔记本电脑、钥匙等
- 特殊物品：宝石、戒指、护身符等
- 交通工具：汽车、马车、飞机等

识别标准：
1. 角色直接使用或持有的物品
2. 对剧情有重要影响的物品
3. 被明确描述或提及的物品

示例：
- "手持一把古剑" → 道具：古剑（武器，青铜材质，古代）
- "拿出笔记本电脑" → 道具：笔记本电脑（电子设备，现代）
```

3. **添加输出格式示例**

```typescript
【输出示例】
{
  "characters": [
    {
      "name": "洪战",
      "age": "70岁",
      "bodyType": "中等身材，略显佝偻",
      "hair": "花白短发",
      "facialFeatures": "眼神锐利，面容苍老",
      "appearance": "70岁老者，中等身材，因年迈而略显佝偻，但眼神锐利，气场沉稳",
      "distinguishingFeatures": "眼神如炬，嘴唇紧抿",
      "personality": "坚毅果决"
    }
  ],
  "scenes": [
    {
      "name": "古堡大厅",
      "location": "山顶古堡内部",
      "spaceType": "室内",
      "lighting": "月光透过破碎窗户，昏暗神秘",
      "era": "古代",
      "atmosphere": "阴森压抑，充满历史感",
      "environment": "古老的城堡大厅，破碎的窗户，月光洒进，石柱林立",
      "keyObjects": ["圆桌", "破碎窗户", "石柱"]
    }
  ],
  "props": [
    {
      "name": "古剑",
      "category": "武器",
      "material": "青铜",
      "era": "古代",
      "description": "剑柄上刻有龙纹，是洪战父亲的遗物",
      "significance": "家族传承，象征身份"
    }
  ]
}
```

---

### 方案 2: 添加场景和道具的智能推断

**优先级**: 🟡 中  
**预计时间**: 4-5小时  
**难度**: 高

**实施步骤**:

创建新文件 `src/app/utils/ai/smartInference.ts`:

```typescript
/**
 * 智能推断场景和道具
 * 基于关键词和上下文分析
 */

// 场景关键词
const SCENE_KEYWORDS = {
  indoor: ['房间', '大厅', '办公室', '卧室', '厨房', '客厅', '走廊', '地下室'],
  outdoor: ['街道', '公园', '森林', '海边', '山顶', '广场', '花园', '院子'],
  building: ['城堡', '宫殿', '寺庙', '教堂', '学校', '医院', '商场', '咖啡厅'],
  transition: ['走进', '来到', '离开', '前往', '进入', '走出', '到达', '抵达']
};

// 道具关键词
const PROP_KEYWORDS = {
  weapon: ['剑', '刀', '枪', '弓', '箭', '匕首', '长矛', '斧头'],
  document: ['信', '信件', '卷轴', '书', '书籍', '文件', '地图', '契约'],
  jewelry: ['戒指', '项链', '宝石', '珠宝', '玉佩', '手镯', '耳环'],
  daily: ['手机', '电脑', '钥匙', '钱包', '包', '伞', '眼镜', '手表'],
  special: ['宝物', '圣物', '遗物', '护身符', '令牌', '印章']
};

/**
 * 从文本中推断场景
 */
export function inferScenes(text: string): Array<{
  name: string;
  location: string;
  spaceType: string;
  description: string;
}> {
  const scenes: any[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // 检查场景关键词
    for (const [type, keywords] of Object.entries(SCENE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (line.includes(keyword)) {
          // 提取场景名称
          const match = line.match(new RegExp(`(.{0,10}${keyword}.{0,10})`));
          if (match) {
            scenes.push({
              name: keyword,
              location: match[1].trim(),
              spaceType: type === 'indoor' ? '室内' : '室外',
              description: line.trim()
            });
          }
        }
      }
    }
  }
  
  // 去重
  return Array.from(new Map(scenes.map(s => [s.name, s])).values());
}

/**
 * 从文本中推断道具
 */
export function inferProps(text: string): Array<{
  name: string;
  category: string;
  description: string;
}> {
  const props: any[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // 检查道具关键词
    for (const [category, keywords] of Object.entries(PROP_KEYWORDS)) {
      for (const keyword of keywords) {
        if (line.includes(keyword)) {
          // 提取道具描述
          const match = line.match(new RegExp(`(.{0,20}${keyword}.{0,20})`));
          if (match) {
            props.push({
              name: keyword,
              category: getCategoryName(category),
              description: match[1].trim()
            });
          }
        }
      }
    }
  }
  
  // 去重
  return Array.from(new Map(props.map(p => [p.name, p])).values());
}

function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    weapon: '武器',
    document: '文件',
    jewelry: '珠宝',
    daily: '日用品',
    special: '特殊物品'
  };
  return map[category] || '其他';
}
```

然后在 `useScriptAnalysis.ts` 中使用：

```typescript
import { inferScenes, inferProps } from '../../../utils/ai/smartInference';

// 在 extractAssets 调用后
const result = await extractAssets(text, [], project?.directorStyle);

// 如果 AI 没有识别到场景，使用智能推断
if (result.scenes.length === 0) {
  const inferredScenes = inferScenes(text);
  console.log('🤖 使用智能推断补充场景:', inferredScenes.length);
  result.scenes = inferredScenes.map(s => ({
    id: generateId(),
    ...s,
    environment: s.description,
    image: '',
    widePrompt: '',
    mediumPrompt: '',
    closeupPrompt: ''
  }));
}

// 如果 AI 没有识别到道具，使用智能推断
if (result.props.length === 0) {
  const inferredProps = inferProps(text);
  console.log('🤖 使用智能推断补充道具:', inferredProps.length);
  result.props = inferredProps.map(p => ({
    id: generateId(),
    ...p,
    image: '',
    aiPrompt: ''
  }));
}
```

---

### 方案 3: 添加手动添加功能

**优先级**: 🟢 低  
**预计时间**: 2-3小时  
**难度**: 低

**实施步骤**:

在 `AnalysisSidebar.tsx` 中添加手动添加按钮：

```tsx
<div className="p-4 border-t space-y-2">
  <p className="text-xs text-slate-500 mb-2">未识别到场景或道具？</p>
  <div className="grid grid-cols-2 gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => onManualAdd('scene')}
      className="text-xs"
    >
      <Plus className="w-3 h-3 mr-1" />
      添加场景
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => onManualAdd('prop')}
      className="text-xs"
    >
      <Plus className="w-3 h-3 mr-1" />
      添加道具
    </Button>
  </div>
</div>
```

---

## 📋 实施计划

### 第一阶段：立即修复（今天）

- [x] 修复描述显示截断问题
- [x] 添加调试日志
- [x] 改进提示信息
- [ ] 测试当前功能，收集日志数据

### 第二阶段：优化 Prompt（明天）

- [ ] 优化场景识别 Prompt
- [ ] 优化道具识别 Prompt
- [ ] 添加输出格式示例
- [ ] 测试优化效果

### 第三阶段：智能推断（本周内）

- [ ] 实现场景智能推断
- [ ] 实现道具智能推断
- [ ] 集成到分析流程
- [ ] 测试推断准确率

### 第四阶段：手动添加（可选）

- [ ] 添加手动添加场景功能
- [ ] 添加手动添加道具功能
- [ ] 添加编辑功能
- [ ] 完善用户体验

---

## 🧪 测试计划

### 测试用例 1: 明确的场景和道具

**输入文本**:
```
第一章 古堡之夜

夜幕降临，古老的城堡矗立在山顶。洪战手持古剑走进大厅，
月光透过破碎的窗户洒进来。圆桌上摆放着一个玉盒。
```

**预期输出**:
- 角色: 洪战
- 场景: 山顶、古堡大厅
- 道具: 古剑、玉盒

---

### 测试用例 2: 隐含的场景

**输入文本**:
```
李明打开门，走了进去。房间里很暗，他打开了灯。
桌子上放着一封信。
```

**预期输出**:
- 角色: 李明
- 场景: 房间（室内）
- 道具: 信

---

### 测试用例 3: 多个场景转换

**输入文本**:
```
张三在办公室工作了一整天。下班后，他来到公园散步。
晚上，他回到家中，打开电视看新闻。
```

**预期输出**:
- 角色: 张三
- 场景: 办公室、公园、家中
- 道具: 电视

---

## 📊 成功标准

### 最低标准（必须达到）

- ✅ 能够识别文本中明确提到的场景
- ✅ 能够识别文本中明确提到的道具
- ✅ 识别率 > 50%

### 目标标准（期望达到）

- ✅ 能够推断隐含的场景
- ✅ 能够识别重要的道具
- ✅ 识别率 > 70%

### 优秀标准（努力达到）

- ✅ 智能推断场景和道具
- ✅ 准确识别所有重要资产
- ✅ 识别率 > 90%

---

## 📞 需要帮助？

如果在实施过程中遇到问题，请：

1. 查看浏览器控制台日志
2. 参考 `ASSET_EXTRACTION_DEBUG.md`
3. 提供详细的错误信息和测试文本

---

**最后更新**: 2026-01-19  
**下次更新**: 测试完成后  
**负责人**: 开发团队
