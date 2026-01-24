/**
 * 质量问题列表组件
 * 显示质量检查发现的问题，支持筛选和跳转
 */
import React, { useState, useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info, Filter, Search, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { AutoOptimizeButton } from './AutoOptimizeButton';
import type { QualityIssue, IssueSeverity, IssueType } from '../../utils/ai/qualityChecker';
import type { OptimizationResult } from '../../utils/ai/autoOptimizer';

interface QualityIssueListProps {
  issues: QualityIssue[];
  onIssueClick?: (issue: QualityIssue) => void;
  showFilters?: boolean;
  onOptimize?: (selectedIssues: QualityIssue[]) => Promise<OptimizationResult[]>; // 🆕 优化回调
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
  prompt: '提示词'
};

/**
 * 严重程度中文映射
 */
const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  error: '错误',
  warning: '警告',
  info: '提示'
};

/**
 * 获取严重程度图标
 */
function getSeverityIcon(severity: IssueSeverity, className?: string) {
  switch (severity) {
    case 'error':
      return <AlertCircle className={className || 'w-4 h-4 text-red-500'} />;
    case 'warning':
      return <AlertTriangle className={className || 'w-4 h-4 text-yellow-500'} />;
    case 'info':
      return <Info className={className || 'w-4 h-4 text-blue-500'} />;
  }
}

/**
 * 获取严重程度徽章
 */
function getSeverityBadge(severity: IssueSeverity) {
  switch (severity) {
    case 'error':
      return <Badge variant="destructive" className="text-xs">错误</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">警告</Badge>;
    case 'info':
      return <Badge variant="secondary" className="text-xs">提示</Badge>;
  }
}

/**
 * 质量问题列表
 */
export function QualityIssueList({ issues, onIssueClick, showFilters = true, onOptimize }: QualityIssueListProps) {
  const [searchText, setSearchText] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | 'all'>('all');
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all');

  // 筛选问题
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // 搜索文本筛选
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchMessage = issue.message.toLowerCase().includes(searchLower);
        const matchSuggestion = issue.suggestion?.toLowerCase().includes(searchLower);
        const matchPanel = issue.panelNumber.toString().includes(searchText);
        if (!matchMessage && !matchSuggestion && !matchPanel) {
          return false;
        }
      }

      // 严重程度筛选
      if (filterSeverity !== 'all' && issue.severity !== filterSeverity) {
        return false;
      }

      // 类型筛选
      if (filterType !== 'all' && issue.type !== filterType) {
        return false;
      }

      return true;
    });
  }, [issues, searchText, filterSeverity, filterType]);

  // 统计信息
  const stats = useMemo(() => {
    const counts = {
      error: 0,
      warning: 0,
      info: 0
    };
    issues.forEach(issue => {
      counts[issue.severity]++;
    });
    return counts;
  }, [issues]);

  // 清除筛选
  const clearFilters = () => {
    setSearchText('');
    setFilterSeverity('all');
    setFilterType('all');
  };

  const hasActiveFilters = searchText || filterSeverity !== 'all' || filterType !== 'all';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              问题列表
            </CardTitle>
            <CardDescription>
              共 {issues.length} 个问题
              {filteredIssues.length !== issues.length && ` (筛选后 ${filteredIssues.length} 个)`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {stats.error}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
              <AlertTriangle className="w-3 h-3" />
              {stats.warning}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Info className="w-3 h-3" />
              {stats.info}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 🆕 一键优化按钮 */}
        {onOptimize && issues.length > 0 && (
          <AutoOptimizeButton
            issues={issues}
            onOptimize={onOptimize}
          />
        )}

        {/* 筛选器 */}
        {showFilters && (
          <div className="space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索问题描述、建议或分镜编号..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 筛选条件 */}
            <div className="flex gap-2">
              <Select value={filterSeverity} onValueChange={(v) => setFilterSeverity(v as IssueSeverity | 'all')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="严重程度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部程度</SelectItem>
                  <SelectItem value="error">错误</SelectItem>
                  <SelectItem value="warning">警告</SelectItem>
                  <SelectItem value="info">提示</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={(v) => setFilterType(v as IssueType | 'all')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="问题类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="continuity">连贯性</SelectItem>
                  <SelectItem value="duration">时长</SelectItem>
                  <SelectItem value="character">角色</SelectItem>
                  <SelectItem value="shot">镜头</SelectItem>
                  <SelectItem value="dialogue">对话</SelectItem>
                  <SelectItem value="prompt">提示词</SelectItem>
                  <SelectItem value="logic">逻辑</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="w-3 h-3" />
                  清除
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 问题列表 */}
        <ScrollArea className="h-[500px] pr-4">
          {filteredIssues.length > 0 ? (
            <div className="space-y-2">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 rounded-lg border transition-all ${
                    onIssueClick
                      ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                      : ''
                  }`}
                  onClick={() => onIssueClick?.(issue)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                    <div className="flex-1 min-w-0">
                      {/* 标签行 */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getSeverityBadge(issue.severity)}
                        <Badge variant="outline" className="text-xs">
                          {ISSUE_TYPE_LABELS[issue.type] || issue.type}
                        </Badge>
                        {issue.panelNumber > 0 && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            分镜 #{issue.panelNumber}
                          </Badge>
                        )}
                      </div>

                      {/* 问题描述 */}
                      <p className="text-sm font-medium text-gray-900 mb-2 leading-relaxed">
                        {issue.message}
                      </p>

                      {/* 修复建议 */}
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
              {hasActiveFilters ? (
                <>
                  <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-2">没有符合筛选条件的问题</p>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    清除筛选条件
                  </Button>
                </>
              ) : (
                <>
                  <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>没有发现问题</p>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
