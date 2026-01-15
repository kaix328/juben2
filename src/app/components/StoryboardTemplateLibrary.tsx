/**
 * 分镜模板库
 * 预设常用分镜组合，一键插入
 */
import React, { useState } from 'react';
import { Layers, Plus, Film, MessageSquare, Swords, Car, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { StoryboardPanel } from '../types';

// 模板分类
type TemplateCategory = 'dialogue' | 'action' | 'chase' | 'battle' | 'transition' | 'emotional';

interface PanelTemplate {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    panels: Partial<StoryboardPanel>[];
    previewEmoji: string;
}

// 预设模板数据
const PANEL_TEMPLATES: PanelTemplate[] = [
    // 对话类
    {
        id: 'dialogue-reverse',
        name: '正反打对话',
        description: '经典双人对话镜头组合',
        category: 'dialogue',
        previewEmoji: '💬',
        panels: [
            { shot: '中景', angle: '平视', description: '双人全景，交代人物关系', duration: 3 },
            { shot: '特写', angle: '过肩', description: 'A角色说话，过B肩拍摄', cameraMovement: '静止', duration: 2 },
            { shot: '特写', angle: '过肩', description: 'B角色回应，过A肩拍摄', cameraMovement: '静止', duration: 2 },
            { shot: '特写', angle: '平视', description: 'A角色反应特写', duration: 1.5 },
            { shot: '特写', angle: '平视', description: 'B角色反应特写', duration: 1.5 },
        ]
    },
    {
        id: 'dialogue-group',
        name: '多人对话',
        description: '三人及以上的对话场景',
        category: 'dialogue',
        previewEmoji: '👥',
        panels: [
            { shot: '远景', angle: '平视', description: '群体全景，交代环境', duration: 4 },
            { shot: '中景', angle: '平视', description: '主说话者中景', duration: 2 },
            { shot: '中景', angle: '平视', description: '反应群体中景', duration: 2 },
            { shot: '特写', angle: '平视', description: '关键人物特写反应', duration: 1.5 },
        ]
    },
    // 动作类
    {
        id: 'action-punch',
        name: '打斗镜头',
        description: '快速剪辑的格斗场景',
        category: 'action',
        previewEmoji: '👊',
        panels: [
            { shot: '中景', angle: '低角度', description: '对峙全景，气氛紧张', duration: 2 },
            { shot: '特写', angle: '平视', description: '出拳动作特写', cameraMovement: '摇', duration: 0.5 },
            { shot: '特写', angle: '平视', description: '击中反应', cameraMovement: '推', duration: 0.5 },
            { shot: '中景', angle: '侧面', description: '连续动作中景', cameraMovement: '跟', duration: 1.5 },
            { shot: '特写', angle: '低角度', description: '胜利者仰拍', duration: 2 },
        ]
    },
    // 追逐类
    {
        id: 'chase-car',
        name: '追车戏',
        description: '高速追逐场景',
        category: 'chase',
        previewEmoji: '🚗',
        panels: [
            { shot: '远景', angle: '航拍', description: '俯瞰追逐路线', duration: 3 },
            { shot: '中景', angle: '侧面', description: '主车快速移动', cameraMovement: '跟', duration: 2 },
            { shot: '特写', angle: '内景', description: '驾驶者表情特写', duration: 1.5 },
            { shot: '中景', angle: '后方', description: '追逐者逼近', cameraMovement: '推', duration: 2 },
            { shot: '特写', angle: '平视', description: '轮胎/油门特写', duration: 1 },
        ]
    },
    // 战斗类
    {
        id: 'battle-epic',
        name: '史诗战斗',
        description: '大规模战斗场景',
        category: 'battle',
        previewEmoji: '⚔️',
        panels: [
            { shot: '远景', angle: '航拍', description: '战场全景鸟瞰', duration: 4 },
            { shot: '中景', angle: '低角度', description: '主角战斗姿态', duration: 2 },
            { shot: '远景', angle: '平视', description: '敌军冲锋', cameraMovement: '推', duration: 2 },
            { shot: '中景', angle: '跟拍', description: '混战场面', cameraMovement: '手持', duration: 3 },
            { shot: '特写', angle: '平视', description: '决定性一击特写', duration: 1.5 },
        ]
    },
    // 转场类
    {
        id: 'transition-flashback',
        name: '回忆闪回',
        description: '进入回忆的过渡镜头',
        category: 'transition',
        previewEmoji: '💭',
        panels: [
            { shot: '特写', angle: '平视', description: '角色陷入沉思', duration: 2, transition: '溶至' },
            { shot: '中景', angle: '平视', description: '回忆画面（过去时空）', duration: 3, colorGrade: '暖色/褪色' },
            { shot: '特写', angle: '平视', description: '回忆中的关键细节', duration: 2 },
            { shot: '特写', angle: '平视', description: '角色回到现实', transition: '溶至', duration: 2 },
        ]
    },
    {
        id: 'transition-montage',
        name: '蒙太奇剪辑',
        description: '时间流逝/成长蒙太奇',
        category: 'transition',
        previewEmoji: '🎬',
        panels: [
            { shot: '中景', angle: '平视', description: '动作1开始', duration: 1.5, transition: '切至' },
            { shot: '中景', angle: '平视', description: '动作2叠加', duration: 1.5, transition: '溶至' },
            { shot: '中景', angle: '平视', description: '动作3进展', duration: 1.5, transition: '溶至' },
            { shot: '中景', angle: '平视', description: '动作4高潮', duration: 1.5, transition: '溶至' },
            { shot: '中景', angle: '平视', description: '最终状态', duration: 2, transition: '切至' },
        ]
    },
    // 情感类
    {
        id: 'emotional-revelation',
        name: '情感爆发',
        description: '角色情绪高潮时刻',
        category: 'emotional',
        previewEmoji: '😢',
        panels: [
            { shot: '中景', angle: '平视', description: '平静的场景建立', duration: 3 },
            { shot: '特写', angle: '平视', description: '情绪变化的微表情', cameraMovement: '推', duration: 2 },
            { shot: '大特写', angle: '平视', description: '眼泪/愤怒等特写', duration: 2 },
            { shot: '中景', angle: '侧面', description: '情绪释放的动作', duration: 2 },
            { shot: '远景', angle: '平视', description: '环境空镜收尾', duration: 3 },
        ]
    }
];

interface StoryboardTemplateLibraryProps {
    onInsertTemplate: (panels: Partial<StoryboardPanel>[]) => void;
}

const CATEGORY_ICONS: Record<TemplateCategory, React.ReactNode> = {
    dialogue: <MessageSquare className="w-4 h-4" />,
    action: <Sparkles className="w-4 h-4" />,
    chase: <Car className="w-4 h-4" />,
    battle: <Swords className="w-4 h-4" />,
    transition: <RotateCcw className="w-4 h-4" />,
    emotional: <Film className="w-4 h-4" />,
};

const CATEGORY_NAMES: Record<TemplateCategory, string> = {
    dialogue: '对话',
    action: '动作',
    chase: '追逐',
    battle: '战斗',
    transition: '转场',
    emotional: '情感',
};

export function StoryboardTemplateLibrary({
    onInsertTemplate
}: StoryboardTemplateLibraryProps) {
    const [open, setOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('dialogue');

    const filteredTemplates = PANEL_TEMPLATES.filter(t => t.category === selectedCategory);

    const handleInsert = (template: PanelTemplate) => {
        onInsertTemplate(template.panels);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Layers className="w-4 h-4" />
                    模板库
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                        分镜模板库
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TemplateCategory)}>
                    <TabsList className="grid grid-cols-6 w-full">
                        {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                            <TabsTrigger key={key} value={key} className="gap-1">
                                {CATEGORY_ICONS[key as TemplateCategory]}
                                <span className="hidden sm:inline">{name}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="mt-4 grid gap-3">
                        {filteredTemplates.map(template => (
                            <Card
                                key={template.id}
                                className="hover:border-purple-400 cursor-pointer transition-colors"
                                onClick={() => handleInsert(template)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">{template.previewEmoji}</div>
                                        <div className="flex-1">
                                            <h3 className="font-medium">{template.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {template.panels.map((p, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                                                    >
                                                        {i + 1}. {p.shot}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="gap-1">
                                            <Plus className="w-4 h-4" />
                                            插入
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </Tabs>

                <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                    💡 点击模板即可快速插入 {filteredTemplates[0]?.panels.length || 0} 个预设分镜到当前位置
                </div>
            </DialogContent>
        </Dialog>
    );
}
