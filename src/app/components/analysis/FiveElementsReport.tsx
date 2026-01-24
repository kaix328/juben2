import { useRef, useState } from 'react';
import { exportToPdf } from '../../utils/exportToPdf';
import {
    Activity,
    BookOpen,
    Users,
    Network,
    Flag,
    Lightbulb,
    Target,
    Swords,
    Trophy,
    UserCircle,
    Copy,
    Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { formatFiveElementsReport } from '../../utils/ai/storyAnalyzer';
import type { StoryFiveElements } from '../../types/story-analysis';
import { StoryChatDialog } from './StoryChatDialog';
import { toast } from 'sonner';

interface FiveElementsReportProps {
    analysis: StoryFiveElements;
    isLoading?: boolean;
}

export function FiveElementsReport({ analysis, isLoading = false }: FiveElementsReportProps) {
    const rawGenre = analysis?.genre || {};
    const synopsis = analysis?.synopsis || {};
    const characterBios = analysis?.characterBios || [];
    const relationships = analysis?.relationships || [];
    const plotPoints = analysis?.plotPoints || [];
    const themes = analysis?.themes || [];
    const symbols = analysis?.symbols || [];

    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // Ensure nested arrays in genre exist
    const genre = {
        ...rawGenre,
        content: rawGenre.content || [],
        uniquePoints: rawGenre.uniquePoints || [],
        creativeElements: rawGenre.creativeElements || [],
        styleFeatures: rawGenre.styleFeatures || []
    };

    const copyReport = () => {
        const text = formatFiveElementsReport(analysis);
        navigator.clipboard.writeText(text);
        toast.success('分析报告已复制到剪贴板');
    };

    const handleExport = async () => {
        setIsExporting(true);
        // Wait for render to update layout to "stacked" mode
        setTimeout(async () => {
            if (reportRef.current) {
                const success = await exportToPdf(reportRef.current, `剧本五元素分析_${new Date().toISOString().split('T')[0]}.pdf`);
                if (success) {
                    toast.success('PDF 导出成功');
                } else {
                    toast.error('PDF 导出失败');
                }
            }
            setIsExporting(false);
        }, 100);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 text-gray-500">
                正在加载分析报告...
            </div>
        );
    }

    const GenreSection = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">1. 题材类型与创意</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium text-gray-500">基本定位</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">时代背景</span>
                            <Badge variant="outline" className="text-base px-3 py-1 bg-slate-50">
                                {genre.eraDetail} ({genre.era === 'ancient' ? '古代' : genre.era === 'modern' ? '现代' : '未来'})
                            </Badge>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">风格基调</span>
                            <Badge variant="outline" className="text-base px-3 py-1 bg-slate-50">
                                {genre.style}
                            </Badge>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">类型标签</span>
                            <div className="flex flex-wrap gap-2">
                                {genre.content.map(c => (
                                    <Badge key={c} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                        {c}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium text-gray-500">核心概览</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">一句话概念 (High Concept)</span>
                            <p className="font-medium text-gray-800 bg-yellow-50 p-3 rounded-md border border-yellow-100">
                                {genre.coreConceptOneLine}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">独特卖点</span>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {genre.uniquePoints.map((p, i) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">详细分析</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-purple-500" />
                                创意元素
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed">
                                {genre.creativeElements.map((item, i) => (
                                    <div key={i} className="mb-2 last:mb-0 flex gap-2">
                                        <span className="text-purple-500 font-bold">•</span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Flag className="w-4 h-4 text-pink-500" />
                                风格特点
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed">
                                {genre.styleFeatures.map((item, i) => (
                                    <div key={i} className="mb-2 last:mb-0 flex gap-2">
                                        <span className="text-pink-500 font-bold">•</span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const SynopsisSection = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">2. 故事梗概</h3>
            <Card className="bg-gradient-to-r from-gray-50 to-white border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">一句话梗概</h3>
                    <p className="text-lg text-gray-700 leading-relaxed font-medium">
                        {synopsis.oneLine}
                    </p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white">
                    <CardContent className="pt-6">
                        <Target className="w-8 h-8 text-blue-500 mb-2" />
                        <div className="text-sm text-gray-500 mb-1">主角目标</div>
                        <div className="font-medium text-gray-800">{synopsis.goal}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white">
                    <CardContent className="pt-6">
                        <Swords className="w-8 h-8 text-red-500 mb-2" />
                        <div className="text-sm text-gray-500 mb-1">核心障碍</div>
                        <div className="font-medium text-gray-800">{synopsis.obstacle}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white">
                    <CardContent className="pt-6">
                        <Activity className="w-8 h-8 text-purple-500 mb-2" />
                        <div className="text-sm text-gray-500 mb-1">解决方式</div>
                        <div className="font-medium text-gray-800">{synopsis.resolution}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white">
                    <CardContent className="pt-6">
                        <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
                        <div className="text-sm text-gray-500 mb-1">最终结果</div>
                        <div className="font-medium text-gray-800">{synopsis.outcome}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">简短梗概 (Short Synopsis)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className={`${isExporting ? 'h-auto' : 'h-[300px]'} w-full pr-4`}>
                            <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                                {synopsis.short}
                            </p>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">完整梗概 (Full Synopsis)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className={`${isExporting ? 'h-auto' : 'h-[300px]'} w-full pr-4`}>
                            <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                                {synopsis.full}
                            </p>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const CharactersSection = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">3. 人物小传</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {characterBios.map((char) => (
                    <Card key={char.id} className={`overflow-hidden break-inside-avoid ${char.isProtagonist ? 'border-2 border-primary/20 shadow-md transform scale-[1.01]' : ''}`}>
                        <div className={`h-2 ${char.isProtagonist ? 'bg-primary' : 'bg-gray-200'}`} />
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {char.name}
                                    {char.isProtagonist && <Badge variant="default" className="text-xs h-5">主角</Badge>}
                                </CardTitle>
                                <CardDescription>{char.identity} · {char.age} · {char.gender}</CardDescription>
                            </div>
                            <UserCircle className={`w-10 h-10 ${char.isProtagonist ? 'text-primary/20' : 'text-gray-200'}`} />
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">性格特征</span>
                                <div className="flex flex-wrap gap-1">
                                    {char.personality.map(p => (
                                        <Badge key={p} variant="secondary" className="px-1.5 py-0 text-xs font-normal text-gray-600 bg-gray-100">{p}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">核心动机</span>
                                <p className="text-gray-700 font-medium bg-gray-50 p-2 rounded text-xs">{char.motivation}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">背景故事</span>
                                <p className={`text-gray-600 ${isExporting ? '' : 'line-clamp-4 hover:line-clamp-none'} transition-all`}>{char.background}</p>
                            </div>

                            <div className="pt-2 border-t mt-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">人物弧光</span>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="space-y-1">
                                        <span className="text-gray-400">开始</span>
                                        <div className="font-medium text-gray-700">{char.arc.start}</div>
                                    </div>
                                    <div className="space-y-1 text-center border-x px-1">
                                        <span className="text-primary/70">变化</span>
                                        <div className="font-medium text-primary">{char.arc.change}</div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-gray-400">结束</span>
                                        <div className="font-medium text-gray-700">{char.arc.end}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    const RelationshipsSection = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">4. 人物关系</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relationships.map((rel) => (
                    <Card key={rel.id} className="hover:shadow-md transition-shadow break-inside-avoid">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="flex flex-col items-center min-w-[80px]">
                                <div className="font-bold text-gray-800">{rel.fromCharacter}</div>
                            </div>

                            <div className="flex-1 flex flex-col items-center">
                                <div className="text-xs text-gray-400 mb-1">{rel.strength === 'strong' ? '强关联' : rel.strength === 'medium' ? '一般' : '弱关联'}</div>
                                <div className={`h-0.5 w-full relative ${rel.tension === 'conflict' ? 'bg-red-300' :
                                    rel.tension === 'competition' ? 'bg-orange-300' :
                                        rel.tension === 'dependence' ? 'bg-blue-300' :
                                            'bg-gray-300'
                                    }`}>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs font-bold text-gray-600 border rounded-full whitespace-nowrap">
                                        {rel.relationLabel}
                                        {rel.isCore && <span className="ml-1 text-red-500">*</span>}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center line-clamp-2">{rel.description}</p>
                            </div>

                            <div className="flex flex-col items-center min-w-[80px]">
                                <div className="font-bold text-gray-800">{rel.toCharacter}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {relationships.length === 0 && (
                <div className="text-center py-12 text-gray-500">暂无人物关系数据</div>
            )}
        </div>
    );

    const PlotSection = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">5. 大情节点</h3>
            <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pl-8 py-4">
                {plotPoints.map((point) => (
                    <div key={point.id} className="relative break-inside-avoid">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[41px] top-4 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center
                            ${point.type === 'climax' ? 'bg-red-500' :
                                point.type === 'turning' ? 'bg-yellow-500' :
                                    point.type === 'setup' ? 'bg-blue-500' :
                                        point.type === 'resolution' ? 'bg-green-500' :
                                            'bg-gray-400'}`}
                        >
                            <span className="text-[10px] text-white font-bold">{point.order}</span>
                        </div>

                        <Card>
                            <CardHeader className="py-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {point.stage === 'early' ? '开篇' : point.stage === 'middle' ? '中段' : '结尾'}
                                        </Badge>
                                        <CardTitle className="text-base">{point.title}</CardTitle>
                                    </div>
                                    <Badge className={`
                                        ${point.type === 'climax' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                            point.type === 'turning' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                                'bg-gray-100 text-gray-700 hover:bg-gray-200'} border-none shadow-none`}>
                                        {point.type.toUpperCase()}
                                    </Badge>
                                </div>
                                {point.beat && (
                                    <div className="mt-1">
                                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                            {point.beat}
                                        </Badge>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3 pb-4">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    {point.description}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    {point.characters.length > 0 && point.characters.map(c => (
                                        <div key={c} className="flex items-center text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                            <UserCircle className="w-3 h-3 mr-1" />
                                            {c}
                                        </div>
                                    ))}
                                    {point.emotionalTone && (
                                        <div className="flex items-center text-pink-500 bg-pink-50 px-2 py-1 rounded">
                                            <Activity className="w-3 h-3 mr-1" />
                                            {point.emotionalTone}
                                        </div>
                                    )}
                                </div>
                                {point.consequence && (
                                    <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 border border-slate-100 mt-2">
                                        <span className="font-semibold mr-1">后果/影响:</span>
                                        {point.consequence}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );

    const ThemesSection = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">6. 主题与意象</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 主题分析 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            核心主题 (Themes)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {themes.length > 0 ? themes.map((theme, idx) => (
                            <div key={idx} className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 break-inside-avoid">
                                <h4 className="font-bold text-gray-800 mb-2">{theme.name}</h4>
                                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{theme.description}</p>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-gray-400 uppercase">体现依据</span>
                                    <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
                                        {theme.evidence.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-400 text-sm">暂无主题分析数据</div>
                        )}
                    </CardContent>
                </Card>

                {/* 关键意象 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Flag className="w-5 h-5 text-purple-500" />
                            关键意象/符号 (Motifs)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {symbols.length > 0 ? symbols.map((symbol, idx) => (
                            <div key={idx} className="bg-purple-50/50 p-4 rounded-lg border border-purple-100 break-inside-avoid">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800">{symbol.name}</h4>
                                    <Badge variant="outline" className="text-xs bg-white text-purple-600 border-purple-200">
                                        象征意义
                                    </Badge>
                                </div>
                                <p className="text-purple-700 text-sm font-medium mb-3">{symbol.meaning}</p>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-gray-400 uppercase">出现场景</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {symbol.occurrences.map((oc, i) => (
                                            <span key={i} className="text-xs bg-white px-2 py-1 rounded border text-gray-500">
                                                {oc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-400 text-sm">暂无意象分析数据</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const FullReportView = () => (
        <div ref={reportRef} className="space-y-12 p-8 bg-white max-w-[1200px] mx-auto">
            <div className="text-center border-b pb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">全书五元素分析报告</h1>
                <p className="text-gray-500">生成时间：{new Date(analysis.updatedAt).toLocaleString()}</p>
            </div>

            <GenreSection />
            <SynopsisSection />
            <CharactersSection />
            <RelationshipsSection />
            <PlotSection />
            <ThemesSection />
        </div>
    );

    if (isExporting) {
        return <FullReportView />;
    }

    return (
        <div className="space-y-6" ref={reportRef}>
            {/* 顶部操作栏 */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">全书五元素分析报告</h2>
                    <p className="text-sm text-gray-500">
                        生成时间：{new Date(analysis.updatedAt).toLocaleString()}
                        {analysis.analysisSource === 'ai' && <Badge variant="secondary" className="ml-2 text-xs">AI 生成</Badge>}
                    </p>
                </div>
                <div className="flex gap-2">
                    <StoryChatDialog analysis={analysis} />
                    <Button variant="outline" size="sm" onClick={copyReport}>
                        <Copy className="w-4 h-4 mr-2" />
                        复制全文
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? '导出中...' : '导出 PDF'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="genre" className="w-full">
                <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-gray-100/80">
                    <TabsTrigger value="genre" className="py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                        <span className="hidden md:inline">题材创意</span>
                    </TabsTrigger>
                    <TabsTrigger value="synopsis" className="py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="hidden md:inline">故事梗概</span>
                    </TabsTrigger>
                    <TabsTrigger value="characters" className="py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Users className="w-4 h-4 mr-2 text-purple-500" />
                        <span className="hidden md:inline">人物小传</span>
                    </TabsTrigger>
                    <TabsTrigger value="relationships" className="py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Network className="w-4 h-4 mr-2 text-green-500" />
                        <span className="hidden md:inline">人物关系</span>
                    </TabsTrigger>
                    <TabsTrigger value="plot" className="py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Activity className="w-4 h-4 mr-2 text-red-500" />
                        <span className="hidden md:inline">大情节点</span>
                    </TabsTrigger>
                    <TabsTrigger value="themes" className="py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Flag className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="hidden md:inline">主题意象</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="genre" className="mt-6 space-y-4">
                    <GenreSection />
                </TabsContent>

                <TabsContent value="synopsis" className="mt-6 space-y-6">
                    <SynopsisSection />
                </TabsContent>

                <TabsContent value="characters" className="mt-6">
                    <CharactersSection />
                </TabsContent>

                <TabsContent value="relationships" className="mt-6">
                    <RelationshipsSection />
                </TabsContent>

                <TabsContent value="plot" className="mt-6">
                    <PlotSection />
                </TabsContent>

                <TabsContent value="themes" className="mt-6 space-y-6">
                    <ThemesSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}
