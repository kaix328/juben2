import React, { useRef, useEffect } from 'react';
import Editor, { Monaco, useMonaco } from '@monaco-editor/react';
import { cn } from '../../utils/classnames';

interface MonacoScriptEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSelectionChange?: (selection: { text: string; start: number; end: number; rect?: DOMRect }) => void;
    className?: string;
    readOnly?: boolean;
}

// 剧本格式定义 (Fountain)
const defineFountain = (monaco: Monaco) => {
    // 注册语言
    monaco.languages.register({ id: 'fountain' });

    // 定义高亮规则
    monaco.languages.setMonarchTokensProvider('fountain', {
        tokenizer: {
            root: [
                // Scene Headings (e.g. INT. HOUSE - DAY)
                [/^(INT|EXT|EST|INT\.\/EXT\.|I\/E)(\.| ).+$/, 'scene-heading'],
                [/^\.[^\.].*$/, 'scene-heading'], // Forced scene heading

                // Characters (Uppercase, usually centered, followed by dialog)
                // 简化规则：全大写且不以数字开头 (避免页码等误判)
                [/^[A-Z][A-Z0-9\s_]+$/, {
                    cases: {
                        '@default': 'character'
                    }
                }],
                [/^@[^@]+$/, 'character'], // Forced character

                // Parentheticals (e.g. (continuing))
                [/^\(.*\)$/, 'parenthetical'],

                // Transitions (Uppercase, right aligned, usually ends with TO:)
                [/^[A-Z\s]+TO:$/, 'transition'],
                [/^>.*$/, 'transition'], // Forced transition

                // Sections
                [/^#+ .*$/, 'section'],

                // Emphasis
                [/\*.*?\*/, 'emphasis'],
                [/_.*?_/, 'underline'],

                // Notes
                [/\[\[.*\]\]/, 'note'],

                // Boneyard
                [/\/\*/, 'comment', '@comment'],
            ],
            comment: [
                [/[^\/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ]
        }
    });

    // 定义主题
    monaco.editor.defineTheme('fountain-theme', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'scene-heading', foreground: '000000', fontStyle: 'bold' },
            { token: 'character', foreground: '555555', fontStyle: 'bold' },
            { token: 'dialogue', foreground: '333333' },
            { token: 'parenthetical', foreground: '888888', fontStyle: 'italic' },
            { token: 'transition', foreground: '000000', fontStyle: 'bold' },
            { token: 'section', foreground: 'aaaaaa' },
            { token: 'note', foreground: '00AA00' },
            { token: 'comment', foreground: 'AAAAAA' }
        ],
        colors: {
            'editor.background': '#ffffff',
            'editor.lineHighlightBackground': '#f5f5f5',
            'editorCursor.foreground': '#000000',
        }
    });
};

export function MonacoScriptEditor({
    value,
    onChange,
    onSelectionChange,
    className,
    readOnly = false
}: MonacoScriptEditorProps) {
    const monaco = useMonaco();
    const editorRef = useRef<any>(null);

    // 初始化配置
    useEffect(() => {
        if (monaco) {
            defineFountain(monaco);
        }
    }, [monaco]);

    // 监听选区变化与内容映射
    const handleEditorMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;

        // 监听选区变化
        editor.onDidChangeCursorSelection((e: any) => {
            if (onSelectionChange) {
                const selection = editor.getSelection();
                const model = editor.getModel();

                if (selection && !selection.isEmpty()) {
                    const text = model.getValueInRange(selection);

                    // 获取选区坐标
                    // Get screen coordinates using getScrolledVisiblePosition looks ok, but better utilize getDomNode
                    // Monaco doesn't easily expose absolute screen coords for selection rect easily without internal API
                    // We can use cursor position or try to compute.

                    // 简易方案：获取光标位置的 DOM coordinates
                    const position = editor.getScrolledVisiblePosition(selection.getEndPosition());
                    const domNode = editor.getDomNode();
                    const rect = domNode.getBoundingClientRect();

                    const top = rect.top + position.top;
                    const left = rect.left + position.left;

                    // 计算 startIndex/endIndex (Character offsets)
                    const start = model.getOffsetAt(selection.getStartPosition());
                    const end = model.getOffsetAt(selection.getEndPosition());

                    onSelectionChange({
                        text,
                        start,
                        end,
                        rect: { top, left } as any
                    });
                } else {
                    // Empty selection
                    // Pass empty text to clear toolbar
                    onSelectionChange({ text: '', start: 0, end: 0 });
                }
            }
        });
    };

    return (
        <div className={cn("relative w-full h-full border rounded-md overflow-hidden", className)}>
            <Editor
                height="100%"
                defaultLanguage="fountain"
                language="fountain"
                theme="fountain-theme"
                value={value}
                onChange={(val) => onChange(val || '')}
                onMount={handleEditorMount}
                options={{
                    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
                    fontSize: 16,
                    lineHeight: 1.6,
                    wordWrap: 'on',
                    minimap: { enabled: false }, // 隐藏 minimap
                    lineNumbers: 'off', // 隐藏行号
                    folding: false, // 隐藏折叠
                    glyphMargin: false, // 隐藏左侧留白
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'line',
                    contextmenu: false, // 禁用默认右键菜单 (可自定义)
                    readOnly: readOnly,
                    padding: { top: 20, bottom: 20 },
                    scrollbar: {
                        vertical: 'auto',
                        horizontal: 'hidden'
                    }
                }}
            />
        </div>
    );
}
