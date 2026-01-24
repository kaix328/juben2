/**
 * Button组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../utils';
import userEvent from '@testing-library/user-event';
import { Button } from '../../app/components/ui/button';

describe('Button组件', () => {
  it('应该正确渲染按钮', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByRole('button', { name: '点击我' })).toBeInTheDocument();
  });

  it('应该响应点击事件', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>点击我</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('禁用状态下不应响应点击', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button disabled onClick={handleClick}>禁用按钮</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('应该支持不同的变体', () => {
    const { rerender } = render(<Button variant="default">默认</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
    
    rerender(<Button variant="destructive">删除</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
    
    rerender(<Button variant="outline">轮廓</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');
    
    rerender(<Button variant="ghost">幽灵</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');
  });

  it('应该支持不同的尺寸', () => {
    const { rerender } = render(<Button size="default">默认</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');
    
    rerender(<Button size="sm">小</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');
    
    rerender(<Button size="lg">大</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');
    
    rerender(<Button size="icon">图标</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10');
  });

  it('应该支持自定义className', () => {
    render(<Button className="custom-class">自定义</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('应该支持asChild属性', () => {
    render(
      <Button asChild>
        <a href="/test">链接按钮</a>
      </Button>
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test');
  });
});
