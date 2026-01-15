/**
 * JSON 解析工具模块
 * 从 volcApi.ts 提取并优化的 JSON 解析逻辑
 */

/**
 * 清理 JSON 文本中的常见格式问题
 */
function sanitizeJsonText(text: string): string {
    return text
        .replace(/[\u201c\u201d]/g, '"')  // 中文双引号 → 英文双引号
        .replace(/[\u2018\u2019]/g, "'")  // 中文单引号 → 英文单引号
        .replace(/，/g, ',')              // 中文逗号 → 英文逗号
        .replace(/：/g, ':')              // 中文冒号 → 英文冒号
        .replace(/\n\s*\/\/[^\n]*/g, '')  // 移除 JavaScript 注释
        .replace(/,(\s*[}\]])/g, '$1')    // 移除尾部逗号
        .replace(/"\s*\n\s*"/g, '", "')   // 修复换行导致的字符串分割
        .replace(/}\s*\n\s*{/g, '},{')    // 修复对象之间缺少逗号
        .replace(/]\s*\n\s*\[/g, '],[');  // 修复数组之间缺少逗号
}

/**
 * 修复常见的 JSON 语法错误
 */
function fixJsonSyntax(json: string): string {
    return json
        .replace(/""(\s*[\}\]])/g, '"$1')  // 修复缺少逗号的情况
        .replace(/,\s*,/g, ',')            // 修复多余的逗号
        .replace(/([\{\[,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // 修复缺少引号的键
        .replace(/[\x00-\x1F\x7F]/g, ' ')  // 移除控制字符
        .replace(/([^\\])\\n/g, '$1\\\\n'); // 修复换行符在字符串中
}

/**
 * 从 Markdown 代码块中提取 JSON
 */
function extractFromMarkdown(text: string): any | null {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
        try {
            const cleaned = fixJsonSyntax(match[1]);
            return JSON.parse(cleaned);
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * 逐个对象解析（处理格式不完整的情况）
 */
function extractObjects(text: string): any[] | null {
    const objectMatches = text.match(/\{[^{}]*\}/g);
    if (!objectMatches || objectMatches.length === 0) return null;

    const validObjects: any[] = [];
    for (const objStr of objectMatches) {
        try {
            const obj = JSON.parse(fixJsonSyntax(objStr));
            if (obj && typeof obj === 'object') {
                validObjects.push(obj);
            }
        } catch {
            // 跳过无法解析的对象
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
 * 提取并修复 JSON 数组
 */
function extractArray(text: string): any | null {
    const arrayMatch = text.match(/\[[\s\S]*?\](?=\s*$|\s*[^\[\{])/);
    if (!arrayMatch) return null;

    try {
        let cleanJson = fixJsonSyntax(arrayMatch[0]);
        const openBrackets = (cleanJson.match(/\[/g) || []).length;
        const closeBrackets = (cleanJson.match(/\]/g) || []).length;
        if (openBrackets > closeBrackets) {
            cleanJson += ']'.repeat(openBrackets - closeBrackets);
        }
        return JSON.parse(cleanJson);
    } catch {
        return null;
    }
}

/**
 * 提取并修复 JSON 对象
 */
function extractObject(text: string): any | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    let jsonStr = match[0];

    // 尝试直接解析
    try {
        return JSON.parse(fixJsonSyntax(jsonStr));
    } catch {
        // 尝试截断到有效位置
        while (jsonStr.length > 2) {
            jsonStr = jsonStr.slice(0, -1);
            if (jsonStr.endsWith('}')) {
                try {
                    return JSON.parse(fixJsonSyntax(jsonStr));
                } catch {
                    continue;
                }
            }
        }
    }
    return null;
}

/**
 * 智能 JSON 解析
 * 支持从各种格式（Markdown 代码块、不完整 JSON 等）中提取 JSON 数据
 * 
 * @param text - 待解析的文本
 * @returns 解析后的 JSON 对象/数组，解析失败返回空数组
 */
export function parseJSON(text: string): any {
    // 1. 预处理：清理常见格式问题
    const cleanText = sanitizeJsonText(text);

    // 2. 策略1：直接解析
    try {
        return JSON.parse(fixJsonSyntax(cleanText));
    } catch {
        console.log('[parseJSON] 直接解析失败，尝试其他策略...');
    }

    // 3. 策略2：从 Markdown 代码块提取
    const fromMarkdown = extractFromMarkdown(text);
    if (fromMarkdown) return fromMarkdown;

    // 4. 策略3：逐个对象解析
    const objects = extractObjects(cleanText);
    if (objects) {
        console.log(`[parseJSON] 逐对象解析成功，提取了 ${objects.length} 个对象`);
        return objects;
    }

    // 5. 策略4：按特定 key 模式提取
    const byKey = extractByKeyPatterns(text);
    if (byKey) return byKey;

    // 6. 策略5：提取数组
    const array = extractArray(cleanText);
    if (array) return array;

    // 7. 策略6：提取对象
    const object = extractObject(cleanText);
    if (object) return object;

    // 8. 全部失败，返回空数组
    console.error('parseJSON failed, raw text:', text.substring(0, 500));
    console.warn('[parseJSON] 所有解析策略失败，返回空数组');
    return [];
}
