/**
 * 悬浮改写工具栏
 * Floating Rewrite Toolbar
 * 
 * 类似 Medium/Notion 的悬浮菜单，选中文字后出现
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Wand2, ChevronDown, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { WRITING_STYLES } from '../utils/prompts/writingStyles';
import { cn } from '../utils/classnames';
import { toast } from 'sonner';

interface FloatingRewriteToolbarProps {
    visible: boolean;
    position: { top: number; left: number };
    selectedText: string;
    onRewrite: (options: { mode: string; styleId?: string; instruction?: string }) => void;
    onClose: () => void;
    isLoading?: boolean;
}

export function FloatingRewriteToolbar({
    visible,
    position,
    selectedText,
    onRewrite,
    onClose,
    isLoading
}: FloatingRewriteToolbarProps) {
    const [toolbarEl, setToolbarEl] = useState<HTMLDivElement | null>(null);
    const [showStyleSelector, setShowStyleSelector] = useState(false);

    // 自动定位调整（防止超出屏幕）
    useEffect(() => {
        if (toolbarEl && visible) {
            const rect = toolbarEl.getBoundingClientRect();
            // 如果右侧超出
            if (position.left + rect.width > window.innerWidth) {
                toolbarEl.style.left = `${window.innerWidth - rect.width - 20}px`;
            }
            // 如果顶部超出
            if (position.top < 0) {
                toolbarEl.style.top = `${position.top + 60}px`; // 移动到下方
            }
        }
    }, [visible, position, toolbarEl]);

    if (!visible) return null;

    // 使用 Portal 渲染到 body，避免层级遮挡
    return createPortal(
        <div
            ref={setToolbarEl}
            role="toolbar"
            className={cn(
                "fixed z-50 flex items-center gap-1 p-1 bg-white border shadow-lg rounded-lg animate-in fade-in zoom-in-95 duration-200",
                isLoading && "opacity-80 pointer-events-none"
            )}
            style={{
                top: Math.max(10, position.top - 50), // 默认在上方
                left: position.left,
                transform: 'translateX(-50%)'
            }}
            onMouseDown={(e) => e.preventDefault()} // 防止失去焦点导致选区消失
        >
            {/* 基础功能：润色 */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 text-purple-600 hover:bg-purple-50"
                onClick={() => onRewrite({ mode: 'polish' })}
            >
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium">润色</span>
            </Button>

            <div className="w-[1px] h-4 bg-gray-200 mx-1" />

            {/* 扩写 */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => onRewrite({ mode: 'expand' })}
            >
                扩写
            </Button>

            {/* 精简 */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => onRewrite({ mode: 'shorten' })}
            >
                精简
            </Button>

            <div className="w-[1px] h-4 bg-gray-200 mx-1" />

            {/* 风格选择 */}
            <Popover open={showStyleSelector} onOpenChange={setShowStyleSelector}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2 text-xs text-gray-600"
                    >
                        <Wand2 className="w-3 h-3" />
                        风格
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                    <Command>
                        <CommandInput placeholder="搜索写作风格..." className="h-9" />
                        <CommandGroup className="max-h-64 overflow-y-auto">
                            {WRITING_STYLES.map((style) => (
                                <CommandItem
                                    key={style.id}
                                    onSelect={() => {
                                        onRewrite({ mode: 'tone', styleId: style.id });
                                        setShowStyleSelector(false);
                                    }}
                                    className="flex flex-col items-start py-2"
                                >
                                    <div className="font-medium text-xs">{style.name}</div>
                                    <div className="text-[10px] text-gray-500 line-clamp-1">{style.description}</div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* 关闭 */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 ml-1 text-gray-400 hover:text-gray-600 rounded-full"
                onClick={onClose}
            >
                <X className="w-4 h-4" />
            </Button>

            {/* Loading 状态 */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600 animate-spin" />
                </div>
            )}
        </div>,
        document.body
    );
}

export default FloatingRewriteToolbar;
