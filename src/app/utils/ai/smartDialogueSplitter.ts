/**
 * 智能对话拆分模块
 * 按句子、情绪转折、语义段落智能拆分对话
 */

/**
 * 情绪转折标记词
 */
const EMOTION_MARKERS = [
    '但是', '可是', '然而', '不过', '只是', '却',
    '虽然', '尽管', '即使', '哪怕',
    '突然', '忽然', '猛然', '顿时',
    '原来', '其实', '实际上', '事实上',
    '所以', '因此', '于是', '那么'
];

/**
 * 强情绪词（表示情绪高潮）
 */
const STRONG_EMOTION_WORDS = [
    '！', '!', '？！', '?!', '！！', '!!',
    '啊', '呀', '哇', '哎', '唉',
    '天啊', '我的天', '不可能', '怎么会',
    '太好了', '太棒了', '糟糕', '完了'
];

/**
 * 对话类型
 */
export enum DialogueType {
    NARRATIVE = 'narrative',      // 叙述性对话
    EMOTIONAL = 'emotional',      // 情绪性对话
    QUESTION = 'question',         // 疑问对话
    EXCLAMATION = 'exclamation',  // 感叹对话
    MIXED = 'mixed'               // 混合类型
}

/**
 * 对话片段
 */
export interface DialogueSegment {
    text: string;
    type: DialogueType;
    emotionLevel: number;  // 情绪强度 0-10
    hasTransition: boolean; // 是否包含转折
    startIndex: number;
    endIndex: number;
}

/**
 * 检测对话类型
 */
function detectDialogueType(text: string): DialogueType {
    const hasQuestion = text.includes('？') || text.includes('?');
    const hasExclamation = text.includes('！') || text.includes('!');
    const hasStrongEmotion = STRONG_EMOTION_WORDS.some(word => text.includes(word));
    
    if (hasQuestion && hasExclamation) return DialogueType.MIXED;
    if (hasQuestion) return DialogueType.QUESTION;
    if (hasExclamation || hasStrongEmotion) return DialogueType.EXCLAMATION;
    
    // 检测情绪词
    const emotionWords = ['高兴', '难过', '愤怒', '害怕', '惊讶', '厌恶', '喜欢', '讨厌'];
    if (emotionWords.some(word => text.includes(word))) {
        return DialogueType.EMOTIONAL;
    }
    
    return DialogueType.NARRATIVE;
}

/**
 * 计算情绪强度
 */
function calculateEmotionLevel(text: string): number {
    let level = 0;
    
    // 感叹号/问号增加情绪
    const exclamationCount = (text.match(/[！!]/g) || []).length;
    const questionCount = (text.match(/[？?]/g) || []).length;
    level += exclamationCount * 2 + questionCount;
    
    // 强情绪词
    const strongEmotionCount = STRONG_EMOTION_WORDS.filter(word => text.includes(word)).length;
    level += strongEmotionCount * 3;
    
    // 省略号（犹豫、停顿）
    const ellipsisCount = (text.match(/[…\.]{2,}/g) || []).length;
    level += ellipsisCount;
    
    return Math.min(10, level);
}

/**
 * 检测是否包含转折
 */
function hasEmotionTransition(text: string): boolean {
    return EMOTION_MARKERS.some(marker => text.includes(marker));
}

/**
 * 按句子拆分（保留标点）
 */
function splitIntoSentences(text: string): string[] {
    if (!text) return [];
    
    // 匹配句子和标点（包括中英文标点）
    const regex = /[^。！？!?…]+[。！？!?…]+/g;
    const sentences = text.match(regex) || [];
    
    // 如果没有匹配到（可能没有标点），按长度拆分
    if (sentences.length === 0) {
        // 尝试按逗号拆分
        const parts = text.split(/[，,]/);
        if (parts.length > 1) {
            return parts.filter(p => p.trim().length > 0);
        }
        return [text];
    }
    
    // 检查是否有剩余文本（没有标点结尾的）
    const lastSentence = sentences[sentences.length - 1];
    const lastIndex = text.lastIndexOf(lastSentence) + lastSentence.length;
    if (lastIndex < text.length) {
        const remaining = text.substring(lastIndex).trim();
        if (remaining) {
            sentences.push(remaining);
        }
    }
    
    return sentences.filter(s => s.trim().length > 0);
}

/**
 * 智能对话拆分（核心函数）
 */
export function smartSplitDialogue(
    dialogue: string,
    threshold: number = 100,
    options: {
        respectEmotionTransition?: boolean;  // 尊重情绪转折
        keepSentenceIntegrity?: boolean;     // 保持句子完整性
        balanceLength?: boolean;             // 平衡长度
    } = {}
): DialogueSegment[] {
    const {
        respectEmotionTransition = true,
        keepSentenceIntegrity = true,
        balanceLength = true
    } = options;
    
    // 如果对话很短，直接返回
    if (!dialogue || dialogue.length <= threshold) {
        return [{
            text: dialogue,
            type: detectDialogueType(dialogue),
            emotionLevel: calculateEmotionLevel(dialogue),
            hasTransition: hasEmotionTransition(dialogue),
            startIndex: 0,
            endIndex: dialogue.length
        }];
    }
    
    // 按句子拆分
    const sentences = splitIntoSentences(dialogue);
    const segments: DialogueSegment[] = [];
    let currentText = '';
    let currentStartIndex = 0;
    
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const potentialText = currentText + sentence;
        
        // 检查是否需要拆分
        let shouldSplit = false;
        
        // 1. 长度超过阈值（必须拆分）
        if (potentialText.length > threshold && currentText.length > 0) {
            shouldSplit = true;
        }
        
        // 2. 情绪转折点（如果启用且当前文本不为空）
        if (respectEmotionTransition && currentText.length > threshold * 0.3) {
            if (hasEmotionTransition(sentence)) {
                shouldSplit = true;
            }
        }
        
        // 3. 情绪强度变化大（从平静到激动，或反之）
        if (currentText.length > threshold * 0.3) {
            const currentEmotion = calculateEmotionLevel(currentText);
            const sentenceEmotion = calculateEmotionLevel(sentence);
            if (Math.abs(currentEmotion - sentenceEmotion) >= 3) {
                shouldSplit = true;
            }
        }
        
        if (shouldSplit) {
            // 保存当前片段
            const endIndex = currentStartIndex + currentText.length;
            segments.push({
                text: currentText.trim(),
                type: detectDialogueType(currentText),
                emotionLevel: calculateEmotionLevel(currentText),
                hasTransition: hasEmotionTransition(currentText),
                startIndex: currentStartIndex,
                endIndex: endIndex
            });
            
            // 开始新片段
            currentStartIndex = endIndex;
            currentText = sentence;
        } else {
            currentText = potentialText;
        }
    }
    
    // 保存最后一个片段
    if (currentText.trim()) {
        segments.push({
            text: currentText.trim(),
            type: detectDialogueType(currentText),
            emotionLevel: calculateEmotionLevel(currentText),
            hasTransition: hasEmotionTransition(currentText),
            startIndex: currentStartIndex,
            endIndex: currentStartIndex + currentText.length
        });
    }
    
    // 如果启用长度平衡，尝试平衡各片段长度
    if (balanceLength && segments.length > 1) {
        return balanceSegmentLengths(segments, threshold);
    }
    
    return segments;
}

/**
 * 平衡片段长度
 */
function balanceSegmentLengths(
    segments: DialogueSegment[],
    threshold: number
): DialogueSegment[] {
    // 找出过短的片段（< threshold/2）
    const shortSegments = segments.filter(s => s.text.length < threshold / 2);
    
    if (shortSegments.length === 0) {
        return segments;
    }
    
    // 尝试合并相邻的短片段
    const balanced: DialogueSegment[] = [];
    let i = 0;
    
    while (i < segments.length) {
        const current = segments[i];
        
        // 如果当前片段很短，且有下一个片段
        if (current.text.length < threshold / 2 && i < segments.length - 1) {
            const next = segments[i + 1];
            
            // 如果合并后不超过阈值，则合并
            if (current.text.length + next.text.length <= threshold * 1.2) {
                balanced.push({
                    text: current.text + next.text,
                    type: current.type === next.type ? current.type : DialogueType.MIXED,
                    emotionLevel: Math.max(current.emotionLevel, next.emotionLevel),
                    hasTransition: current.hasTransition || next.hasTransition,
                    startIndex: current.startIndex,
                    endIndex: next.endIndex
                });
                i += 2;
                continue;
            }
        }
        
        balanced.push(current);
        i++;
    }
    
    return balanced;
}

/**
 * 简化版：只返回文本数组（兼容旧接口）
 */
export function smartSplitDialogueSimple(
    dialogue: string,
    threshold: number = 100
): string[] {
    const segments = smartSplitDialogue(dialogue, threshold);
    return segments.map(s => s.text);
}

/**
 * 分析对话结构
 */
export function analyzeDialogueStructure(dialogue: string): {
    totalLength: number;
    sentenceCount: number;
    emotionTransitions: number;
    averageEmotionLevel: number;
    dominantType: DialogueType;
    suggestedSplitCount: number;
} {
    const sentences = splitIntoSentences(dialogue);
    const segments = smartSplitDialogue(dialogue, 100);
    
    const emotionTransitions = segments.filter(s => s.hasTransition).length;
    const averageEmotionLevel = segments.reduce((sum, s) => sum + s.emotionLevel, 0) / segments.length;
    
    // 统计类型
    const typeCounts: Record<DialogueType, number> = {
        [DialogueType.NARRATIVE]: 0,
        [DialogueType.EMOTIONAL]: 0,
        [DialogueType.QUESTION]: 0,
        [DialogueType.EXCLAMATION]: 0,
        [DialogueType.MIXED]: 0
    };
    
    segments.forEach(s => typeCounts[s.type]++);
    const dominantType = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0] as DialogueType;
    
    return {
        totalLength: dialogue.length,
        sentenceCount: sentences.length,
        emotionTransitions,
        averageEmotionLevel,
        dominantType,
        suggestedSplitCount: segments.length
    };
}
