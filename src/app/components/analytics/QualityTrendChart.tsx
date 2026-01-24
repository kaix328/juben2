/**
 * 质量趋势图表组件
 * 显示质量分数随时间的变化趋势
 * 支持点击数据点查看详情
 */
import React, { useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { QualityTrendPoint } from '../../utils/analytics/qualityAnalytics';

interface QualityTrendChartProps {
    data: QualityTrendPoint[];
    height?: number;
    onPointClick?: (point: QualityTrendPoint) => void;
}

export function QualityTrendChart({ data, height = 300, onPointClick }: QualityTrendChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                暂无趋势数据
            </div>
        );
    }

    // 格式化数据，保留原始数据引用
    const chartData = data.map((point, index) => ({
        time: new Date(point.timestamp).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        质量分数: point.qualityScore,
        错误数: point.errorCount,
        警告数: point.warningCount,
        提示数: point.infoCount,
        _originalIndex: index // 保留原始索引用于点击回调
    }));

    // 处理点击事件
    const handleClick = useCallback((e: any) => {
        if (e && e.activePayload && e.activePayload.length > 0) {
            const clickedData = e.activePayload[0].payload;
            const originalIndex = clickedData._originalIndex;
            if (originalIndex !== undefined && onPointClick) {
                onPointClick(data[originalIndex]);
            }
        }
    }, [data, onPointClick]);

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    onClick={handleClick}
                    style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="time"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [value, undefined]}
                        labelFormatter={(label) => `时间: ${label}`}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="质量分数"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4, cursor: 'pointer' }}
                        activeDot={{ r: 8, cursor: 'pointer' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="错误数"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 3, cursor: 'pointer' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="警告数"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', r: 3, cursor: 'pointer' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="提示数"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3, cursor: 'pointer' }}
                    />
                </LineChart>
            </ResponsiveContainer>
            {onPointClick && (
                <div className="text-center text-xs text-gray-400 mt-2">
                    💡 点击图表上的数据点查看详情
                </div>
            )}
        </div>
    );
}

