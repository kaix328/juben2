/**
 * 分镜连贯性检测面板
 * 显示连贯性检测结果和建议
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  continuityChecker, 
  ContinuityReport, 
  ContinuityIssue,
  ContinuityRule,
  getSeverityColor,
  getSeverityIcon,
  formatReportAsText
} from '../utils/continuityChecker';
import type { StoryboardPanel } from '../types';

interface ContinuityPanelProps {
  panels: StoryboardPanel[];
  onPanelSelect?: (panelId: string) => void;
  className?: string;
}

export const ContinuityPanel: React.FC<ContinuityPanelProps> = ({
  panels,
  onPanelSelect,
  className = ''
}) => {
  const [report, setReport] = useState<ContinuityReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [rules, setRules] = useState<ContinuityRule[]>(continuityChecker.getRules());

  // 执行检测
  const runCheck = useCallback(async () => {
    setIsChecking(true);
    
    // 模拟异步处理（实际检测很快，但给用户反馈）
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = continuityChecker.checkAllPanels(panels);
    setReport(result);
    setIsChecking(false);
  }, [panels]);

  // 过滤问题
  const filteredIssues = useMemo(() => {
    if (!report) return [];
    if (selectedSeverity === 'all') return report.issues;
    return report.issues.filter(i => i.severity === selectedSeverity);
  }, [report, selectedSeverity]);

  // 切换规则启用状态
  const toggleRule = useCallback((ruleId: string) => {
    continuityChecker.setRuleEnabled(
      ruleId, 
      !rules.find(r => r.id === ruleId)?.enabled
    );
    setRules([...continuityChecker.getRules()]);
  }, [rules]);

  // 导出报告
  const exportReport = useCallback(() => {
    if (!report) return;
    
    const text = formatReportAsText(report);
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `continuity-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // 获取评分等级
  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', label: '优秀' };
    if (score >= 80) return { grade: 'B', label: '良好' };
    if (score >= 70) return { grade: 'C', label: '中等' };
    if (score >= 60) return { grade: 'D', label: '及格' };
    return { grade: 'F', label: '需改进' };
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            分镜连贯性检测
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="检测设置"
            >
              ⚙️
            </button>
            {report && (
              <button
                onClick={exportReport}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="导出报告"
              >
                📥
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={runCheck}
          disabled={isChecking || panels.length === 0}
          className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all ${
            isChecking 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg'
          }`}
        >
          {isChecking ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              检测中...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🔍</span>
              开始检测 ({panels.length} 个分镜)
            </span>
          )}
        </button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="p-4 border-b bg-gray-50">
          <h4 className="font-medium mb-3 text-sm text-gray-700">检测规则设置</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {rules.map(rule => (
              <label 
                key={rule.id}
                className="flex items-start gap-3 p-2 rounded hover:bg-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleRule(rule.id)}
                  className="mt-1 rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{rule.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      rule.severity === 'error' ? 'bg-red-100 text-red-600' :
                      rule.severity === 'warning' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {rule.severity === 'error' ? '错误' : 
                       rule.severity === 'warning' ? '警告' : '提示'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 结果展示 */}
      {report && (
        <>
          {/* 评分卡片 */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-6">
              {/* 评分圆环 */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={report.score >= 70 ? '#22c55e' : report.score >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${report.score * 2.51} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${getScoreColor(report.score)}`}>
                    {report.score}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getScoreGrade(report.score).label}
                  </span>
                </div>
              </div>
              
              {/* 统计信息 */}
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{report.summary.errors}</div>
                  <div className="text-xs text-red-500">错误</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{report.summary.warnings}</div>
                  <div className="text-xs text-orange-500">警告</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{report.summary.infos}</div>
                  <div className="text-xs text-blue-500">提示</div>
                </div>
              </div>
            </div>
          </div>

          {/* 过滤器 */}
          <div className="px-4 py-2 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">筛选:</span>
              {['all', 'error', 'warning', 'info'].map(severity => (
                <button
                  key={severity}
                  onClick={() => setSelectedSeverity(severity)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedSeverity === severity
                      ? severity === 'all' ? 'bg-gray-700 text-white' :
                        severity === 'error' ? 'bg-red-500 text-white' :
                        severity === 'warning' ? 'bg-orange-500 text-white' :
                        'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {severity === 'all' ? '全部' :
                   severity === 'error' ? '错误' :
                   severity === 'warning' ? '警告' : '提示'}
                  {severity !== 'all' && (
                    <span className="ml-1">
                      ({severity === 'error' ? report.summary.errors :
                        severity === 'warning' ? report.summary.warnings :
                        report.summary.infos})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 问题列表 */}
          <div className="max-h-96 overflow-y-auto">
            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl mb-2 block">✅</span>
                <p>没有发现问题，分镜连贯性良好！</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredIssues.map(issue => (
                  <div
                    key={issue.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      expandedIssue === issue.id ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => setExpandedIssue(
                      expandedIssue === issue.id ? null : issue.id
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getSeverityIcon(issue.severity)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="text-sm font-medium text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPanelSelect?.(issue.panelId);
                            }}
                          >
                            分镜 #{issue.panelNumber}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(issue.severity)}`}>
                            {issue.ruleName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{issue.message}</p>
                        
                        {/* 展开详情 */}
                        {expandedIssue === issue.id && (
                          <div className="mt-3 p-3 bg-white rounded-lg border">
                            <div className="flex items-start gap-2">
                              <span className="text-green-500">💡</span>
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">建议</p>
                                <p className="text-sm text-gray-600">{issue.suggestion}</p>
                              </div>
                            </div>
                            {issue.relatedPanels && issue.relatedPanels.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <span className="text-xs text-gray-500">
                                  相关分镜: {issue.relatedPanels.map((id, idx) => (
                                    <button
                                      key={id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onPanelSelect?.(id);
                                      }}
                                      className="text-blue-500 hover:underline ml-1"
                                    >
                                      #{panels.find(p => p.id === id)?.panelNumber || '?'}
                                    </button>
                                  ))}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className={`text-gray-400 transition-transform ${
                        expandedIssue === issue.id ? 'rotate-180' : ''
                      }`}>
                        ▼
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 空状态 */}
      {!report && !isChecking && (
        <div className="p-8 text-center text-gray-500">
          <span className="text-4xl mb-3 block">🎯</span>
          <p className="mb-2">点击上方按钮开始检测</p>
          <p className="text-sm">系统将自动分析分镜的连贯性问题</p>
        </div>
      )}
    </div>
  );
};

export default ContinuityPanel;
