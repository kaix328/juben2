/**
 * 图像生成模块
 * 从 aiService.ts 拆分
 */
import type { StoryboardPanel, Character, Scene, DirectorStyle } from '../../types';
import { generateStoryboardImagePrompt } from '../prompts';
import { optimizePrompt, callDoubaoImage } from '../volcApi';
import { IMAGE_SIZES } from '../../constants/imageSizes';

/**
 * 分镜图片生成（支持重试和自定义尺寸）
 */
export async function generateStoryboardImage(
    panel: StoryboardPanel,
    characters: Character[],
    scenes: Scene[],
    directorStyle?: DirectorStyle,
    enableOptimization: boolean = true,
    maxRetries: number = 3,
    imageSize?: string
): Promise<string> {
    // 1. 使用完整的提示词生成函数
    let imagePrompt = generateStoryboardImagePrompt(panel, characters, scenes, directorStyle);

    // 2. 可选的AI优化
    if (enableOptimization) {
        try {
            imagePrompt = await optimizePrompt(
                imagePrompt,
                directorStyle?.artStyle || 'Cinematic',
                'storyboard'
            );
        } catch (e) {
            console.warn('Prompt optimization failed, using original', e);
        }
    }

    // 3. 根据 aspectRatio 或 imageSize 选择尺寸
    let selectedSize: string = IMAGE_SIZES.STORYBOARD;
    if (imageSize && (IMAGE_SIZES as any)[imageSize]) {
        selectedSize = (IMAGE_SIZES as any)[imageSize];
    } else if (panel.aspectRatio) {
        const aspectSizeMap: Record<string, string> = {
            '16:9': IMAGE_SIZES.STORYBOARD_16_9,
            '9:16': IMAGE_SIZES.STORYBOARD_9_16,
            '1:1': IMAGE_SIZES.STORYBOARD_1_1,
            '4:3': IMAGE_SIZES.STORYBOARD_4_3,
            '21:9': IMAGE_SIZES.STORYBOARD_21_9,
        };
        selectedSize = aspectSizeMap[panel.aspectRatio] || IMAGE_SIZES.STORYBOARD;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[图片生成] 第 ${attempt}/${maxRetries} 次尝试，尺寸: ${selectedSize}...`);
            return await callDoubaoImage(imagePrompt, selectedSize, directorStyle?.negativePrompt);
        } catch (error) {
            lastError = error as Error;
            console.warn(`[图片生成] 第 ${attempt} 次失败:`, error);

            if (attempt < maxRetries) {
                const delay = 1000 * attempt;
                console.log(`[图片生成] ${delay}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error('[图片生成] 所有重试均失败:', lastError);
    return `https://placehold.co/1024x576?text=${encodeURIComponent('AI生成失败（已重试' + maxRetries + '次）')}`;
}
