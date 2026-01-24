
import { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { callDeepSeek } from '../../utils/volcApi';
import type { StoryFiveElements } from '../../types/story-analysis';
import { formatFiveElementsReport } from '../../utils/ai/storyAnalyzer';
import { toast } from 'sonner';

interface StoryChatDialogProps {
    analysis: StoryFiveElements;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export function StoryChatDialog({ analysis }: StoryChatDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '你好！我是你的剧本助手。我已经阅读了全书分析报告，你可以问我关于剧情、人物、主题或改进建议的任何问题。',
            timestamp: Date.now()
        }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // 准备上下文
            const context = formatFiveElementsReport(analysis);

            const history = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // 构建 Prompt
            const systemPrompt = `你是一个专业的剧本顾问助手。你已经阅读了用户的剧本五元素分析报告。
请基于以下分析报告内容回答用户的问题。如果分析报告中没有相关信息，请如实告知，不要编造。
回答要专业、客观、富有建设性。

--- 剧本分析报告 ---
${context}
--- 分析报告结束 ---
`;

            const response = await callDeepSeek([
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: userMsg.content }
            ]);

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('AI 响应失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI 剧本问答
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b bg-purple-50/50">
                    <DialogTitle className="flex items-center gap-2 text-purple-800">
                        <Bot className="w-5 h-5" />
                        剧本助手
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative bg-slate-50">
                    <ScrollArea className="h-full p-4">
                        <div className="space-y-4 pb-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <Avatar className={`w-8 h-8 border ${msg.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                        <AvatarFallback>
                                            {msg.role === 'user' ? <User className="w-4 h-4 text-blue-600" /> : <Bot className="w-4 h-4 text-purple-600" />}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className={`max-w-[80%] rounded-lg p-3 text-sm shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border rounded-bl-none'
                                        }`}>
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <Avatar className="w-8 h-8 border bg-purple-100">
                                        <AvatarFallback><Bot className="w-4 h-4 text-purple-600" /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-white border rounded-lg p-3 rounded-bl-none shadow-sm flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                        <span className="text-xs text-gray-400">思考中...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-4 border-t bg-white">
                    <div className="flex w-full gap-2 items-center">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="问问关于你的剧本的问题..."
                            className="flex-1 bg-gray-50 focus:bg-white transition-colors"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            size="icon"
                            className={isLoading ? 'opacity-50' : 'bg-purple-600 hover:bg-purple-700'}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
