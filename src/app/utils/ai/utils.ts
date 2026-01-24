/**
 * AI 模块通用工具函数
 * 从 aiService.ts 拆分
 */

// 开发环境日志工具（生产环境不输出）
const isDev = import.meta.env?.DEV ?? true;

export const devLog = (...args: any[]) => {
  if (isDev) console.log(...args);
};

/**
 * AI 调用重试机制（指数退避）
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e as Error;
      console.warn(`[重试机制] 第 ${i + 1} 次调用失败，${i < maxRetries - 1 ? `${baseDelay * Math.pow(2, i)}ms 后重试` : '已达最大重试次数'}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
      }
    }
  }
  throw lastError || new Error('未知错误');
}

/**
 * 角色一致性检查（返回未知角色列表）
 */
export function checkCharacterConsistency(
  panelCharacters: string[],
  assetCharacters: { name: string }[]
): string[] {
  if (!panelCharacters || panelCharacters.length === 0) return [];
  const knownNames = new Set(assetCharacters.map(c => c.name));
  return panelCharacters.filter(name => !knownNames.has(name));
}

/**
 * 将长文本分段
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 10000,
  overlap: number = 500
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end);
    chunks.push(chunk);

    // 如果还有剩余文本，向后移动（减去重叠部分）
    if (end < text.length) {
      start = end - overlap;
    } else {
      break;
    }
  }

  return chunks;
}

/**
 * 智能分块：尝试按场号切分剧本
 * 优先匹配：第X场、内景、外景、INT.、EXT.
 */
export function splitScriptByScenes(
  text: string,
  maxChunkSize: number = 8000
): string[] {
  // 如果文本较短，直接返回
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentStart = 0;

  // 场景标题正则
  const sceneHeaderRegex = /(?:^|\n)\s*(?:第[0-9一二三四五六七八九十]+[场幕]|内景|外景|INT\.|EXT\.)/gi;

  while (currentStart < text.length) {
    let splitIndex = -1;
    const searchStart = currentStart + maxChunkSize * 0.8; // 从 80% 处开始寻找分割点
    const searchEnd = Math.min(currentStart + maxChunkSize, text.length);

    // 如果剩余部分小于 chunk size，直接作为一个 chunk
    if (text.length - currentStart <= maxChunkSize) {
      chunks.push(text.substring(currentStart));
      break;
    }

    // 在 searchStart 和 searchEnd 之间寻找最佳分割点（场景标题）
    const searchArea = text.substring(searchStart, searchEnd);
    const matches = Array.from(searchArea.matchAll(sceneHeaderRegex));

    if (matches.length > 0) {
      // 找到分割点
      // match.index 是相对于 searchArea 的
      const lastMatch = matches[matches.length - 1];
      if (lastMatch.index !== undefined) {
        splitIndex = searchStart + lastMatch.index;
      }
    }

    // 如果没找到场景分割点，退化为寻找换行符
    if (splitIndex === -1) {
      const lastNewLine = text.lastIndexOf('\n', searchEnd);
      if (lastNewLine > currentStart + maxChunkSize * 0.5) {
        splitIndex = lastNewLine;
      }
    }

    // 如果还没找到，硬切分
    if (splitIndex === -1) {
      splitIndex = searchEnd;
    }

    // 添加 chunk
    chunks.push(text.substring(currentStart, splitIndex));
    currentStart = splitIndex;
  }

  return chunks;
}
