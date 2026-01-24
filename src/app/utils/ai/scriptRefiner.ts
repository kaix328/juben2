/**
 * 剧本润色引擎
 * Script Refiner
 * 
 * 负责构建上下文感知的 AI 改写 Prompt，并调用 LLM 进行文本优化。
 */
import { getStylePrompt } from '../prompts/writingStyles';
import type { Character } from '../../types';
import { aiService } from '../../services/aiService';

export interface RewriteContext {
    projectId: string;
    chapterId: string;
    characters?: Character[]; // 本章出现的角色
    previousText?: string;    // 前文摘要或最后几段
    summary?: string;         // 故事梗概
}

export interface RewriteOptions {
    instruction?: string;      // 用户输入的具体指令
    styleId?: string;          // 选用的文风 ID
    mode?: 'refine' | 'expand' | 'shorten' | 'polish'; // 改写模式
    creativity?: number;       // 创意度 (temperature)
}

export class ScriptRefiner {

    /**
     * 执行改写
     * @param selection 选中的原始文本
     * @param context 上下文信息
     * @param options 改写选项
     */
    async refine(selection: string, context: RewriteContext, options: RewriteOptions): Promise<string> {
        const prompt = this.buildPrompt(selection, context, options);

        try {
            // 调用 LLM
            const response = await aiService.text.generate({
                prompt,
                temperature: options.creativity || 0.7,
                maxTokens: 4000 // 增加 Token 上限，防止长文截断
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || '生成失败');
            }

            return this.cleanOutput(response.data);
        } catch (error) {
            console.error('Script Rewrite Failed:', error);
            throw error;
        }
    }

    /**
     * 构建 Prompt
     */
    private buildPrompt(selection: string, context: RewriteContext, options: RewriteOptions): string {
        const stylePrompt = options.styleId ? getStylePrompt(options.styleId) : '';

        // 角色上下文
        let characterContext = '';
        if (context.characters && context.characters.length > 0) {
            characterContext = `\n【涉及角色】\n${context.characters
                .map(c => `- ${c.name}: ${c.personality || '无性格描述'} (${c.gender || '未知'})`)
                .join('\n')}`;
        }

        // 剧情上下文
        let storyContext = '';
        if (context.summary) {
            storyContext += `\n【故事背景】\n${context.summary}\n`;
        }
        if (context.previousText) {
            storyContext += `\n【前文情境】\n${context.previousText}\n`;
        }

        // 构建 System Prompt
        return `你是一位专业的剧本医生和资深小说编辑。请根据以下要求对选中的文本片段进行专业改写。

${characterContext}
${storyContext}

【改写目标】
1. 核心指令：${options.instruction || this.getModeInstruction(options.mode)}
2. 写作风格：${stylePrompt || '保持原文风格，提升文笔质感'}
3. 约束条件：
   - 保持剧情核心逻辑不变
   - 符合角色性格设定 (不OOC)
   - 格式规范 (剧本/小说格式)
   - ⚠️ 必须完整改写整段文本，严禁中途截断或只改写一部分！
   - 仅输出改写后的正文，不要包含"好的"、"改写如下"等废话

【原始文本】
${selection}
`;
    }

    /**
     * 获取模式默认指令
     */
    private getModeInstruction(mode?: string): string {
        switch (mode) {
            case 'expand': return '扩写这段内容，丰富动作描写和感官细节，增加画面感。';
            case 'shorten': return '精简这段内容，去除冗余修饰，保留核心动作和对白，加快节奏。';
            case 'polish': return '润色这段文字，优化词汇选择，提升文学性，修正语病。';
            default: return '优化这段内容，使其更自然流畅。';
        }
    }

    /**
     * 清理输出
     */
    private cleanOutput(text: string): string {
        return text.trim().replace(/^["']|["']$/g, '');
    }
}

export const scriptRefiner = new ScriptRefiner();
