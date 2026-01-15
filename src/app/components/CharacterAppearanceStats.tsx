/**
 * 角色出场统计面板
 * 展示角色在各场景/分镜中的出场情况
 */
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Film, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { Character, ScriptScene, StoryboardPanel } from '../../types';

interface CharacterAppearanceStatsProps {
    characters: Character[];
    scenes?: ScriptScene[];
    panels?: StoryboardPanel[];
}

interface AppearanceData {
    name: string;
    sceneCount: number;
    panelCount: number;
    dialogueCount: number;
}

const COLORS = [
    '#8B5CF6', '#EC4899', '#3B82F6', '#10B981',
    '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'
];

export function CharacterAppearanceStats({
    characters,
    scenes = [],
    panels = []
}: CharacterAppearanceStatsProps) {
    // 计算每个角色的出场统计
    const stats = useMemo<AppearanceData[]>(() => {
        return characters.map(char => {
            // 场景出场次数
            const sceneCount = scenes.filter(scene =>
                scene.characters?.includes(char.name)
            ).length;

            // 分镜出场次数
            const panelCount = panels.filter(panel =>
                panel.characters?.includes(char.name)
            ).length;

            // 对白次数
            const dialogueCount = scenes.reduce((acc, scene) => {
                const dialogues = scene.dialogues?.filter(d => d.character === char.name) || [];
                return acc + dialogues.length;
            }, 0);

            return {
                name: char.name,
                sceneCount,
                panelCount,
                dialogueCount
            };
        }).sort((a, b) => b.panelCount - a.panelCount);
    }, [characters, scenes, panels]);

    // 计算总计
    const totals = useMemo(() => ({
        scenes: scenes.length,
        panels: panels.length,
        dialogues: scenes.reduce((acc, s) => acc + (s.dialogues?.length || 0), 0)
    }), [scenes, panels]);

    if (characters.length === 0) {
        return (
            <Card className="bg-gray-50">
                <CardContent className="py-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>暂无角色数据</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    角色出场统计
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 总览数据 */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <Film className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                        <p className="text-2xl font-bold text-purple-700">{totals.scenes}</p>
                        <p className="text-xs text-purple-600">场景</p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 text-center">
                        <Users className="w-5 h-5 mx-auto text-pink-600 mb-1" />
                        <p className="text-2xl font-bold text-pink-700">{totals.panels}</p>
                        <p className="text-xs text-pink-600">分镜</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <span className="text-xl">💬</span>
                        <p className="text-2xl font-bold text-blue-700">{totals.dialogues}</p>
                        <p className="text-xs text-blue-600">对白</p>
                    </div>
                </div>

                {/* 柱状图 */}
                {stats.length > 0 && (
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats} layout="vertical" margin={{ left: 60, right: 20 }}>
                                <XAxis type="number" fontSize={12} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    fontSize={12}
                                    width={55}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => [
                                        value,
                                        name === 'panelCount' ? '分镜出场' :
                                            name === 'sceneCount' ? '场景出场' : '对白数'
                                    ]}
                                />
                                <Bar dataKey="panelCount" fill="#8B5CF6" radius={[0, 4, 4, 0]}>
                                    {stats.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* 详细列表 */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {stats.map((item, index) => (
                        <div
                            key={item.name}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium">{item.name}</span>
                            </div>
                            <div className="flex gap-4 text-gray-600 text-xs">
                                <span>{item.sceneCount} 场景</span>
                                <span>{item.panelCount} 分镜</span>
                                <span>{item.dialogueCount} 对白</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
