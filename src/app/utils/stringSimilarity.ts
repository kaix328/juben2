/**
 * 字符串相似度工具
 * 用于资产库去重和模糊匹配
 */

/**
 * 计算 Levenshtein 距离（编辑距离）
 */
export function levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) matrix[i] = [i];
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // 删除
                matrix[i][j - 1] + 1,      // 插入
                matrix[i - 1][j - 1] + cost // 替换
            );
        }
    }
    return matrix[len1][len2];
}

/**
 * 计算相似度分数 (0 到 1)
 */
export function calculateSimilarity(s1: string, s2: string): number {
    const str1 = s1.trim().toLowerCase();
    const str2 = s2.trim().toLowerCase();

    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    // 基础相似度
    let score = 1 - distance / maxLength;

    // 特殊情况增强：如果一个字符串包含另一个字符串
    if (str1.includes(str2) || str2.includes(str1)) {
        score = Math.max(score, 0.85);
    }

    return score;
}

/**
 * 在资产列表中寻找潜在重复项
 */
export function findPotentialDuplicates<T extends { name: string; aliases?: string[] }>(
    newItem: T,
    existingItems: T[],
    threshold: number = 0.7
): { item: T; score: number }[] {
    const results: { item: T; score: number }[] = [];
    const newName = newItem.name.trim().toLowerCase();

    for (const existing of existingItems) {
        let maxScore = calculateSimilarity(newName, existing.name);

        // 检查别名
        if (existing.aliases) {
            for (const alias of existing.aliases) {
                maxScore = Math.max(maxScore, calculateSimilarity(newName, alias));
            }
        }

        if (maxScore >= threshold) {
            results.push({ item: existing, score: maxScore });
        }
    }

    return results.sort((a, b) => b.score - a.score);
}
