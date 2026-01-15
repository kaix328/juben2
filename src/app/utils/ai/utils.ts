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
