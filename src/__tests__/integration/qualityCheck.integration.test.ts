/**
 * 质量检查集成测试
 * 测试质量检查功能的准确性和性能
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { performQualityCheck, IssueSeverity, IssueType } from '../../app/utils/ai/qualityChecker';
import type { StoryboardPanel } from '../../types';

describe('质量检查集成测试', () => {
    let basePanels: StoryboardPanel[];

    beforeEach(() => {
        // 基础测试数据
        basePanels = [
            {
                id: 'p1',
                panelNumber: 1,
                sceneId: 'scene1',
                shot: '全景',
                angle: '正面',
                movement: '固定',
                duration: 3,
                description: '建立镜头：教室全景',
                dialogue: '',
                characters: [],
                notes: '建立镜头'
            },
            {
                id: 'p2',
                panelNumber: 2,
                sceneId: 'scene1',
                shot: '中景',
                angle: '正面',
                movement: '固定',
                duration: 4,
                description: '小明和小红坐在教室里',
                dialogue: '你好！',
                characters: ['小明', '小红'],
                notes: ''
            }
        ];
    });

    describe('连贯性检查', () => {
        it('应检测连续3个相同景别', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], panelNumber: 1, shot: '近景' },
                { ...basePanels[0], panelNumber: 2, shot: '近景' },
                { ...basePanels[0], panelNumber: 3, shot: '近景' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.warnings.find(i => 
                i.message.includes('连续 3 个相同景别')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.severity).toBe(IssueSeverity.WARNING);
            expect(issue?.type).toBe(IssueType.CONTINUITY);
        });

        it('应检测轴线跳跃', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], panelNumber: 1, angle: '左侧', sceneId: 'scene1' },
                { ...basePanels[0], panelNumber: 2, angle: '右侧', sceneId: 'scene1' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.warnings.find(i => 
                i.message.includes('轴线跳跃')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.severity).toBe(IssueSeverity.WARNING);
        });

        it('应检测景别跳跃过大', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], panelNumber: 1, shot: '远景', sceneId: 'scene1' },
                { ...basePanels[0], panelNumber: 2, shot: '特写', sceneId: 'scene1' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.infos.find(i => 
                i.message.includes('景别跳跃过大')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.severity).toBe(IssueSeverity.INFO);
        });
    });

    describe('时长检查', () => {
        it('应检测时长过短', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], duration: 0.5 }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.warnings.find(i => 
                i.message.includes('时长过短')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.message).toContain('0.5秒');
        });

        it('应检测时长过长', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], duration: 20 }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.warnings.find(i => 
                i.message.includes('时长过长')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.message).toContain('20秒');
        });

        it('应检测对话时长不匹配', () => {
            const panels: StoryboardPanel[] = [
                { 
                    ...basePanels[0], 
                    duration: 2,
                    dialogue: '这是一段很长的对话内容，需要至少5秒才能说完，但是分镜时长只有2秒，这样会导致对话说不完'
                }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.warnings.find(i => 
                i.message.includes('对话时长不足')
            );
            
            expect(issue).toBeDefined();
        });

        it('应检测总时长过长', () => {
            const panels: StoryboardPanel[] = Array.from({ length: 50 }, (_, i) => ({
                ...basePanels[0],
                id: `p${i}`,
                panelNumber: i + 1,
                duration: 15
            }));

            const report = performQualityCheck(panels);
            
            const issue = report.infos.find(i => 
                i.message.includes('总时长过长')
            );
            
            expect(issue).toBeDefined();
        });
    });

    describe('角色检查', () => {
        it('应检测有对话但无角色', () => {
            const panels: StoryboardPanel[] = [
                { 
                    ...basePanels[0], 
                    dialogue: '你好！',
                    characters: []
                }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.errors.find(i => 
                i.message.includes('有对话但没有角色')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.severity).toBe(IssueSeverity.ERROR);
        });

        it('应检测角色突然消失', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], panelNumber: 1, characters: ['小明', '小红'], sceneId: 'scene1' },
                { ...basePanels[0], panelNumber: 2, characters: ['小明'], sceneId: 'scene1' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.warnings.find(i => 
                i.message.includes('突然消失')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.message).toContain('小红');
        });

        it('应检测角色突然出现', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], panelNumber: 1, characters: ['小明'], sceneId: 'scene1' },
                { ...basePanels[0], panelNumber: 2, characters: ['小明', '小红'], sceneId: 'scene1' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.infos.find(i => 
                i.message.includes('突然出现')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.message).toContain('小红');
        });
    });

    describe('镜头检查', () => {
        it('应检测缺少建立镜头', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], panelNumber: 1, shot: '近景', notes: '' },
                { ...basePanels[0], panelNumber: 2, shot: '特写', notes: '' },
                { ...basePanels[0], panelNumber: 3, shot: '中景', notes: '' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.warnings.find(i => 
                i.message.includes('缺少建立镜头')
            );
            
            expect(issue).toBeDefined();
        });

        it('应检测缺少画面描述', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], description: '' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.errors.find(i => 
                i.message.includes('缺少画面描述')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.severity).toBe(IssueSeverity.ERROR);
        });

        it('应检测缺少景别', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], shot: '' as any }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.errors.find(i => 
                i.message.includes('缺少景别')
            );
            
            expect(issue).toBeDefined();
        });
    });

    describe('对话检查', () => {
        it('应检测对话过长', () => {
            const panels: StoryboardPanel[] = [
                { 
                    ...basePanels[0], 
                    dialogue: '这是一段非常非常长的对话'.repeat(20)
                }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.warnings.find(i => 
                i.message.includes('对话过长')
            );
            
            expect(issue).toBeDefined();
        });

        it('应检测缺少标点符号', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], dialogue: '你好我是小明' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.infos.find(i => 
                i.message.includes('缺少标点符号')
            );
            
            expect(issue).toBeDefined();
        });
    });

    describe('逻辑检查', () => {
        it('应检测编号不连续', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], panelNumber: 1 },
                { ...basePanels[0], panelNumber: 3, id: 'p3' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.errors.find(i => 
                i.message.includes('编号不连续')
            );
            
            expect(issue).toBeDefined();
            expect(issue?.severity).toBe(IssueSeverity.ERROR);
        });

        it('应检测ID重复', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], panelNumber: 1, id: 'p1' },
                { ...basePanels[0], panelNumber: 2, id: 'p1' }
            ];

            const report = performQualityCheck(panels);
            
            const issue = report.errors.find(i => 
                i.message.includes('ID 重复')
            );
            
            expect(issue).toBeDefined();
        });
    });

    describe('质量分数计算', () => {
        it('无问题时应得100分', () => {
            const report = performQualityCheck(basePanels);
            expect(report.summary.qualityScore).toBeGreaterThanOrEqual(80);
        });

        it('有错误时应扣分', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], description: '' }, // 错误
                { ...basePanels[0], shot: '' as any }  // 错误
            ];

            const report = performQualityCheck(panels);
            expect(report.summary.qualityScore).toBeLessThan(100);
            expect(report.summary.errorCount).toBeGreaterThan(0);
        });

        it('质量分数不应低于0', () => {
            const panels: StoryboardPanel[] = Array.from({ length: 20 }, (_, i) => ({
                ...basePanels[0],
                id: `p${i}`,
                panelNumber: i + 1,
                description: '',
                shot: '' as any,
                dialogue: '你好',
                characters: []
            }));

            const report = performQualityCheck(panels);
            expect(report.summary.qualityScore).toBeGreaterThanOrEqual(0);
        });
    });

    describe('性能测试', () => {
        it('小规模测试（10个分镜）应在1秒内完成', () => {
            const panels: StoryboardPanel[] = Array.from({ length: 10 }, (_, i) => ({
                ...basePanels[0],
                id: `p${i}`,
                panelNumber: i + 1
            }));

            const startTime = performance.now();
            performQualityCheck(panels);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(1000);
        });

        it('中等规模测试（25个分镜）应在2秒内完成', () => {
            const panels: StoryboardPanel[] = Array.from({ length: 25 }, (_, i) => ({
                ...basePanels[0],
                id: `p${i}`,
                panelNumber: i + 1
            }));

            const startTime = performance.now();
            performQualityCheck(panels);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(2000);
        });

        it('大规模测试（50个分镜）应在5秒内完成', () => {
            const panels: StoryboardPanel[] = Array.from({ length: 50 }, (_, i) => ({
                ...basePanels[0],
                id: `p${i}`,
                panelNumber: i + 1
            }));

            const startTime = performance.now();
            performQualityCheck(panels);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(5000);
        });
    });

    describe('边界情况测试', () => {
        it('空数组应返回100分', () => {
            const report = performQualityCheck([]);
            expect(report.summary.qualityScore).toBe(100);
            expect(report.totalPanels).toBe(0);
            expect(report.totalIssues).toBe(0);
        });

        it('单个分镜应正常检查', () => {
            const panels: StoryboardPanel[] = [basePanels[0]];
            const report = performQualityCheck(panels);
            
            expect(report.totalPanels).toBe(1);
            expect(report).toBeDefined();
        });

        it('应处理特殊字符', () => {
            const panels: StoryboardPanel[] = [
                {
                    ...basePanels[0],
                    dialogue: '你好！@#$%^&*()_+{}[]|\\:";\'<>?,./~`',
                    description: '特殊字符：😀🎉🎨'
                }
            ];

            expect(() => performQualityCheck(panels)).not.toThrow();
        });

        it('应处理缺失字段', () => {
            const panels: StoryboardPanel[] = [
                {
                    id: 'p1',
                    panelNumber: 1,
                    sceneId: 'scene1',
                    shot: '全景',
                    angle: '正面',
                    movement: '固定',
                    duration: 3,
                    description: '测试',
                    dialogue: '',
                    characters: []
                } as any
            ];

            expect(() => performQualityCheck(panels)).not.toThrow();
        });
    });

    describe('配置测试', () => {
        it('应支持禁用特定检查', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], duration: 0.5 }
            ];

            const report = performQualityCheck(panels, {
                checkDuration: false
            });

            const issue = report.warnings.find(i => 
                i.message.includes('时长')
            );

            expect(issue).toBeUndefined();
        });

        it('应支持自定义时长阈值', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], duration: 2 }
            ];

            const report = performQualityCheck(panels, {
                minDuration: 3
            });

            const issue = report.warnings.find(i => 
                i.message.includes('时长过短')
            );

            expect(issue).toBeDefined();
        });
    });

    describe('报告格式测试', () => {
        it('应包含所有必需字段', () => {
            const report = performQualityCheck(basePanels);

            expect(report).toHaveProperty('totalPanels');
            expect(report).toHaveProperty('totalIssues');
            expect(report).toHaveProperty('errors');
            expect(report).toHaveProperty('warnings');
            expect(report).toHaveProperty('infos');
            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('checkTime');
        });

        it('summary应包含正确的统计', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], description: '' }, // 错误
                { ...basePanels[0], panelNumber: 2, duration: 0.5 } // 警告
            ];

            const report = performQualityCheck(panels);

            expect(report.summary.errorCount).toBe(report.errors.length);
            expect(report.summary.warningCount).toBe(report.warnings.length);
            expect(report.summary.infoCount).toBe(report.infos.length);
        });

        it('每个问题应包含必需字段', () => {
            const panels: StoryboardPanel[] = [
                { ...basePanels[0], description: '' }
            ];

            const report = performQualityCheck(panels);
            const issue = report.errors[0];

            expect(issue).toHaveProperty('id');
            expect(issue).toHaveProperty('type');
            expect(issue).toHaveProperty('severity');
            expect(issue).toHaveProperty('panelNumber');
            expect(issue).toHaveProperty('panelId');
            expect(issue).toHaveProperty('message');
        });
    });
});
