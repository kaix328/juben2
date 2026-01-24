/**
 * 连贯性检查报告对话框
 * 显示分镜连贯性检查结果
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import type { ContinuityReport, ContinuityIssue } from '../../../utils/continuityChecker';

interface ContinuityReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ContinuityReport | null;
  onIssueClick?: (issue: ContinuityIssue) => void;
}

/**
 * 获取严重程度图标
 */
function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'info':
      return <Info className="w-4 h-4 text-blue-500" />;
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
}

/**
 * 获取严重程度徽章
 */
function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'error':
      return <Badge variant="destructive" className="text-xs">错误</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">警告</Badge>;
    case 'info':
      return <Badge variant="secondary" className="text-xs">提示</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{severity}</Badge>;
  }
}

/**
 * 连贯性报告对话框
 */
export function ContinuityReportDialog({
  open,
  onOpenChange,
  report,
  onIssueClick,
}: ContinuityReportDialogProps) {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            连贯性检查报告
          </DialogTitle>
          <DialogDescription>
            检查了 {report.checkedPanels} 个分镜，发现 {report.issues.length} 个问题
          </DialogDescription>
        </DialogHeader>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-700">错误</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{report.summary.errors}</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-700">警告</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{report.summary.warnings}</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">提示</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{report.summary.infos}</div>
          </div>
        </div>

        {/* 问题列表 */}
        <ScrollArea className="h-[400px] pr-4">
          {report.issues.length > 0 ? (
            <div className="space-y-2">
              {report.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    onIssueClick ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300' : ''
                  }`}
                  onClick={() => onIssueClick?.(issue)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getSeverityBadge(issue.severity)}
                        <Badge variant="outline" className="text-xs">
                          {issue.ruleName}
                        </Badge>
                        {issue.panelNumber > 0 && (
                          <span className="text-xs text-gray-500">
                            分镜 #{issue.panelNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2 leading-relaxed">
                        {issue.message}
                      </p>
                      {issue.suggestion && (
                        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded text-xs text-blue-800 border border-blue-100">
                          <span className="shrink-0">💡</span>
                          <span className="leading-relaxed">{issue.suggestion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
              <p className="text-lg font-medium mb-1">未发现连贯性问题 🎉</p>
              <p className="text-sm">分镜连贯性良好，符合专业制作标准</p>
            </div>
          )}
        </ScrollArea>

        {/* 检查规则说明 */}
        <div className="p-3 bg-gray-50 rounded-lg border text-xs text-gray-600">
          <p className="font-medium mb-1">检查规则包括：</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>轴线规则 - 确保镜头方向一致性</li>
            <li>30度规则 - 避免跳切和视觉不连贯</li>
            <li>景别跳跃 - 检查镜头切换是否合理</li>
            <li>时长合理性 - 确保每个镜头时长适当</li>
            <li>角色连贯性 - 检查角色出现的逻辑性</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
