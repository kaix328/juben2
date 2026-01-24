/**
 * 组件测试模板
 * 基于 frontend-testing skill
 * 
 * 使用方法:
 * 1. 复制此模板到组件目录
 * 2. 重命名为 ComponentName.spec.tsx
 * 3. 替换 ComponentName 为实际组件名
 * 4. 根据组件功能添加/删除测试用例
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// import { ComponentName } from './index'

// ============================================================================
// Mocks
// ============================================================================

// 路由 Mock (如果组件使用 useNavigate, useParams 等)
// const mockNavigate = vi.fn()
// vi.mock('react-router-dom', async () => {
//   const actual = await vi.importActual('react-router-dom')
//   return {
//     ...actual,
//     useNavigate: () => mockNavigate,
//     useParams: () => ({ id: 'test-id' }),
//   }
// })

// API Mock (如果组件调用 API)
// vi.mock('@/utils/volcApi')
// import * as api from '@/utils/volcApi'
// const mockedApi = vi.mocked(api)

// Storage Mock (如果组件使用 IndexedDB)
// vi.mock('@/utils/storage')
// import * as storage from '@/utils/storage'
// const mockedStorage = vi.mocked(storage)

// ============================================================================
// 测试数据工厂
// ============================================================================

// const createMockProps = (overrides = {}) => ({
//   title: 'Test Title',
//   onSubmit: vi.fn(),
//   ...overrides,
// })

// const createMockItem = (overrides = {}) => ({
//   id: 'item-1',
//   name: 'Test Item',
//   createdAt: new Date().toISOString(),
//   ...overrides,
// })

// ============================================================================
// 测试辅助函数
// ============================================================================

// const renderComponent = (props = {}) => {
//   return render(<ComponentName {...createMockProps(props)} />)
// }

// ============================================================================
// 测试用例
// ============================================================================

describe('ComponentName', () => {
  // 每个测试前重置 mocks
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // 渲染测试 (必需)
  // --------------------------------------------------------------------------
  describe('渲染', () => {
    it('应该正常渲染', () => {
      // Arrange
      // const props = createMockProps()

      // Act
      // render(<ComponentName {...props} />)

      // Assert
      // expect(screen.getByRole('...')).toBeInTheDocument()
    })

    it('应该使用默认 props 渲染', () => {
      // render(<ComponentName />)
      // expect(screen.getByText('...')).toBeInTheDocument()
    })
  })

  // --------------------------------------------------------------------------
  // Props 测试 (必需)
  // --------------------------------------------------------------------------
  describe('Props', () => {
    it('应该应用自定义 className', () => {
      // render(<ComponentName className="custom-class" />)
      // expect(screen.getByTestId('component')).toHaveClass('custom-class')
    })

    it('应该正确处理必需的 props', () => {
      // const handleClick = vi.fn()
      // render(<ComponentName onClick={handleClick} />)
      // fireEvent.click(screen.getByRole('button'))
      // expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  // --------------------------------------------------------------------------
  // 用户交互测试 (如果有事件处理)
  // --------------------------------------------------------------------------
  describe('用户交互', () => {
    it('应该处理点击事件', async () => {
      // const user = userEvent.setup()
      // const handleClick = vi.fn()
      // render(<ComponentName onClick={handleClick} />)
      //
      // await user.click(screen.getByRole('button'))
      //
      // expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('应该处理输入变化', async () => {
      // const user = userEvent.setup()
      // const handleChange = vi.fn()
      // render(<ComponentName onChange={handleChange} />)
      //
      // await user.type(screen.getByRole('textbox'), 'new value')
      //
      // expect(handleChange).toHaveBeenCalled()
    })

    it('应该处理表单提交', async () => {
      // const user = userEvent.setup()
      // const handleSubmit = vi.fn()
      // render(<ComponentName onSubmit={handleSubmit} />)
      //
      // await user.type(screen.getByLabelText('名称'), 'Test')
      // await user.click(screen.getByRole('button', { name: /提交/i }))
      //
      // expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({
      //   name: 'Test'
      // }))
    })
  })

  // --------------------------------------------------------------------------
  // 状态管理测试 (如果有 useState/useReducer)
  // --------------------------------------------------------------------------
  describe('状态管理', () => {
    it('应该在交互后更新状态', async () => {
      // const user = userEvent.setup()
      // render(<ComponentName />)
      //
      // // 初始状态
      // expect(screen.getByText('初始值')).toBeInTheDocument()
      //
      // // 触发状态变化
      // await user.click(screen.getByRole('button'))
      //
      // // 验证新状态
      // expect(screen.getByText('更新后的值')).toBeInTheDocument()
    })
  })

  // --------------------------------------------------------------------------
  // 异步操作测试 (如果有 API 调用)
  // --------------------------------------------------------------------------
  describe('异步操作', () => {
    it('应该显示加载状态', () => {
      // mockedApi.fetchData.mockImplementation(() => new Promise(() => {}))
      // render(<ComponentName />)
      //
      // expect(screen.getByText(/加载中/i)).toBeInTheDocument()
    })

    it('应该在成功时显示数据', async () => {
      // mockedApi.fetchData.mockResolvedValue({ items: ['Item 1'] })
      // render(<ComponentName />)
      //
      // await waitFor(() => {
      //   expect(screen.getByText('Item 1')).toBeInTheDocument()
      // })
    })

    it('应该在失败时显示错误', async () => {
      // mockedApi.fetchData.mockRejectedValue(new Error('网络错误'))
      // render(<ComponentName />)
      //
      // await waitFor(() => {
      //   expect(screen.getByText(/错误/i)).toBeInTheDocument()
      // })
    })
  })

  // --------------------------------------------------------------------------
  // 边界情况测试 (必需)
  // --------------------------------------------------------------------------
  describe('边界情况', () => {
    it('应该处理 null 值', () => {
      // render(<ComponentName value={null} />)
      // expect(screen.getByText(/暂无数据/i)).toBeInTheDocument()
    })

    it('应该处理 undefined 值', () => {
      // render(<ComponentName value={undefined} />)
      // expect(screen.getByText(/暂无数据/i)).toBeInTheDocument()
    })

    it('应该处理空数组', () => {
      // render(<ComponentName items={[]} />)
      // expect(screen.getByText(/暂无内容/i)).toBeInTheDocument()
    })

    it('应该处理空字符串', () => {
      // render(<ComponentName text="" />)
      // expect(screen.getByPlaceholderText(/请输入/i)).toBeInTheDocument()
    })

    it('应该处理超长文本', () => {
      // const longText = 'a'.repeat(1000)
      // render(<ComponentName text={longText} />)
      // expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument() // 应该被截断
    })
  })

  // --------------------------------------------------------------------------
  // 可访问性测试 (推荐)
  // --------------------------------------------------------------------------
  describe('可访问性', () => {
    it('应该有可访问的名称', () => {
      // render(<ComponentName label="测试标签" />)
      // expect(screen.getByRole('button', { name: /测试标签/i })).toBeInTheDocument()
    })

    it('应该支持键盘导航', async () => {
      // const user = userEvent.setup()
      // render(<ComponentName />)
      //
      // await user.tab()
      // expect(screen.getByRole('button')).toHaveFocus()
    })

    it('应该有正确的 ARIA 属性', () => {
      // render(<ComponentName disabled />)
      // expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })
  })
})
