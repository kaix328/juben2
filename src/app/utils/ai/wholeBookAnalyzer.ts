
import { chapterStorage, scriptStorage, analysisStorage, generateId } from '../storage';
import { StoryAnalyzer } from './storyAnalyzer';
import type {
    AnalysisRequest,
    AnalysisProgress,
    StoryFiveElements
} from '../../types/story-analysis';

export class WholeBookAnalyzer {
    private onProgress?: (progress: AnalysisProgress) => void;

    constructor(onProgress?: (progress: AnalysisProgress) => void) {
        this.onProgress = onProgress;
    }

    private updateProgress(step: AnalysisProgress['step'], progress: number, message: string) {
        if (this.onProgress) {
            this.onProgress({ step, progress, message });
        }
    }

    /**
     * 分析整个项目的所有章节
     */
    async analyzeProject(projectId: string): Promise<StoryFiveElements> {
        this.updateProgress('idle', 0, '正在准备全书分析...');

        // 1. 获取所有章节
        const chapters = await chapterStorage.getByProjectId(projectId);
        if (!chapters || chapters.length === 0) {
            throw new Error('项目中没有任何章节');
        }

        this.updateProgress('idle', 5, `找到 ${chapters.length} 个章节，正在汇总内容...`);

        // 2. 聚合所有剧本内容
        let fullScriptValues: string[] = [];
        let totalWords = 0;

        for (const [index, chapter] of chapters.entries()) {
            const script = await scriptStorage.getByChapterId(chapter.id);
            if (script && (script.content || (script.scenes && script.scenes.length > 0))) {
                let content = '';
                if (script.content && script.content.trim()) {
                    content = script.content;
                } else if (script.scenes) {
                    // 如果没有 raw content，尝试从 scenes 重建
                    content = script.scenes.map(s =>
                        `第${s.sceneNumber}场 ${s.location}\n${s.action}\n${s.dialogues.map(d => `${d.character}：${d.lines}`).join('\n')}`
                    ).join('\n\n');
                }

                if (content) {
                    fullScriptValues.push(`\n=== 第 ${chapter.orderIndex + 1} 章：${chapter.title} ===\n\n${content}`);
                    totalWords += content.length;
                }
            } else {
                console.warn(`章节 ${chapter.title} (ID: ${chapter.id}) 没有剧本内容`);
            }

            // 报告加载进度 (5% - 20%)
            const loadProgress = 5 + Math.floor((index + 1) / chapters.length * 15);
            this.updateProgress('idle', loadProgress, `正在加载第 ${index + 1}/${chapters.length} 章...`);
        }

        const aggregatedScript = fullScriptValues.join('\n\n');

        if (!aggregatedScript.trim()) {
            throw new Error('所有章节均无有效剧本内容，无法分析');
        }

        console.log(`[WholeBookAnalyzer] 全书汇总完成，共 ${fullScriptValues.length} 章，${totalWords} 字`);
        this.updateProgress('idle', 20, `全书汇总完成（${totalWords} 字），开始 AI 分析...`);

        // 3. 调用 StoryAnalyzer 进行分析
        // 这里的关键是 StoryAnalyzer 内部已经实现了 analyzeAll，且部分方法通过 Map-Reduce 支持长文本
        // 我们需要传递一个适配的回调函数，将 StoryAnalyzer 的进度 (0-100) 映射到全书分析的剩余进度 (20-100)

        const analyzer = new StoryAnalyzer((progress) => {
            // 映射 StoryAnalyzer 的进度：20 + (progress.progress * 0.8)
            // 例如：StoryAnalyzer 50% -> 全书 60%
            const distinctProgress = 20 + Math.floor(progress.progress * 0.8);
            this.updateProgress(progress.step, distinctProgress, `[AI] ${progress.message}`);
        });

        const request: AnalysisRequest = {
            projectId,
            scriptContent: aggregatedScript,
            // 可以在这里传入项目中已有的角色列表，辅助 AI 识别
            // existingCharacters: ... 
        };

        const result = await analyzer.analyzeAll(request);

        // 4. 后处理与保存
        // 尝试获取现有的项目级分析记录，以便进行更新而不是覆盖（例如保留之前的情感曲线数据）
        const existingAnalysis = await analysisStorage.getProjectAnalysis(projectId);

        const finalResult: StoryFiveElements = {
            ...(existingAnalysis || {}), // 保留已有数据（ID, createdAt, emotionCurve等）
            ...result,                   // 覆盖新的五元素分析数据
            id: existingAnalysis?.id || generateId(),
            projectId,
            chapterId: undefined, // 明确置空
            analysisSource: 'ai',
            // 如果是新记录则设置 createdAt，否则保留
            createdAt: existingAnalysis?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 保存到数据库
        this.updateProgress('complete', 98, '正在保存全书分析结果...');
        await analysisStorage.save(finalResult);

        this.updateProgress('complete', 100, '全书分析完成！');
        return finalResult;
    }
}
