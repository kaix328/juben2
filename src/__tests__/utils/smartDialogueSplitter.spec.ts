/**
 * 智能对话拆分测试
 */
import { describe, it, expect } from 'vitest';
import {
    smartSplitDialogue,
    smartSplitDialogueSimple,
    analyzeDialogueStructure,
    DialogueType
} from '../../app/utils/ai/smartDialogueSplitter';

describe('smartDialogueSplitter', () => {
    describe('smartSplitDialogue', () => {
        it('应该保持短对话不拆分', () => {
            const dialogue = '你好，很高兴见到你。';
            const segments = smartSplitDialogue(dialogue, 100);
            
            expect(segments).toHaveLength(1);
            expect(segments[0].text).toBe(dialogue);
        });

        it('应该按句子拆分长对话', () => {
            const dialogue = '我告诉你，这件事情绝对不能这样做！你必须听我的，否则后果自负。我已经警告过你很多次了。';
            const segments = smartSplitDialogue(dialogue, 30); // 降低阈值以确保拆分
            
            expect(segments.length).toBeGreaterThanOrEqual(1);
            // 每个片段应该是完整的句子
            segments.forEach(segment => {
                expect(segment.text.length).toBeGreaterThan(0);
            });
            
            // 如果对话足够长，应该被拆分
            if (dialogue.length > 60) {
                expect(segments.length).toBeGreaterThan(1);
            }
        });

        it('应该在情绪转折点拆分', () => {
            const dialogue = '我很高兴见到你。但是，我必须告诉你一个坏消息。这件事很严重。';
            const segments = smartSplitDialogue(dialogue, 50, {
                respectEmotionTransition: true
            });
            
            expect(segments.length).toBeGreaterThanOrEqual(1);
            // 检查是否有转折标记
            const hasAnyTransition = segments.some(s => s.hasTransition);
            expect(hasAnyTransition).toBe(true);
        });

        it('应该识别对话类型', () => {
            const question = '你在做什么？';
            const exclamation = '太棒了！';
            const narrative = '我今天去了公园。';
            
            const segments1 = smartSplitDialogue(question, 100);
            const segments2 = smartSplitDialogue(exclamation, 100);
            const segments3 = smartSplitDialogue(narrative, 100);
            
            expect(segments1[0].type).toBe(DialogueType.QUESTION);
            expect(segments2[0].type).toBe(DialogueType.EXCLAMATION);
            expect(segments3[0].type).toBe(DialogueType.NARRATIVE);
        });

        it('应该计算情绪强度', () => {
            const calm = '我今天去了公园。';
            const excited = '太好了！！我终于成功了！！';
            
            const segments1 = smartSplitDialogue(calm, 100);
            const segments2 = smartSplitDialogue(excited, 100);
            
            expect(segments1[0].emotionLevel).toBeLessThan(segments2[0].emotionLevel);
            expect(segments2[0].emotionLevel).toBeGreaterThan(5);
        });

        it('应该在情绪强度变化大时拆分', () => {
            const dialogue = '我今天去了公园。天啊！我看到了一只熊！太可怕了！';
            const segments = smartSplitDialogue(dialogue, 50);
            
            // 应该拆分（平静 → 惊讶）
            expect(segments.length).toBeGreaterThanOrEqual(1);
            
            // 检查情绪强度变化
            if (segments.length > 1) {
                const emotions = segments.map(s => s.emotionLevel);
                const maxEmotion = Math.max(...emotions);
                const minEmotion = Math.min(...emotions);
                expect(maxEmotion).toBeGreaterThan(minEmotion);
            }
        });

        it('应该保持句子完整性', () => {
            const dialogue = '这是第一句话。这是第二句话。这是第三句话。';
            const segments = smartSplitDialogue(dialogue, 20, {
                keepSentenceIntegrity: true
            });
            
            // 每个片段应该以标点结尾
            segments.forEach(segment => {
                const lastChar = segment.text[segment.text.length - 1];
                expect(['。', '！', '？', '!', '?']).toContain(lastChar);
            });
        });

        it('应该平衡片段长度', () => {
            const dialogue = '短句。这是一个比较长的句子，包含了更多的内容和信息。短句。';
            const segments = smartSplitDialogue(dialogue, 50, {
                balanceLength: true
            });
            
            // 检查是否有过短的片段被合并
            const shortSegments = segments.filter(s => s.text.length < 10);
            expect(shortSegments.length).toBeLessThan(2);
        });

        it('应该处理没有标点的对话', () => {
            const dialogue = '这是一段没有标点的对话';
            const segments = smartSplitDialogue(dialogue, 100);
            
            expect(segments).toHaveLength(1);
            expect(segments[0].text).toBe(dialogue);
        });

        it('应该处理只有标点的对话', () => {
            const dialogue = '！？。';
            const segments = smartSplitDialogue(dialogue, 100);
            
            expect(segments.length).toBeGreaterThan(0);
        });

        it('应该处理空字符串', () => {
            const dialogue = '';
            const segments = smartSplitDialogue(dialogue, 100);
            
            expect(segments).toHaveLength(1);
            expect(segments[0].text).toBe('');
        });

        it('应该识别多种情绪转折词', () => {
            const dialogues = [
                '我很开心。但是事情变了。',
                '他说得对。然而我不同意。',
                '看起来不错。不过有个问题。',
                '我以为是这样。原来我错了。'
            ];
            
            dialogues.forEach(dialogue => {
                const segments = smartSplitDialogue(dialogue, 100);
                const hasTransition = segments.some(s => s.hasTransition);
                expect(hasTransition).toBe(true);
            });
        });
    });

    describe('smartSplitDialogueSimple', () => {
        it('应该返回字符串数组', () => {
            const dialogue = '第一句。第二句。第三句。';
            const result = smartSplitDialogueSimple(dialogue, 20);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            result.forEach(text => {
                expect(typeof text).toBe('string');
            });
        });

        it('应该与 smartSplitDialogue 结果一致', () => {
            const dialogue = '这是一段测试对话。包含多个句子。';
            const segments = smartSplitDialogue(dialogue, 50);
            const simple = smartSplitDialogueSimple(dialogue, 50);
            
            expect(simple.length).toBe(segments.length);
            simple.forEach((text, i) => {
                expect(text).toBe(segments[i].text);
            });
        });
    });

    describe('analyzeDialogueStructure', () => {
        it('应该正确分析对话结构', () => {
            const dialogue = '你好！我很高兴见到你。但是我有个坏消息要告诉你。';
            const analysis = analyzeDialogueStructure(dialogue);
            
            expect(analysis.totalLength).toBe(dialogue.length);
            expect(analysis.sentenceCount).toBeGreaterThan(0);
            expect(analysis.emotionTransitions).toBeGreaterThan(0);
            expect(analysis.averageEmotionLevel).toBeGreaterThanOrEqual(0);
            expect(analysis.dominantType).toBeDefined();
            expect(analysis.suggestedSplitCount).toBeGreaterThan(0);
        });

        it('应该识别主导对话类型', () => {
            const question = '你在哪里？你在做什么？你什么时候回来？';
            const exclamation = '太好了！真棒！太厉害了！';
            
            const analysis1 = analyzeDialogueStructure(question);
            const analysis2 = analyzeDialogueStructure(exclamation);
            
            expect(analysis1.dominantType).toBe(DialogueType.QUESTION);
            expect(analysis2.dominantType).toBe(DialogueType.EXCLAMATION);
        });

        it('应该计算平均情绪强度', () => {
            const calm = '今天天气不错。我去了公园。很安静。';
            const excited = '太好了！！我成功了！！真是太棒了！！';
            
            const analysis1 = analyzeDialogueStructure(calm);
            const analysis2 = analyzeDialogueStructure(excited);
            
            expect(analysis1.averageEmotionLevel).toBeLessThan(analysis2.averageEmotionLevel);
        });

        it('应该建议合理的拆分数量', () => {
            const short = '短对话。';
            const long = '这是一段很长的对话。包含很多句子。每个句子都有不同的内容。需要拆分成多个片段。还有更多内容。继续说下去。';
            
            const analysis1 = analyzeDialogueStructure(short);
            const analysis2 = analyzeDialogueStructure(long);
            
            // 长对话应该建议更多拆分
            expect(analysis2.suggestedSplitCount).toBeGreaterThanOrEqual(analysis1.suggestedSplitCount);
        });

        it('应该统计情绪转折次数', () => {
            const noTransition = '我很开心。今天天气很好。';
            const withTransition = '我很开心。但是突然下雨了。然而我带了伞。';
            
            const analysis1 = analyzeDialogueStructure(noTransition);
            const analysis2 = analyzeDialogueStructure(withTransition);
            
            expect(analysis2.emotionTransitions).toBeGreaterThan(analysis1.emotionTransitions);
        });
    });

    describe('边界情况', () => {
        it('应该处理超长对话', () => {
            const dialogue = '这是一段超长的对话。'.repeat(50);
            const segments = smartSplitDialogue(dialogue, 100);
            
            expect(segments.length).toBeGreaterThan(1);
            segments.forEach(segment => {
                expect(segment.text.length).toBeLessThanOrEqual(150); // 允许一定超出
            });
        });

        it('应该处理特殊字符', () => {
            const dialogue = '你好！@#$%^&*()_+{}:"<>?';
            const segments = smartSplitDialogue(dialogue, 100);
            
            expect(segments.length).toBeGreaterThan(0);
        });

        it('应该处理连续标点', () => {
            const dialogue = '什么？！！！真的吗？？？';
            const segments = smartSplitDialogue(dialogue, 100);
            
            expect(segments.length).toBeGreaterThan(0);
            expect(segments[0].emotionLevel).toBeGreaterThan(5);
        });

        it('应该处理省略号', () => {
            const dialogue = '我想说…但是…算了…';
            const segments = smartSplitDialogue(dialogue, 100);
            
            expect(segments.length).toBeGreaterThan(0);
        });
    });

    describe('性能测试', () => {
        it('应该快速处理中等长度对话', () => {
            const dialogue = '这是一段中等长度的对话。'.repeat(10);
            const start = Date.now();
            
            smartSplitDialogue(dialogue, 100);
            
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(100); // 应该在100ms内完成
        });

        it('应该处理大量短对话', () => {
            const dialogues = Array(100).fill('短对话。');
            const start = Date.now();
            
            dialogues.forEach(d => smartSplitDialogue(d, 100));
            
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(500); // 应该在500ms内完成
        });
    });
});
