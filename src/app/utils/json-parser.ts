/**
 * JSON 解析工具模块
 * 从 volcApi.ts 提取并优化的 JSON 解析逻辑
 */

/**
 * 清理 JSON 文本中的常见格式问题
 */
function sanitizeJsonText(text: string): string {
    let cleaned = text
        .replace(/[\u201c\u201d]/g, '"')  // 中文双引号 → 英文双引号
        .replace(/[\u2018\u2019]/g, "'")  // 中文单引号 → 英文单引号
        .replace(/，/g, ',')              // 中文逗号 → 英文逗号
        .replace(/：/g, ':')              // 中文冒号 → 英文冒号
        .replace(/\n\s*\/\/[^\n]*/g, '')  // 移除 JavaScript 注释
        .replace(/,(\s*[}\]])/g, '$1')    // 移除尾部逗号
        .replace(/}\s*\n\s*{/g, '},{')    // 修复对象之间缺少逗号
        .replace(/]\s*\n\s*\[/g, '],[');  // 修复数组之间缺少逗号

    return cleaned;
}

/**
 * 修复常见的 JSON 语法错误
 */
function fixJsonSyntax(json: string): string {
    let fixed = json
        .replace(/""(\s*[\}\]])/g, '"$1')  // 修复缺少逗号的情况
        .replace(/,\s*,/g, ',')            // 修复多余的逗号
        .replace(/([\{\[,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // 修复缺少引号的键
        .replace(/[\x00-\x1F\x7F]/g, ' ')  // 移除控制字符
        .replace(/,(\s*[\}\]])/g, '$1');   // 移除尾部逗号

    return fixed;
}


/**
 * 从 Markdown 代码块中提取 JSON
 */
function extractFromMarkdown(text: string): any | null {
    // 尝试多种 Markdown 代码块格式
    const patterns = [
        /```json\s*([\s\S]*?)\s*```/,  // ```json ... ```
        /```\s*([\s\S]*?)\s*```/,       // ``` ... ```
        /`{3,}\s*json\s*([\s\S]*?)`{3,}/,  // 支持更多反引号
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            try {
                const cleaned = sanitizeJsonText(match[1]);
                const fixed = fixJsonSyntax(cleaned);
                const result = JSON.parse(fixed);
                console.log('[extractFromMarkdown] 成功从 Markdown 提取 JSON');
                return result;
            } catch (e) {
                console.log('[extractFromMarkdown] 解析失败，尝试下一个模式', e);
                continue;
            }
        }
    }
    return null;
}

/**
 * 逐个对象解析（处理格式不完整的情况）
 */
/**
 * 逐个对象解析（处理格式不完整的情况）
 * 改进：使用括号计数法支持嵌套对象
 */
function extractObjects(text: string): any[] | null {
    const validObjects: any[] = [];
    let braceCount = 0;
    let startIndex = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inString) {
            if (escape) {
                escape = false;
            } else if (char === '\\') {
                escape = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') {
            if (braceCount === 0) {
                startIndex = i;
            }
            braceCount++;
        } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && startIndex !== -1) {
                // 找到了一个完整的最外层对象
                const objStr = text.substring(startIndex, i + 1);
                try {
                    const obj = JSON.parse(fixJsonSyntax(objStr));
                    if (obj && typeof obj === 'object') {
                        validObjects.push(obj);
                    }
                } catch {
                    // 尝试修复并解析
                    try {
                        // 移除可能的尾部逗号等
                        const fixed = objStr.replace(/,(\s*})$/, '$1');
                        const obj = JSON.parse(fixed);
                        if (obj && typeof obj === 'object') {
                            validObjects.push(obj);
                        }
                    } catch {
                        // 忽略解析失败的对象
                    }
                }
                startIndex = -1;
            }
        }
    }

    return validObjects.length > 0 ? validObjects : null;
}

/**
 * 从长文本中寻找包含特定 key 的 JSON 对象
 */
function extractByKeyPatterns(text: string): any | null {
    const keyPatterns = ['"characters"', '"scenes"', '"props"', '"costumes"'];

    for (const key of keyPatterns) {
        const keyIndex = text.indexOf(key);
        if (keyIndex === -1) continue;

        // 向上寻找最近的 {
        const startBrace = text.lastIndexOf('{', keyIndex);
        if (startBrace === -1) continue;

        // 向下寻找匹配的 }
        let braceCount = 0;
        let endBrace = -1;
        for (let i = startBrace; i < text.length; i++) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endBrace = i;
                    break;
                }
            }
        }

        if (endBrace !== -1) {
            try {
                const potentialJson = text.substring(startBrace, endBrace + 1);
                return JSON.parse(fixJsonSyntax(potentialJson));
            } catch {
                // 继续尝试其他模式
            }
        }
    }
    return null;
}

/**
 * 提取并修复 JSON 数组（增强版）
 */
function extractArray(text: string): any | null {
    // 尝试找到数组的开始
    const startIndex = text.indexOf('[');
    if (startIndex === -1) return null;

    // 从开始位置提取到文本末尾
    let jsonStr = text.substring(startIndex);

    // 尝试多次修复和解析
    const attempts = [
        // 尝试1：直接解析
        () => {
            console.log('[extractArray] 尝试1: 直接解析');
            return JSON.parse(jsonStr);
        },

        // 尝试2：修复语法后解析
        () => {
            console.log('[extractArray] 尝试2: 修复语法后解析');
            return JSON.parse(fixJsonSyntax(jsonStr));
        },

        // 尝试3：补全缺失的括号
        () => {
            console.log('[extractArray] 尝试3: 补全缺失的括号');
            let fixed = fixJsonSyntax(jsonStr);
            const openBrackets = (fixed.match(/\[/g) || []).length;
            const closeBrackets = (fixed.match(/\]/g) || []).length;
            const openBraces = (fixed.match(/\{/g) || []).length;
            const closeBraces = (fixed.match(/\}/g) || []).length;

            console.log(`[extractArray] 括号统计: [ ${openBrackets}/${closeBrackets}, { ${openBraces}/${closeBraces}`);

            if (openBraces > closeBraces) {
                fixed += '}'.repeat(openBraces - closeBraces);
            }
            if (openBrackets > closeBrackets) {
                fixed += ']'.repeat(openBrackets - closeBrackets);
            }
            return JSON.parse(fixed);
        },

        // 尝试4：截断到最后一个完整对象
        () => {
            console.log('[extractArray] 尝试4: 截断到最后一个完整对象');
            const lastCompleteObject = jsonStr.lastIndexOf('}');
            if (lastCompleteObject === -1) throw new Error('No complete object');

            let truncated = jsonStr.substring(0, lastCompleteObject + 1);
            // 确保数组闭合
            if (!truncated.trim().endsWith(']')) {
                truncated += ']';
            }
            const fixed = fixJsonSyntax(truncated);
            console.log('[extractArray] 截断后长度:', fixed.length);
            return JSON.parse(fixed);
        },

        // 尝试5：更激进的修复 - 移除所有问题字符
        () => {
            console.log('[extractArray] 尝试5: 激进修复');
            let fixed = jsonStr
                .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')  // 移除所有控制字符
                .replace(/,(\s*[}\]])/g, '$1')           // 移除尾部逗号
                .replace(/,\s*,/g, ',');                 // 移除重复逗号

            // 补全括号
            const openBrackets = (fixed.match(/\[/g) || []).length;
            const closeBrackets = (fixed.match(/\]/g) || []).length;
            const openBraces = (fixed.match(/\{/g) || []).length;
            const closeBraces = (fixed.match(/\}/g) || []).length;

            if (openBraces > closeBraces) {
                fixed += '}'.repeat(openBraces - closeBraces);
            }
            if (openBrackets > closeBrackets) {
                fixed += ']'.repeat(openBrackets - closeBrackets);
            }

            return JSON.parse(fixed);
        },

        // 尝试6：基于错误位置的智能修复
        () => {
            console.log('[extractArray] 尝试6: 基于错误位置修复');
            try {
                JSON.parse(jsonStr);
            } catch (e: any) {
                if (e instanceof SyntaxError && e.message.includes('position')) {
                    const match = e.message.match(/position (\d+)/);
                    if (match) {
                        const errorPos = parseInt(match[1]);
                        console.log('[extractArray] 检测到错误位置:', errorPos);

                        // 截断到错误位置之前的最后一个完整对象
                        const beforeError = jsonStr.substring(0, errorPos);
                        const lastCloseBrace = beforeError.lastIndexOf('}');

                        if (lastCloseBrace > 0) {
                            let truncated = jsonStr.substring(0, lastCloseBrace + 1);
                            if (!truncated.trim().endsWith(']')) {
                                truncated += ']';
                            }
                            console.log('[extractArray] 截断到位置:', lastCloseBrace);
                            return JSON.parse(truncated);
                        }
                    }
                }
            }
            throw new Error('无法基于错误位置修复');
        }
    ];

    for (let i = 0; i < attempts.length; i++) {
        try {
            const result = attempts[i]();
            if (result && Array.isArray(result) && result.length > 0) {
                console.log(`[extractArray] 尝试 ${i + 1} 成功，提取了 ${result.length} 个元素`);
                return result;
            }
        } catch (e) {
            console.log(`[extractArray] 尝试 ${i + 1} 失败:`, e instanceof Error ? e.message : e);
            // 继续下一个尝试
        }
    }

    console.log('[extractArray] 所有尝试都失败');
    return null;
}

/**
 * 提取并修复 JSON 对象（增强版）
 */
function extractObject(text: string): any | null {
    // 查找第一个 {
    const startIndex = text.indexOf('{');
    if (startIndex === -1) return null;

    // 从开始位置提取
    let jsonStr = text.substring(startIndex);

    // 尝试多种策略
    const attempts = [
        // 尝试1：直接解析
        () => {
            console.log('[extractObject] 尝试1: 直接解析');
            return JSON.parse(fixJsonSyntax(jsonStr));
        },

        // 尝试2：查找匹配的闭合括号
        () => {
            console.log('[extractObject] 尝试2: 查找匹配的闭合括号');
            let braceCount = 0;
            let endIndex = -1;

            for (let i = 0; i < jsonStr.length; i++) {
                if (jsonStr[i] === '{') braceCount++;
                else if (jsonStr[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        endIndex = i;
                        break;
                    }
                }
            }

            if (endIndex > 0) {
                const extracted = jsonStr.substring(0, endIndex + 1);
                return JSON.parse(fixJsonSyntax(extracted));
            }
            throw new Error('未找到匹配的闭合括号');
        },

        // 尝试3：逐步截断直到找到有效的 JSON
        () => {
            console.log('[extractObject] 尝试3: 逐步截断');
            let testStr = jsonStr;
            while (testStr.length > 2) {
                if (testStr.endsWith('}')) {
                    try {
                        return JSON.parse(fixJsonSyntax(testStr));
                    } catch {
                        // 继续截断
                    }
                }
                testStr = testStr.slice(0, -1);
            }
            throw new Error('无法找到有效的 JSON');
        },

        // 尝试4：基于错误位置智能修复
        () => {
            console.log('[extractObject] 尝试4: 基于错误位置修复');
            try {
                JSON.parse(jsonStr);
            } catch (e: any) {
                if (e instanceof SyntaxError && e.message.includes('position')) {
                    const match = e.message.match(/position (\d+)/);
                    if (match) {
                        const errorPos = parseInt(match[1]);
                        console.log('[extractObject] 检测到错误位置:', errorPos);

                        // 截断到错误位置之前的最后一个完整字段
                        const beforeError = jsonStr.substring(0, errorPos);

                        // 查找最后一个逗号或闭合括号
                        const lastComma = beforeError.lastIndexOf(',');
                        const lastCloseBrace = beforeError.lastIndexOf('}');
                        const cutPoint = Math.max(lastComma, lastCloseBrace);

                        if (cutPoint > 0) {
                            let truncated = jsonStr.substring(0, cutPoint + 1);

                            // 补全缺失的闭合括号
                            const openBraces = (truncated.match(/\{/g) || []).length;
                            const closeBraces = (truncated.match(/\}/g) || []).length;
                            if (openBraces > closeBraces) {
                                truncated += '}'.repeat(openBraces - closeBraces);
                            }

                            console.log('[extractObject] 截断并修复后长度:', truncated.length);
                            return JSON.parse(truncated);
                        }
                    }
                }
            }
            throw new Error('无法基于错误位置修复');
        }
    ];

    for (let i = 0; i < attempts.length; i++) {
        try {
            const result = attempts[i]();
            if (result && typeof result === 'object') {
                console.log(`[extractObject] 尝试 ${i + 1} 成功`);
                return result;
            }
        } catch (e) {
            console.log(`[extractObject] 尝试 ${i + 1} 失败:`, e instanceof Error ? e.message : e);
        }
    }

    console.log('[extractObject] 所有尝试都失败');
    return null;
}

/**
 * 智能 JSON 解析
 * 支持从各种格式（Markdown 代码块、不完整 JSON 等）中提取 JSON 数据
 * 
 * @param text - 待解析的文本
 * @returns 解析后的 JSON 对象/数组，解析失败返回空对象
 */
export function parseJSON(text: string): any {
    console.log('[parseJSON] 开始解析，文本长度:', text?.length || 0);
    console.log('[parseJSON] 文本预览:', text?.substring(0, 300));

    if (!text || text.trim().length === 0) {
        console.error('[parseJSON] 输入文本为空！');
        return { characters: [], scenes: [], props: [], costumes: [] };
    }

    // 1. 策略1：优先从 Markdown 代码块提取（AI 经常返回这种格式）
    const fromMarkdown = extractFromMarkdown(text);
    if (fromMarkdown) {
        console.log('[parseJSON] Markdown 提取成功！');
        return ensureCompleteStructure(fromMarkdown);
    }

    // 2. 预处理：清理常见格式问题
    const cleanText = sanitizeJsonText(text);

    // 3. 策略2：直接解析
    try {
        const result = JSON.parse(fixJsonSyntax(cleanText));
        console.log('[parseJSON] 直接解析成功！');
        return ensureCompleteStructure(result);
    } catch (e) {
        console.log('[parseJSON] 直接解析失败，尝试其他策略...', e);
    }

    // 4. 策略3：逐个对象解析（优先于整体数组解析，因为容错性更高）
    const objects = extractObjects(cleanText);
    if (objects) {
        console.log(`[parseJSON] 逐对象解析成功，提取了 ${objects.length} 个对象`);
        return ensureCompleteStructure(objects);
    }

    // 5. 策略4：尝试提取数组 (作为备选)
    const array = extractArray(cleanText);
    if (array) {
        console.log('[parseJSON] 数组提取成功！');
        return ensureCompleteStructure(array);
    }

    // 6. 策略5：尝试提取单个对象
    const object = extractObject(cleanText);
    if (object && typeof object === 'object' && !Array.isArray(object)) {
        console.log('[parseJSON] 单对象提取成功！');
        return ensureCompleteStructure(object);
    }

    // 7. 策略6：按特定 key 模式提取
    const byKey = extractByKeyPatterns(text);
    if (byKey) {
        console.log('[parseJSON] 按 key 模式提取成功！');
        return ensureCompleteStructure(byKey);
    }

    // 8. 全部失败，返回空结构
    console.error('[parseJSON] 所有解析策略失败！');
    console.error('[parseJSON] 原始文本:', text.substring(0, 1000));
    console.warn('[parseJSON] 返回空结构');
    return { characters: [], scenes: [], props: [], costumes: [] };
}

/**
 * 确保返回的数据结构完整（包含 characters、scenes、props、costumes）
 */
function ensureCompleteStructure(data: any): any {
    // 如果是数组，尝试转换为对象结构
    if (Array.isArray(data)) {
        console.log('[ensureCompleteStructure] 输入是数组，尝试转换为对象结构');

        // 尝试检测数组内容类型
        const isSceneArray = data.some((item: any) => item.sceneNumber || item.location || item.sceneType);

        // 🆕 检测是否是分镜数组 (Storyboard Panel Array)
        const isPanelArray = data.some((item: any) =>
            item.sceneId || item.shotSize || item.shot || (item.panelNumber && item.description)
        );

        if (isSceneArray || isPanelArray) {
            return data; // 直接返回数组，由调用方（如 scriptExtractor 或 storyboardGenerator）自行处理
        }

        return {
            characters: data.filter((item: any) =>
                (item.name && (item.age || item.role || item.description)) ||
                (item.age || item.hair || item.facialFeatures || item.personality || item.appearance)
            ),
            scenes: data.filter((item: any) =>
                item.location || item.spaceType || item.lighting || item.atmosphere || item.environment
            ),
            props: data.filter((item: any) =>
                item.category || item.significance || (item.material && !item.style)
            ),
            costumes: data.filter((item: any) =>
                item.characterName || (item.material && item.style && item.color)
            )
        };
    }

    // 如果是对象，确保包含所有必需的数组
    if (typeof data === 'object' && data !== null) {
        // 🆕 检测是否是单个场景对象直接返回的情况
        if (data.sceneNumber || (data.location && data.action)) {
            return {
                characters: [],
                scenes: [data],
                props: [],
                costumes: []
            };
        }

        return {
            characters: Array.isArray(data.characters) ? data.characters : [],
            scenes: Array.isArray(data.scenes) ? data.scenes : [],
            props: Array.isArray(data.props) ? data.props : [],
            costumes: Array.isArray(data.costumes) ? data.costumes : []
        };
    }

    // 其他情况返回空结构
    return { characters: [], scenes: [], props: [], costumes: [] };
}
