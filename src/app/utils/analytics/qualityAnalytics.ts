/**
 * 质量数据分析模块
 * 收集、分析和可视化质量检查数据
 */
import type { QualityReport, QualityIssue, IssueType } from '../ai/qualityChecker';
import { IssueSeverity, IssueType as IssueTypeEnum } from '../ai/qualityChecker';

/**
 * 质量趋势数据点
 */
export interface QualityTrendPoint {
    timestamp: string;
    qualityScore: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    totalPanels: number;
}

/**
 * 问题频率统计
 */
export interface IssueFrequency {
    type: IssueType;
    count: number;
    percentage: number;
    avgSeverity: number;
}

/**
 * 质量改进建议
 */
export interface QualityImprovement {
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    suggestion: string;
    impact: string;
    frequency: number;
}

/**
 * 质量分析报告
 */
export interface QualityAnalysisReport {
    period: {
        start: string;
        end: string;
    };
    summary: {
        totalChecks: number;
        avgQualityScore: number;
        totalIssues: number;
        improvementRate: number; // 改进率（百分比）
    };
    trends: QualityTrendPoint[];
    issueFrequency: IssueFrequency[];
    topIssues: QualityIssue[];
    improvements: QualityImprovement[];
    recommendations: string[];
}

/**
 * 获取严重程度的数值分数
 */
function getSeverityScore(severity: string): number {
    switch (severity) {
        case IssueSeverity.ERROR:
            return 3;
        case IssueSeverity.WARNING:
            return 2;
        case IssueSeverity.INFO:
            return 1;
        default:
            return 0;
    }
}

/**
 * 质量数据存储
 * 支持 BroadcastChannel 跨标签页实时同步
 */
class QualityDataStore {
    private static instance: QualityDataStore;
    private reports: Map<string, QualityReport> = new Map();
    private maxReports = 100; // 最多保存100个报告
    private broadcastChannel: BroadcastChannel | null = null;
    private listeners: Set<(event: 'update' | 'clear', projectId?: string) => void> = new Set();

    private constructor() {
        this.loadFromStorage();
        this.initBroadcastChannel();
    }

    static getInstance(): QualityDataStore {
        if (!QualityDataStore.instance) {
            QualityDataStore.instance = new QualityDataStore();
        }
        return QualityDataStore.instance;
    }

    /**
     * 初始化 BroadcastChannel 用于跨标签页同步
     */
    private initBroadcastChannel(): void {
        try {
            this.broadcastChannel = new BroadcastChannel('quality-data-sync');
            this.broadcastChannel.onmessage = (event) => {
                const { type, projectId } = event.data;
                console.log('[QualityDataStore] 收到跨标签页消息:', type, projectId);

                // 重新加载数据
                this.loadFromStorage();

                // 通知订阅者
                this.notifyListeners(type, projectId);
            };
            console.log('[QualityDataStore] BroadcastChannel 已初始化');
        } catch (error) {
            console.warn('[QualityDataStore] BroadcastChannel 不可用:', error);
        }
    }

    /**
     * 订阅数据变更事件
     */
    subscribe(callback: (event: 'update' | 'clear', projectId?: string) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * 通知所有订阅者
     */
    private notifyListeners(event: 'update' | 'clear', projectId?: string): void {
        this.listeners.forEach(callback => {
            try {
                callback(event, projectId);
            } catch (error) {
                console.error('[QualityDataStore] 通知订阅者失败:', error);
            }
        });
    }

    /**
     * 广播数据变更到其他标签页
     */
    private broadcast(type: 'update' | 'clear', projectId?: string): void {
        try {
            this.broadcastChannel?.postMessage({ type, projectId });
        } catch (error) {
            console.warn('[QualityDataStore] 广播消息失败:', error);
        }
    }

    /**
     * 保存质量报告
     */
    saveReport(projectId: string, report: QualityReport): void {
        const key = `${projectId}-${report.checkTime}`;
        this.reports.set(key, report);

        console.log('[QualityDataStore] 保存报告:', {
            projectId,
            key,
            checkTime: report.checkTime,
            qualityScore: report.summary.qualityScore,
            totalReports: this.reports.size
        });

        if (this.reports.size > this.maxReports) {
            const firstKey = this.reports.keys().next().value;
            if (firstKey) {
                this.reports.delete(firstKey);
            }
        }

        this.saveToStorage();
        this.broadcast('update', projectId);
        this.notifyListeners('update', projectId);
    }

    /**
     * 获取项目的所有报告
     */
    getReports(projectId: string): QualityReport[] {
        const reports: QualityReport[] = [];
        const prefix = projectId + '-';
        for (const [key, report] of this.reports.entries()) {
            if (key.startsWith(prefix)) {
                reports.push(report);
            }
        }

        console.log('[QualityDataStore] 获取报告:', {
            projectId,
            prefix,
            totalReportsInStore: this.reports.size,
            matchingReports: reports.length,
            sampleKeys: Array.from(this.reports.keys()).slice(0, 5) // 只打印前5个key用于调试
        });

        return reports.sort((a, b) =>
            new Date(b.checkTime).getTime() - new Date(a.checkTime).getTime() // 降序排列，最新的在前
        );
    }

    /**
     * 获取时间范围内的报告
     */
    getReportsByDateRange(projectId: string, start: Date, end: Date): QualityReport[] {
        return this.getReports(projectId).filter(report => {
            const checkTime = new Date(report.checkTime);
            return checkTime >= start && checkTime <= end;
        });
    }

    /**
     * 清除项目数据
     */
    clearProject(projectId: string): void {
        for (const key of this.reports.keys()) {
            if (key.startsWith(projectId)) {
                this.reports.delete(key);
            }
        }
        this.saveToStorage();
        this.broadcast('clear', projectId);
        this.notifyListeners('clear', projectId);
    }

    /**
     * 从本地存储加载
     */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem('quality-reports');
            if (data) {
                const parsed = JSON.parse(data);
                this.reports = new Map(Object.entries(parsed));
                console.log('[QualityDataStore] 从localStorage加载数据:', {
                    reportsCount: this.reports.size,
                    keys: Array.from(this.reports.keys())
                });
            } else {
                console.log('[QualityDataStore] localStorage中没有数据');
            }
        } catch (error) {
            console.error('[QualityDataStore] 加载数据失败:', error);
        }
    }

    /**
     * 保存到本地存储
     */
    private saveToStorage(): void {
        try {
            const data = Object.fromEntries(this.reports);
            localStorage.setItem('quality-reports', JSON.stringify(data));
            console.log('[QualityDataStore] 保存到localStorage:', {
                reportsCount: this.reports.size,
                dataSize: JSON.stringify(data).length
            });
        } catch (error) {
            console.error('[QualityDataStore] 保存数据失败:', error);
        }
    }
}

/**
 * 计算质量趋势
 */
export function calculateQualityTrend(reports: QualityReport[]): QualityTrendPoint[] {
    return reports.map(report => ({
        timestamp: report.checkTime,
        qualityScore: report.summary.qualityScore,
        errorCount: report.summary.errorCount,
        warningCount: report.summary.warningCount,
        infoCount: report.summary.infoCount,
        totalPanels: report.totalPanels
    }));
}

/**
 * 计算问题频率
 */
export function calculateIssueFrequency(reports: QualityReport[]): IssueFrequency[] {
    const typeCount = new Map<IssueType, { count: number; totalSeverity: number }>();
    let totalIssues = 0;

    // 统计每种类型的问题
    reports.forEach(report => {
        [...report.errors, ...report.warnings, ...report.infos].forEach(issue => {
            const current = typeCount.get(issue.type) || { count: 0, totalSeverity: 0 };
            current.count++;

            // 计算严重程度分数
            const severityScore = getSeverityScore(issue.severity);
            current.totalSeverity += severityScore;

            typeCount.set(issue.type, current);
            totalIssues++;
        });
    });

    // 转换为频率数组
    const frequencies: IssueFrequency[] = [];
    for (const [type, data] of typeCount.entries()) {
        frequencies.push({
            type,
            count: data.count,
            percentage: totalIssues > 0 ? (data.count / totalIssues) * 100 : 0,
            avgSeverity: data.count > 0 ? data.totalSeverity / data.count : 0
        });
    }

    // 按频率排序
    return frequencies.sort((a, b) => b.count - a.count);
}

/**
 * 获取最常见的问题
 */
export function getTopIssues(reports: QualityReport[], limit = 10): QualityIssue[] {
    const issueMap = new Map<string, { issue: QualityIssue; count: number }>();

    // 统计相同问题的出现次数
    reports.forEach(report => {
        [...report.errors, ...report.warnings, ...report.infos].forEach(issue => {
            const key = `${issue.type}-${issue.message}`;
            const current = issueMap.get(key);

            if (current) {
                current.count++;
            } else {
                issueMap.set(key, { issue, count: 1 });
            }
        });
    });

    // 转换为数组并排序
    const issues = Array.from(issueMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(item => item.issue);

    return issues;
}

/**
 * 生成改进建议
 */
export function generateImprovements(reports: QualityReport[]): QualityImprovement[] {
    const improvements: QualityImprovement[] = [];
    const issueFrequency = calculateIssueFrequency(reports);

    issueFrequency.forEach(freq => {
        if (freq.count === 0) return;

        let improvement: QualityImprovement | null = null;

        switch (freq.type) {
            case IssueTypeEnum.CONTINUITY:
                improvement = {
                    priority: freq.avgSeverity >= 2.5 ? 'high' : 'medium',
                    category: '连贯性',
                    issue: '镜头连贯性问题频繁出现',
                    suggestion: '注意景别变化、轴线规则和镜头节奏',
                    impact: '提升视觉流畅度和观看体验',
                    frequency: freq.count
                };
                break;

            case IssueTypeEnum.DURATION:
                improvement = {
                    priority: freq.avgSeverity >= 2.5 ? 'high' : 'medium',
                    category: '时长',
                    issue: '分镜时长设置不合理',
                    suggestion: '根据对话长度和画面内容调整时长',
                    impact: '改善节奏感和信息传达效率',
                    frequency: freq.count
                };
                break;

            case IssueTypeEnum.CHARACTER:
                improvement = {
                    priority: freq.avgSeverity >= 2.5 ? 'high' : 'medium',
                    category: '角色',
                    issue: '角色连续性问题',
                    suggestion: '添加角色进入/离开镜头，保持角色连续性',
                    impact: '提升叙事清晰度',
                    frequency: freq.count
                };
                break;

            case IssueTypeEnum.SHOT:
                improvement = {
                    priority: freq.avgSeverity >= 2.5 ? 'high' : 'medium',
                    category: '镜头',
                    issue: '镜头设置不完整',
                    suggestion: '添加建立镜头，完善必填字段',
                    impact: '提升专业性和完整性',
                    frequency: freq.count
                };
                break;

            case IssueTypeEnum.DIALOGUE:
                improvement = {
                    priority: 'low',
                    category: '对话',
                    issue: '对话格式问题',
                    suggestion: '控制对话长度，添加标点符号',
                    impact: '提升可读性',
                    frequency: freq.count
                };
                break;

            case IssueTypeEnum.LOGIC:
                improvement = {
                    priority: 'high',
                    category: '逻辑',
                    issue: '数据逻辑错误',
                    suggestion: '检查编号连续性和ID唯一性',
                    impact: '确保数据完整性',
                    frequency: freq.count
                };
                break;
        }

        if (improvement) {
            improvements.push(improvement);
        }
    });

    // 按优先级和频率排序
    return improvements.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : b.frequency - a.frequency;
    });
}

/**
 * 生成推荐建议
 */
export function generateRecommendations(reports: QualityReport[]): string[] {
    if (reports.length === 0) {
        return ['暂无数据，请先进行质量检查'];
    }

    const recommendations: string[] = [];
    const latestReport = reports[reports.length - 1];
    const avgScore = reports.reduce((sum, r) => sum + r.summary.qualityScore, 0) / reports.length;

    // 1. 总体质量评价
    if (avgScore >= 90) {
        recommendations.push('✅ 整体质量优秀，继续保持！');
    } else if (avgScore >= 70) {
        recommendations.push('⚠️ 整体质量良好，还有提升空间');
    } else {
        recommendations.push('❌ 整体质量需要改进，请关注高频问题');
    }

    // 2. 趋势分析
    if (reports.length >= 3) {
        const recentScores = reports.slice(-3).map(r => r.summary.qualityScore);
        const isImproving = recentScores[2] > recentScores[0];

        if (isImproving) {
            recommendations.push('📈 质量分数呈上升趋势，改进效果显著');
        } else {
            recommendations.push('📉 质量分数未见明显改善，建议重点关注常见问题');
        }
    }

    // 3. 错误建议
    if (latestReport.summary.errorCount > 0) {
        recommendations.push(`🔴 当前有 ${latestReport.summary.errorCount} 个严重错误，建议优先修复`);
    }

    // 4. 警告建议
    if (latestReport.summary.warningCount > 5) {
        recommendations.push(`🟡 警告数量较多（${latestReport.summary.warningCount}个），建议逐步优化`);
    }

    // 5. 具体改进建议
    const issueFreq = calculateIssueFrequency(reports);
    const topIssueType = issueFreq[0];

    if (topIssueType) {
        const typeNames = {
            [IssueTypeEnum.CONTINUITY]: '连贯性',
            [IssueTypeEnum.DURATION]: '时长',
            [IssueTypeEnum.CHARACTER]: '角色',
            [IssueTypeEnum.SHOT]: '镜头',
            [IssueTypeEnum.DIALOGUE]: '对话',
            [IssueTypeEnum.LOGIC]: '逻辑'
        };

        recommendations.push(
            `💡 最常见的问题是${typeNames[topIssueType.type]}问题（${topIssueType.percentage.toFixed(1)}%），建议重点关注`
        );
    }

    return recommendations;
}

/**
 * 生成完整的质量分析报告
 */
export function generateAnalysisReport(
    projectId: string,
    startDate?: Date,
    endDate?: Date
): QualityAnalysisReport {
    const store = QualityDataStore.getInstance();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 默认30天
    const end = endDate || new Date();

    const reports = store.getReportsByDateRange(projectId, start, end);

    if (reports.length === 0) {
        return {
            period: {
                start: start.toISOString(),
                end: end.toISOString()
            },
            summary: {
                totalChecks: 0,
                avgQualityScore: 0,
                totalIssues: 0,
                improvementRate: 0
            },
            trends: [],
            issueFrequency: [],
            topIssues: [],
            improvements: [],
            recommendations: ['暂无数据，请先进行质量检查']
        };
    }

    // 计算总结数据
    const totalChecks = reports.length;
    const avgQualityScore = reports.reduce((sum, r) => sum + r.summary.qualityScore, 0) / totalChecks;
    const totalIssues = reports.reduce((sum, r) => sum + r.totalIssues, 0);

    // 计算改进率
    let improvementRate = 0;
    if (reports.length >= 2) {
        const firstScore = reports[0].summary.qualityScore;
        const lastScore = reports[reports.length - 1].summary.qualityScore;
        improvementRate = ((lastScore - firstScore) / (100 - firstScore)) * 100;
    }

    return {
        period: {
            start: start.toISOString(),
            end: end.toISOString()
        },
        summary: {
            totalChecks,
            avgQualityScore: Math.round(avgQualityScore * 10) / 10,
            totalIssues,
            improvementRate: Math.round(improvementRate * 10) / 10
        },
        trends: calculateQualityTrend(reports),
        issueFrequency: calculateIssueFrequency(reports),
        topIssues: getTopIssues(reports),
        improvements: generateImprovements(reports),
        recommendations: generateRecommendations(reports)
    };
}

/**
 * 保存质量报告
 */
export function saveQualityReport(projectId: string, report: QualityReport): void {
    const store = QualityDataStore.getInstance();
    store.saveReport(projectId, report);
}

/**
 * 获取质量报告历史
 */
export function getQualityHistory(projectId: string): QualityReport[] {
    const store = QualityDataStore.getInstance();
    return store.getReports(projectId);
}

/**
 * 清除项目数据
 */
export function clearProjectData(projectId: string): void {
    const store = QualityDataStore.getInstance();
    store.clearProject(projectId);
}

/**
 * 导出分析报告为JSON
 */
export function exportAnalysisReport(report: QualityAnalysisReport): string {
    return JSON.stringify(report, null, 2);
}

/**
 * 导出分析报告为CSV
 */
export function exportAnalysisReportCSV(report: QualityAnalysisReport): string {
    const lines: string[] = [];

    // 标题
    lines.push('质量分析报告');
    lines.push('');

    // 总结
    lines.push('总结');
    lines.push('检查次数,平均质量分数,总问题数,改进率');
    lines.push(
        `${report.summary.totalChecks},${report.summary.avgQualityScore},${report.summary.totalIssues},${report.summary.improvementRate}%`
    );
    lines.push('');

    // 趋势
    lines.push('质量趋势');
    lines.push('时间,质量分数,错误数,警告数,提示数,分镜数');
    report.trends.forEach(point => {
        lines.push(
            `${point.timestamp},${point.qualityScore},${point.errorCount},${point.warningCount},${point.infoCount},${point.totalPanels}`
        );
    });
    lines.push('');

    // 问题频率
    lines.push('问题频率');
    lines.push('类型,数量,百分比,平均严重程度');
    report.issueFrequency.forEach(freq => {
        lines.push(
            `${freq.type},${freq.count},${freq.percentage.toFixed(1)}%,${freq.avgSeverity.toFixed(2)}`
        );
    });

    return lines.join('\n');
}

/**
 * 订阅质量数据更新
 * 用于实时更新 UI
 */
export function subscribeToQualityUpdates(
    callback: (event: 'update' | 'clear', projectId?: string) => void
): () => void {
    const store = QualityDataStore.getInstance();
    return store.subscribe(callback);
}

/**
 * 质量对比结果
 */
export interface QualityComparison {
    period1: {
        start: string;
        end: string;
        avgScore: number;
        totalIssues: number;
        checkCount: number;
    };
    period2: {
        start: string;
        end: string;
        avgScore: number;
        totalIssues: number;
        checkCount: number;
    };
    scoreDiff: number; // 分数变化
    issueDiff: number; // 问题数变化
    improvementPercent: number; // 改进百分比
    verdict: 'improved' | 'declined' | 'stable';
}

/**
 * 比较两个时间段的质量数据
 */
export function compareQualityPeriods(
    projectId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
): QualityComparison {
    const store = QualityDataStore.getInstance();

    const reports1 = store.getReportsByDateRange(projectId, period1Start, period1End);
    const reports2 = store.getReportsByDateRange(projectId, period2Start, period2End);

    const calcAvg = (reports: QualityReport[]) => {
        if (reports.length === 0) return 0;
        return Math.round(reports.reduce((sum, r) => sum + r.summary.qualityScore, 0) / reports.length);
    };

    const calcIssues = (reports: QualityReport[]) => {
        return reports.reduce((sum, r) => sum + r.summary.errorCount + r.summary.warningCount + r.summary.infoCount, 0);
    };

    const avg1 = calcAvg(reports1);
    const avg2 = calcAvg(reports2);
    const issues1 = calcIssues(reports1);
    const issues2 = calcIssues(reports2);

    const scoreDiff = avg2 - avg1;
    const issueDiff = issues2 - issues1;
    const improvementPercent = avg1 > 0 ? Math.round((scoreDiff / avg1) * 100) : 0;

    let verdict: 'improved' | 'declined' | 'stable' = 'stable';
    if (scoreDiff > 5) verdict = 'improved';
    else if (scoreDiff < -5) verdict = 'declined';

    return {
        period1: {
            start: period1Start.toISOString(),
            end: period1End.toISOString(),
            avgScore: avg1,
            totalIssues: issues1,
            checkCount: reports1.length
        },
        period2: {
            start: period2Start.toISOString(),
            end: period2End.toISOString(),
            avgScore: avg2,
            totalIssues: issues2,
            checkCount: reports2.length
        },
        scoreDiff,
        issueDiff,
        improvementPercent,
        verdict
    };
}

