/**
 * PreviewDialog 组件冒烟测试
 * 验证组件的基本功能和渲染
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreviewDialog } from '../../app/pages/StoryboardEditor/components/PreviewDialog';
import type { StoryboardPanel } from '../../app/types';

// Mock UI components
vi.mock('../../app/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
}));

vi.mock('../../app/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="button">
      {children}
    </button>
  ),
}));

vi.mock('../../app/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

describe('PreviewDialog - Smoke Tests', () => {
  const mockPanel: StoryboardPanel = {
    id: 'panel-1',
    panelNumber: 1,
    sceneId: 'scene-1',
    episodeNumber: 1,
    description: '测试描述',
    dialogue: '测试对白',
    aiPrompt: '测试提示词',
    aiVideoPrompt: '视频提示词',
    duration: 5,
    characters: ['角色A'],
    props: [],
    shot: '全景',
    angle: '平视',
    cameraMovement: '静止',
    shotSize: 'WS',
    cameraAngle: 'EYE_LEVEL',
    movementType: 'STATIC',
    transition: '切至',
    soundEffects: [],
    music: '',
    notes: '',
    startFrame: '',
    endFrame: '',
    motionSpeed: 'normal',
    environmentMotion: '',
    characterActions: [],
    composition: '',
    shotIntent: '',
    focusPoint: '',
    lighting: { mood: '' },
    generatedImage: 'https://example.com/image.jpg',
  };

  const mockPanels = [mockPanel];
  const mockOnOpenChange = vi.fn();

  it('应该在 open 为 false 时不渲染', () => {
    render(
      <PreviewDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        panels={mockPanels}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('应该在 open 为 true 时渲染对话框', () => {
    render(
      <PreviewDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        panels={mockPanels}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
  });

  it('应该显示标题', () => {
    render(
      <PreviewDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        panels={mockPanels}
      />
    );

    expect(screen.getByText('分镜预览播放')).toBeInTheDocument();
  });

  it('应该显示分镜计数', () => {
    render(
      <PreviewDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        panels={mockPanels}
      />
    );

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('应该显示多个分镜的计数', () => {
    const multiplePanels = [
      mockPanel,
      { ...mockPanel, id: 'panel-2', panelNumber: 2 },
      { ...mockPanel, id: 'panel-3', panelNumber: 3 },
    ];

    render(
      <PreviewDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        panels={multiplePanels}
      />
    );

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('应该渲染控制按钮', () => {
    render(
      <PreviewDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        panels={mockPanels}
      />
    );

    const buttons = screen.getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('应该处理空 panels 数组', () => {
    render(
      <PreviewDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        panels={[]}
      />
    );

    // 组件应该返回 null，不渲染任何内容
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
  });

  it('应该显示进度条', () => {
    render(
      <PreviewDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        panels={mockPanels}
      />
    );

    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });
});
