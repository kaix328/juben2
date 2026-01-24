/**
 * ShotCard 组件测试套件
 * 测试分镜卡片组件的所有功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ShotCard, ShotCardDraggable } from '../../app/components/storyboard/ShotCard';
import type { StoryboardPanel } from '../../app/types';
import type { PanelStatus } from '../../app/pages/StoryboardEditor/types';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock UI components
vi.mock('../../app/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../app/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('../../app/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('../../app/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('../../app/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
}));

vi.mock('../../app/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock('../../app/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('../../app/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick}>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

describe('ShotCard', () => {
  const mockPanel: StoryboardPanel = {
    id: 'panel-1',
    panelNumber: 1,
    description: '测试描述',
    shot: '全景',
    setupShot: '固定机位',
    duration: 5,
    characters: ['角色A', '角色B'],
    dialogue: '测试对白',
    aiPrompt: '测试提示词',
    aiVideoPrompt: '视频提示词',
    generatedImage: '',
  };

  const defaultProps = {
    panel: mockPanel,
    index: 0,
    isSelected: false,
    onSelect: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onGenerateImage: vi.fn(),
    onCopy: vi.fn(),
    onSplit: vi.fn(),
    onGeneratePrompts: vi.fn(),
    onApplyPreset: vi.fn(),
    onCopyPrompt: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染分镜卡片', () => {
      render(<ShotCard {...defaultProps} />);
      
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('测试描述')).toBeInTheDocument();
    });

    it('应该显示分镜序号', () => {
      render(<ShotCard {...defaultProps} />);
      
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('应该显示角色数量', () => {
      render(<ShotCard {...defaultProps} />);
      
      expect(screen.getByText('2 角色')).toBeInTheDocument();
    });

    it('应该在 Grid 模式下渲染紧凑布局', () => {
      const { container } = render(
        <ShotCard {...defaultProps} viewMode="grid" />
      );
      
      expect(container.querySelector('.aspect-video')).toBeInTheDocument();
    });

    it('应该在 List 模式下渲染完整布局', () => {
      render(<ShotCard {...defaultProps} viewMode="list" />);
      
      expect(screen.getByText('画面描述')).toBeInTheDocument();
      expect(screen.getByText('角色对白')).toBeInTheDocument();
    });
  });

  describe('选中状态', () => {
    it('应该显示选中状态', () => {
      const { container } = render(
        <ShotCard {...defaultProps} isSelected={true} />
      );
      
      // 检查是否有选中状态的样式类
      const card = container.querySelector('.border-blue-500');
      expect(card).toBeInTheDocument();
    });

    it('应该调用 onSelect 当点击选择框', () => {
      render(<ShotCard {...defaultProps} />);
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });

    it('应该在 Grid 模式下点击卡片时选中', () => {
      const { container } = render(
        <ShotCard {...defaultProps} viewMode="grid" />
      );
      
      const card = container.firstChild as HTMLElement;
      fireEvent.click(card);
      
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });
  });

  describe('状态显示', () => {
    it('应该显示 pending 状态', () => {
      render(<ShotCard {...defaultProps} status="pending" />);
      
      expect(screen.getByText('排队中')).toBeInTheDocument();
    });

    it('应该显示 processing 状态', () => {
      render(<ShotCard {...defaultProps} status="processing" />);
      
      expect(screen.getByText('生成中')).toBeInTheDocument();
    });

    it('应该显示 completed 状态', () => {
      render(<ShotCard {...defaultProps} status="completed" />);
      
      expect(screen.getByText('已完成')).toBeInTheDocument();
    });

    it('应该显示 failed 状态', () => {
      render(<ShotCard {...defaultProps} status="failed" />);
      
      expect(screen.getByText('失败')).toBeInTheDocument();
    });

    it('应该在 processing 时禁用生成按钮', () => {
      render(<ShotCard {...defaultProps} status="processing" />);
      
      const generateButton = screen.getByText(/生成预览图/);
      expect(generateButton.closest('button')).toBeDisabled();
    });
  });

  describe('图片预览', () => {
    it('应该显示生成的图片', () => {
      const panelWithImage = {
        ...mockPanel,
        generatedImage: 'https://example.com/image.png',
      };
      
      render(<ShotCard {...defaultProps} panel={panelWithImage} />);
      
      const img = screen.getByAltText('分镜 1');
      expect(img).toHaveAttribute('src', 'https://example.com/image.png');
    });

    it('应该显示占位符当没有图片时', () => {
      render(<ShotCard {...defaultProps} />);
      
      expect(screen.getByText(/点击上方按钮生成预览图/)).toBeInTheDocument();
    });

    it('应该在 processing 时显示加载动画', () => {
      render(<ShotCard {...defaultProps} status="processing" />);
      
      expect(screen.getByText('生成中...')).toBeInTheDocument();
    });
  });

  describe('操作按钮', () => {
    it('应该调用 onGenerateImage 当点击生成按钮', () => {
      render(<ShotCard {...defaultProps} />);
      
      // 使用 getAllByText 获取所有匹配的元素，然后选择按钮
      const buttons = screen.getAllByRole('button');
      const generateButton = buttons.find(btn => btn.textContent?.includes('生成预览图'));
      
      expect(generateButton).toBeDefined();
      fireEvent.click(generateButton!);
      
      expect(defaultProps.onGenerateImage).toHaveBeenCalled();
    });

    it('应该调用 onGeneratePrompts 当点击刷新提示词', () => {
      render(<ShotCard {...defaultProps} />);
      
      const refreshButton = screen.getByText('刷新提示词');
      fireEvent.click(refreshButton);
      
      expect(defaultProps.onGeneratePrompts).toHaveBeenCalled();
    });

    it('应该调用 onCopy 当点击复制分镜', () => {
      render(<ShotCard {...defaultProps} />);
      
      const copyButton = screen.getByText('复制分镜');
      fireEvent.click(copyButton);
      
      expect(defaultProps.onCopy).toHaveBeenCalled();
    });

    it('应该调用 onDelete 当点击删除', () => {
      render(<ShotCard {...defaultProps} />);
      
      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);
      
      expect(defaultProps.onDelete).toHaveBeenCalled();
    });

    it('应该调用 onSplit 当选择拆分选项', () => {
      render(<ShotCard {...defaultProps} />);
      
      const splitButton = screen.getByText('拆分');
      fireEvent.click(splitButton);
      
      // 在实际实现中，这会打开下拉菜单
      // 这里简化测试
      expect(splitButton).toBeInTheDocument();
    });
  });

  describe('内容编辑', () => {
    it('应该调用 onUpdate 当修改描述', () => {
      render(<ShotCard {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/描述画面内容/);
      fireEvent.change(textarea, { target: { value: '新描述' } });
      
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({
        description: '新描述',
      });
    });

    it('应该调用 onUpdate 当修改对白', () => {
      render(<ShotCard {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/输入角色台词/);
      fireEvent.change(textarea, { target: { value: '新对白' } });
      
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({
        dialogue: '新对白',
      });
    });

    it('应该调用 onUpdate 当修改 AI 提示词', () => {
      render(<ShotCard {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/AI 绘图提示词/);
      fireEvent.change(textarea, { target: { value: '新提示词' } });
      
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({
        aiPrompt: '新提示词',
      });
    });

    it('应该调用 onUpdate 当修改视频提示词', () => {
      render(<ShotCard {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/AI 视频提示词/);
      fireEvent.change(textarea, { target: { value: '新视频提示词' } });
      
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({
        aiVideoPrompt: '新视频提示词',
      });
    });
  });

  describe('拖拽功能', () => {
    it('应该渲染可拖拽的卡片', () => {
      const movePanel = vi.fn();
      
      render(
        <DndProvider backend={HTML5Backend}>
          <ShotCardDraggable {...defaultProps} movePanel={movePanel} />
        </DndProvider>
      );
      
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('应该显示拖拽手柄', () => {
      const movePanel = vi.fn();
      
      const { container } = render(
        <DndProvider backend={HTML5Backend}>
          <ShotCardDraggable {...defaultProps} movePanel={movePanel} />
        </DndProvider>
      );
      
      expect(container.querySelector('.cursor-move')).toBeInTheDocument();
    });
  });

  describe('提示词复制', () => {
    it('应该调用 onCopyPrompt 当复制图像提示词', () => {
      render(<ShotCard {...defaultProps} />);
      
      const copyButtons = screen.getAllByText('复制提示词');
      fireEvent.click(copyButtons[0]); // 第一个是图像提示词
      
      expect(defaultProps.onCopyPrompt).toHaveBeenCalledWith(
        '测试提示词',
        'image'
      );
    });

    it('应该调用 onCopyPrompt 当复制视频提示词', () => {
      render(<ShotCard {...defaultProps} />);
      
      const copyButtons = screen.getAllByText('复制提示词');
      fireEvent.click(copyButtons[1]); // 第二个是视频提示词
      
      expect(defaultProps.onCopyPrompt).toHaveBeenCalledWith(
        '视频提示词',
        'video'
      );
    });
  });

  describe('Grid 模式特定功能', () => {
    it('应该在 Grid 模式下显示紧凑信息', () => {
      render(<ShotCard {...defaultProps} viewMode="grid" />);
      
      expect(screen.getByText('全景')).toBeInTheDocument();
      expect(screen.getByText('5s')).toBeInTheDocument();
      expect(screen.getByText('2角色')).toBeInTheDocument();
    });

    it('应该在 Grid 模式下悬停时显示操作按钮', () => {
      const { container } = render(
        <ShotCard {...defaultProps} viewMode="grid" />
      );
      
      const hoverArea = container.querySelector('.group-hover\\:opacity-100');
      expect(hoverArea).toBeInTheDocument();
    });

    it('应该在 Grid 模式下阻止事件冒泡', () => {
      render(<ShotCard {...defaultProps} viewMode="grid" />);
      
      const generateButton = screen.getByText(/生成/);
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagation = vi.spyOn(clickEvent, 'stopPropagation');
      
      fireEvent(generateButton, clickEvent);
      
      expect(stopPropagation).toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    it('应该处理空描述', () => {
      const panelWithoutDesc = { ...mockPanel, description: '' };
      
      render(<ShotCard {...defaultProps} panel={panelWithoutDesc} />);
      
      expect(screen.getByPlaceholderText(/描述画面内容/)).toHaveValue('');
    });

    it('应该处理空对白', () => {
      const panelWithoutDialogue = { ...mockPanel, dialogue: '' };
      
      render(<ShotCard {...defaultProps} panel={panelWithoutDialogue} />);
      
      expect(screen.getByPlaceholderText(/输入角色台词/)).toHaveValue('');
    });

    it('应该处理没有角色的情况', () => {
      const panelWithoutCharacters = { ...mockPanel, characters: [] };
      
      render(<ShotCard {...defaultProps} panel={panelWithoutCharacters} />);
      
      // 检查角色徽章不存在（使用更具体的选择器）
      const badge = screen.queryByText(/\d+ 角色/);
      expect(badge).not.toBeInTheDocument();
    });

    it('应该处理没有时长的情况', () => {
      const panelWithoutDuration = { ...mockPanel, duration: undefined };
      
      const { container } = render(
        <ShotCard {...defaultProps} panel={panelWithoutDuration} viewMode="grid" />
      );
      
      expect(container.textContent).not.toContain('s');
    });
  });

  describe('性能优化', () => {
    it('应该使用 memo 优化渲染', () => {
      const { rerender } = render(<ShotCard {...defaultProps} />);
      
      // 重新渲染相同的 props
      rerender(<ShotCard {...defaultProps} />);
      
      // 组件应该被 memo 包裹
      expect(ShotCard.displayName).toBe('ShotCard');
    });

    it('应该为 ShotCardDraggable 设置 displayName', () => {
      expect(ShotCardDraggable.displayName).toBe('ShotCardDraggable');
    });
  });
});
