/**
 * 分批处理大场景模块
 * 支持 50+ 场景的大型剧本
 */
import type { ScriptScene, Character, Scene, StoryboardPanel, DirectorStyle } from '../../types';
import type { ProgressCallback } from '../../types/extraction';
import { createProgress } from '../../types/extraction';

/**
 * 批次信息
 */
export interface BatchInfo {
    batchIndex: number;      // 批次索引（从 0 开始）
    totalBatches: number;    // 总批次数
    sceneStart: number;      // 起始场景索引
    sceneEnd: number;        // 结束场景索引
    sceneCount: number;      // 场景数量
    estimatedPanels: number; // 预估分镜数
}

/**
 * 批次结果
 */
export interface BatchResult {
    batchInfo: BatchInfo;
    panels: StoryboardPanel[];
    success: boolean;
    error?: Error;
    duration: number; // 处理时长（毫秒）
}

/**
 * 批次配置
 */
export interface BatchConfig {
    batchSize: number;           // 每批场景数（默认 10）
    maxRetries: number;          // 最大重试次数（默认 2）
    retryDelay: number;          // 重试延迟（毫秒，默认 2000）
    continueOnError: boolean;    // 出错时是否继续（默认 true）
    mergeBatches: boolean;       // 是否合并批次结果（默认 true）
}

/**
 * 默认批次配置
 */
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
    batchSize: 10,
    maxRetries: 2,
    retryDelay: 2000,
    continueOnError: true,
    mergeBatches: true
};

/**
 * 将场景分批
 */
export function splitIntoBatches(
    scenes: ScriptScene[],
    batchSize: number = 10
): ScriptScene[][] {
    const batches: ScriptScene[][] = [];
    
    for (let i = 0; i < scenes.length; i += batchSize) {
        batches.push(scenes.slice(i, i + batchSize));
    }
    
    console.log(`[splitIntoBatches] 将 ${scenes.length} 个场景分为 ${batches.length} 批，每批最多 ${batchSize} 个`);
    
    return batches;
}

/**
 * 计算批次信息
 */
export function calculateBatchInfo(
    batchIndex: number,
    totalBatches: number,
    scenes: ScriptScene[],
    allScenes: ScriptScene[]
): BatchInfo {
    const sceneStart = allScenes.indexOf(scenes[0]);
    const sceneEnd = allScenes.indexOf(scenes[scenes.length - 1]);
    
    // 简单预估：每个场景平均 3 个分镜
    const estimatedPanels = scenes.length * 3;
    
    return {
        batchIndex,
        totalBatches,
        sceneStart,
        sceneEnd,
        sceneCount: scenes.length,
        estimatedPanels
    };
}

/**
 * 分批处理场景（核心函数 - 性能优化版）
 */
export async function processScenesInBatches(
    scenes: ScriptScene[],
    characters: Character[],
    assetsScenes: Scene[],
    densityMode: 'compact' | 'standard' | 'detailed',
    directorStyle: DirectorStyle | undefined,
    extractFunction: (
        scenes: ScriptScene[],
        characters: Character[],
        assetsScenes: Scene[],
        densityMode: 'compact' | 'standard' | 'detailed',
        directorStyle?: DirectorStyle,
        onProgress?: ProgressCallback
    ) => Promise<StoryboardPanel[]>,
    config: Partial<BatchConfig> = {},
    onProgress?: ProgressCallback
): Promise<StoryboardPanel[]> {
    const finalConfig = { ...DEFAULT_BATCH_CONFIG, ...config };
    
    // 如果场景数量不多，直接处理
    if (scenes.length <= finalConfig.batchSize) {
        console.log(`[processScenesInBatches] 场景数量 ${scenes.length} 不超过批次大小，直接处理`);
        return extractFunction(scenes, characters, assetsScenes, densityMode, directorStyle, onProgress);
    }
    
    // 分批
    const batches = splitIntoBatches(scenes, finalConfig.batchSize);
    const batchResults: BatchResult[] = [];
    let currentPanelNumber = 1;
    
    console.log(`[processScenesInBatches] 开始分批处理 ${batches.length} 批场景`);
    
    // 报告准备阶段
    onProgress?.(createProgress(
        'preparing',
        0,
        batches.length,
        `准备分批处理 ${scenes.length} 个场景（${batches.length} 批）...`
    ));
    
    // 🚀 性能优化：并发处理批次（限制并发数为 2-3）
    const MAX_CONCURRENT = 2;
    const processBatch = async (batchIndex: number): Promise<BatchResult> => {
        const batch = batches[batchIndex];
        const batchInfo = calculateBatchInfo(batchIndex, batches.length, batch, scenes);
        
        console.log(`[processScenesInBatches] 处理第 ${batchIndex + 1}/${batches.length} 批（场景 ${batchInfo.sceneStart + 1}-${batchInfo.sceneEnd + 1}）`);
        
        // 报告当前批次进度
        onProgress?.(createProgress(
            'extracting',
            batchIndex,
            batches.length,
            `正在处理第 ${batchIndex + 1}/${batches.length} 批场景（${batch.length} 个场景）...`
        ));
        
        let batchSuccess = false;
        let batchPanels: StoryboardPanel[] = [];
        let batchError: Error | undefined;
        let retryCount = 0;
        const startTime = Date.now();
        
        // 重试逻辑
        while (!batchSuccess && retryCount <= finalConfig.maxRetries) {
            try {
                if (retryCount > 0) {
                    console.log(`[processScenesInBatches] 第 ${batchIndex + 1} 批重试 ${retryCount}/${finalConfig.maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
                }
                
                // 创建批次专用的进度回调
                const batchProgressCallback: ProgressCallback = (progress) => {
                    const overallProgress = createProgress(
                        progress.stage,
                        batchIndex,
                        batches.length,
                        `批次 ${batchIndex + 1}/${batches.length}: ${progress.message}`
                    );
                    onProgress?.(overallProgress);
                };
                
                batchPanels = await extractFunction(
                    batch,
                    characters,
                    assetsScenes,
                    densityMode,
                    directorStyle,
                    batchProgressCallback
                );
                
                batchSuccess = true;
                console.log(`[processScenesInBatches] 第 ${batchIndex + 1} 批成功，生成 ${batchPanels.length} 个分镜`);
                
            } catch (error) {
                retryCount++;
                batchError = error as Error;
                console.error(`[processScenesInBatches] 第 ${batchIndex + 1} 批失败（尝试 ${retryCount}/${finalConfig.maxRetries + 1}）:`, error);
                
                if (retryCount > finalConfig.maxRetries) {
                    if (finalConfig.continueOnError) {
                        console.warn(`[processScenesInBatches] 第 ${batchIndex + 1} 批最终失败，继续处理下一批`);
                        break;
                    } else {
                        throw new Error(`批次 ${batchIndex + 1} 处理失败: ${batchError.message}`);
                    }
                }
            }
        }
        
        const duration = Date.now() - startTime;
        
        return {
            batchInfo,
            panels: batchPanels,
            success: batchSuccess,
            error: batchError,
            duration
        };
    };
    
    // 🚀 并发处理批次
    for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
        const batchPromises = [];
        for (let j = 0; j < MAX_CONCURRENT && i + j < batches.length; j++) {
            batchPromises.push(processBatch(i + j));
        }
        
        const results = await Promise.all(batchPromises);
        batchResults.push(...results);
    }
    
    // 🚀 性能优化：按批次顺序合并结果，避免重复遍历
    const totalPanels: StoryboardPanel[] = [];
    for (const result of batchResults) {
        if (result.success && result.panels.length > 0) {
            // 重新编号（直接修改，避免创建新对象）
            for (const panel of result.panels) {
                panel.panelNumber = currentPanelNumber++;
                totalPanels.push(panel);
            }
        }
    }
    
    // 报告完成
    const successCount = batchResults.filter(r => r.success).length;
    const failCount = batchResults.filter(r => !r.success).length;
    
    console.log(`[processScenesInBatches] 批次处理完成: ${successCount} 成功, ${failCount} 失败, 共 ${totalPanels.length} 个分镜`);
    
    onProgress?.(createProgress(
        'complete',
        batches.length,
        batches.length,
        `批次处理完成: ${successCount}/${batches.length} 批成功，共生成 ${totalPanels.length} 个分镜`
    ));
    
    // 如果没有任何成功的批次，抛出错误
    if (totalPanels.length === 0) {
        throw new Error('所有批次都失败了，无法生成分镜');
    }
    
    return totalPanels;
}

/**
 * 获取批次统计信息
 */
export function getBatchStatistics(results: BatchResult[]): {
    totalBatches: number;
    successBatches: number;
    failedBatches: number;
    totalPanels: number;
    totalDuration: number;
    averageDuration: number;
    successRate: number;
} {
    const totalBatches = results.length;
    const successBatches = results.filter(r => r.success).length;
    const failedBatches = results.filter(r => !r.success).length;
    const totalPanels = results.reduce((sum, r) => sum + r.panels.length, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalDuration / totalBatches;
    const successRate = (successBatches / totalBatches) * 100;
    
    return {
        totalBatches,
        successBatches,
        failedBatches,
        totalPanels,
        totalDuration,
        averageDuration,
        successRate
    };
}

/**
 * 估算批次处理时间
 */
export function estimateBatchProcessingTime(
    sceneCount: number,
    batchSize: number = 10,
    averageTimePerBatch: number = 30000 // 默认 30 秒/批
): {
    estimatedBatches: number;
    estimatedTime: number; // 毫秒
    estimatedTimeFormatted: string;
} {
    const estimatedBatches = Math.ceil(sceneCount / batchSize);
    const estimatedTime = estimatedBatches * averageTimePerBatch;
    
    const minutes = Math.floor(estimatedTime / 60000);
    const seconds = Math.floor((estimatedTime % 60000) / 1000);
    const estimatedTimeFormatted = minutes > 0 
        ? `${minutes} 分 ${seconds} 秒`
        : `${seconds} 秒`;
    
    return {
        estimatedBatches,
        estimatedTime,
        estimatedTimeFormatted
    };
}

/**
 * 验证批次完整性
 */
export function validateBatchCompleteness(
    originalScenes: ScriptScene[],
    generatedPanels: StoryboardPanel[]
): {
    isComplete: boolean;
    missingScenes: ScriptScene[];
    coveredScenes: ScriptScene[];
    coverageRate: number;
} {
    const coveredSceneIds = new Set(generatedPanels.map(p => p.sceneId));
    const coveredScenes = originalScenes.filter(s => coveredSceneIds.has(s.id));
    const missingScenes = originalScenes.filter(s => !coveredSceneIds.has(s.id));
    const coverageRate = (coveredScenes.length / originalScenes.length) * 100;
    const isComplete = missingScenes.length === 0;
    
    return {
        isComplete,
        missingScenes,
        coveredScenes,
        coverageRate
    };
}
