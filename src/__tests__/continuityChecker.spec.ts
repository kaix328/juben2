/**
 * ContinuityChecker 测试
 * 测试分镜连贯性检查功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  ContinuityChecker, 
  continuityChecker,
  getSeverityColor,
  getSeverityIcon,
  formatReportAsText,
  CONTINUITY_RULES
} from '../app/utils/continuityChecker'
import type { StoryboardPanel } from '../app/types'

describe('ContinuityChecker', () => {
  let checker: ContinuityChecker

  beforeEach(() => {
    checker = new ContinuityChecker()
  })

  // ==========================================================================
  // 基础功能测试
  // ==========================================================================
  describe('基础功能', () => {
    it('应该创建检查器实例', () => {
      expect(checker).toBeInstanceOf(ContinuityChecker)
    })

    it('应该加载所有规则', () => {
      const rules = checker.getRules()
      
      expect(rules).toHaveLength(CONTINUITY_RULES.length)
      expect(rules.length).toBeGreaterThan(0)
    })

    it('应该支持启用/禁用规则', () => {
      checker.setRuleEnabled('axis_180', false)
      const rules = checker.getRules()
      const rule = rules.find(r => r.id === 'axis_180')
      
      expect(rule?.enabled).toBe(false)
    })
  })

  // ==========================================================================
  // 180度轴线规则测试
  // ==========================================================================
  describe('180度轴线规则', () => {
    it('应该检测连续过肩镜头的轴线问题', () => {
      const panel1: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '角色A说话',
        shot: '过肩镜头',
        shotSize: 'OTS',
        angle: '平视',
        cameraAngle: 'EYE_LEVEL',
        dialogue: '角色A: 你好',
        characters: ['角色A', '角色B'],
        props: [],
        notes: '',
        cameraMovement: '静止', // 添加运镜，避免触发30度规则
      }

      const panel2: StoryboardPanel = {
        id: 'panel-2',
        panelNumber: 2,
        sceneId: 'scene-1',
        description: '角色B回应',
        shot: '过肩镜头',
        shotSize: 'OTS',
        angle: '平视',
        cameraAngle: 'EYE_LEVEL', // 保持相同角度
        dialogue: '角色B: 你好',
        characters: ['角色A', '角色B'],
        props: [],
        notes: '',
        cameraMovement: '静止', // 添加运镜，避免触发30度规则
      }

      const issues = checker.checkPanel(panel2, panel1)
      
      expect(issues).toHaveLength(1)
      expect(issues[0].ruleId).toBe('axis_180')
      expect(issues[0].severity).toBe('error')
    })

    it('如果有轴线标注应该跳过检测', () => {
      const panel1: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '角色A说话',
        shot: '过肩镜头',
        shotSize: 'OTS',
        angle: '平视',
        cameraAngle: 'EYE_LEVEL',
        dialogue: '角色A: 你好',
        characters: ['角色A', '角色B'],
        props: [],
        notes: '',
        axisNote: '轴线在角色A左侧',
        cameraMovement: '静止', // 添加运镜，避免触发30度规则
      }

      const panel2: StoryboardPanel = {
        id: 'panel-2',
        panelNumber: 2,
        sceneId: 'scene-1',
        description: '角色B回应',
        shot: '过肩镜头',
        shotSize: 'OTS',
        angle: '平视',
        cameraAngle: 'EYE_LEVEL', // 保持相同角度
        dialogue: '角色B: 你好',
        characters: ['角色A', '角色B'],
        props: [],
        notes: '',
        cameraMovement: '静止', // 添加运镜，避免触发30度规则
      }

      const issues = checker.checkPanel(panel2, panel1)
      
      expect(issues).toHaveLength(0)
    })
  })

  // ==========================================================================
  // 30度规则测试
  // ==========================================================================
  describe('30度规则', () => {
    it('应该检测相同景别和角度的跳切', () => {
      const panel1: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '角色站立',
        shot: '中景',
        shotSize: 'MS',
        angle: '平视',
        cameraAngle: 'EYE_LEVEL',
        characters: ['角色A'],
        props: [],
        notes: '',
      }

      const panel2: StoryboardPanel = {
        id: 'panel-2',
        panelNumber: 2,
        sceneId: 'scene-1',
        description: '角色继续站立',
        shot: '中景',
        shotSize: 'MS',
        angle: '平视',
        cameraAngle: 'EYE_LEVEL',
        characters: ['角色A'],
        props: [],
        notes: '',
      }

      const issues = checker.checkPanel(panel2, panel1)
      
      expect(issues.length).toBeGreaterThan(0)
      const issue = issues.find(i => i.ruleId === 'rule_30_degree')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('如果有运镜应该跳过检测', () => {
      const panel1: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '角色站立',
        shot: '中景',
        angle: '平视',
        characters: ['角色A'],
        props: [],
        notes: '',
      }

      const panel2: StoryboardPanel = {
        id: 'panel-2',
        panelNumber: 2,
        sceneId: 'scene-1',
        description: '镜头推进',
        shot: '中景',
        angle: '平视',
        cameraMovement: '推镜',
        movementType: 'DOLLY_IN',
        characters: ['角色A'],
        props: [],
        notes: '',
      }

      const issues = checker.checkPanel(panel2, panel1)
      const issue = issues.find(i => i.ruleId === 'rule_30_degree')
      
      expect(issue).toBeUndefined()
    })
  })

  // ==========================================================================
  // 景别跳跃规则测试
  // ==========================================================================
  describe('景别跳跃规则', () => {
    it('应该检测景别跳跃过大', () => {
      const panel1: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '远景',
        shot: '远景',
        shotSize: 'EWS',
        angle: '平视',
        characters: [],
        props: [],
        notes: '',
      }

      const panel2: StoryboardPanel = {
        id: 'panel-2',
        panelNumber: 2,
        sceneId: 'scene-1',
        description: '特写',
        shot: '特写',
        shotSize: 'CU',
        angle: '平视',
        characters: ['角色A'],
        props: [],
        notes: '',
      }

      const issues = checker.checkPanel(panel2, panel1)
      const issue = issues.find(i => i.ruleId === 'shot_jump')
      
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
      expect(issue?.message).toContain('景别跳跃过大')
    })

    it('景别跳跃小于2级应该通过', () => {
      const panel1: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '中景',
        shot: '中景',
        shotSize: 'MS',
        angle: '平视',
        characters: ['角色A'],
        props: [],
        notes: '',
      }

      const panel2: StoryboardPanel = {
        id: 'panel-2',
        panelNumber: 2,
        sceneId: 'scene-1',
        description: '近景',
        shot: '近景',
        shotSize: 'MCU',
        angle: '平视',
        characters: ['角色A'],
        props: [],
        notes: '',
      }

      const issues = checker.checkPanel(panel2, panel1)
      const issue = issues.find(i => i.ruleId === 'shot_jump')
      
      expect(issue).toBeUndefined()
    })
  })

  // ==========================================================================
  // 对话场景覆盖测试
  // ==========================================================================
  describe('对话场景覆盖', () => {
    it('应该检测说话者不在画面中', () => {
      const panel: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '场景描述',
        shot: '中景',
        angle: '平视',
        dialogue: '张三: 你好',
        characters: ['李四'], // 张三不在画面中
        props: [],
        notes: '',
      }

      const issues = checker.checkPanel(panel)
      const issue = issues.find(i => i.ruleId === 'dialogue_coverage')
      
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
      expect(issue?.message).toContain('张三')
    })

    it('说话者在画面中应该通过', () => {
      const panel: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '场景描述',
        shot: '中景',
        angle: '平视',
        dialogue: '张三: 你好',
        characters: ['张三', '李四'],
        props: [],
        notes: '',
      }

      const issues = checker.checkPanel(panel)
      const issue = issues.find(i => i.ruleId === 'dialogue_coverage')
      
      expect(issue).toBeUndefined()
    })
  })

  // ==========================================================================
  // 场景建立镜头测试
  // ==========================================================================
  describe('场景建立镜头', () => {
    it('应该检测新场景未使用建立镜头', () => {
      const panel1: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '旧场景',
        shot: '中景',
        shotSize: 'MS',
        angle: '平视',
        characters: [],
        props: [],
        notes: '',
      }

      const panel2: StoryboardPanel = {
        id: 'panel-2',
        panelNumber: 2,
        sceneId: 'scene-2', // 新场景
        description: '新场景',
        shot: '特写',
        shotSize: 'CU', // 使用特写而非远景
        angle: '平视',
        characters: ['角色A'],
        props: [],
        notes: '',
      }

      const issues = checker.checkPanel(panel2, panel1)
      const issue = issues.find(i => i.ruleId === 'scene_establishing')
      
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('info')
      expect(issue?.message).toContain('未建立空间感')
    })

    it('新场景使用远景应该通过', () => {
      const panel1: StoryboardPanel = {
        id: 'panel-1',
        panelNumber: 1,
        sceneId: 'scene-1',
        description: '旧场景',
        shot: '中景',
        angle: '平视',
        characters: [],
        props: [],
        notes: '',
      }

      const panel2: StoryboardPanel = {
        id: 'panel-2',
        panelNumber: 2,
        sceneId: 'scene-2',
        description: '新场景',
        shot: '远景',
        shotSize: 'WS',
        angle: '平视',
        characters: [],
        props: [],
        notes: '',
      }

      const issues = checker.checkPanel(panel2, panel1)
      const issue = issues.find(i => i.ruleId === 'scene_establishing')
      
      expect(issue).toBeUndefined()
    })
  })

  // ==========================================================================
  // 完整检查测试
  // ==========================================================================
  describe('checkAllPanels', () => {
    it('应该检查所有分镜并生成报告', () => {
      const panels: StoryboardPanel[] = [
        {
          id: 'panel-1',
          panelNumber: 1,
          sceneId: 'scene-1',
          description: '开场',
          shot: '远景',
          shotSize: 'WS',
          angle: '平视',
          characters: [],
          props: [],
          notes: '',
        },
        {
          id: 'panel-2',
          panelNumber: 2,
          sceneId: 'scene-1',
          description: '角色出现',
          shot: '中景',
          shotSize: 'MS',
          angle: '平视',
          characters: ['角色A'],
          props: [],
          notes: '',
        },
      ]

      const report = checker.checkAllPanels(panels)
      
      expect(report).toBeDefined()
      expect(report.totalPanels).toBe(2)
      expect(report.checkedPanels).toBe(2)
      expect(report.issues).toBeInstanceOf(Array)
      expect(report.summary).toBeDefined()
      expect(report.score).toBeGreaterThanOrEqual(0)
      expect(report.score).toBeLessThanOrEqual(100)
    })

    it('无问题的分镜应该得到高分', () => {
      const panels: StoryboardPanel[] = [
        {
          id: 'panel-1',
          panelNumber: 1,
          sceneId: 'scene-1',
          description: '开场远景',
          shot: '远景',
          shotSize: 'WS',
          angle: '平视',
          characters: [],
          props: [],
          notes: '',
        },
        {
          id: 'panel-2',
          panelNumber: 2,
          sceneId: 'scene-1',
          description: '中景',
          shot: '中景',
          shotSize: 'MS',
          angle: '平视',
          characters: ['角色A'],
          props: [],
          notes: '',
        },
        {
          id: 'panel-3',
          panelNumber: 3,
          sceneId: 'scene-1',
          description: '特写',
          shot: '特写',
          shotSize: 'CU',
          angle: '平视',
          characters: ['角色A'],
          props: [],
          notes: '',
        },
      ]

      const report = checker.checkAllPanels(panels)
      
      expect(report.score).toBeGreaterThan(80)
    })

    it('应该正确统计问题数量', () => {
      const panels: StoryboardPanel[] = [
        {
          id: 'panel-1',
          panelNumber: 1,
          sceneId: 'scene-1',
          description: '中景',
          shot: '中景',
          shotSize: 'MS',
          angle: '平视',
          characters: ['角色A'],
          props: [],
          notes: '',
        },
        {
          id: 'panel-2',
          panelNumber: 2,
          sceneId: 'scene-1',
          description: '相同镜头',
          shot: '中景',
          shotSize: 'MS',
          angle: '平视',
          characters: ['角色A'],
          props: [],
          notes: '',
        },
      ]

      const report = checker.checkAllPanels(panels)
      
      expect(report.summary.errors + report.summary.warnings + report.summary.infos).toBe(report.issues.length)
    })
  })

  // ==========================================================================
  // 辅助函数测试
  // ==========================================================================
  describe('辅助函数', () => {
    it('getSeverityColor 应该返回正确的颜色类', () => {
      expect(getSeverityColor('error')).toContain('red')
      expect(getSeverityColor('warning')).toContain('orange')
      expect(getSeverityColor('info')).toContain('blue')
    })

    it('getSeverityIcon 应该返回正确的图标', () => {
      expect(getSeverityIcon('error')).toBe('❌')
      expect(getSeverityIcon('warning')).toBe('⚠️')
      expect(getSeverityIcon('info')).toBe('ℹ️')
    })

    it('formatReportAsText 应该生成文本报告', () => {
      const panels: StoryboardPanel[] = [
        {
          id: 'panel-1',
          panelNumber: 1,
          sceneId: 'scene-1',
          description: '测试',
          shot: '中景',
          angle: '平视',
          characters: [],
          props: [],
          notes: '',
        },
      ]

      const report = checker.checkAllPanels(panels)
      const text = formatReportAsText(report)
      
      expect(text).toContain('分镜连贯性检测报告')
      expect(text).toContain('总分镜数')
      expect(text).toContain('连贯性评分')
    })
  })

  // ==========================================================================
  // 单例测试
  // ==========================================================================
  describe('单例', () => {
    it('continuityChecker 应该是可用的单例', () => {
      expect(continuityChecker).toBeInstanceOf(ContinuityChecker)
      
      const panels: StoryboardPanel[] = [
        {
          id: 'panel-1',
          panelNumber: 1,
          sceneId: 'scene-1',
          description: '测试',
          shot: '中景',
          angle: '平视',
          characters: [],
          props: [],
          notes: '',
        },
      ]

      const report = continuityChecker.checkAllPanels(panels)
      expect(report).toBeDefined()
    })
  })
})
