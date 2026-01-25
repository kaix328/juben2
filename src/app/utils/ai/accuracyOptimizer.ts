/**
 * AI 分析准确度优化模块
 * 提供多种策略提升 AI 提取和分析的准确性
 */

import { callDeepSeek, parseJSON } from '../volcApi';

/**
 * AI 提示词优化策略
 */
export const PROMPT_STRATEGIES = {
  // 结构化输出策略
  structuredOutput: {
    prefix: '【重要】请严格按照以下结构输出，不要添加任何额外说明：\n',
    suffix: '\n\n请确保输出是有效的 JSON 格式，不要使用 Markdown 代码块。',
  },

  // 示例驱动策略（Few-shot Learning）
  fewShot: {
    examples: [
      {
        input: '小明走进房间，看到桌上有一封信。',
        output: {
          sceneNumber: 1,
          location: '房间',
          timeOfDay: '白天',
          sceneType: 'INT',
          action: '小明走进房间，目光落在桌上的一封信上。',
          characters: ['小明'],
          dialogues: [],
          estimatedDuration: 10,
        },
      },
    ],
  },

  // 分步推理策略（Chain-of-Thought）
  chainOfThought: {
    steps: [
      '1. 识别场景：确定地点、时间、内外景',
      '2. 提取角色：列出所有出现的角色',
      '3. 分析动作：将叙述转换为视觉化描述',
      '4. 提取对白：识别并格式化所有对话',
      '5. 估算时长：根据内容量估算场景时长',
    ],
  },

  // 自我验证策略
  selfVerification: {
    checks: [
      '检查是否所有必需字段都已填写',
      '检查场景编号是否连续',
      '检查角色名称是否一致',
      '检查对白是否完整',
      '检查时长估算是否合理',
    ],
  },
};

/**
 * 增强的提示词构建器
 */
export class EnhancedPromptBuilder {
  private basePrompt: string = '';
  private strategies: string[] = [];
  private examples: any[] = [];
  private constraints: string[] = [];

  constructor(basePrompt: string) {
    this.basePrompt = basePrompt;
  }

  /**
   * 添加结构化输出约束
   */
  addStructuredOutput(): this {
    this.strategies.push(PROMPT_STRATEGIES.structuredOutput.prefix);
    this.constraints.push(PROMPT_STRATEGIES.structuredOutput.suffix);
    return this;
  }

  /**
   * 添加示例（Few-shot）
   */
  addExamples(examples: any[]): this {
    this.examples = examples;
    return this;
  }

  /**
   * 添加分步推理
   */
  addChainOfThought(): this {
    const steps = PROMPT_STRATEGIES.chainOfThought.steps.join('\n');
    this.strategies.push(`\n【分析步骤】\n${steps}\n`);
    return this;
  }

  /**
   * 添加自我验证
   */
  addSelfVerification(): this {
    const checks = PROMPT_STRATEGIES.selfVerification.checks.join('\n');
    this.strategies.push(`\n【输出前请自我检查】\n${checks}\n`);
    return this;
  }

  /**
   * 添加格式约束
   */
  addFormatConstraints(): this {
    this.constraints.push(`
【格式要求】
1. 必须返回有效的 JSON 数组
2. 不要使用 Markdown 代码块（不要用 \`\`\` 包裹）
3. 所有字符串中的引号必须转义
4. 所有对象必须有完整的闭合括号
5. 字符串中的换行使用 \\n 转义
6. 数字类型不要加引号
7. 布尔值使用 true/false，不要加引号
`);
    return this;
  }

  /**
   * 构建最终提示词
   */
  build(): string {
    let prompt = '';

    // 添加策略
    if (this.strategies.length > 0) {
      prompt += this.strategies.join('\n') + '\n\n';
    }

    // 添加示例
    if (this.examples.length > 0) {
      prompt += '【参考示例】\n';
      this.examples.forEach((example, index) => {
        prompt += `示例 ${index + 1}：\n`;
        prompt += `输入：${example.input}\n`;
        prompt += `输出：${JSON.stringify(example.output, null, 2)}\n\n`;
      });
    }

    // 添加基础提示词
    prompt += this.basePrompt;

    // 添加约束
    if (this.constraints.length > 0) {
      prompt += '\n\n' + this.constraints.join('\n');
    }

    return prompt;
  }
}

/**
 * 结果验证器
 */
export class ResultValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * 验证场景数据
   */
  validateScenes(scenes: any[]): { valid: boolean; errors: string[]; warnings: string[] } {
    this.errors = [];
    this.warnings = [];

    if (!Array.isArray(scenes)) {
      this.errors.push('返回数据不是数组');
      return this.getResult();
    }

    if (scenes.length === 0) {
      this.errors.push('场景数组为空');
      return this.getResult();
    }

    scenes.forEach((scene, index) => {
      this.validateScene(scene, index);
    });

    return this.getResult();
  }

  /**
   * 验证单个场景
   */
  private validateScene(scene: any, index: number): void {
    const sceneNum = index + 1;

    // 必需字段检查
    if (!scene.sceneNumber) {
      this.errors.push(`场景 ${sceneNum}: 缺少场景编号`);
    }
    if (!scene.location || typeof scene.location !== 'string') {
      this.errors.push(`场景 ${sceneNum}: 缺少或无效的地点`);
    }
    if (!scene.timeOfDay) {
      this.warnings.push(`场景 ${sceneNum}: 缺少时间`);
    }
    if (!scene.sceneType || !['INT', 'EXT', 'INT/EXT'].includes(scene.sceneType)) {
      this.warnings.push(`场景 ${sceneNum}: 场景类型无效`);
    }

    // 对白检查
    if (Array.isArray(scene.dialogues)) {
      scene.dialogues.forEach((dialogue: any, dIndex: number) => {
        if (!dialogue.character) {
          this.errors.push(`场景 ${sceneNum} 对白 ${dIndex + 1}: 缺少角色名`);
        }
        if (dialogue.lines === undefined || dialogue.lines === null) {
          this.errors.push(`场景 ${sceneNum} 对白 ${dIndex + 1}: 缺少台词内容`);
        }
      });
    }

    // 角色一致性检查
    if (Array.isArray(scene.characters) && Array.isArray(scene.dialogues)) {
      const dialogueCharacters = scene.dialogues.map((d: any) => d.character);
      const missingCharacters = dialogueCharacters.filter(
        (char: string) => !scene.characters.includes(char)
      );
      if (missingCharacters.length > 0) {
        this.warnings.push(
          `场景 ${sceneNum}: 对白中的角色 [${missingCharacters.join(', ')}] 未在角色列表中`
        );
      }
    }

    // 时长合理性检查
    if (scene.estimatedDuration) {
      if (scene.estimatedDuration < 5) {
        this.warnings.push(`场景 ${sceneNum}: 时长过短 (${scene.estimatedDuration}秒)`);
      }
      if (scene.estimatedDuration > 600) {
        this.warnings.push(`场景 ${sceneNum}: 时长过长 (${scene.estimatedDuration}秒)`);
      }
    }
  }

  private getResult() {
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }
}

/**
 * 智能修复器
 */
export class SmartFixer {
  /**
   * 修复场景数据
   */
  fixScenes(scenes: any[]): any[] {
    return scenes.map((scene, index) => this.fixScene(scene, index));
  }

  /**
   * 修复单个场景
   */
  private fixScene(scene: any, index: number): any {
    const fixed = { ...scene };

    // 修复场景编号
    if (!fixed.sceneNumber || typeof fixed.sceneNumber !== 'number') {
      fixed.sceneNumber = index + 1;
    }

    // 修复地点
    if (!fixed.location || typeof fixed.location !== 'string') {
      fixed.location = '未知场景';
    }

    // 修复时间
    if (!fixed.timeOfDay) {
      fixed.timeOfDay = this.inferTimeOfDay(fixed.action || '');
    }

    // 修复场景类型
    if (!fixed.sceneType || !['INT', 'EXT', 'INT/EXT'].includes(fixed.sceneType)) {
      fixed.sceneType = this.inferSceneType(fixed.location);
    }

    // 修复集数
    if (!fixed.episodeNumber || typeof fixed.episodeNumber !== 'number') {
      fixed.episodeNumber = 1;
    }

    // 修复角色列表
    if (!Array.isArray(fixed.characters)) {
      fixed.characters = [];
    }

    // 修复对白
    if (!Array.isArray(fixed.dialogues)) {
      fixed.dialogues = [];
    } else {
      fixed.dialogues = fixed.dialogues.map((d: any) => this.fixDialogue(d));
      
      // 自动补充角色列表
      const dialogueCharacters = fixed.dialogues.map((d: any) => d.character);
      dialogueCharacters.forEach((char: string) => {
        if (!fixed.characters.includes(char)) {
          fixed.characters.push(char);
        }
      });
    }

    // 修复动作描述
    if (!fixed.action) {
      fixed.action = '';
    }

    // 修复时长
    if (!fixed.estimatedDuration || typeof fixed.estimatedDuration !== 'number') {
      fixed.estimatedDuration = this.estimateDuration(fixed);
    }

    return fixed;
  }

  /**
   * 修复对白
   */
  private fixDialogue(dialogue: any): any {
    return {
      character: dialogue.character || '未知角色',
      lines: dialogue.lines || '',
      extension: dialogue.extension,
      parenthetical: dialogue.parenthetical,
      isFirstAppearance: dialogue.isFirstAppearance || false,
      isContinued: dialogue.isContinued || false,
    };
  }

  /**
   * 推断时间
   */
  private inferTimeOfDay(action: string): string {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('夜') || lowerAction.includes('晚')) return '夜晚';
    if (lowerAction.includes('晨') || lowerAction.includes('早')) return '清晨';
    if (lowerAction.includes('午')) return '中午';
    if (lowerAction.includes('傍晚') || lowerAction.includes('黄昏')) return '傍晚';
    return '白天';
  }

  /**
   * 推断场景类型
   */
  private inferSceneType(location: string): 'INT' | 'EXT' {
    const outdoor = ['街道', '公园', '广场', '山', '海边', '森林', '户外', '室外'];
    const lowerLocation = location.toLowerCase();
    
    for (const keyword of outdoor) {
      if (lowerLocation.includes(keyword)) {
        return 'EXT';
      }
    }
    
    return 'INT';
  }

  /**
   * 估算时长
   */
  private estimateDuration(scene: any): number {
    let duration = 15; // 基础时长

    // 根据动作描述长度
    if (scene.action) {
      duration += Math.min(scene.action.length / 10, 30);
    }

    // 根据对白数量
    if (Array.isArray(scene.dialogues)) {
      scene.dialogues.forEach((d: any) => {
        if (d.lines) {
          duration += Math.min(d.lines.length / 5, 20);
        }
      });
    }

    return Math.round(duration);
  }
}

/**
 * 重试策略
 */
export class RetryStrategy {
  private maxRetries: number;
  private retryDelay: number;

  constructor(maxRetries: number = 3, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * 带重试的 AI 调用
   */
  async callWithRetry<T>(
    fn: () => Promise<T>,
    validator?: (result: T) => boolean
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[RetryStrategy] 尝试 ${attempt}/${this.maxRetries}...`);
        const result = await fn();

        // 如果提供了验证器，验证结果
        if (validator && !validator(result)) {
          throw new Error('结果验证失败');
        }

        console.log(`[RetryStrategy] 成功！`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`[RetryStrategy] 尝试 ${attempt} 失败:`, error);

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw new Error(`重试 ${this.maxRetries} 次后仍然失败: ${lastError?.message}`);
  }
}

/**
 * 综合优化器
 */
export class AIAccuracyOptimizer {
  private promptBuilder: EnhancedPromptBuilder;
  private validator: ResultValidator;
  private fixer: SmartFixer;
  private retryStrategy: RetryStrategy;

  constructor() {
    this.promptBuilder = new EnhancedPromptBuilder('');
    this.validator = new ResultValidator();
    this.fixer = new SmartFixer();
    this.retryStrategy = new RetryStrategy(3, 1000);
  }

  /**
   * 优化的 AI 调用
   */
  async optimizedExtract(
    basePrompt: string,
    options: {
      useExamples?: boolean;
      useChainOfThought?: boolean;
      useSelfVerification?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<any[]> {
    // 构建增强的提示词
    this.promptBuilder = new EnhancedPromptBuilder(basePrompt);
    this.promptBuilder.addStructuredOutput().addFormatConstraints();

    if (options.useExamples) {
      this.promptBuilder.addExamples(PROMPT_STRATEGIES.fewShot.examples);
    }
    if (options.useChainOfThought) {
      this.promptBuilder.addChainOfThought();
    }
    if (options.useSelfVerification) {
      this.promptBuilder.addSelfVerification();
    }

    const enhancedPrompt = this.promptBuilder.build();

    // 带重试的调用
    if (options.maxRetries) {
      this.retryStrategy = new RetryStrategy(options.maxRetries, 1000);
    }

    return await this.retryStrategy.callWithRetry(
      async () => {
        const result = await callDeepSeek([{ role: 'user', content: enhancedPrompt }]);
        let scenes = parseJSON(result);

        // 兼容不同的返回格式
        if (!Array.isArray(scenes) && scenes?.scenes) {
          scenes = scenes.scenes;
        }

        // 验证
        const validation = this.validator.validateScenes(scenes);
        if (!validation.valid) {
          console.warn('[AIAccuracyOptimizer] 验证失败:', validation.errors);
          console.log('[AIAccuracyOptimizer] 尝试修复...');
        }

        // 修复
        const fixed = this.fixer.fixScenes(scenes);

        // 再次验证
        const finalValidation = this.validator.validateScenes(fixed);
        if (finalValidation.warnings.length > 0) {
          console.warn('[AIAccuracyOptimizer] 警告:', finalValidation.warnings);
        }

        return fixed;
      },
      (result) => Array.isArray(result) && result.length > 0
    );
  }
}
