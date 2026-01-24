# 🔧 资产提取不完整问题修复方案

**问题**: 原文一多，提取就不完整  
**创建时间**: 2026-01-19  
**状态**: 分析中

---

## 🔍 问题分析

### 根本原因

从代码中发现了几个关键问题：

#### 1. 文本截断太短 ⚠️
```typescript
const contextText = originalText.substring(0, 15000);
```
- **问题**: 只取前 15000 字符
- **影响**: 长文本后面的内容被忽略
- **示例**: 如果原文有 30000 字，后半部分完全不会被分析

#### 2. AI 输出 Token 限制 ⚠️
```typescript
// 当前代码中没有设置 maxTokens
await callDeepSeek([{ role: 'user', content: prompt }]);
```
- **问题**: 使用默认的 Token 限制（通常 4096）
- **影响**: AI 返回的 JSON 可能被截断
- **结果**: 只能提取部分资产

#### 3. Prompt 太长 ⚠️
```typescript
const prompt = `你是一位拥有15年经验...
【任务】分析以下故事文本...
【角色提取要求】...
【场景提取要求 - 重要！】...
【道具提取要求 - 重要！】...
【服装提取要求】...
故事文本：${contextText}`;
```
- **问题**: Prompt 本身就很长（约 1000+ tokens）
- **影响**: 留给输出的空间更少
- **结果**: 输出被截断

---

## 🛠️ 解决方案

### 方案 1: 增加 Token 限制（推荐）⭐

**优点**: 简单直接，效果明显  
**缺点**: 可能增加 API 成本

**实施**:
```typescript
// 在 callDeepSeek 调用时增加 maxTokens
const result = await callDeepSeek(
    [{ role: 'user', content: prompt }],
    0.7,  // temperature
    8192  // 🆕 maxTokens - 增加到 8192
);
```

---

### 方案 2: 分批处理长文本（推荐）⭐⭐⭐

**优点**: 可以处理任意长度的文本  
**缺点**: 需要多次 API 调用

**实施**:
```typescript
// 1. 将长文本分成多个批次
const CHUNK_SIZE = 10000; // 每批 10000 字符
const chunks = [];
for (let i = 0; i < originalText.length; i += CHUNK_SIZE) {
    chunks.push(originalText.substring(i, i + CHUNK_SIZE));
}

// 2. 分批提取
const allAssets = {
    characters: [],
    scenes: [],
    props: [],
    costumes: []
};

for (const chunk of chunks) {
    const result = await extractAssetsFromChunk(chunk);
    // 合并结果，去重
    allAssets.characters.push(...result.characters);
    allAssets.scenes.push(...result.scenes);
    allAssets.props.push(...result.props);
    allAssets.costumes.push(...result.costumes);
}

// 3. 去重
allAssets.characters = deduplicateAssets(allAssets.characters);
allAssets.scenes = deduplicateAssets(allAssets.scenes);
allAssets.props = deduplicateAssets(allAssets.props);
```

---

### 方案 3: 简化 Prompt

**优点**: 节省输入 Token，留更多空间给输出  
**缺点**: 可能影响提取质量

**实施**:
```typescript
const prompt = `分析文本，提取角色、场景、道具。

返回 JSON 格式：
{
  "characters": [{"name": "名字", "age": "年龄", "appearance": "外貌"}],
  "scenes": [{"name": "场景名", "location": "地点", "atmosphere": "氛围"}],
  "props": [{"name": "道具名", "category": "类别", "description": "描述"}]
}

文本：${contextText}`;
```

---

### 方案 4: 组合方案（最佳）⭐⭐⭐⭐⭐

结合以上方案的优点：

1. **增加 Token 限制** → 8192
2. **分批处理** → 每批 10000 字符
3. **简化 Prompt** → 减少不必要的说明
4. **智能合并** → 自动去重

---

## 📝 实施计划

### 立即修复（方案 1）

**修改文件**: `src/app/utils/ai/assetExtractor.ts`

```typescript
// 修改 callDeepSeek 调用
const result = await callDeepSeek(
    [{ role: 'user', content: prompt }],
    0.7,
    8192  // 🆕 增加 maxTokens
);
```

**修改文件**: `src/app/utils/volcApi.ts`

```typescript
export async function callDeepSeek(
    messages: { role: string; content: string }[],
    temperature = 0.7,
    maxTokens = 4096  // 🆕 添加参数
): Promise<string> {
    // ... 在 API 调用中使用 maxTokens
}
```

---

### 完整优化（方案 4）

创建新文件: `src/app/utils/ai/assetExtractorOptimized.ts`

```typescript
/**
 * 优化的资产提取模块
 * 支持长文本分批处理
 */

const CHUNK_SIZE = 10000; // 每批字符数
const MAX_TOKENS = 8192;  // 最大输出 Token

/**
 * 分批提取资产（支持长文本）
 */
export async function extractAssetsOptimized(
    originalText: string,
    scenesCount: any[],
    directorStyle?: DirectorStyle,
    onProgress?: (progress: number) => void
): Promise<ExtractedAssets> {
    // 1. 分割文本
    const chunks = splitTextIntoChunks(originalText, CHUNK_SIZE);
    console.log(`📄 [extractAssetsOptimized] 文本分为 ${chunks.length} 批处理`);

    // 2. 分批提取
    const allResults: ExtractedAssets[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
        console.log(`🔍 [extractAssetsOptimized] 处理第 ${i + 1}/${chunks.length} 批`);
        
        const result = await extractAssetsFromChunk(
            chunks[i],
            scenesCount,
            directorStyle
        );
        
        allResults.push(result);
        
        // 报告进度
        if (onProgress) {
            onProgress((i + 1) / chunks.length * 100);
        }
    }

    // 3. 合并并去重
    const merged = mergeAndDeduplicateAssets(allResults);
    
    console.log(`✅ [extractAssetsOptimized] 合并完成:`, {
        characters: merged.characters.length,
        scenes: merged.scenes.length,
        props: merged.props.length,
        costumes: merged.costumes.length
    });

    return merged;
}

/**
 * 分割文本为多个批次
 */
function splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    
    // 按段落分割，避免截断句子
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    
    for (const para of paragraphs) {
        if (currentChunk.length + para.length > chunkSize) {
            if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = '';
            }
            
            // 如果单个段落超过 chunkSize，强制分割
            if (para.length > chunkSize) {
                for (let i = 0; i < para.length; i += chunkSize) {
                    chunks.push(para.substring(i, i + chunkSize));
                }
            } else {
                currentChunk = para;
            }
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + para;
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}

/**
 * 从单个批次提取资产
 */
async function extractAssetsFromChunk(
    chunk: string,
    scenesCount: any[],
    directorStyle?: DirectorStyle
): Promise<ExtractedAssets> {
    // 使用简化的 Prompt
    const prompt = `分析以下文本，提取所有角色、场景和道具。

返回 JSON 格式（不要包含 Markdown 标记）：
{
  "characters": [{"name": "角色名", "age": "年龄", "appearance": "外貌", "personality": "性格"}],
  "scenes": [{"name": "场景名", "location": "地点", "spaceType": "室内/室外", "atmosphere": "氛围"}],
  "props": [{"name": "道具名", "category": "类别", "description": "描述"}]
}

文本：
${chunk}`;

    try {
        const result = await callDeepSeek(
            [{ role: 'user', content: prompt }],
            0.7,
            MAX_TOKENS  // 🆕 使用更大的 Token 限制
        );
        
        const data = parseJSON(result);
        
        // 处理数据...
        return processExtractedData(data, directorStyle);
    } catch (error) {
        console.error('❌ [extractAssetsFromChunk] 提取失败:', error);
        return { characters: [], scenes: [], props: [], costumes: [] };
    }
}

/**
 * 合并并去重资产
 */
function mergeAndDeduplicateAssets(results: ExtractedAssets[]): ExtractedAssets {
    const merged: ExtractedAssets = {
        characters: [],
        scenes: [],
        props: [],
        costumes: []
    };

    // 合并所有结果
    for (const result of results) {
        merged.characters.push(...result.characters);
        merged.scenes.push(...result.scenes);
        merged.props.push(...result.props);
        merged.costumes.push(...result.costumes);
    }

    // 去重（基于名称）
    merged.characters = deduplicateByName(merged.characters);
    merged.scenes = deduplicateByName(merged.scenes);
    merged.props = deduplicateByName(merged.props);
    merged.costumes = deduplicateByName(merged.costumes);

    return merged;
}

/**
 * 根据名称去重
 */
function deduplicateByName<T extends { name: string }>(items: T[]): T[] {
    const seen = new Map<string, T>();
    
    for (const item of items) {
        const key = item.name.trim().toLowerCase();
        if (!seen.has(key)) {
            seen.set(key, item);
        } else {
            // 如果已存在，合并信息（保留更详细的描述）
            const existing = seen.get(key)!;
            const merged = mergeAssetInfo(existing, item);
            seen.set(key, merged);
        }
    }
    
    return Array.from(seen.values());
}

/**
 * 合并资产信息
 */
function mergeAssetInfo<T extends any>(existing: T, newItem: T): T {
    // 保留更长的描述
    const merged = { ...existing };
    
    for (const key in newItem) {
        if (typeof newItem[key] === 'string') {
            if (!existing[key] || newItem[key].length > existing[key].length) {
                merged[key] = newItem[key];
            }
        }
    }
    
    return merged;
}
```

---

## 🧪 测试方案

### 测试 1: 短文本（< 10000 字）
- 使用方案 1（增加 Token）
- 验证提取完整性

### 测试 2: 中等文本（10000-30000 字）
- 使用方案 4（分批处理）
- 验证分批和合并逻辑

### 测试 3: 长文本（> 30000 字）
- 使用方案 4（分批处理）
- 验证性能和准确性

---

## 📊 预期效果

### 修复前
- 文本长度 > 15000 字：后面内容被忽略
- AI 输出被截断：只能提取部分资产
- 用户体验差：提取不完整

### 修复后
- 支持任意长度文本
- 完整提取所有资产
- 自动去重合并
- 显示处理进度

---

## 🚀 下一步

1. **立即修复**: 实施方案 1（5分钟）
2. **完整优化**: 实施方案 4（1-2小时）
3. **测试验证**: 使用不同长度的文本测试
4. **用户反馈**: 收集使用反馈

---

**创建时间**: 2026-01-19 23:00  
**优先级**: 🔴 高  
**预计时间**: 立即修复 5分钟，完整优化 1-2小时
