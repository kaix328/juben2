/**
 * 问题分布饼图组件
 * 显示不同类型问题的分布情况
 */
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { IssueFrequency } from '../../utils/analytics/qualityAnalytics';
import { IssueType } from '../../utils/ai/qualityChecker';

interface IssueDistributionChartProps {
    data: IssueFrequency[];
    height?: number;
}

const COLORS = {
    [IssueType.CONTINUITY]: '#8b5cf6',
    [IssueType.DURATION]: '#3b82f6',
    [IssueType.CHARACTER]: '#10b981',
    [IssueType.SHOT]: '#f59e0b',
    [IssueType.DIALOGUE]: '#ec4899',
    [IssueType.LOGIC]: '#ef4444'
};

const TYPE_NAMES = {
    [IssueType.CONTINUITY]: '连贯性',
    [IssueType.DURATION]: '时长',
    [IssueType.CHARACTER]: '角色',
    [IssueType.SHOT]: '镜头',
    [IssueType.DIALOGUE]: '对话',
    [IssueType.LOGIC]: '逻辑'
};

export function IssueDistributionChart({ data, height = 300 }: IssueDistributionChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                暂无问题数据
            </div>
        );
    }

    // 格式化数据
    const chartData = data.map(item => ({
        name: TYPE_NAMES[item.type],
        value: item.count,
        percentage: item.percentage
    }));

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
        if (percentage < 5) return null; // 小于5%不显示标签
        
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                style={{ fontSize: '12px', fontWeight: 'bold' }}
            >
                {`${percentage.toFixed(1)}%`}
            </text>
        );
    };

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[data[index].type]} 
                            />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                            `${value} 个 (${props.payload.percentage.toFixed(1)}%)`,
                            name
                        ]}
                        contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{ fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
