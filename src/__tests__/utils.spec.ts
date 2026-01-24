/**
 * 工具函数测试
 * 测试通用工具函数
 */

import { describe, it, expect } from 'vitest'
import { cn } from '../app/utils/classnames'

describe('classnames utility', () => {
  describe('cn', () => {
    it('应该合并多个类名', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('应该过滤 falsy 值', () => {
      const result = cn('class1', false && 'class2', null, undefined, 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class3')
      expect(result).not.toContain('class2')
    })

    it('应该处理条件类名', () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled'
      )

      expect(result).toContain('base-class')
      expect(result).toContain('active')
      expect(result).not.toContain('disabled')
    })

    it('应该处理空输入', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('应该处理对象语法', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      })

      expect(result).toContain('class1')
      expect(result).not.toContain('class2')
      expect(result).toContain('class3')
    })

    it('应该合并 Tailwind 类名并处理冲突', () => {
      // tailwind-merge 应该处理冲突的类名
      const result = cn('px-2', 'px-4')
      // 后面的应该覆盖前面的
      expect(result).toContain('px-4')
    })

    it('应该处理数组输入', () => {
      const result = cn(['class1', 'class2'])
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })
  })
})

describe('JSON Parser', () => {
  // 如果有 json-parser.ts 的导出函数，可以在这里测试
  it('placeholder test', () => {
    expect(true).toBe(true)
  })
})
