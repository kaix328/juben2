import type { StoryboardPanel } from './storyboard';

// 分镜模板
export interface StoryboardTemplate {
    id: string;
    name: string;
    description: string;
    category: '对话' | '动作' | '追逐' | '战斗' | '转场' | '其他';
    panels: Omit<StoryboardPanel, 'id' | 'panelNumber' | 'sceneId' | 'generatedImage' | 'isGenerating'>[];
    previewImage?: string;
    usageCount: number;
}
