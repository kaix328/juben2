/**
 * 数据分析仪表盘
 * 提供项目统计、进度追踪、质量分析等功能
 */

import React, { useMemo } from 'react';
import type { StoryboardPanel, StoryboardAnalytics } from '../types';
import type { QualityAnalysisReport } from '../utils/analytics/qualityAnalytics';
import {
  calculateStoryboardAnalytics,
  generateAnalyticSuggestions
} from '../utils/projectStats';

// ============ 仪表盘组件 ============

interface DashboardProps {
  panels: StoryboardPanel[];
  qualityReport?: QualityAnalysisReport | null;
  className?: string;
}

export const AnalyticsDashboard: React.FC<DashboardProps> = ({
  panels,
  qualityReport,
  className = ''
}) => {
  const stats: StoryboardAnalytics = useMemo(() => calculateStoryboardAnalytics(panels), [panels]);
  const suggestions = useMemo(() => generateAnalyticSuggestions(stats), [stats]);

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
  };

  // 获取景别颜色
  const getShotColor = (_: string, index: number) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-500">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📊</span>
          项目分析仪表盘
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* 概览卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalPanels}</div>
            <div className="text-sm text-blue-500">总分镜数</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalScenes}</div>
            <div className="text-sm text-green-500">场景数</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600">{formatDuration(stats.totalDuration)}</div>
            <div className="text-sm text-purple-500">总时长</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.totalCharacters}</div>
            <div className="text-sm text-orange-500">角色数</div>
          </div>
        </div>

        {/* 🆕 深度质量分析报告 */}
        {qualityReport && (
          <div className="p-4 bg-slate-50 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span>🩺</span>
              深度质量诊断
              {qualityReport.summary.totalChecks > 0 && (
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (基于 {qualityReport.summary.totalChecks} 次检查)
                </span>
              )}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-white rounded border text-center">
                <div className="text-2xl font-bold text-indigo-600">{qualityReport.summary.avgQualityScore}</div>
                <div className="text-xs text-gray-500">平均质量分</div>
              </div>
              <div className="p-3 bg-white rounded border text-center">
                <div className="text-2xl font-bold text-pink-600">{qualityReport.summary.totalIssues}</div>
                <div className="text-xs text-gray-500">发现问题总数</div>
              </div>
              <div className="p-3 bg-white rounded border text-center">
                <div className={`text-2xl font-bold ${qualityReport.summary.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {qualityReport.summary.improvementRate >= 0 ? '+' : ''}{qualityReport.summary.improvementRate}%
                </div>
                <div className="text-xs text-gray-500">质量改善率</div>
              </div>
            </div>

            {qualityReport.recommendations.length > 0 && (
              <div className="space-y-2">
                {qualityReport.recommendations.slice(0, 3).map((rec, i) => (
                  <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span>•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}

            {qualityReport.topIssues.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <div className="text-xs font-medium text-gray-500 mb-2">高频问题 TOP 3</div>
                <div className="space-y-2">
                  {qualityReport.topIssues.slice(0, 3).map((issue, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-white ${issue.severity === 'error' ? 'bg-red-500' :
                          issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-400'
                        }`}>
                        {issue.type}
                      </span>
                      <span className="text-gray-600 truncate">{issue.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 进度条 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">项目完成度</span>
            <span className="text-lg font-bold text-blue-600">{stats.completionRate.toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>已完成: {stats.completedPanels}</span>
            <span>有图片: {stats.panelsWithImages}</span>
            <span>有对白: {stats.panelsWithDialogue}</span>
          </div>
        </div>

        {/* 质量评分 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">节奏评分</span>
              <span className={`text-lg font-bold ${stats.rhythmScore >= 70 ? 'text-green-600' :
                  stats.rhythmScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                {stats.rhythmScore.toFixed(0)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${stats.rhythmScore >= 70 ? 'bg-green-500' :
                    stats.rhythmScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                style={{ width: `${stats.rhythmScore}%` }}
              />
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">多样性评分</span>
              <span className={`text-lg font-bold ${stats.diversityScore >= 70 ? 'text-green-600' :
                  stats.diversityScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                {stats.diversityScore.toFixed(0)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${stats.diversityScore >= 70 ? 'bg-green-500' :
                    stats.diversityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                style={{ width: `${stats.diversityScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 景别分布 */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">景别分布</h4>
            <div className="space-y-2">
              {Object.entries(stats.shotDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([shot, count], index) => {
                  const percentage = (count / stats.totalPanels) * 100;
                  return (
                    <div key={shot} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-gray-600 truncate" title={shot}>{shot}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getShotColor(shot, index)
                          }}
                        />
                      </div>
                      <span className="w-12 text-sm text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 🆕 镜头运动分布 */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">运镜分布</h4>
            <div className="space-y-2">
              {Object.entries(stats.cameraMovementDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([move, count]) => {
                  const percentage = (count / stats.totalPanels) * 100;
                  const moveName = move === 'STATIC' ? '静止' : move.replace('_', ' ');
                  return (
                    <div key={move} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-gray-600 truncate" title={move}>{moveName}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-indigo-500"
                          style={{
                            width: `${percentage}%`,
                            opacity: 0.5 + (0.5 * (count / Math.max(...Object.values(stats.cameraMovementDistribution))))
                          }}
                        />
                      </div>
                      <span className="w-12 text-sm text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 🆕 对白分析 & 时长分布 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 时长分布 */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">时长分布</h4>
            <div className="flex items-end justify-around h-32">
              {[
                { label: '短 (<2s)', value: stats.durationDistribution.short, color: 'bg-blue-500' },
                { label: '中 (2-5s)', value: stats.durationDistribution.medium, color: 'bg-green-500' },
                { label: '长 (>5s)', value: stats.durationDistribution.long, color: 'bg-orange-500' }
              ].map(item => {
                const maxValue = Math.max(
                  stats.durationDistribution.short,
                  stats.durationDistribution.medium,
                  stats.durationDistribution.long
                );
                const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                return (
                  <div key={item.label} className="flex flex-col items-center gap-2">
                    <span className="text-sm font-medium">{item.value}</span>
                    <div
                      className={`w-16 ${item.color} rounded-t-lg transition-all`}
                      style={{ height: `${height}%`, minHeight: item.value > 0 ? '8px' : '0' }}
                    />
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 对白分析 */}
          <div className="p-4 border rounded-lg flex flex-col justify-center">
            <h4 className="font-medium mb-4">对白 vs 画面</h4>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-4 border-blue-500 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl font-bold text-blue-600">{stats.dialogueStats.hasDialogue}</span>
                </div>
                <div className="text-sm text-gray-600">有对白</div>
              </div>
              <div className="text-2xl font-bold text-gray-300">VS</div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-4 border-gray-300 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl font-bold text-gray-500">{stats.dialogueStats.silent}</span>
                </div>
                <div className="text-sm text-gray-600">纯画面</div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              对白占比: <span className="font-medium text-gray-900">{stats.dialogueStats.dialogueRatio.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 智能建议 */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <span>💡</span>
            智能建议
          </h4>
          {suggestions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              暂无建议，项目状态良好！
            </p>
          ) : (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-start gap-3 ${suggestion.type === 'success' ? 'bg-green-50' :
                      suggestion.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                    }`}
                >
                  <span className="text-lg">
                    {suggestion.type === 'success' ? '✅' :
                      suggestion.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${suggestion.type === 'success' ? 'bg-green-200 text-green-700' :
                          suggestion.type === 'warning' ? 'bg-yellow-200 text-yellow-700' :
                            'bg-blue-200 text-blue-700'
                        }`}>
                        {suggestion.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{suggestion.message}</p>
                    {suggestion.action && (
                      <p className="text-xs text-gray-500 mt-1">
                        建议: {suggestion.action}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
