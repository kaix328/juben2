/**
 * 质量分析面板组件
 * 显示完整的质量分析报告
 * 支持跨标签页实时更新
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Download, Calendar, RefreshCw, GitCompare } from 'lucide-react';
import { Button } from '../ui/button';
import { QualityTrendChart } from './QualityTrendChart';
import { IssueDistributionChart } from './IssueDistributionChart';
import { IssueHeatmap } from './IssueHeatmap';
import {
    generateAnalysisReport,
    exportAnalysisReport,
    exportAnalysisReportCSV,
    subscribeToQualityUpdates,
    compareQualityPeriods,
    getTopIssues,
    getQualityHistory,
    type QualityAnalysisReport,
    type QualityComparison
} from '../../utils/analytics/qualityAnalytics';

interface QualityAnalyticsPanelProps {
    projectId: string;
    className?: string;
}

export function QualityAnalyticsPanel({ projectId, className = '' }: QualityAnalyticsPanelProps) {
    const [report, setReport] = useState<QualityAnalysisReport | null>(null);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false); // 实时更新指示器
    const [showComparison, setShowComparison] = useState(false);
    const [comparison, setComparison] = useState<QualityComparison | null>(null);

    // 获取所有问题用于热力图
    const allIssues = useMemo(() => {
        const history = getQualityHistory(projectId);
        return getTopIssues(history, 100); // 获取最多100个问题
    }, [projectId, report]); // report 变化时重新计算

    // 计算对比数据
    const loadComparison = useCallback(() => {
        const now = new Date();
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

        // 当前时段
        const period2End = now;
        const period2Start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // 上一时段
        const period1End = period2Start;
        const period1Start = new Date(period1End.getTime() - days * 24 * 60 * 60 * 1000);

        const result = compareQualityPeriods(projectId, period1Start, period1End, period2Start, period2End);
        setComparison(result);
    }, [projectId, dateRange]);

    const loadReport = useCallback(() => {
        setLoading(true);
        try {
            const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
            const endDate = new Date();
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            console.log('[QualityAnalyticsPanel] 加载报告:', {
                projectId,
                dateRange,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            const analysisReport = generateAnalysisReport(projectId, startDate, endDate);

            console.log('[QualityAnalyticsPanel] 生成的报告:', {
                totalChecks: analysisReport.summary.totalChecks,
                avgScore: analysisReport.summary.avgQualityScore,
                trendsCount: analysisReport.trends.length
            });

            setReport(analysisReport);
        } catch (error) {
            console.error('[QualityAnalytics] 加载报告失败:', error);
        } finally {
            setLoading(false);
        }
    }, [projectId, dateRange]);

    // 初始加载
    useEffect(() => {
        loadReport();
    }, [loadReport]);

    // 订阅实时更新
    useEffect(() => {
        const unsubscribe = subscribeToQualityUpdates((event, updatedProjectId) => {
            // 只在当前项目数据更新时刷新
            if (updatedProjectId === projectId || !updatedProjectId) {
                console.log('[QualityAnalyticsPanel] 收到实时更新:', event);
                setIsLive(true);
                loadReport();
                // 3秒后关闭实时更新指示器
                setTimeout(() => setIsLive(false), 3000);
            }
        });

        return () => unsubscribe();
    }, [projectId, loadReport]);

    const handleExportJSON = () => {
        if (!report) return;

        const json = exportAnalysisReport(report);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quality-analysis-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        if (!report) return;

        const csv = exportAnalysisReportCSV(report);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quality-analysis-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-96 ${className}`}>
                <div className="text-gray-400">加载中...</div>
            </div>
        );
    }

    if (!report || report.summary.totalChecks === 0) {
        return (
            <div className={`flex flex-col items-center justify-center h-96 ${className}`}>
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <div className="text-gray-400 text-lg mb-2">暂无分析数据</div>
                <div className="text-gray-400 text-sm mb-4">
                    数据分析需要至少进行一次质量检查
                </div>
                <div className="text-center text-sm text-gray-500 space-y-2 max-w-md">
                    <p>💡 <strong>如何使用数据分析：</strong></p>
                    <ol className="text-left space-y-1 mt-2">
                        <li>1. 生成分镜后，点击"质量检查"按钮</li>
                        <li>2. 系统会自动保存质量数据</li>
                        <li>3. 多次检查后，这里会显示：</li>
                        <li className="ml-4">• 质量趋势图表</li>
                        <li className="ml-4">• 问题分布统计</li>
                        <li className="ml-4">• 改进建议</li>
                    </ol>
                    <p className="mt-4 text-blue-600">
                        👉 请先进行质量检查以生成数据
                    </p>
                </div>
            </div>
        );
    }

    const { summary, trends, issueFrequency, improvements, recommendations } = report;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* 头部：时间范围选择和导出 - 优化布局 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* 时间范围选择 */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {/* 🆕 实时更新指示器 */}
                    {isLive && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-600 text-[10px] rounded-full animate-pulse">
                            <RefreshCw className="w-3 h-3" />
                            实时
                        </span>
                    )}
                    <div className="flex gap-1.5">
                        {(['7d', '30d', '90d'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${dateRange === range
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {range === '7d' ? '7天' : range === '30d' ? '30天' : '90天'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 导出按钮 */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportJSON}
                        className="flex items-center gap-1.5 text-xs h-8 px-2.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">导出</span>JSON
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 text-xs h-8 px-2.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">导出</span>CSV
                    </Button>
                </div>
            </div>

            {/* 总览卡片 - 超紧凑布局 */}
            <div className="grid grid-cols-4 gap-3">
                {/* 检查次数 */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 overflow-hidden">
                    <div className="text-[10px] text-gray-500 mb-1 font-medium truncate">检查次数</div>
                    <div className="text-lg font-bold text-gray-900 truncate">{summary.totalChecks}</div>
                </div>

                {/* 平均质量分数 */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 overflow-hidden">
                    <div className="text-[10px] text-gray-500 mb-1 font-medium truncate">平均分数</div>
                    <div className="flex items-baseline gap-0.5">
                        <div className={`text-lg font-bold truncate ${summary.avgQualityScore >= 80 ? 'text-green-600' :
                            summary.avgQualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {summary.avgQualityScore}
                        </div>
                        <div className="text-[10px] text-gray-400 flex-shrink-0">/100</div>
                    </div>
                </div>

                {/* 总问题数 */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 overflow-hidden">
                    <div className="text-[10px] text-gray-500 mb-1 font-medium truncate">总问题</div>
                    <div className="text-lg font-bold text-gray-900 truncate">{summary.totalIssues}</div>
                </div>

                {/* 改进率 */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 overflow-hidden">
                    <div className="text-[10px] text-gray-500 mb-1 font-medium truncate">改进率</div>
                    <div className="flex items-center gap-0.5">
                        <div className={`text-base font-bold truncate ${summary.improvementRate > 0 ? 'text-green-600' :
                            summary.improvementRate < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                            {summary.improvementRate > 0 ? '+' : ''}{summary.improvementRate}%
                        </div>
                        {summary.improvementRate > 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600 flex-shrink-0" />
                        ) : summary.improvementRate < 0 ? (
                            <TrendingDown className="w-3 h-3 text-red-600 flex-shrink-0" />
                        ) : null}
                    </div>
                </div>
            </div>

            {/* 质量趋势图 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">质量趋势</h3>
                <QualityTrendChart
                    data={trends}
                    height={300}
                    onPointClick={(point) => {
                        // 显示详细信息
                        const date = new Date(point.timestamp).toLocaleString('zh-CN');
                        const detail = `📊 ${date}\n质量分数: ${point.qualityScore}\n错误: ${point.errorCount} | 警告: ${point.warningCount} | 提示: ${point.infoCount}\n分镜数: ${point.totalPanels}`;

                        // 使用 toast 显示，但需要动态导入以避免循环
                        import('sonner').then(({ toast }) => {
                            toast.info('数据点详情', {
                                description: detail,
                                duration: 8000
                            });
                        });

                        console.log('[QualityAnalytics] 点击数据点:', point);
                    }}
                />
            </div>

            {/* 问题分布图 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">问题分布</h3>
                <IssueDistributionChart data={issueFrequency} height={300} />
            </div>

            {/* 🆕 问题热力图 */}
            {allIssues.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">问题热力图</h3>
                    <p className="text-xs text-gray-500 mb-3">点击分镜格子可滚动到对应位置（需在分镜编辑器中查看）</p>
                    <IssueHeatmap
                        issues={allIssues}
                        onPanelClick={(panelNumber) => {
                            // 尝试滚动到对应分镜（如果在分镜编辑器页面）
                            const panelElement = document.querySelector(`[data-panel-number="${panelNumber}"]`);
                            if (panelElement) {
                                panelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                panelElement.classList.add('ring-4', 'ring-purple-500');
                                setTimeout(() => panelElement.classList.remove('ring-4', 'ring-purple-500'), 2000);
                                import('sonner').then(({ toast }) => {
                                    toast.success(`已定位到分镜 #${panelNumber}`);
                                });
                            } else {
                                // 不在分镜编辑器页面，提示用户
                                import('sonner').then(({ toast }) => {
                                    toast.info(`分镜 #${panelNumber}`, {
                                        description: '请返回分镜编辑器查看此分镜',
                                        action: {
                                            label: '了解',
                                            onClick: () => { }
                                        }
                                    });
                                });
                            }
                        }}
                    />
                </div>
            )}

            {/* 🆕 时段对比 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <GitCompare className="w-5 h-5" />
                        时段对比
                    </h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (!showComparison) {
                                loadComparison();
                            }
                            setShowComparison(!showComparison);
                        }}
                    >
                        {showComparison ? '收起' : '展开对比'}
                    </Button>
                </div>

                {showComparison && comparison && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-gray-50">
                            <div className="text-xs text-gray-500 mb-1">上一时段平均分</div>
                            <div className="text-2xl font-bold">{comparison.period1.avgScore}</div>
                            <div className="text-xs text-gray-400">{comparison.period1.checkCount} 次检查</div>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50">
                            <div className="text-xs text-gray-500 mb-1">当前时段平均分</div>
                            <div className="text-2xl font-bold">{comparison.period2.avgScore}</div>
                            <div className="text-xs text-gray-400">{comparison.period2.checkCount} 次检查</div>
                        </div>
                        <div className={`p-4 rounded-lg ${comparison.verdict === 'improved' ? 'bg-green-50' :
                            comparison.verdict === 'declined' ? 'bg-red-50' : 'bg-gray-50'
                            }`}>
                            <div className="text-xs text-gray-500 mb-1">变化</div>
                            <div className={`text-2xl font-bold flex items-center gap-1 ${comparison.scoreDiff > 0 ? 'text-green-600' :
                                comparison.scoreDiff < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                {comparison.scoreDiff > 0 ? '+' : ''}{comparison.scoreDiff}
                                {comparison.scoreDiff > 0 && <TrendingUp className="w-4 h-4" />}
                                {comparison.scoreDiff < 0 && <TrendingDown className="w-4 h-4" />}
                            </div>
                            <div className="text-xs text-gray-400">
                                {comparison.verdict === 'improved' ? '有改进 📈' :
                                    comparison.verdict === 'declined' ? '有下降 📉' : '保持稳定'}
                            </div>
                        </div>
                    </div>
                )}

                {showComparison && !comparison && (
                    <div className="text-center text-gray-400 py-4">暂无对比数据</div>
                )}
            </div>

            {/* 改进建议 */}
            {improvements.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">改进建议</h3>
                    <div className="space-y-3">
                        {improvements.map((improvement, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${improvement.priority === 'high' ? 'bg-red-500' :
                                    improvement.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900">{improvement.category}</span>
                                        <span className="text-xs text-gray-500">
                                            出现 {improvement.frequency} 次
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-1">{improvement.issue}</div>
                                    <div className="text-sm text-blue-600">💡 {improvement.suggestion}</div>
                                    <div className="text-xs text-gray-500 mt-1">影响: {improvement.impact}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 推荐建议 */}
            {recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        推荐建议
                    </h3>
                    <div className="space-y-2">
                        {recommendations.map((recommendation, index) => (
                            <div
                                key={index}
                                className="text-sm text-gray-700 flex items-start gap-2"
                            >
                                <span className="text-blue-600 font-bold">•</span>
                                <span>{recommendation}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
