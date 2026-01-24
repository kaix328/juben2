/**
 * 分镜数量控制测试
 */
import { describe, it, expect } from 'vitest';
import {
    adjustPanelCount,
    mergePanels,
    splitPanels,
    calculateTargetRange
} from '../../app/utils/ai/panelCountController';
import type { StoryboardPanel } from '../../app/types';

// 创建测试分镜
function createTestPanel(overrides: Partial<StoryboardPanel> = {}): StoryboardPanel {
    return {
        id: `panel-${Math.random()}`,
        panelNumber: 1,
        sceneId: 'scene-1',
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
        characterActions: [],
        ...overrides
    };
}

describe('panelCountController', () => {
    describe('calculateTargetRange', () => {
        it('应该计算正确的目标范围（20%误差）', () => {
            const range = calculateTargetRange(100);
            expect(range.min).toBe(80);
            expect(range.max).toBe(120);
        });

        it('应该处理小数值', () => {
            const range = calculateTargetRange(10);
            expect(range.min).toBe(8);
            expect(range.max).toBe(12);
        });

        it('应该处理大数值', () => {
            const range = calculateTargetRange(500);
            expect(range.min).toBe(400);
            expect(range.max).toBe(600);
        });
    });

    describe('mergePanels', () => {
        it('应该合并分镜到目标数量', () => {
            const panels = Array.from({ length: 10 }, (_, i) => 
                createTestPanel({ panelNumber: i + 1 })
            );
            
            const result = mergePanels(panels, 5);
            
            expect(result.length).toBe(5);
        });

        it('应该保留关键分镜（建立镜头）', () => {
            const panels = [
                createTestPanel({ shot: '远景', notes: '建立场景' }),
                createTestPanel({ shot: '中景' }),
                createTestPanel({ shot: '中景' }),
                createTestPanel({ shot: '近景' })
            ];
            
            const result = mergePanels(panels, 2);
            
            // 建立镜头应该被保留
            expect(result.some(p => p.shot === '远景')).toBe(true);
        });

        it('应该合并相似的分镜', () => {
            const panels = [
                createTestPanel({ shot: '中景', sceneId: 'scene-1' }),
                createTestPanel({ shot: '中景', sceneId: 'scene-1' }),
                createTestPanel({ shot: '特写', sceneId: 'scene-2' })
            ];
            
            const result = mergePanels(panels, 2);
            
            expect(result.length).toBe(2);
        });

        it('应该合并对话分镜', () => {
            const panels = [
                createTestPanel({ dialogue: '你好' }),
                createTestPanel({ dialogue: '世界' }),
                createTestPanel({ dialogue: '' })
            ];
            
            const result = mergePanels(panels, 2);
            
            expect(result.length).toBe(2);
            // 合并后的对话应该包含两部分
            expect(result[0].dialogue).toContain('你好');
        });

        it('应该累加时长', () => {
            const panels = [
                createTestPanel({ duration: 3 }),
                createTestPanel({ duration: 4 })
            ];
            
            const result = mergePanels(panels, 1);
            
            expect(result[0].duration).toBe(7);
        });

        it('应该重新编号', () => {
            const panels = Array.from({ length: 5 }, (_, i) => 
                createTestPanel({ panelNumber: i + 1 })
            );
            
            const result = mergePanels(panels, 3);
            
            expect(result[0].panelNumber).toBe(1);
            expect(result[1].panelNumber).toBe(2);
            expect(result[2].panelNumber).toBe(3);
        });

        it('当数量已经符合时不应该合并', () => {
            const panels = Array.from({ length: 5 }, (_, i) => 
                createTestPanel({ panelNumber: i + 1 })
            );
            
            const result = mergePanels(panels, 5);
            
            expect(result.length).toBe(5);
        });
    });

    describe('splitPanels', () => {
        it('应该拆分分镜到目标数量', () => {
            const panels = Array.from({ length: 3 }, (_, i) => 
                createTestPanel({ 
                    panelNumber: i + 1,
                    dialogue: '这是一段很长的对话，需要被拆分成多个分镜来展示完整的内容和情感变化。'
                })
            );
            
            const result = splitPanels(panels, 6);
            
            expect(result.length).toBe(6);
        });

        it('应该优先拆分长对话', () => {
            const panels = [
                createTestPanel({ dialogue: '短对话' }),
                createTestPanel({ 
                    dialogue: '这是一段很长的对话，需要被拆分成多个分镜来展示完整的内容和情感变化。这段对话包含了多个句子。'
                })
            ];
            
            const result = splitPanels(panels, 3);
            
            expect(result.length).toBe(3);
            // 长对话应该被拆分
            expect(result.filter(p => p.notes?.includes('[拆分')).length).toBeGreaterThan(0);
        });

        it('应该优先拆分长描述', () => {
            const panels = [
                createTestPanel({ description: '短描述' }),
                createTestPanel({ 
                    description: '这是一段很长的描述，包含了大量的视觉细节和场景信息，需要被拆分成多个分镜来完整展示。描述中包含了角色的动作、表情、环境的变化等多个元素。'
                })
            ];
            
            const result = splitPanels(panels, 3);
            
            expect(result.length).toBe(3);
        });

        it('应该优先拆分长时长', () => {
            const panels = [
                createTestPanel({ duration: 3 }),
                createTestPanel({ duration: 10 })
            ];
            
            const result = splitPanels(panels, 3);
            
            expect(result.length).toBe(3);
            // 时长应该被分配
            const totalDuration = result.reduce((sum, p) => sum + (p.duration || 0), 0);
            expect(totalDuration).toBe(13);
        });

        it('应该重新编号', () => {
            const panels = Array.from({ length: 2 }, (_, i) => 
                createTestPanel({ 
                    panelNumber: i + 1,
                    dialogue: '这是一段很长的对话，需要被拆分。'
                })
            );
            
            const result = splitPanels(panels, 4);
            
            expect(result[0].panelNumber).toBe(1);
            expect(result[1].panelNumber).toBe(2);
            expect(result[2].panelNumber).toBe(3);
            expect(result[3].panelNumber).toBe(4);
        });

        it('当数量已经符合时不应该拆分', () => {
            const panels = Array.from({ length: 5 }, (_, i) => 
                createTestPanel({ panelNumber: i + 1 })
            );
            
            const result = splitPanels(panels, 5);
            
            expect(result.length).toBe(5);
        });

        it('应该在拆分后添加标记', () => {
            const panels = [
                createTestPanel({ 
                    dialogue: '这是一段很长的对话，需要被拆分成多个分镜。'
                })
            ];
            
            const result = splitPanels(panels, 2);
            
            expect(result[0].notes).toContain('[拆分1/2]');
            expect(result[1].notes).toContain('[拆分2/2]');
        });
    });

    describe('adjustPanelCount', () => {
        it('当数量在范围内时不应该调整', () => {
            const panels = Array.from({ length: 10 }, (_, i) => 
                createTestPanel({ panelNumber: i + 1 })
            );
            
            const result = adjustPanelCount(panels, 8, 12);
            
            expect(result.length).toBe(10);
        });

        it('当数量过多时应该合并', () => {
            const panels = Array.from({ length: 15 }, (_, i) => 
                createTestPanel({ panelNumber: i + 1 })
            );
            
            const result = adjustPanelCount(panels, 5, 10);
            
            expect(result.length).toBe(10);
        });

        it('当数量过少时应该拆分', () => {
            const panels = Array.from({ length: 5 }, (_, i) => 
                createTestPanel({ 
                    panelNumber: i + 1,
                    dialogue: '这是一段很长的对话，需要被拆分。'
                })
            );
            
            const result = adjustPanelCount(panels, 8, 12);
            
            expect(result.length).toBe(8);
        });

        it('应该保持分镜的连续编号', () => {
            const panels = Array.from({ length: 10 }, (_, i) => 
                createTestPanel({ panelNumber: i + 1 })
            );
            
            const result = adjustPanelCount(panels, 5, 7);
            
            result.forEach((panel, index) => {
                expect(panel.panelNumber).toBe(index + 1);
            });
        });

        it('应该处理边界情况（目标最小值）', () => {
            const panels = Array.from({ length: 10 }, (_, i) => 
                createTestPanel({ panelNumber: i + 1 })
            );
            
            const result = adjustPanelCount(panels, 10, 15);
            
            expect(result.length).toBe(10);
        });

        it('应该处理边界情况（目标最大值）', () => {
            const panels = Array.from({ length: 10 }, (_, i) => 
                createTestPanel({ panelNumber: i + 1 })
            );
            
            const result = adjustPanelCount(panels, 5, 10);
            
            expect(result.length).toBe(10);
        });
    });
});
