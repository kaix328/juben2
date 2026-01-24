/**
 * 问题热力图组件
 * 按分镜编号显示问题密度
 */
import React, { useMemo } from 'react';
import type { QualityIssue } from '../../utils/ai/qualityChecker';

interface IssueHeatmapProps {
    issues: QualityIssue[];
    maxPanelNumber?: number;
    onPanelClick?: (panelNumber: number) => void;
    className?: string;
}

export function IssueHeatmap({
    issues,
    maxPanelNumber = 100,
    onPanelClick,
    className = ''
}: IssueHeatmapProps) {
    // 计算每个分镜的问题密度
    const heatmapData = useMemo(() => {
        const densityMap = new Map<number, { count: number; severity: number }>();

        issues.forEach(issue => {
            if (issue.panelNumber !== undefined) {
                const existing = densityMap.get(issue.panelNumber) || { count: 0, severity: 0 };
                const severityScore = issue.severity === 'error' ? 3 : issue.severity === 'warning' ? 2 : 1;
                densityMap.set(issue.panelNumber, {
                    count: existing.count + 1,
                    severity: Math.max(existing.severity, severityScore)
                });
            }
        });

        return densityMap;
    }, [issues]);

    // 获取实际的最大分镜号
    const actualMaxPanel = useMemo(() => {
        let max = 0;
        issues.forEach(issue => {
            if (issue.panelNumber && issue.panelNumber > max) {
                max = issue.panelNumber;
            }
        });
        return Math.min(Math.max(max, 10), maxPanelNumber);
    }, [issues, maxPanelNumber]);

    // 生成分镜格子
    const cells = useMemo(() => {
        const result: Array<{
            panelNumber: number;
            count: number;
            severity: number;
            color: string;
        }> = [];

        for (let i = 1; i <= actualMaxPanel; i++) {
            const data = heatmapData.get(i);
            const count = data?.count || 0;
            const severity = data?.severity || 0;

            // 根据问题数量和严重程度计算颜色
            let color = 'bg-gray-100'; // 无问题
            if (count > 0) {
                if (severity === 3) { // 有错误
                    color = count >= 3 ? 'bg-red-600' : count >= 2 ? 'bg-red-400' : 'bg-red-200';
                } else if (severity === 2) { // 只有警告
                    color = count >= 3 ? 'bg-yellow-500' : count >= 2 ? 'bg-yellow-300' : 'bg-yellow-200';
                } else { // 只有提示
                    color = count >= 3 ? 'bg-blue-400' : count >= 2 ? 'bg-blue-300' : 'bg-blue-200';
                }
            }

            result.push({ panelNumber: i, count, severity, color });
        }

        return result;
    }, [actualMaxPanel, heatmapData]);

    if (issues.length === 0) {
        return (
            <div className={`flex items-center justify-center h-32 text-gray-400 ${className}`}>
                暂无问题数据
            </div>
        );
    }

    return (
        <div className={className}>
            {/* 图例 */}
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-100"></span> 无问题
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-blue-300"></span> 提示
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-yellow-400"></span> 警告
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500"></span> 错误
                </span>
            </div>

            {/* 热力图格子 */}
            <div className="flex flex-wrap gap-1">
                {cells.map(cell => (
                    <button
                        key={cell.panelNumber}
                        onClick={() => onPanelClick?.(cell.panelNumber)}
                        className={`w-6 h-6 rounded text-[10px] font-medium transition-all hover:scale-110 hover:ring-2 hover:ring-blue-400 ${cell.color} ${cell.count > 0 ? 'text-white' : 'text-gray-400'
                            }`}
                        title={`分镜 #${cell.panelNumber}: ${cell.count} 个问题`}
                    >
                        {cell.panelNumber}
                    </button>
                ))}
            </div>

            {/* 统计信息 */}
            <div className="mt-3 text-xs text-gray-500">
                共 {actualMaxPanel} 个分镜，{heatmapData.size} 个分镜存在问题
            </div>
        </div>
    );
}

export default IssueHeatmap;
