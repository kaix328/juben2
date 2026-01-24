/**
 * 质量报告面板组件
 * 显示分镜质量检查结果
 */
import React, { useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { QualityAnalyticsPanel } from '../analytics/QualityAnalyticsPanel';
import type { QualityReport, QualityIssue, IssueSeverity } from '../../utils/ai/qualityChecker';

interface QualityReportPanelProps {
  report: QualityReport | null;
  onIssueClick?: (issue: QualityIssue) => void;
  projectId?: string; // 🆕 用于数据分析
}

/**
 * 获取质量等级
 */
function getQualityGrade(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 90) return { label: '优秀', color: 'text-green-600', bgColor: 'bg-green-50' };
  if (score >= 80) return { label: '良好', color: 'text-blue-600', bgColor: 'bg-blue-50' };
  if (score >= 70) return { label: '中等', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
  if (score >= 60) return { label: '及格', color: 'text-orange-600', bgColor: 'bg-orange-50' };
  return { label: '需改进', color: 'text-red-600', bgColor: 'bg-red-50' };
}

/**
 * 获取严重程度图标
 */
function getSeverityIcon(severity: IssueSeverity) {
  switch (severity) {
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'info':
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

/**
 * 获取严重程度标签
 */
function getSeverityBadge(severity: IssueSeverity) {
  switch (severity) {
    case 'error':
      return <Badge variant="destructive">错误</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">警告</Badge>;
    case 'info':
      return <Badge variant="secondary">提示</Badge>;
  }
}

/**
 * 问题类型中文映射
 */
const ISSUE_TYPE_LABELS: Record<string, string> = {
  continuity: '连贯性',
  duration: '时长',
  character: '角色',
  shot: '镜头',
  dialogue: '对话',
  logic: '逻辑',
  prompt: '提示词',
};

/**
 * 问题项组件
 */
function IssueItem({ issue, onClick }: { issue: QualityIssue; onClick?: (issue: QualityIssue) => void }) {
  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={() => onClick?.(issue)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getSeverityBadge(issue.severity)}
            <Badge variant="outline" className="text-xs">
              {ISSUE_TYPE_LABELS[issue.type] || issue.type}
            </Badge>
            {issue.panelNumber > 0 && (
              <span className="text-xs text-gray-500">分镜 #{issue.panelNumber}</span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">{issue.message}</p>
          {issue.suggestion && (
            <p className="text-xs text-gray-600">💡 {issue.suggestion}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 质量报告面板
 */
export function QualityReportPanel({ report, onIssueClick, projectId }: QualityReportPanelProps) {
  // 如果没有报告，显示空状态
  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            质量报告
          </CardTitle>
          <CardDescription>生成分镜后将自动进行质量检查</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无质量报告</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary } = report;
  const grade = getQualityGrade(summary.qualityScore);

  // 统计各类型问题数量
  const issuesByType = useMemo(() => {
    const counts: Record<string, number> = {
      continuity: 0,
      duration: 0,
      character: 0,
      shot: 0,
      dialogue: 0,
      logic: 0
    };
    
    [...report.errors, ...report.warnings, ...report.infos].forEach(issue => {
      counts[issue.type] = (counts[issue.type] || 0) + 1;
    });
    
    return counts;
  }, [report]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          质量报告
        </CardTitle>
        <CardDescription>
          共检查 {report.totalPanels} 个分镜，发现 {report.totalIssues} 个问题
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 质量分数 */}
        <div className={`p-4 rounded-lg ${grade.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">质量分数</span>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${grade.color}`}>
                {summary.qualityScore}
              </span>
              <span className="text-gray-500">/100</span>
            </div>
          </div>
          <Progress value={summary.qualityScore} className="h-2 mb-2" />
          <div className="flex items-center justify-between">
            <Badge className={grade.bgColor + ' ' + grade.color}>{grade.label}</Badge>
            {summary.qualityScore >= 80 ? (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>质量良好</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <TrendingDown className="w-3 h-3" />
                <span>建议优化</span>
              </div>
            )}
          </div>
        </div>

        {/* 问题统计 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-700">错误</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{summary.errorCount}</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-700">警告</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{summary.warningCount}</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">提示</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{summary.infoCount}</div>
          </div>
        </div>

        {/* 问题分类统计 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">问题分布</h4>
          <div className="space-y-2">
            {Object.entries(issuesByType).map(([type, count]) => (
              count > 0 && (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{ISSUE_TYPE_LABELS[type]}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              )
            ))}
          </div>
        </div>

        {/* 问题列表和数据分析 */}
        {report.totalIssues > 0 && (
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="errors" className="gap-1">
                错误 <Badge variant="secondary" className="ml-1">{summary.errorCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="warnings" className="gap-1">
                警告 <Badge variant="secondary" className="ml-1">{summary.warningCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="infos" className="gap-1">
                提示 <Badge variant="secondary" className="ml-1">{summary.infoCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1">
                <BarChart3 className="w-4 h-4" />
                数据分析
              </TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {report.errors.length > 0 ? (
                  <div className="space-y-2">
                    {report.errors.map((issue, index) => (
                      <IssueItem key={`error-${issue.id}-${index}`} issue={issue} onClick={onIssueClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p>没有错误 🎉</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="warnings" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {report.warnings.length > 0 ? (
                  <div className="space-y-2">
                    {report.warnings.map((issue, index) => (
                      <IssueItem key={`warning-${issue.id}-${index}`} issue={issue} onClick={onIssueClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p>没有警告 👍</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="infos" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {report.infos.length > 0 ? (
                  <div className="space-y-2">
                    {report.infos.map((issue, index) => (
                      <IssueItem key={`info-${issue.id}-${index}`} issue={issue} onClick={onIssueClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>没有提示信息</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* 🆕 数据分析标签页 */}
            <TabsContent value="analytics" className="mt-4">
              {projectId ? (
                <QualityAnalyticsPanel projectId={projectId} className="border-0 shadow-none" />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>无法加载数据分析</p>
                  <p className="text-xs mt-2">项目ID未提供</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* 检查时间 */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          检查时间: {new Date(report.checkTime).toLocaleString('zh-CN')}
        </div>
      </CardContent>
    </Card>
  );
}
