import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  MapPin,
  Box,
  Film,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Camera,
  Image as ImageIcon,
  Layers,
  RefreshCw,
  Wand2,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { Project, StoryboardPanel, EmotionBeat } from '../types';
import { projectStorage, storyboardStorage, analysisStorage, chapterStorage, scriptStorage } from '../utils/storage';
import { calculateProjectStats, getCharacterAppearances, getSceneUsageFrequency } from '../utils/projectStats';
import { StoryAnalyzer } from '../utils/ai/storyAnalyzer';
import { EmotionCurveChart } from '../components/dashboard/EmotionCurveChart';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { FadeIn, CountUp, ProgressBar } from '../components/Animations';
import { generateAnalysisReport, type QualityAnalysisReport } from '../utils/analytics/qualityAnalytics';
import { WholeBookAnalyzer } from '../utils/ai/wholeBookAnalyzer';
import { FiveElementsReport } from '../components/analysis/FiveElementsReport';
import type { StoryFiveElements } from '../types/story-analysis';
export function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [characterStats, setCharacterStats] = useState<Record<string, number>>({});
  const [sceneStats, setSceneStats] = useState<Record<string, number>>({});
  const [panels, setPanels] = useState<StoryboardPanel[]>([]);
  const [emotionData, setEmotionData] = useState<EmotionBeat[]>([]);
  const [qualityReport, setQualityReport] = useState<QualityAnalysisReport | null>(null); // 🆕
  const [projectAnalysis, setProjectAnalysis] = useState<StoryFiveElements | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProjectAnalyzing, setIsProjectAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ progress: 0, message: '' });
  const [activeTab, setActiveTab] = useState<'overview' | 'storyboard' | 'analysis'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (projectId) {
        try {
          setIsLoading(true);
          const proj = await projectStorage.getById(projectId);

          if (proj) {
            // ... (loading stats, charStats, scnStats)
            const stats = await calculateProjectStats(projectId);
            setProject({ ...proj, stats });

            const charStats = await getCharacterAppearances(projectId);
            const scnStats = await getSceneUsageFrequency(projectId);
            setCharacterStats(charStats);
            setSceneStats(scnStats);

            // ... (loading chapters and panels)
            const chapters = await chapterStorage.getByProjectId(projectId);
            const allPanels: StoryboardPanel[] = [];
            for (const chapter of chapters) {
              const storyboard = await storyboardStorage.getByChapterId(chapter.id);
              if (storyboard?.panels) {
                allPanels.push(...storyboard.panels);
              }
            }
            setPanels(allPanels);

            // ... (loading emotion data)
            const analysis = await analysisStorage.getByProjectId(projectId);
            if (analysis?.emotionCurve) {
              setEmotionData(analysis.emotionCurve);
            }

            // 🆕 Load Project Analysis (Whole Book)
            const wholeBookAnalysis = await analysisStorage.getProjectAnalysis(projectId);
            if (wholeBookAnalysis) {
              setProjectAnalysis(wholeBookAnalysis);
            }

            // 🆕 Load quality report
            const report = generateAnalysisReport(projectId);
            setQualityReport(report);
          }
        } catch (error) {
          console.error("Failed to load dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData().catch(err => console.error("Unhandled promise rejection in loadData:", err));
  }, [projectId]);

  // 处理全书分析
  const handleAnalyzeProject = async () => {
    if (!projectId) return;

    setIsProjectAnalyzing(true);
    setAnalysisProgress({ progress: 0, message: '准备开始...' });

    try {
      const analyzer = new WholeBookAnalyzer((progress) => {
        setAnalysisProgress({
          progress: progress.progress,
          message: progress.message
        });
      });

      const result = await analyzer.analyzeProject(projectId);
      setProjectAnalysis(result);
      toast.success('全书分析完成！');
    } catch (error: any) {
      console.error('全书分析失败:', error);
      toast.error('分析失败', {
        description: error.message || '未知错误，请确保剧本内容不为空。'
      });
    } finally {
      setIsProjectAnalyzing(false);
    }
  };

  // 处理情感分析
  const handleAnalyzeEmotion = async () => {
    console.log('Starting emotion analysis...');
    if (!projectId) {
      console.error('No Project ID');
      return;
    }
    setIsAnalyzing(true);
    try {
      // 1. 获取所有剧本内容
      console.log('Fetching chapters...');
      const chapters = await chapterStorage.getByProjectId(projectId);
      console.log('Chapters found:', chapters.length);

      let fullScript = '';
      for (const chapter of chapters) {
        const script = await scriptStorage.getByChapterId(chapter.id);
        if (script) {
          if (script.content && script.content.trim()) {
            fullScript += script.content + '\n\n';
          } else if (script.scenes && script.scenes.length > 0) {
            // Fallback: 如果 raw content 为空，从 scenes 重建剧本
            console.log(`Chapter ${chapter.id} raw content empty, generating from scenes...`);
            const sceneText = script.scenes.map(scene => {
              let text = `第${scene.sceneNumber}场 ${scene.location} ${scene.timeOfDay}\n`;
              text += `${scene.action}\n`;
              scene.dialogues.forEach(d => {
                text += `${d.character}：${d.lines}\n`;
              });
              return text;
            }).join('\n\n');
            fullScript += sceneText + '\n\n';
          }
        }
      }
      console.log('Full script length:', fullScript.length);

      if (!fullScript.trim()) {
        console.warn('Script content is empty.');
        toast.error('无法进行分析：检测到所有章节的剧本内容为空。', {
          description: '请先前往“剧本编辑器”编写或导入剧本内容。'
        });
        setIsAnalyzing(false);
        return;
      }

      // 检查脚本是否有更改 (使用简单的长度+首尾字符哈希)
      const generateSimpleHash = (text: string) => {
        if (!text) return '';
        return `${text.length}-${text.charCodeAt(0)}-${text.charCodeAt(text.length - 1)}`;
      };
      const currentScriptHash = generateSimpleHash(fullScript);

      // 2. 检查缓存：如果脚本没变且有缓存，直接使用
      let analysis = await analysisStorage.getByProjectId(projectId);
      if (analysis?.emotionCurve && analysis.emotionCurve.length > 0) {
        const cachedHash = (analysis as any).scriptHash;
        if (cachedHash === currentScriptHash) {
          console.log('[ProjectDashboard] 使用缓存的情感分析结果');
          toast.success('已加载缓存的情感分析结果', {
            description: '剧本未发生更改，直接使用上次分析结果。'
          });
          setEmotionData(analysis.emotionCurve);
          setIsAnalyzing(false);
          return;
        }
      }

      // 3. 调用 AI 分析 (使用 Map-Reduce 支持长剧本)
      console.log('Calling AI analyzer...');
      toast.info('正在进行情感分析...', {
        description: 'AI 正在阅读剧本并分析情感节奏，请稍候。'
      });

      const analyzer = new StoryAnalyzer();
      // 使用 Map-Reduce 版本以支持超长剧本
      const emotionCurve = await analyzer.analyzeEmotionCurveMR(fullScript);
      console.log('Emotion curve generated:', emotionCurve);

      // 4. 保存结果（包括 scriptHash 用于缓存校验）
      if (!analysis) {
        // 如果不存在分析记录，创建一个新的
        analysis = {
          id: Date.now().toString(),
          projectId: projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          analysisSource: 'ai',
          genre: {} as any, // 占位
          synopsis: {} as any,
          characterBios: [],
          relationships: [],
          plotPoints: [],
          emotionCurve: emotionCurve
        };
      } else {
        analysis.emotionCurve = emotionCurve;
        analysis.updatedAt = new Date().toISOString();
      }

      // 保存脚本哈希用于下次缓存校验
      (analysis as any).scriptHash = currentScriptHash;

      await analysisStorage.save(analysis);
      setEmotionData(emotionCurve);
      toast.success('情感分析完成！');

    } catch (error: any) {
      console.error('情感分析失败:', error);
      toast.error('分析失败，请重试', {
        description: error.message || '未知错误'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
        <p className="text-gray-500 ml-2">加载中...</p>
      </div>
    );
  }

  if (!project || !project.stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">项目数据加载失败</p>
      </div>
    );
  }

  const stats = project.stats;
  const topCharacters = Object.entries(characterStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const topScenes = Object.entries(sceneStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">首页</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/projects/${projectId}`}>{project.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>数据统计</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题 */}
      <FadeIn direction="up" duration={400}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              {project.title}
            </h1>
            <p className="text-gray-600 mt-1">项目数据总览与分镜分析</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/tools`)}>
              <Wand2 className="w-4 h-4 mr-2" />
              高级工具
            </Button>
            <Button onClick={() => navigate(`/projects/${projectId}`)}>
              返回项目
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* 标签页切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            项目概览
          </TabsTrigger>
          <TabsTrigger value="storyboard" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            分镜分析
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            全书分析
          </TabsTrigger>
        </TabsList>

        {/* 项目概览标签页 */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <FadeIn direction="up" duration={400} delay={100}>
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  项目完成度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      <CountUp end={stats.completionRate} duration={1500} decimals={0} suffix="%" />
                    </span>
                    <span className="text-sm opacity-90">
                      {stats.completionRate < 30 && '刚刚起步'}
                      {stats.completionRate >= 30 && stats.completionRate < 60 && '稳步推进'}
                      {stats.completionRate >= 60 && stats.completionRate < 90 && '接近完成'}
                      {stats.completionRate >= 90 && '即将大功告成'}
                    </span>
                  </div>
                  <ProgressBar
                    value={stats.completionRate}
                    max={100}
                    animated={true}
                    color="bg-white"
                    className="h-3"
                  />
                  <div className="grid grid-cols-4 gap-3 text-sm opacity-90">
                    <div>
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      原文编写
                    </div>
                    <div>
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      剧本改写
                    </div>
                    <div>
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      分镜制作
                    </div>
                    <div>
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      图片生成
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* 情感节奏分析 */}
          <FadeIn direction="up" duration={400} delay={150}>
            {emotionData.length > 0 ? (
              <EmotionCurveChart
                data={emotionData}
                onAnalyze={handleAnalyzeEmotion}
                isAnalyzing={isAnalyzing}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    情感节奏分析
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500 mb-4 text-center max-w-md">
                    使用 AI 分析剧本的戏剧张力与场面能量，生成可视化的情感节奏曲线，辅助把控叙事节奏。
                  </p>
                  <Button
                    onClick={handleAnalyzeEmotion}
                    disabled={isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        分析中 ({panels.length > 0 ? '需数秒' : '准备中'}...)
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        开始情感分析
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </FadeIn>

          {/* 核心数据统计 */}
          <FadeIn direction="up" duration={400} delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                    <FileText className="w-4 h-4" />
                    章节总数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    <CountUp end={stats.totalChapters} duration={1200} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">个章节</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                    <Film className="w-4 h-4" />
                    场景总数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    <CountUp end={stats.totalScenes} duration={1200} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">个剧本场景</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                    <Camera className="w-4 h-4" />
                    分镜总数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    <CountUp end={stats.totalPanels} duration={1200} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">个分镜画面</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    总时长
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    <CountUp end={Math.floor(stats.totalDuration / 60)} duration={1200} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">分钟</p>
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          {/* 资源库统计 */}
          <FadeIn direction="up" duration={400} delay={300}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    角色数量
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">
                    <CountUp end={stats.charactersCount} duration={1200} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">个角色</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    场景数量
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-teal-600">
                    <CountUp end={stats.scenesCount} duration={1200} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">个场景</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                    <Box className="w-4 h-4" />
                    道具数量
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-pink-600">
                    <CountUp end={stats.propsCount} duration={1200} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">个道具</p>
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          {/* 详细统计 */}
          <FadeIn direction="up" duration={400} delay={400}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 角色出场统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    角色出场统计 TOP 5
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topCharacters.length > 0 ? (
                    <div className="space-y-3">
                      {topCharacters.map(([name, count], index) => (
                        <div key={name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                {index + 1}
                              </span>
                              {name}
                            </span>
                            <span className="text-gray-600">{count} 次</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full h-2"
                              style={{ width: `${(count / topCharacters[0][1]) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">暂无角色出场数据</p>
                  )}
                </CardContent>
              </Card>

              {/* 场景使用频率 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    场景使用频率 TOP 5
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topScenes.length > 0 ? (
                    <div className="space-y-3">
                      {topScenes.map(([location, count], index) => (
                        <div key={location} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                              <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                {index + 1}
                              </span>
                              <span className="truncate max-w-[200px]">{location}</span>
                            </span>
                            <span className="text-gray-600">{count} 次</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-600 rounded-full h-2"
                              style={{ width: `${(count / topScenes[0][1]) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">暂无场景使用数据</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          {/* 快捷操作 */}
          <FadeIn direction="up" duration={400} delay={500}>
            <Card>
              <CardHeader>
                <CardTitle>快捷操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate(`/projects/${projectId}`)}
                  >
                    <FileText className="w-6 h-6" />
                    <span>查看章节</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate(`/projects/${projectId}/assets`)}
                  >
                    <Users className="w-6 h-6" />
                    <span>资源库</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => navigate(`/projects/${projectId}/style`)}
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span>导演风格</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="w-6 h-6" />
                    <span>刷新统计</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* 分镜分析标签页 */}
        <TabsContent value="storyboard" className="mt-6">
          {panels.length > 0 ? (
            <AnalyticsDashboard panels={panels} qualityReport={qualityReport} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">暂无分镜数据</h3>
                <p className="text-gray-500 mb-4">请先在章节中创建分镜</p>
                <Button onClick={() => navigate(`/projects/${projectId}`)}>
                  前往创建分镜
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <FadeIn direction="up" duration={400}>
            {projectAnalysis ? (
              <div className="space-y-6">
                <Card className="bg-slate-50 border-dashed border-slate-300">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="text-sm text-gray-600">
                      分析报告已生成。当您添加新的章节后，建议重新分析以更新报告。
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAnalyzeProject}
                      disabled={isProjectAnalyzing}
                    >
                      {isProjectAnalyzing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {isProjectAnalyzing ? '更新分析中...' : '更新全书分析'}
                    </Button>
                  </CardContent>
                </Card>

                {isProjectAnalyzing && (
                  <Card className="mb-6">
                    <CardContent className="py-8">
                      <div className="max-w-md mx-auto space-y-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{analysisProgress.message}</span>
                          <span>{analysisProgress.progress}%</span>
                        </div>
                        <ProgressBar value={analysisProgress.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FiveElementsReport analysis={projectAnalysis} isLoading={false} />
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
                  <div className="p-4 bg-purple-50 rounded-full">
                    <BookOpen className="w-12 h-12 text-purple-500" />
                  </div>
                  <div className="text-center max-w-lg space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">开始全书五元素分析</h3>
                    <p className="text-gray-500">
                      AI 将阅读项目中所有章节的剧本，深度分析题材、生成故事大纲、梳理人物小传与关系网，并提取核心情节。
                    </p>
                  </div>

                  {isProjectAnalyzing ? (
                    <div className="w-full max-w-md space-y-4 bg-gray-50 p-6 rounded-lg">
                      <div className="flex justify-between text-sm font-medium text-purple-700 mb-1">
                        <span>{analysisProgress.message}</span>
                        <span>{analysisProgress.progress}%</span>
                      </div>
                      <ProgressBar value={analysisProgress.progress} className="h-3" color="bg-purple-600" />
                      <p className="text-xs text-gray-400 text-center">分析长篇剧本可能需要几分钟，请耐心等待...</p>
                    </div>
                  ) : (
                    <Button size="lg" onClick={handleAnalyzeProject} className="bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all">
                      <Wand2 className="w-5 h-5 mr-2" />
                      立即开始分析
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}
