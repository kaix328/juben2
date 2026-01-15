/**
 * 快捷键帮助面板
 * 显示所有可用快捷键及其功能
 */
import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';

interface ShortcutItem {
    keys: string[];
    description: string;
    category: string;
}

const shortcuts: ShortcutItem[] = [
    // 编辑
    { keys: ['Ctrl', 'Z'], description: '撤销', category: '编辑' },
    { keys: ['Ctrl', 'Y'], description: '重做', category: '编辑' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: '重做（备选）', category: '编辑' },
    { keys: ['Ctrl', 'S'], description: '保存', category: '编辑' },
    { keys: ['Ctrl', 'C'], description: '复制选中项', category: '编辑' },

    // 选择
    { keys: ['Ctrl', 'A'], description: '全选', category: '选择' },
    { keys: ['Escape'], description: '取消选择', category: '选择' },
    { keys: ['Delete'], description: '删除选中', category: '选择' },
    { keys: ['Backspace'], description: '删除选中', category: '选择' },

    // 导航（扩展）
    { keys: ['←'], description: '上一个分镜', category: '导航' },
    { keys: ['→'], description: '下一个分镜', category: '导航' },
    { keys: ['Home'], description: '跳转到第一个', category: '导航' },
    { keys: ['End'], description: '跳转到最后一个', category: '导航' },

    // 生成（扩展）
    { keys: ['G'], description: '生成当前分镜图片', category: '生成' },
    { keys: ['Ctrl', 'G'], description: '批量生成全部', category: '生成' },
    { keys: ['R'], description: '刷新提示词', category: '生成' },
];

// 按类别分组
const groupedShortcuts = shortcuts.reduce((acc, item) => {
    if (!acc[item.category]) {
        acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
}, {} as Record<string, ShortcutItem[]>);

export function KeyboardShortcutsHelp() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Keyboard className="w-4 h-4" />
                    <span className="hidden sm:inline">快捷键</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5" />
                        键盘快捷键
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {Object.entries(groupedShortcuts).map(([category, items]) => (
                        <div key={category}>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">{category}</h3>
                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50"
                                    >
                                        <span className="text-sm text-gray-700">{item.description}</span>
                                        <div className="flex gap-1">
                                            {item.keys.map((key, keyIndex) => (
                                                <React.Fragment key={keyIndex}>
                                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm">
                                                        {key}
                                                    </kbd>
                                                    {keyIndex < item.keys.length - 1 && (
                                                        <span className="text-gray-400">+</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                    💡 提示：按 <kbd className="px-1 py-0.5 bg-white border rounded text-xs">?</kbd> 可快速打开此帮助面板
                </div>
            </DialogContent>
        </Dialog>
    );
}
