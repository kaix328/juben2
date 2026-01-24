/**
 * 分批处理测试
 */
import { describe, it, expect, vi } from 'vitest';
import {
    splitIntoBatches,
    calculateBatchInfo,
    processScenesInBatches,
    getBatchStatistics,
    estimateBatchProcessingTime,
    validateBatchCompleteness,
    DEFAULT_BATCH_CONFIG,
    type BatchResult
} from '../../app/utils/ai/batchProcessor';
import type { ScriptScene, StoryboardPanel } from '../../app/types';

// 创建测试场景
function createTestScene(id: string, sceneNumber: number): ScriptScene {
    return {
        id,
        sceneNumber,
        location: `场景${sceneNumber}`,
        timeOfDay: '日',
        sceneType: 'INT',
        action: '测试动作',
        characters: ['角色A'],
        dialogues: [],
        episodeNumber: 1
    };
}

// 创建测试分镜
function createTestPanel(id: string, sceneId: string, panelNumber: number): StoryboardPanel {
    return {
        id,
        panelNumber,
        sceneId,
        episodeNumber: 1,
        description: '测试描述',
        dialogue: '',
        shot: '中景',
        angle: '平视',
        cameraMovement: '静止',
        duration: 3,
        characters: [],
        props: [],
        notes: '',
        aiPrompt: '',
        aiVideoPrompt: '',
        shotSize: 'MS',
        cameraAngle: 'EYE_LEVEL',
        movementType: 'STATIC',
        transition: '切至',
        soundEffects: [],
        music: '',
        startFrame: '',
        endFrame: '',
        motionSpeed: 'normal',
        environmentMotion: '',
        characterActions: []
    };
}

describe('batchProcessor', () => {
    describe('splitIntoBatches', () => {
        it('应该正确分批', () => {
            const scenes = Array.from({ length: 25 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            const batches = splitIntoBatches(scenes, 10);
            
            expect(batches.length).toBe(3);
            expect(batches[0].length).toBe(10);
            expect(batches[1].length).toBe(10);
            expect(batches[2].length).toBe(5);
        });

        it('应该处理刚好整除的情况', () => {
            const scenes = Array.from({ length: 20 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            const batches = splitIntoBatches(scenes, 10);
            
            expect(batches.length).toBe(2);
            expect(batches[0].length).toBe(10);
            expect(batches[1].length).toBe(10);
        });

        it('应该处理少于批次大小的情况', () => {
            const scenes = Array.from({ length: 5 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            const batches = splitIntoBatches(scenes, 10);
            
            expect(batches.length).toBe(1);
            expect(batches[0].length).toBe(5);
        });

        it('应该处理空数组', () => {
            const batches = splitIntoBatches([], 10);
            
            expect(batches.length).toBe(0);
        });

        it('应该使用自定义批次大小', () => {
            const scenes = Array.from({ length: 15 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            const batches = splitIntoBatches(scenes, 5);
            
            expect(batches.length).toBe(3);
            batches.forEach(batch => {
                expect(batch.length).toBe(5);
            });
        });
    });

    describe('calculateBatchInfo', () => {
        it('应该计算正确的批次信息', () => {
            const allScenes = Array.from({ length: 25 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            const batchScenes = allScenes.slice(10, 20);
            
            const info = calculateBatchInfo(1, 3, batchScenes, allScenes);
            
            expect(info.batchIndex).toBe(1);
            expect(info.totalBatches).toBe(3);
            expect(info.sceneStart).toBe(10);
            expect(info.sceneEnd).toBe(19);
            expect(info.sceneCount).toBe(10);
            expect(info.estimatedPanels).toBe(30); // 10 * 3
        });

        it('应该处理第一批', () => {
            const allScenes = Array.from({ length: 25 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            const batchScenes = allScenes.slice(0, 10);
            
            const info = calculateBatchInfo(0, 3, batchScenes, allScenes);
            
            expect(info.batchIndex).toBe(0);
            expect(info.sceneStart).toBe(0);
            expect(info.sceneEnd).toBe(9);
        });

        it('应该处理最后一批', () => {
            const allScenes = Array.from({ length: 25 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            const batchScenes = allScenes.slice(20, 25);
            
            const info = calculateBatchInfo(2, 3, batchScenes, allScenes);
            
            expect(info.batchIndex).toBe(2);
            expect(info.sceneStart).toBe(20);
            expect(info.sceneEnd).toBe(24);
            expect(info.sceneCount).toBe(5);
        });
    });

    describe('processScenesInBatches', () => {
        it('应该成功处理多批场景', async () => {
            const scenes = Array.from({ length: 25 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            // Mock 提取函数
            const mockExtract = vi.fn(async (scenes) => {
                return scenes.map((scene, i) => 
                    createTestPanel(`panel-${scene.id}-${i}`, scene.id, i + 1)
                );
            });
            
            const result = await processScenesInBatches(
                scenes,
                [],
                [],
                'standard',
                undefined,
                mockExtract,
                { batchSize: 10 }
            );
            
            expect(mockExtract).toHaveBeenCalledTimes(3); // 3 批
            expect(result.length).toBe(25); // 每个场景 1 个分镜
            
            // 检查分镜编号连续
            result.forEach((panel, i) => {
                expect(panel.panelNumber).toBe(i + 1);
            });
        });

        it('应该处理少于批次大小的场景', async () => {
            const scenes = Array.from({ length: 5 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            const mockExtract = vi.fn(async (scenes) => {
                return scenes.map((scene, i) => 
                    createTestPanel(`panel-${scene.id}`, scene.id, i + 1)
                );
            });
            
            const result = await processScenesInBatches(
                scenes,
                [],
                [],
                'standard',
                undefined,
                mockExtract,
                { batchSize: 10 }
            );
            
            expect(mockExtract).toHaveBeenCalledTimes(1); // 直接处理
            expect(result.length).toBe(5);
        });

        it('应该在失败时重试', async () => {
            const scenes = Array.from({ length: 15 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            let callCount = 0;
            const mockExtract = vi.fn(async (scenes) => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('第一次失败');
                }
                return scenes.map((scene, i) => 
                    createTestPanel(`panel-${scene.id}`, scene.id, i + 1)
                );
            });
            
            const result = await processScenesInBatches(
                scenes,
                [],
                [],
                'standard',
                undefined,
                mockExtract,
                { batchSize: 10, maxRetries: 2, retryDelay: 100 }
            );
            
            expect(mockExtract).toHaveBeenCalledTimes(3); // 1次失败+1次重试+1次成功第二批
            expect(result.length).toBeGreaterThan(0);
        });

        it('应该在 continueOnError 为 true 时继续处理', async () => {
            const scenes = Array.from({ length: 25 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            let callCount = 0;
            const mockExtract = vi.fn(async (scenes) => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('第一批失败');
                }
                return scenes.map((scene, i) => 
                    createTestPanel(`panel-${scene.id}`, scene.id, i + 1)
                );
            });
            
            const result = await processScenesInBatches(
                scenes,
                [],
                [],
                'standard',
                undefined,
                mockExtract,
                { batchSize: 10, maxRetries: 0, continueOnError: true }
            );
            
            expect(result.length).toBeGreaterThan(0); // 应该有第2、3批的结果
        });

        it('应该在 continueOnError 为 false 时抛出错误', async () => {
            const scenes = Array.from({ length: 25 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            const mockExtract = vi.fn(async () => {
                throw new Error('批次失败');
            });
            
            await expect(
                processScenesInBatches(
                    scenes,
                    [],
                    [],
                    'standard',
                    undefined,
                    mockExtract,
                    { batchSize: 10, maxRetries: 0, continueOnError: false }
                )
            ).rejects.toThrow('批次 1 处理失败');
        });
    });

    describe('getBatchStatistics', () => {
        it('应该计算正确的统计信息', () => {
            const results: BatchResult[] = [
                {
                    batchInfo: { batchIndex: 0, totalBatches: 3, sceneStart: 0, sceneEnd: 9, sceneCount: 10, estimatedPanels: 30 },
                    panels: Array(10).fill(null).map((_, i) => createTestPanel(`p${i}`, 's1', i)),
                    success: true,
                    duration: 5000
                },
                {
                    batchInfo: { batchIndex: 1, totalBatches: 3, sceneStart: 10, sceneEnd: 19, sceneCount: 10, estimatedPanels: 30 },
                    panels: Array(10).fill(null).map((_, i) => createTestPanel(`p${i}`, 's2', i)),
                    success: true,
                    duration: 6000
                },
                {
                    batchInfo: { batchIndex: 2, totalBatches: 3, sceneStart: 20, sceneEnd: 24, sceneCount: 5, estimatedPanels: 15 },
                    panels: [],
                    success: false,
                    error: new Error('失败'),
                    duration: 3000
                }
            ];
            
            const stats = getBatchStatistics(results);
            
            expect(stats.totalBatches).toBe(3);
            expect(stats.successBatches).toBe(2);
            expect(stats.failedBatches).toBe(1);
            expect(stats.totalPanels).toBe(20);
            expect(stats.totalDuration).toBe(14000);
            expect(stats.averageDuration).toBe(14000 / 3);
            expect(stats.successRate).toBeCloseTo(66.67, 1);
        });
    });

    describe('estimateBatchProcessingTime', () => {
        it('应该估算正确的处理时间', () => {
            const estimate = estimateBatchProcessingTime(25, 10, 30000);
            
            expect(estimate.estimatedBatches).toBe(3);
            expect(estimate.estimatedTime).toBe(90000); // 3 * 30000
            expect(estimate.estimatedTimeFormatted).toBe('1 分 30 秒');
        });

        it('应该处理少于1分钟的情况', () => {
            const estimate = estimateBatchProcessingTime(10, 10, 30000);
            
            expect(estimate.estimatedBatches).toBe(1);
            expect(estimate.estimatedTime).toBe(30000);
            expect(estimate.estimatedTimeFormatted).toBe('30 秒');
        });

        it('应该使用默认值', () => {
            const estimate = estimateBatchProcessingTime(50);
            
            expect(estimate.estimatedBatches).toBe(5);
            expect(estimate.estimatedTime).toBe(150000); // 5 * 30000
        });
    });

    describe('validateBatchCompleteness', () => {
        it('应该验证完整性', () => {
            const scenes = Array.from({ length: 10 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            const panels = scenes.map((scene, i) => 
                createTestPanel(`panel-${i}`, scene.id, i + 1)
            );
            
            const validation = validateBatchCompleteness(scenes, panels);
            
            expect(validation.isComplete).toBe(true);
            expect(validation.missingScenes.length).toBe(0);
            expect(validation.coveredScenes.length).toBe(10);
            expect(validation.coverageRate).toBe(100);
        });

        it('应该检测遗漏的场景', () => {
            const scenes = Array.from({ length: 10 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            const panels = scenes.slice(0, 7).map((scene, i) => 
                createTestPanel(`panel-${i}`, scene.id, i + 1)
            );
            
            const validation = validateBatchCompleteness(scenes, panels);
            
            expect(validation.isComplete).toBe(false);
            expect(validation.missingScenes.length).toBe(3);
            expect(validation.coveredScenes.length).toBe(7);
            expect(validation.coverageRate).toBe(70);
        });

        it('应该处理空结果', () => {
            const scenes = Array.from({ length: 10 }, (_, i) => 
                createTestScene(`scene-${i}`, i + 1)
            );
            
            const validation = validateBatchCompleteness(scenes, []);
            
            expect(validation.isComplete).toBe(false);
            expect(validation.missingScenes.length).toBe(10);
            expect(validation.coverageRate).toBe(0);
        });
    });

    describe('DEFAULT_BATCH_CONFIG', () => {
        it('应该有合理的默认值', () => {
            expect(DEFAULT_BATCH_CONFIG.batchSize).toBe(10);
            expect(DEFAULT_BATCH_CONFIG.maxRetries).toBe(2);
            expect(DEFAULT_BATCH_CONFIG.retryDelay).toBe(2000);
            expect(DEFAULT_BATCH_CONFIG.continueOnError).toBe(true);
            expect(DEFAULT_BATCH_CONFIG.mergeBatches).toBe(true);
        });
    });
});
