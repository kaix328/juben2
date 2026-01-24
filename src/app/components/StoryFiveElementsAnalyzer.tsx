/**
 * 故事五元素分析组件 - 全新重写版本
 * 优化 UI 布局和滚动体验
 */
import { useState, useCallback, useEffect } from 'react';
import {
  Sparkles, BookOpen, Users, Network, GitBranch,
  Download, RefreshCw, Copy,
  Target, Lightbulb, Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { toast } from 'sonner';
import { cn } from '../utils/classnames';

import type {
  StoryFiveElements,
  AnalysisProgress,
  CharacterBio,
  CharacterRelationship,

  PlotPoint,
} from '../types/story-analysis';
import { analyzeStoryFiveElements, formatFiveElementsReport } from '../utils/ai/storyAnalyzer';
import { CharacterNetworkGraph } from '../pages/ScriptEditor/components/CharacterNetworkGraph';

interface StoryFiveElementsAnalyzerProps {
  projectId: string;
  chapterId?: string;
  scriptContent: string;
  existingCharacters?: string[];
  onAnalysisComplete?: (analysis: StoryFiveElements) => void;
  initialAnalysis?: StoryFiveElements | null;
}

// 本地存储
const STORAGE_KEY_PREFIX = 'five-elements-analysis-';

function getStorageKey(projectId: string, chapterId?: string): string {
  return chapterId
    ? `${STORAGE_KEY_PREFIX}${projectId}-${chapterId}`
    : `${STORAGE_KEY_PREFIX}${projectId}`;
}

function saveToStorage(projectId: string, chapterId: string | undefined, analysis: StoryFiveElements) {
  try {
    const key = getStorageKey(projectId, chapterId);
    localStorage.setItem(key, JSON.stringify({
      analysis,
      timestamp: Date.now(),
    }));
    console.log('💾 [Storage] 已保存分析结果');
  } catch (error) {
    console.error('❌ [Storage] 保存失败:', error);
  }
}

function loadFromStorage(projectId: string, chapterId?: string): StoryFiveElements | null {
  try {
    const key = getStorageKey(projectId, chapterId);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log('📂 [Storage] 已加载分析结果');
      return parsed.analysis;
    }
  } catch (error) {
    console.error('❌ [Storage] 加载失败:', error);
  }
  return null;
}

function clearStorage(projectId: string, chapterId?: string) {
  try {
    const key = getStorageKey(projectId, chapterId);
    localStorage.removeItem(key);
    console.log('🗑️ [Storage] 已清除分析结果');
  } catch (error) {
    console.error('❌ [Storage] 清除失败:', error);
  }
}

// 主组件
export function StoryFiveElementsAnalyzer({
  projectId,
  chapterId,
  scriptContent,
  existingCharacters,
  onAnalysisComplete,
  initialAnalysis,
}: StoryFiveElementsAnalyzerProps) {
  const [analysis, setAnalysis] = useState<StoryFiveElements | null>(initialAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({
    step: 'idle',
    progress: 0,
    message: '',
  });
  const [activeTab, setActiveTab] = useState('genre');

  // 加载本地存储的分析结果
  useEffect(() => {
    if (!analysis && !initialAnalysis) {
      const stored = loadFromStorage(projectId, chapterId);
      if (stored) {
        setAnalysis(stored);
      }
    }
  }, [projectId, chapterId, analysis, initialAnalysis]);

  // 开始分析
  const handleAnalyze = useCallback(async () => {
    if (!scriptContent.trim()) {
      toast.error('剧本内容为空');
      return;
    }

    setIsAnalyzing(true);
    setProgress({ step: 'idle', progress: 0, message: '准备分析...' });

    try {
      const result = await analyzeStoryFiveElements(
        {
          projectId,
          chapterId,
          scriptContent,
          existingCharacters,
        },
        (prog) => {
          setProgress(prog);
        }
      );

      setAnalysis(result);
      saveToStorage(projectId, chapterId, result);
      onAnalysisComplete?.(result);
      toast.success('分析完成！');
    } catch (error) {
      console.error('分析失败:', error);
      toast.error('分析失败: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, chapterId, scriptContent, existingCharacters, onAnalysisComplete]);

  // 导出报告
  const handleExport = useCallback(() => {
    if (!analysis) return;

    const report = formatFiveElementsReport(analysis);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `五元素分析报告_${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('报告已导出');
  }, [analysis]);

  // 复制报告
  const handleCopy = useCallback(() => {
    if (!analysis) return;

    const report = formatFiveElementsReport(analysis);
    navigator.clipboard.writeText(report);
    toast.success('报告已复制到剪贴板');
  }, [analysis]);

  // 清除分析
  const handleClear = useCallback(() => {
    setAnalysis(null);
    clearStorage(projectId, chapterId);
    toast.success('已清除分析结果');
  }, [projectId, chapterId]);

  return (
    <Card className="w-full h-full flex flex-col">
      {/* 头部 */}
      <CardHeader className="flex-shrink-0 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            故事五元素分析
          </CardTitle>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !scriptContent.trim()}
            size="sm"
            className="gap-2"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isAnalyzing ? '分析中' : analysis ? '重新分析' : '开始分析'}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <CardDescription>
            深度分析故事的题材类型、梗概、人物、关系和情节点
          </CardDescription>
          {analysis && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                <Copy className="w-4 h-4" />
                复制
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
                <Download className="w-4 h-4" />
                导出
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                清除
              </Button>
            </div>
          )}
        </div>

        {/* 进度条 */}
        {isAnalyzing && (
          <div className="space-y-2">
            <Progress value={progress.progress} className="h-2" />
            <p className="text-sm text-gray-600">{progress.message}</p>
          </div>
        )}
      </CardHeader>

      {/* 内容区域 */}
      <CardContent className="flex-1 overflow-hidden p-0">
        {!analysis ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6 text-gray-500">
            <Sparkles className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">点击"开始分析"按钮</p>
            <p className="text-sm">AI将为您分析故事的五大元素</p>
            <p className="text-xs mt-2 text-gray-400">
              包括：题材类型、故事梗概、人物小传、人物关系、大情节点
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* 标签栏 */}
            <div className="flex-shrink-0 px-6 pt-4 border-b">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="genre" className="gap-1">
                  <Lightbulb className="w-4 h-4" />
                  <span className="hidden sm:inline">题材</span>
                </TabsTrigger>
                <TabsTrigger value="synopsis" className="gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">梗概</span>
                </TabsTrigger>
                <TabsTrigger value="characters" className="gap-1">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">人物</span>
                </TabsTrigger>
                <TabsTrigger value="relationships" className="gap-1">
                  <Network className="w-4 h-4" />
                  <span className="hidden sm:inline">关系</span>
                </TabsTrigger>
                <TabsTrigger value="plotPoints" className="gap-1">
                  <GitBranch className="w-4 h-4" />
                  <span className="hidden sm:inline">情节</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* 内容面板 - 每个都可独立滚动 */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="genre" className="h-full m-0 overflow-y-auto">
                <div className="p-6">
                  <GenrePanel genre={analysis.genre} />
                </div>
              </TabsContent>

              <TabsContent value="synopsis" className="h-full m-0 overflow-y-auto">
                <div className="p-6">
                  <SynopsisPanel synopsis={analysis.synopsis} />
                </div>
              </TabsContent>

              <TabsContent value="characters" className="h-full m-0 overflow-y-auto">
                <div className="p-6">
                  <CharactersPanel characters={analysis.characterBios} />
                </div>
              </TabsContent>

              <TabsContent value="relationships" className="h-full m-0 overflow-y-auto">
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">人物关系图谱</h3>
                    <div className="text-xs text-gray-500">
                      拖拽节点调整布局 • 滚轮缩放
                    </div>
                  </div>
                  <div className="flex-1 min-h-[500px] border rounded-lg shadow-inner bg-slate-50">
                    {analysis.characterBios.length > 0 ? (
                      <CharacterNetworkGraph
                        characters={analysis.characterBios}
                        relationships={analysis.relationships}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        暂无人物数据
                      </div>
                    )}
                  </div>
                  <div className="mt-8">
                    <h4 className="font-medium mb-4">关系列表详细</h4>
                    <RelationshipsPanel relationships={analysis.relationships} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="plotPoints" className="h-full m-0 overflow-y-auto">
                <div className="p-6">
                  <PlotPointsPanel plotPoints={analysis.plotPoints} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

// ============ 子面板组件 ============

function GenrePanel({ genre }: { genre: StoryFiveElements['genre'] }) {
  return (
    <div className="space-y-6">
      {/* 核心概念 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-sm font-medium text-purple-600 mb-2">核心概念</h3>
        <p className="text-xl text-purple-900 font-medium leading-relaxed">
          {genre.coreConceptOneLine}
        </p>
      </div>

      {/* 分类标签 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">时代背景</p>
          <Badge variant="secondary" className="text-base">
            {genre.eraDetail}
          </Badge>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">风格类型</p>
          <Badge variant="secondary" className="text-base">
            {genre.style}
          </Badge>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">内容类型</p>
          <div className="flex flex-wrap gap-1">
            {genre.content.map((c, i) => (
              <Badge key={i} variant="outline">{c}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* 创意元素 */}
      {genre.creativeElements.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            创意元素
          </h4>
          <div className="flex flex-wrap gap-2">
            {genre.creativeElements.map((element, i) => (
              <Badge key={i} variant="secondary" className="bg-yellow-50 text-yellow-800">
                {element}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 风格特点 */}
      {genre.styleFeatures.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">风格特点</h4>
          <div className="flex flex-wrap gap-2">
            {genre.styleFeatures.map((feature, i) => (
              <Badge key={i} variant="outline">{feature}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* 独特卖点 */}
      {genre.uniquePoints.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-600" />
            独特卖点
          </h4>
          <ul className="space-y-2">
            {genre.uniquePoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-1">★</span>
                <span className="flex-1">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SynopsisPanel({ synopsis }: { synopsis: StoryFiveElements['synopsis'] }) {
  return (
    <div className="space-y-6">
      {/* 一句话梗概 */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-600 mb-2">一句话梗概</h3>
        <p className="text-xl text-blue-900 font-medium leading-relaxed">
          {synopsis.oneLine}
        </p>
      </div>

      {/* 简短梗概 */}
      <div>
        <h4 className="font-medium mb-3">简短梗概</h4>
        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
          {synopsis.short}
        </p>
      </div>

      {/* 完整梗概 */}
      <div>
        <h4 className="font-medium mb-3">完整梗概</h4>
        <div className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
          {synopsis.full}
        </div>
      </div>

      {/* 核心问题 */}
      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">故事核心问题</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuestionCard question="主角是谁？" answer={synopsis.protagonist} />
          <QuestionCard question="主角想要什么？" answer={synopsis.goal} />
          <QuestionCard question="什么在阻碍主角？" answer={synopsis.obstacle} />
          <QuestionCard question="主角如何克服？" answer={synopsis.resolution} />
          <QuestionCard question="最终结果如何？" answer={synopsis.outcome} className="md:col-span-2" />
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ question, answer, className }: { question: string; answer: string; className?: string }) {
  return (
    <div className={cn("p-4 bg-gray-50 rounded-lg", className)}>
      <p className="text-sm text-gray-500 mb-2 font-medium">{question}</p>
      <p className="text-gray-800 leading-relaxed">{answer}</p>
    </div>
  );
}

function CharactersPanel({ characters }: { characters: CharacterBio[] }) {
  if (characters.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>暂无人物数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {characters.map((char) => (
        <div key={char.id} className="border rounded-lg bg-white hover:shadow-md transition-shadow">
          {/* 人物头部 - 始终可见 */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-semibold",
                char.isProtagonist
                  ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                  : "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
              )}>
                {char.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{char.name}</h3>
                  {char.isProtagonist && (
                    <Badge className="bg-purple-500 text-white text-xs">主角</Badge>
                  )}
                  {char.age && (
                    <span className="text-sm text-gray-500">{char.age}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{char.identity}</p>
              </div>
            </div>
          </div>

          {/* 人物详情 - 可折叠 */}
          <Accordion type="single" collapsible>
            <AccordionItem value={char.id} className="border-0">
              <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">
                <span className="text-sm text-gray-600">查看详细信息</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  {/* 性格特点 */}
                  {char.personality.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase">性格特点</p>
                      <div className="flex flex-wrap gap-1.5">
                        {char.personality.map((p, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 背景故事 */}
                  {char.background && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase">背景故事</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{char.background}</p>
                    </div>
                  )}

                  {/* 核心动机 */}
                  {char.motivation && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase">核心动机</p>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                        {char.motivation}
                      </p>
                    </div>
                  )}

                  {/* 人物弧线 */}
                  {(char.arc.start || char.arc.change || char.arc.end) && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase">人物弧线</p>
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        {char.arc.start && (
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                            {char.arc.start}
                          </span>
                        )}
                        {char.arc.change && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200">
                              {char.arc.change}
                            </span>
                          </>
                        )}
                        {char.arc.end && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200">
                              {char.arc.end}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 重要经历 */}
                  {char.keyExperiences.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase">重要经历</p>
                      <ul className="space-y-2">
                        {char.keyExperiences.map((exp, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2 pl-2">
                            <span className="text-purple-500 mt-0.5 font-bold">•</span>
                            <span className="flex-1">{exp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 行为模式 */}
                  {char.behaviorPattern && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase">行为模式</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{char.behaviorPattern}</p>
                    </div>
                  )}

                  {/* 语言风格 */}
                  {char.speechStyle && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase">语言风格</p>
                      <p className="text-sm text-gray-700 leading-relaxed italic">"{char.speechStyle}"</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ))}
    </div>
  );
}

function RelationshipsPanel({ relationships }: { relationships: CharacterRelationship[] }) {
  if (relationships.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Network className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>暂无关系数据</p>
      </div>
    );
  }

  const relationTypeColors: Record<string, string> = {
    family: 'bg-orange-100 text-orange-800',
    romance: 'bg-pink-100 text-pink-800',
    friendship: 'bg-green-100 text-green-800',
    rivalry: 'bg-red-100 text-red-800',
    enemy: 'bg-red-200 text-red-900',
    mentor: 'bg-indigo-100 text-indigo-800',
    colleague: 'bg-slate-100 text-slate-800',
    alliance: 'bg-cyan-100 text-cyan-800',
    subordinate: 'bg-amber-100 text-amber-800',
    other: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-4">
      {relationships.map((rel) => (
        <div key={rel.id} className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{rel.fromCharacter}</span>
              <span className="text-gray-400">↔</span>
              <span className="font-medium">{rel.toCharacter}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={relationTypeColors[rel.relationType] || relationTypeColors.other}>
                {rel.relationLabel}
              </Badge>
              {rel.isCore && (
                <Badge variant="outline" className="text-xs">核心</Badge>
              )}
            </div>
          </div>
          {rel.description && (
            <p className="text-sm text-gray-700 mb-2">{rel.description}</p>
          )}
          {rel.development && (
            <p className="text-xs text-gray-500">发展：{rel.development}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function PlotPointsPanel({ plotPoints }: { plotPoints: PlotPoint[] }) {
  if (plotPoints.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>暂无情节点数据</p>
      </div>
    );
  }

  const plotTypeColors: Record<string, string> = {
    setup: 'bg-blue-100 text-blue-800',
    development: 'bg-green-100 text-green-800',
    turning: 'bg-yellow-100 text-yellow-800',
    climax: 'bg-red-100 text-red-800',
    resolution: 'bg-purple-100 text-purple-800',
  };

  const plotTypeLabels: Record<string, string> = {
    setup: '建立',
    development: '发展',
    turning: '转折',
    climax: '高潮',
    resolution: '结局',
  };

  const stageLabels: Record<string, string> = {
    early: '前期',
    middle: '中期',
    late: '后期',
  };

  return (
    <div className="space-y-4">
      {plotPoints.map((point) => (
        <div key={point.id} className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                {point.order}
              </span>
              <h4 className="font-medium">{point.title}</h4>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                {stageLabels[point.stage]}
              </Badge>
              <Badge className={plotTypeColors[point.type] || plotTypeColors.development}>
                {plotTypeLabels[point.type] || point.type}
              </Badge>
            </div>
          </div>
          {point.description && (
            <p className="text-sm text-gray-700 mb-2">{point.description}</p>
          )}
          {point.characters.length > 0 && (
            <p className="text-xs text-gray-500 mb-1">
              涉及角色：{point.characters.join('、')}
            </p>
          )}
          {point.consequence && (
            <p className="text-xs text-gray-500 mb-1">
              影响：{point.consequence}
            </p>
          )}
          {point.emotionalTone && (
            <p className="text-xs text-gray-500">
              基调：{point.emotionalTone}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default StoryFiveElementsAnalyzer;
