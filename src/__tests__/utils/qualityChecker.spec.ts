/**
 * 质量检查测试
 */
import { describe, it, expect } from 'vitest';
import {
    performQualityCheck,
    getIssueStatistics,
    IssueSeverity,
    IssueType,
    DEFAULT_CHECK_CONFIG
} from '../../app/utils/ai/qualityChecker';
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

describe('qualityChecker', () => {
    describe('performQualityCheck', () => {
        it('应该检查完美的分镜', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, shot: '远景', description: '建立镜头' }),
                createTestPanel({ panelNumber: 2, shot: '中景', description: '角色出现' }),
                createTestPanel({ panelNumber: 3, shot: '近景', description: '角色特写' })
            ];
            
            const report = performQualityCheck(panels);
            
            expect(report.totalPanels).toBe(3);
            expect(report.summary.qualityScore).toBeGreaterThan(80);
        });

        it('应该检测连续相同景别', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, shot: '中景' }),
                createTestPanel({ panelNumber: 2, shot: '中景' }),
                createTestPanel({ panelNumber: 3, shot: '中景' })
            ];
            
            const report = performQualityCheck(panels);
            
            const continuityIssues = report.warnings.filter(i => i.type === IssueType.CONTINUITY);
            expect(continuityIssues.length).toBeGreaterThan(0);
        });

        it('应该检测景别跳跃', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, shot: '大远景', sceneId: 'scene-1' }),
                createTestPanel({ panelNumber: 2, shot: '大特写', sceneId: 'scene-1' })
            ];
            
            const report = performQualityCheck(panels);
            
            const continuityIssues = [...report.warnings, ...report.infos].filter(
                i => i.type === IssueType.CONTINUITY
            );
            expect(continuityIssues.length).toBeGreaterThan(0);
        });

        it('应该检测时长过短', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, duration: 0.5 })
            ];
            
            const report = performQualityCheck(panels, { minDuration: 1 });
            
            const durationIssues = report.warnings.filter(i => i.type === IssueType.DURATION);
            expect(durationIssues.length).toBeGreaterThan(0);
        });

        it('应该检测时长过长', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, duration: 20 })
            ];
            
            const report = performQualityCheck(panels, { maxDuration: 15 });
            
            const durationIssues = report.warnings.filter(i => i.type === IssueType.DURATION);
            expect(durationIssues.length).toBeGreaterThan(0);
        });

        it('应该检测对话时长不匹配', () => {
            const panels = [
                createTestPanel({ 
                    panelNumber: 1, 
                    dialogue: '这是一段很长的对话，需要足够的时间来说完。这段对话非常长，需要更多时间。我们需要确保有足够的时间来完整地表达这些内容。',
                    duration: 1
                })
            ];
            
            const report = performQualityCheck(panels);
            
            const durationIssues = report.warnings.filter(i => i.type === IssueType.DURATION);
            expect(durationIssues.length).toBeGreaterThan(0);
        });

        it('应该检测角色突然消失', () => {
            const panels = [
                createTestPanel({ 
                    panelNumber: 1, 
                    sceneId: 'scene-1',
                    characters: ['角色A', '角色B']
                }),
                createTestPanel({ 
                    panelNumber: 2, 
                    sceneId: 'scene-1',
                    characters: ['角色A']
                })
            ];
            
            const report = performQualityCheck(panels);
            
            const characterIssues = report.warnings.filter(i => i.type === IssueType.CHARACTER);
            expect(characterIssues.length).toBeGreaterThan(0);
            expect(characterIssues[0].message).toContain('角色B');
        });

        it('应该检测有对话但没有角色', () => {
            const panels = [
                createTestPanel({ 
                    panelNumber: 1, 
                    dialogue: '你好',
                    characters: []
                })
            ];
            
            const report = performQualityCheck(panels);
            
            const characterIssues = report.errors.filter(i => i.type === IssueType.CHARACTER);
            expect(characterIssues.length).toBeGreaterThan(0);
        });

        it('应该检测缺少建立镜头', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, shot: '近景', sceneId: 'scene-1' }),
                createTestPanel({ panelNumber: 2, shot: '特写', sceneId: 'scene-1' }),
                createTestPanel({ panelNumber: 3, shot: '中景', sceneId: 'scene-1' })
            ];
            
            const report = performQualityCheck(panels);
            
            const shotIssues = report.warnings.filter(i => i.type === IssueType.SHOT);
            expect(shotIssues.some(i => i.message.includes('建立镜头'))).toBe(true);
        });

        it('应该检测缺少必填字段', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, description: '' }),
                createTestPanel({ panelNumber: 2, shot: '' as any })
            ];
            
            const report = performQualityCheck(panels);
            
            const shotIssues = report.errors.filter(i => i.type === IssueType.SHOT);
            expect(shotIssues.length).toBeGreaterThanOrEqual(2);
        });

        it('应该检测对话过长', () => {
            const panels = [
                createTestPanel({ 
                    panelNumber: 1, 
                    dialogue: 'A'.repeat(250)
                })
            ];
            
            const report = performQualityCheck(panels);
            
            const dialogueIssues = report.warnings.filter(i => i.type === IssueType.DIALOGUE);
            expect(dialogueIssues.length).toBeGreaterThan(0);
        });

        it('应该检测对话缺少标点', () => {
            const panels = [
                createTestPanel({ 
                    panelNumber: 1, 
                    dialogue: '这是一段没有标点的对话'
                })
            ];
            
            const report = performQualityCheck(panels);
            
            const dialogueIssues = report.infos.filter(i => i.type === IssueType.DIALOGUE);
            expect(dialogueIssues.length).toBeGreaterThan(0);
        });

        it('应该检测分镜编号不连续', () => {
            const panels = [
                createTestPanel({ panelNumber: 1 }),
                createTestPanel({ panelNumber: 3 }), // 跳过了 2
                createTestPanel({ panelNumber: 4 })
            ];
            
            const report = performQualityCheck(panels);
            
            const logicIssues = report.errors.filter(i => i.type === IssueType.LOGIC);
            expect(logicIssues.length).toBeGreaterThan(0);
        });

        it('应该检测重复 ID', () => {
            const panels = [
                createTestPanel({ id: 'panel-1', panelNumber: 1 }),
                createTestPanel({ id: 'panel-1', panelNumber: 2 }) // 重复 ID
            ];
            
            const report = performQualityCheck(panels);
            
            const logicIssues = report.errors.filter(i => i.type === IssueType.LOGIC);
            expect(logicIssues.length).toBeGreaterThan(0);
        });

        it('应该支持禁用特定检查', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, duration: 0.5 })
            ];
            
            const report = performQualityCheck(panels, { 
                checkDuration: false 
            });
            
            const durationIssues = report.warnings.filter(i => i.type === IssueType.DURATION);
            expect(durationIssues.length).toBe(0);
        });

        it('应该计算质量分数', () => {
            const perfectPanels = [
                createTestPanel({ panelNumber: 1, shot: '远景', description: '建立' }),
                createTestPanel({ panelNumber: 2, shot: '中景', description: '正常' })
            ];
            
            const badPanels = [
                createTestPanel({ panelNumber: 1, description: '' }),
                createTestPanel({ panelNumber: 3, shot: '' as any }) // 编号跳跃 + 缺少景别
            ];
            
            const report1 = performQualityCheck(perfectPanels);
            const report2 = performQualityCheck(badPanels);
            
            expect(report1.summary.qualityScore).toBeGreaterThan(report2.summary.qualityScore);
        });

        it('应该处理空数组', () => {
            const report = performQualityCheck([]);
            
            expect(report.totalPanels).toBe(0);
            expect(report.totalIssues).toBe(0);
            expect(report.summary.qualityScore).toBe(100);
        });
    });

    describe('getIssueStatistics', () => {
        it('应该统计问题类型', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, duration: 0.5 }),
                createTestPanel({ panelNumber: 2, description: '' }),
                createTestPanel({ panelNumber: 3, dialogue: '没有标点' })
            ];
            
            const report = performQualityCheck(panels);
            const stats = getIssueStatistics(report);
            
            expect(stats.byType[IssueType.DURATION]).toBeGreaterThan(0);
            expect(stats.byType[IssueType.SHOT]).toBeGreaterThan(0);
            expect(stats.byType[IssueType.DIALOGUE]).toBeGreaterThan(0);
        });

        it('应该统计问题严重程度', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, description: '' }), // ERROR
                createTestPanel({ panelNumber: 2, duration: 0.5 })    // WARNING
            ];
            
            const report = performQualityCheck(panels);
            const stats = getIssueStatistics(report);
            
            expect(stats.bySeverity[IssueSeverity.ERROR]).toBeGreaterThan(0);
            expect(stats.bySeverity[IssueSeverity.WARNING]).toBeGreaterThan(0);
        });

        it('应该返回最严重的问题', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, description: '' }),
                createTestPanel({ panelNumber: 2, shot: '' as any }),
                createTestPanel({ panelNumber: 3, duration: 0.5 })
            ];
            
            const report = performQualityCheck(panels);
            const stats = getIssueStatistics(report);
            
            expect(stats.topIssues.length).toBeGreaterThan(0);
            expect(stats.topIssues.length).toBeLessThanOrEqual(5);
        });
    });

    describe('DEFAULT_CHECK_CONFIG', () => {
        it('应该有合理的默认值', () => {
            expect(DEFAULT_CHECK_CONFIG.checkContinuity).toBe(true);
            expect(DEFAULT_CHECK_CONFIG.checkDuration).toBe(true);
            expect(DEFAULT_CHECK_CONFIG.checkCharacter).toBe(true);
            expect(DEFAULT_CHECK_CONFIG.checkShot).toBe(true);
            expect(DEFAULT_CHECK_CONFIG.checkDialogue).toBe(true);
            expect(DEFAULT_CHECK_CONFIG.checkLogic).toBe(true);
            expect(DEFAULT_CHECK_CONFIG.minDuration).toBe(1);
            expect(DEFAULT_CHECK_CONFIG.maxDuration).toBe(15);
            expect(DEFAULT_CHECK_CONFIG.maxTotalDuration).toBe(600);
        });
    });

    describe('质量分数计算', () => {
        it('完美分镜应该得到高分', () => {
            const panels = [
                createTestPanel({ 
                    panelNumber: 1, 
                    shot: '远景', 
                    description: '建立镜头',
                    duration: 4
                }),
                createTestPanel({ 
                    panelNumber: 2, 
                    shot: '中景', 
                    description: '角色出现',
                    duration: 3
                })
            ];
            
            const report = performQualityCheck(panels);
            
            expect(report.summary.qualityScore).toBeGreaterThanOrEqual(90);
        });

        it('有错误的分镜应该扣分', () => {
            const panels = [
                createTestPanel({ panelNumber: 1, description: '' }), // -10
                createTestPanel({ panelNumber: 2, shot: '' as any })  // -10
            ];
            
            const report = performQualityCheck(panels);
            
            expect(report.summary.qualityScore).toBeLessThan(90);
        });

        it('质量分数不应低于0', () => {
            const panels = Array(20).fill(null).map((_, i) => 
                createTestPanel({ panelNumber: i + 1, description: '', shot: '' as any })
            );
            
            const report = performQualityCheck(panels);
            
            expect(report.summary.qualityScore).toBeGreaterThanOrEqual(0);
        });
    });
});
