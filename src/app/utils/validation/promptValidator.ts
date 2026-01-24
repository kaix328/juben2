/**
 * 提示词验证器
 * 用于验证和优化 AI 绘图提示词的质量
 */

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

export interface PromptAnalysis {
  length: number;
  tokenCount: number;
  keywordCount: number;
  hasChinese: boolean;
  hasEnglish: boolean;
  languageMix: boolean;
  duplicateRate: number;
}

/**
 * 平台配置
 */
export const PLATFORM_LIMITS = {
  'stable-diffusion': {
    maxTokens: 150,
    maxLength: 500,
    supportsChinese: false,
    supportsWeights: true,
    supportsNegative: true,
  },
  'midjourney': {
    maxTokens: 200,
    maxLength: 800,
    supportsChinese: false,
    supportsWeights: false,
    supportsNegative: false,
  },
  'runway': {
    maxTokens: 300,
    maxLength: 1000,
    supportsChinese: false,
    supportsWeights: false,
    supportsNegative: false,
  },
  'doubao': {
    maxTokens: 500,
    maxLength: 2000,
    supportsChinese: true,
    supportsWeights: false,
    supportsNegative: true,
  },
  'default': {
    maxTokens: 200,
    maxLength: 800,
    supportsChinese: true,
    supportsWeights: false,
    supportsNegative: true,
  },
};

export class PromptValidator {
  /**
   * 分析提示词
   */
  static analyze(prompt: string): PromptAnalysis {
    const hasChinese = /[\u4e00-\u9fa5]/.test(prompt);
    const hasEnglish = /[a-zA-Z]/.test(prompt);
    
    // 估算 token 数量（粗略估计：中文1字=1token，英文1词=1token）
    const chineseChars = (prompt.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (prompt.match(/[a-zA-Z]+/g) || []).length;
    const tokenCount = chineseChars + englishWords;
    
    // 提取关键词
    const keywords = this.extractKeywords(prompt);
    
    // 计算重复率
    const duplicateRate = this.calculateDuplicateRate(prompt);
    
    return {
      length: prompt.length,
      tokenCount,
      keywordCount: keywords.length,
      hasChinese,
      hasEnglish,
      languageMix: hasChinese && hasEnglish,
      duplicateRate,
    };
  }

  /**
   * 验证提示词
   */
  static validate(prompt: string, platform: string = 'default'): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    const analysis = this.analyze(prompt);
    const limits = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS] || PLATFORM_LIMITS.default;
    
    // 1. 长度检查
    if (analysis.tokenCount > limits.maxTokens) {
      issues.push(`提示词过长（${analysis.tokenCount} tokens），建议精简到 ${limits.maxTokens} tokens 以内`);
    } else if (analysis.tokenCount > limits.maxTokens * 0.8) {
      warnings.push(`提示词接近长度限制（${analysis.tokenCount}/${limits.maxTokens} tokens）`);
    }
    
    if (analysis.length > limits.maxLength) {
      issues.push(`字符数过多（${analysis.length}），建议控制在 ${limits.maxLength} 以内`);
    }
    
    // 2. 语言检查
    if (!limits.supportsChinese && analysis.hasChinese) {
      issues.push(`${platform} 平台不支持中文，请使用纯英文提示词`);
      suggestions.push('建议使用英文描述或切换到支持中文的平台（如豆包）');
    }
    
    if (analysis.languageMix && platform !== 'doubao') {
      warnings.push('提示词中英文混杂，可能影响生成效果');
      suggestions.push('建议统一使用一种语言');
    }
    
    // 3. 关键词检查
    if (analysis.keywordCount < 3) {
      warnings.push('关键词过少，建议增加描述性词汇');
      suggestions.push('添加更多细节描述，如颜色、材质、风格等');
    }
    
    if (analysis.keywordCount > 50) {
      warnings.push('关键词过多，可能导致主题不明确');
      suggestions.push('保留最重要的关键词，删除次要描述');
    }
    
    // 4. 重复率检查
    if (analysis.duplicateRate > 0.3) {
      warnings.push(`关键词重复率过高（${Math.round(analysis.duplicateRate * 100)}%）`);
      suggestions.push('删除重复的描述词，或使用权重语法代替重复');
    }
    
    // 5. 空提示词检查
    if (!prompt || prompt.trim().length === 0) {
      issues.push('提示词为空');
    }
    
    // 6. 特殊字符检查
    const invalidChars = prompt.match(/[<>{}[\]\\]/g);
    if (invalidChars && invalidChars.length > 0) {
      warnings.push(`包含可能导致问题的特殊字符：${[...new Set(invalidChars)].join(' ')}`);
      suggestions.push('移除特殊字符，使用标准标点符号');
    }
    
    // 计算总分
    let score = 100;
    score -= issues.length * 20;
    score -= warnings.length * 10;
    score = Math.max(0, Math.min(100, score));
    
    return {
      isValid: issues.length === 0,
      score,
      issues,
      warnings,
      suggestions,
    };
  }

  /**
   * 清理和规范化提示词
   */
  static sanitize(prompt: string): string {
    let cleaned = prompt;
    
    // 1. 移除多余空格
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // 2. 移除特殊字符
    cleaned = cleaned.replace(/[<>{}[\]\\]/g, '');
    
    // 3. 规范化标点符号
    cleaned = cleaned.replace(/[，。！？；：]/g, (match) => {
      const map: Record<string, string> = {
        '，': ', ',
        '。': '. ',
        '！': '! ',
        '？': '? ',
        '；': '; ',
        '：': ': ',
      };
      return map[match] || match;
    });
    
    // 4. 移除连续的逗号
    cleaned = cleaned.replace(/,\s*,+/g, ', ');
    
    // 5. 移除首尾逗号
    cleaned = cleaned.replace(/^,\s*|,\s*$/g, '');
    
    return cleaned;
  }

  /**
   * 提取关键词
   */
  static extractKeywords(prompt: string): string[] {
    // 按逗号分割
    const parts = prompt.split(/[,，]/).map(p => p.trim()).filter(p => p.length > 0);
    
    // 去重
    return [...new Set(parts)];
  }

  /**
   * 计算重复率
   */
  static calculateDuplicateRate(prompt: string): number {
    const keywords = this.extractKeywords(prompt);
    if (keywords.length === 0) return 0;
    
    const uniqueKeywords = new Set(keywords.map(k => k.toLowerCase()));
    const duplicateCount = keywords.length - uniqueKeywords.size;
    
    return duplicateCount / keywords.length;
  }

  /**
   * 去重
   */
  static deduplicate(prompt: string): string {
    const keywords = this.extractKeywords(prompt);
    const seen = new Set<string>();
    const unique: string[] = [];
    
    keywords.forEach(keyword => {
      const normalized = keyword.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(keyword);
      }
    });
    
    return unique.join(', ');
  }

  /**
   * 精简提示词到指定长度
   */
  static truncate(prompt: string, maxTokens: number): string {
    const keywords = this.extractKeywords(prompt);
    const analysis = this.analyze(prompt);
    
    if (analysis.tokenCount <= maxTokens) {
      return prompt;
    }
    
    // 按重要性排序（保留前面的关键词）
    const truncated: string[] = [];
    let currentTokens = 0;
    
    for (const keyword of keywords) {
      const keywordAnalysis = this.analyze(keyword);
      if (currentTokens + keywordAnalysis.tokenCount <= maxTokens) {
        truncated.push(keyword);
        currentTokens += keywordAnalysis.tokenCount;
      } else {
        break;
      }
    }
    
    return truncated.join(', ');
  }

  /**
   * 转换为纯英文
   */
  static toEnglish(prompt: string): string {
    // 这里只做简单的中文标点转换
    // 实际的中英翻译需要调用翻译 API
    let english = prompt;
    
    // 转换标点符号
    english = english.replace(/，/g, ', ');
    english = english.replace(/。/g, '. ');
    english = english.replace(/！/g, '! ');
    english = english.replace(/？/g, '? ');
    english = english.replace(/；/g, '; ');
    english = english.replace(/：/g, ': ');
    
    // 移除中文字符（如果需要翻译，应该调用翻译 API）
    // 这里只是标记需要翻译
    const hasChinese = /[\u4e00-\u9fa5]/.test(english);
    if (hasChinese) {
      console.warn('[PromptValidator] 提示词包含中文，建议使用翻译 API 转换');
    }
    
    return english;
  }

  /**
   * 转换为纯中文
   */
  static toChinese(prompt: string): string {
    // 转换标点符号
    let chinese = prompt;
    chinese = chinese.replace(/,\s*/g, '，');
    chinese = chinese.replace(/\.\s*/g, '。');
    chinese = chinese.replace(/!\s*/g, '！');
    chinese = chinese.replace(/\?\s*/g, '？');
    chinese = chinese.replace(/;\s*/g, '；');
    chinese = chinese.replace(/:\s*/g, '：');
    
    return chinese;
  }

  /**
   * 计算质量评分
   */
  static calculateScore(prompt: string, platform: string = 'default'): number {
    const validation = this.validate(prompt, platform);
    return validation.score;
  }

  /**
   * 获取优化建议
   */
  static getSuggestions(prompt: string, platform: string = 'default'): string[] {
    const validation = this.validate(prompt, platform);
    return [...validation.issues, ...validation.warnings, ...validation.suggestions];
  }
}

/**
 * 便捷函数：快速验证
 */
export function validatePrompt(prompt: string, platform?: string): ValidationResult {
  return PromptValidator.validate(prompt, platform);
}

/**
 * 便捷函数：快速清理
 */
export function sanitizePrompt(prompt: string): string {
  return PromptValidator.sanitize(prompt);
}

/**
 * 便捷函数：快速去重
 */
export function deduplicatePrompt(prompt: string): string {
  return PromptValidator.deduplicate(prompt);
}
