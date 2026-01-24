// 统计面板组件
import { memo } from 'react';
import { BarChart3, X, Clock, Users, Film, MessageCircle, Sparkles } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import type { ScriptStats } from '../types';

interface StatsPanelProps {
    stats: ScriptStats;
    onClose: () => void;
    onShowCharacterStats?: () => void;
}

export const StatsPanel = memo(function StatsPanel({ stats, onClose, onShowCharacterStats }: StatsPanelProps) {
    return (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                    <BarChart3 className="w-5 h-5" />
                    剧本统计
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* 总场景数 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                            <Film className="w-4 h-4" />
                            <span className="text-sm font-medium">总场景</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalScenes}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            内景: <span className="font-medium text-purple-600">{stats.sceneTypeStats.int}</span>
                            {' / '}
                            外景: <span className="font-medium text-teal-600">{stats.sceneTypeStats.ext}</span>
                        </div>
                    </div>

                    {/* 总对话数 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">总对话</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalDialogues}
                        </div>
                    </div>

                    {/* 角色数量 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                        <div className="flex items-center gap-2 text-green-600 mb-1 justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">角色数量</span>
                            </div>
                            {onShowCharacterStats && (
                                <button onClick={onShowCharacterStats} className="text-xs text-blue-500 hover:text-blue-700 underline">
                                    详情
                                </button>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalCharacters.length}
                        </div>
                        {stats.totalCharacters.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1 truncate" title={stats.totalCharacters.join(', ')}>
                                {stats.totalCharacters.slice(0, 3).join(', ')}
                                {stats.totalCharacters.length > 3 && '...'}
                            </div>
                        )}
                    </div>

                    {/* 预计时长 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">预计时长</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalDuration}
                        </div>
                    </div>

                    {/* 🆕 预估分镜数 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                        <div className="flex items-center gap-2 text-pink-600 mb-1">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">预估分镜</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            ~{stats.estimatedPanelCount.max}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            范围: {stats.estimatedPanelCount.min}-{stats.estimatedPanelCount.max} 个
                        </div>
                    </div>
                </div>

                {/* 🆕 图表区域 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* 场景类型分布 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 h-[300px] flex flex-col">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Film className="w-4 h-4 text-purple-500" />
                            场景类型分布
                        </h4>
                        <div className="flex-1 w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: '内景', value: stats.sceneTypeStats.int },
                                            { name: '外景', value: stats.sceneTypeStats.ext },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#a855f7" /> {/* Purple */}
                                        <Cell fill="#0d9488" /> {/* Teal */}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 集数时长分布 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 h-[300px] flex flex-col">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            每集预估时长 (分钟)
                        </h4>
                        <div className="flex-1 w-full h-full">
                            {stats.episodeDurations.size > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={Array.from(stats.episodeDurations.entries()).map(([ep, duration]) => ({
                                            name: `第${ep}集`,
                                            minutes: parseDurationToMinutes(duration)
                                        }))}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} />
                                        <YAxis fontSize={12} />
                                        <Tooltip formatter={(value: number) => [`${value} 分钟`, '时长']} />
                                        <Bar dataKey="minutes" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                    暂无分集数据
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

// 辅助函数：解析时长字符串 "MM:SS" 为分钟数 (浮点)
function parseDurationToMinutes(duration: string): number {
    if (!duration) return 0;
    const parts = duration.split(':');
    if (parts.length === 2) {
        const min = parseInt(parts[0], 10);
        const sec = parseInt(parts[1], 10);
        return parseFloat((min + sec / 60).toFixed(1));
    }
    // 处理 "HH:MM:SS"
    if (parts.length === 3) {
        const hour = parseInt(parts[0], 10);
        const min = parseInt(parts[1], 10);
        return hour * 60 + min;
    }
    return 0;
}
