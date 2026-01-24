import { useMemo } from 'react';
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { RefreshCw, Wand2, Activity, TrendingUp } from 'lucide-react';
import { EmotionBeat } from '../../types/story-analysis';

interface EmotionCurveChartProps {
    data: EmotionBeat[];
    height?: number;
    onAnalyze?: () => void;
    isAnalyzing?: boolean;
}

export function EmotionCurveChart({ data, height = 400, onAnalyze, isAnalyzing = false }: EmotionCurveChartProps) {
    const chartData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            name: `场景 ${item.sceneOrder}: ${item.sceneLocation}`, // 用于 Tooltip 显示
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-10 text-gray-400">
                    暂无情感数据
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    情感节奏与能量曲线
                </CardTitle>
                {onAnalyze && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAnalyze}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        {isAnalyzing ? '分析中...' : '重新分析'}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {/* 模拟数据警告 */}
                {data.some(d => d.isMock) && (
                    <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700 flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span>当前展示为<strong>模拟演示数据</strong>（因为 AI 分析超时或失败），仅供参考。</span>
                    </div>
                )}

                <div style={{ width: '100%', height: height }}>
                    <ResponsiveContainer>
                        <ComposedChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 20,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="sceneOrder"
                                tickLine={false}
                                axisLine={false}
                                label={{ value: '场景顺序', position: 'insideBottom', offset: -10 }}
                            />
                            <YAxis
                                yAxisId="left"
                                domain={[0, 10]}
                                tickLine={false}
                                axisLine={false}
                                label={{ value: '强度等级', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                                formatter={(value: number, name: string, props: any) => {
                                    if (props.payload.isMock) {
                                        return [`${value} (模拟)`, name];
                                    }
                                    return [value, name];
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            {/* 能量区域 - 使用 Area 填充 */}
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="energy"
                                name="场面能量"
                                fill="url(#colorEnergy)"
                                stroke="#10B981"
                                strokeWidth={2}
                                fillOpacity={0.2}
                            />

                            {/* 紧张度曲线 - 使用 Line 强调 */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="tension"
                                name="戏剧张力"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                            />

                            <defs>
                                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                    <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-500 mt-1" />
                        <p>
                            <strong>戏剧张力 (橙线):</strong> 反映情节的紧迫感和悬念程度。高张力通常对应冲突爆发、危机时刻或重大揭示。
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <Activity className="w-4 h-4 text-emerald-500 mt-1" />
                        <p>
                            <strong>场面能量 (绿区):</strong> 反映场景的活跃程度和动作密度。高能量通常对应动作戏、争吵或快速剪辑段落。
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
