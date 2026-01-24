/**
 * 质量报告侧边栏组件
 * 在分镜编辑器中显示质量检查结果
 */
import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { QualityReportPanel } from './QualityReportPanel';
import { QualityIssueList } from './QualityIssueList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { QualityReport, QualityIssue } from '../../utils/ai/qualityChecker';
import type { OptimizationResult } from '../../utils/ai/autoOptimizer';

interface QualityReportSidebarProps {
  report: QualityReport | null;
  onClose: () => void;
  onRefresh?: () => void;
  onIssueClick?: (issue: QualityIssue) => void;
  onOptimize?: (selectedIssues: QualityIssue[]) => Promise<OptimizationResult[]>; // 🆕 优化回调
  isRefreshing?: boolean;
  projectId?: string; // 🆕 用于数据分析
}

export function QualityReportSidebar({
  report,
  onClose,
  onRefresh,
  onIssueClick,
  onOptimize, // 🆕
  isRefreshing = false,
  projectId // 🆕
}: QualityReportSidebarProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'issues'>('report');

  // 收集所有问题
  const allIssues = report
    ? [...report.errors, ...report.warnings, ...report.infos]
    : [];

  return (
    <div className="w-[400px] h-full bg-white border-l shadow-lg flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-lg">质量报告</h3>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-hidden">
        {report ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'report' | 'issues')} className="h-full flex flex-col">
            <TabsList className="w-full grid grid-cols-2 mx-4 mt-4">
              <TabsTrigger value="report">总览</TabsTrigger>
              <TabsTrigger value="issues">
                问题列表 ({allIssues.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="report" className="mt-0">
                <QualityReportPanel 
                  report={report} 
                  onIssueClick={onIssueClick}
                  projectId={projectId} // 🆕 传递projectId
                />
              </TabsContent>

              <TabsContent value="issues" className="mt-0">
                <QualityIssueList
                  issues={allIssues}
                  onIssueClick={onIssueClick}
                  onOptimize={onOptimize} // 🆕 传递优化回调
                  showFilters={true}
                />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="p-4">
            <QualityReportPanel report={null} />
          </div>
        )}
      </div>
    </div>
  );
}
