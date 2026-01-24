/**
 * PromptEngine 测试
 * 测试提示词生成引擎的核心功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PromptEngine, createPromptEngine, generateCharacterPrompt } from '../app/utils/promptEngine'
import type { Character, Scene, StoryboardPanel, DirectorStyle } from '../app/types'

describe('PromptEngine', () => {
  let engine: PromptEngine
  let mockDirectorStyle: DirectorStyle

  beforeEach(() => {
    mockDirectorStyle = {
      id: 'style-1',
      name: '电影风格',
      artStyle: '写实风格',
      colorTone: '冷色调',
      lightingStyle: '自然光',
      cameraStyle: '手持摄影',
      mood: '紧张',
      customPrompt: 'cinematic, professional',
    }
    engine = new PromptEngine(mockDirectorStyle)
  })

  // ==========================================================================
  // 触发词生成测试
  // ==========================================================================
  describe('generateTriggerWord', () => {
    it('应该生成标准格式的触发词', () => {
      const triggerWord = PromptEngine.generateTriggerWord('张三', 'char-123456')
      
      expect(triggerWord).toMatch(/^char_[a-z0-9]+_[a-z0-9]{4}$/)
      expect(triggerWord).toContain('char_')
    })

    it('应该处理中文名称', () => {
      const triggerWord = PromptEngine.generateTriggerWord('李明', 'char-abc123')
      
      expect(triggerWord).toBeTruthy()
      expect(triggerWord).toMatch(/^char_/)
    })

    it('应该处理英文名称', () => {
      const triggerWord = PromptEngine.generateTriggerWord('John Smith', 'char-xyz789')
      
      expect(triggerWord).toContain('char_')
      // 名字会被截断到8个字符，所以 "johnsmith" 变成 "johnsmit"
      expect(triggerWord).toContain('johnsmit')
    })

    it('应该使用ID后4位作为哈希', () => {
      const triggerWord = PromptEngine.generateTriggerWord('测试', 'char-abcd1234')
      
      expect(triggerWord).toContain('1234')
    })
  })

  // ==========================================================================
  // 角色全身图提示词测试
  // ==========================================================================
  describe('forCharacterFullBody', () => {
    const mockCharacter: Character = {
      id: 'char-1',
      name: '张三',
      appearance: '黑色短发，蓝色眼睛，身穿白色衬衫',
      personality: '冷静',
      triggerWord: 'char_zhangsan_0001',
      referenceImages: [],
    }

    it('应该生成包含角色名称的提示词', () => {
      const result = engine.forCharacterFullBody(mockCharacter)
      
      expect(result.positive).toContain('张三')
    })

    it('应该包含触发词', () => {
      const result = engine.forCharacterFullBody(mockCharacter)
      
      expect(result.positive).toContain('char_zhangsan_0001')
    })

    it('应该包含外观描述', () => {
      const result = engine.forCharacterFullBody(mockCharacter)
      
      expect(result.positive).toContain('黑色短发')
    })

    it('应该包含全身视图标签', () => {
      const result = engine.forCharacterFullBody(mockCharacter)
      
      expect(result.positive).toContain('full body')
      expect(result.positive).toContain('白色背景')
    })

    it('应该包含导演风格', () => {
      const result = engine.forCharacterFullBody(mockCharacter)
      
      expect(result.positive).toContain('写实风格')
      expect(result.positive).toContain('cinematic')
    })

    it('应该包含负面提示词', () => {
      const result = engine.forCharacterFullBody(mockCharacter)
      
      expect(result.negative).toBeTruthy()
      expect(result.negative).toContain('low quality')
      expect(result.negative).toContain('bad anatomy')
    })

    it('应该包含元数据', () => {
      const result = engine.forCharacterFullBody(mockCharacter)
      
      expect(result.metadata).toBeDefined()
      expect(result.metadata?.hasStyle).toBe(true)
      expect(result.metadata?.totalParts).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // 角色脸部图提示词测试
  // ==========================================================================
  describe('forCharacterFace', () => {
    const mockCharacter: Character = {
      id: 'char-1',
      name: '李四',
      appearance: '金色长发，绿色眼睛，高鼻梁，薄嘴唇',
      personality: '温柔',
      triggerWord: 'char_lisi_0002',
      referenceImages: [],
    }

    it('应该生成脸部特写提示词', () => {
      const result = engine.forCharacterFace(mockCharacter)
      
      expect(result.positive).toContain('face close-up')
      expect(result.positive).toContain('脸部特写')
    })

    it('应该只包含前3个面部特征', () => {
      const result = engine.forCharacterFace(mockCharacter)
      
      expect(result.positive).toContain('金色长发')
      expect(result.positive).toContain('绿色眼睛')
      expect(result.positive).toContain('高鼻梁')
    })

    it('应该包含面部质量标签', () => {
      const result = engine.forCharacterFace(mockCharacter)
      
      expect(result.positive).toContain('detailed face')
      expect(result.positive).toContain('clear eyes')
    })
  })

  // ==========================================================================
  // 场景提示词测试
  // ==========================================================================
  describe('forSceneWide', () => {
    const mockScene: Scene = {
      id: 'scene-1',
      name: '城市街道',
      location: '繁华商业区',
      environment: '高楼林立，霓虹闪烁',
      timeOfDay: 'night',
      weather: '晴朗',
      description: '现代都市夜景',
    }

    it('应该生成远景提示词', () => {
      const result = engine.forSceneWide(mockScene)
      
      expect(result.positive).toContain('wide shot')
      expect(result.positive).toContain('远景镜头')
    })

    it('应该包含场景名称和位置', () => {
      const result = engine.forSceneWide(mockScene)
      
      expect(result.positive).toContain('城市街道')
      expect(result.positive).toContain('繁华商业区')
    })

    it('应该包含时间描述', () => {
      const result = engine.forSceneWide(mockScene)
      
      expect(result.positive).toContain('夜晚')
      expect(result.positive).toContain('nighttime')
    })

    it('应该包含天气信息', () => {
      const result = engine.forSceneWide(mockScene)
      
      expect(result.positive).toContain('晴朗天气')
    })
  })

  // ==========================================================================
  // 分镜图片提示词测试
  // ==========================================================================
  describe('forStoryboardImage', () => {
    const mockPanel: StoryboardPanel = {
      id: 'panel-1',
      panelNumber: 1,
      sceneId: 'scene-1',
      description: '主角站在街道中央',
      shot: '中景',
      shotSize: 'MS',
      angle: '平视',
      cameraAngle: 'EYE_LEVEL',
      characters: ['张三'],
      props: ['手机', '背包'],
      notes: '',
    }

    const mockCharacters: Character[] = [
      {
        id: 'char-1',
        name: '张三',
        appearance: '黑色短发，蓝色眼睛',
        personality: '冷静',
        referenceImages: [],
      },
    ]

    const mockScenes: Scene[] = []

    it('应该生成包含景别的提示词', () => {
      const result = engine.forStoryboardImage(mockPanel, mockCharacters, mockScenes)
      
      expect(result.positive).toContain('中景')
      expect(result.positive).toContain('medium shot')
    })

    it('应该包含角度信息', () => {
      const result = engine.forStoryboardImage(mockPanel, mockCharacters, mockScenes)
      
      expect(result.positive).toContain('平视')
      expect(result.positive).toContain('eye level')
    })

    it('应该包含画面描述', () => {
      const result = engine.forStoryboardImage(mockPanel, mockCharacters, mockScenes)
      
      expect(result.positive).toContain('主角站在街道中央')
    })

    it('应该包含角色信息', () => {
      const result = engine.forStoryboardImage(mockPanel, mockCharacters, mockScenes)
      
      expect(result.positive).toContain('张三')
      expect(result.positive).toContain('黑色短发')
    })

    it('应该包含道具信息', () => {
      const result = engine.forStoryboardImage(mockPanel, mockCharacters, mockScenes)
      
      expect(result.positive).toContain('手机')
      expect(result.positive).toContain('背包')
    })

    it('应该包含电影质量标签', () => {
      const result = engine.forStoryboardImage(mockPanel, mockCharacters, mockScenes)
      
      expect(result.positive).toContain('cinematic')
      expect(result.positive).toContain('professional')
    })
  })

  // ==========================================================================
  // 分镜视频提示词测试
  // ==========================================================================
  describe('forStoryboardVideo', () => {
    const mockPanel: StoryboardPanel = {
      id: 'panel-1',
      panelNumber: 1,
      sceneId: 'scene-1',
      description: '镜头缓慢推进',
      shot: '中景',
      angle: '平视',
      cameraMovement: '推镜',
      movementType: 'DOLLY_IN',
      duration: 5,
      characters: ['张三'],
      props: [],
      notes: '',
    }

    const mockCharacters: Character[] = [
      {
        id: 'char-1',
        name: '张三',
        appearance: '黑色短发',
        personality: '冷静',
        referenceImages: [],
      },
    ]

    it('应该生成包含运镜的提示词', () => {
      const result = engine.forStoryboardVideo(mockPanel, mockCharacters)
      
      expect(result.positive).toContain('推镜')
      expect(result.positive).toContain('dolly forward')
    })

    it('应该包含时长信息', () => {
      const result = engine.forStoryboardVideo(mockPanel, mockCharacters)
      
      expect(result.positive).toContain('5秒')
      expect(result.positive).toContain('5 seconds')
    })

    it('应该包含动作描述', () => {
      const result = engine.forStoryboardVideo(mockPanel, mockCharacters)
      
      expect(result.positive).toContain('镜头缓慢推进')
    })

    it('应该包含视频质量标签', () => {
      const result = engine.forStoryboardVideo(mockPanel, mockCharacters)
      
      expect(result.positive).toContain('smooth motion')
      expect(result.positive).toContain('cinematic video')
    })
  })

  // ==========================================================================
  // 便捷函数测试
  // ==========================================================================
  describe('便捷函数', () => {
    it('createPromptEngine 应该创建引擎实例', () => {
      const engine = createPromptEngine(mockDirectorStyle)
      
      expect(engine).toBeInstanceOf(PromptEngine)
    })

    it('generateCharacterPrompt 应该生成角色提示词', () => {
      const mockCharacter: Character = {
        id: 'char-1',
        name: '测试角色',
        appearance: '测试外观',
        personality: '测试性格',
        referenceImages: [],
      }

      const prompt = generateCharacterPrompt(mockCharacter, mockDirectorStyle)
      
      expect(prompt).toBeTruthy()
      expect(prompt).toContain('测试角色')
    })
  })

  // ==========================================================================
  // 配置选项测试
  // ==========================================================================
  describe('引擎配置', () => {
    it('应该支持禁用负面提示词', () => {
      const engine = new PromptEngine(mockDirectorStyle, { includeNegative: false })
      const mockCharacter: Character = {
        id: 'char-1',
        name: '测试',
        appearance: '测试',
        personality: '测试',
        referenceImages: [],
      }

      const result = engine.forCharacterFullBody(mockCharacter)
      
      expect(result.negative).toBe('')
    })

    it('应该支持不同的质量标签级别', () => {
      const engineNone = new PromptEngine(mockDirectorStyle, { qualityTags: 'none' })
      const engineBasic = new PromptEngine(mockDirectorStyle, { qualityTags: 'basic' })
      const enginePro = new PromptEngine(mockDirectorStyle, { qualityTags: 'professional' })

      const mockCharacter: Character = {
        id: 'char-1',
        name: '测试',
        appearance: '测试',
        personality: '测试',
        referenceImages: [],
      }

      const resultNone = engineNone.forCharacterFullBody(mockCharacter)
      const resultBasic = engineBasic.forCharacterFullBody(mockCharacter)
      const resultPro = enginePro.forCharacterFullBody(mockCharacter)

      expect(resultNone.positive).not.toContain('masterpiece')
      expect(resultBasic.positive).toContain('高质量')
      expect(resultPro.positive).toContain('masterpiece')
    })
  })
})
