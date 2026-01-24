import { useState, useCallback } from 'react';
import { db } from '../db/db';
import { generateId } from '../utils/storage';
import type { AssetRelation, RelationType } from '../types/relation';
import type { Character, Scene, Prop, Costume } from '../types';
import { toast } from 'sonner';

/**
 * 关系图谱 Hook
 * 管理资产之间的关系数据
 */
export function useRelationGraph(projectId: string) {
    const [relations, setRelations] = useState<AssetRelation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 加载关系数据
    const loadRelations = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const data = await db.assetRelations
                .where('projectId')
                .equals(projectId)
                .toArray();
            setRelations(data);
        } catch (error) {
            console.error('Failed to load relations:', error);
            toast.error('加载关系数据失败');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    // 添加关系
    const addRelation = useCallback(async (relation: Omit<AssetRelation, 'id' | 'projectId' | 'createdAt'>) => {
        if (!projectId) return;

        const newRelation: AssetRelation = {
            ...relation,
            id: generateId(),
            projectId,
            createdAt: new Date().toISOString(),
        };

        try {
            await db.assetRelations.add(newRelation);
            setRelations(prev => [...prev, newRelation]);
            toast.success('关系已添加');
        } catch (error) {
            console.error('Failed to add relation:', error);
            toast.error('添加关系失败');
        }
    }, [projectId]);

    // 更新关系
    const updateRelation = useCallback(async (id: string, updates: Partial<AssetRelation>) => {
        try {
            await db.assetRelations.update(id, updates);
            setRelations(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
            toast.success('关系已更新');
        } catch (error) {
            console.error('Failed to update relation:', error);
            toast.error('更新关系失败');
        }
    }, []);

    // 删除关系
    const deleteRelation = useCallback(async (id: string) => {
        try {
            await db.assetRelations.delete(id);
            setRelations(prev => prev.filter(r => r.id !== id));
            toast.success('关系已删除');
        } catch (error) {
            console.error('Failed to delete relation:', error);
            toast.error('删除关系失败');
        }
    }, []);

    // 批量添加关系
    const batchAddRelations = useCallback(async (newRelations: Omit<AssetRelation, 'id' | 'projectId' | 'createdAt'>[]) => {
        if (!projectId) return;

        const relationsToAdd: AssetRelation[] = newRelations.map(r => ({
            ...r,
            id: generateId(),
            projectId,
            createdAt: new Date().toISOString(),
        }));

        try {
            await db.assetRelations.bulkAdd(relationsToAdd);
            setRelations(prev => [...prev, ...relationsToAdd]);
            toast.success(`已添加 ${relationsToAdd.length} 个关系`);
        } catch (error) {
            console.error('Failed to batch add relations:', error);
            toast.error('批量添加关系失败');
        }
    }, [projectId]);

    // 清空所有关系
    const clearRelations = useCallback(async () => {
        if (!projectId) return;

        try {
            await db.assetRelations.where('projectId').equals(projectId).delete();
            setRelations([]);
            toast.success('关系图谱已清空');
        } catch (error) {
            console.error('Failed to clear relations:', error);
            toast.error('清空关系失败');
        }
    }, [projectId]);

    // 自动分析关系
    const analyzeRelations = useCallback((
        characters: Character[],
        scenes: Scene[],
        props: Prop[],
        costumes: Costume[]
    ) => {
        const suggestions: Omit<AssetRelation, 'id' | 'projectId' | 'createdAt'>[] = [];

        // 1. 分析角色-场景关系（基于名称匹配）
        characters.forEach(char => {
            scenes.forEach(scene => {
                // 检查场景描述中是否提到角色
                const mentioned = scene.description?.toLowerCase().includes(char.name.toLowerCase()) ||
                    scene.location?.toLowerCase().includes(char.name.toLowerCase());

                if (mentioned) {
                    // 检查是否已存在
                    const exists = relations.some(r =>
                        r.fromId === char.id && r.toId === scene.id && r.relationType === 'appears_in'
                    );

                    if (!exists) {
                        suggestions.push({
                            fromId: char.id,
                            fromType: 'character',
                            toId: scene.id,
                            toType: 'scene',
                            relationType: 'appears_in',
                            description: `${char.name} 出现在 ${scene.name}`,
                            strength: 0.7,
                        });
                    }
                }
            });
        });

        // 2. 分析角色-道具关系
        characters.forEach(char => {
            props.forEach(prop => {
                const mentioned = prop.description?.toLowerCase().includes(char.name.toLowerCase()) ||
                    char.description?.toLowerCase().includes(prop.name.toLowerCase());

                if (mentioned) {
                    const exists = relations.some(r =>
                        r.fromId === char.id && r.toId === prop.id && r.relationType === 'uses'
                    );

                    if (!exists) {
                        suggestions.push({
                            fromId: char.id,
                            fromType: 'character',
                            toId: prop.id,
                            toType: 'prop',
                            relationType: 'uses',
                            description: `${char.name} 使用 ${prop.name}`,
                            strength: 0.6,
                        });
                    }
                }
            });
        });

        // 3. 分析角色-服装关系
        characters.forEach(char => {
            costumes.forEach(costume => {
                // 服装通常有 characterId 字段
                if (costume.characterId === char.id) {
                    const exists = relations.some(r =>
                        r.fromId === char.id && r.toId === costume.id && r.relationType === 'wears'
                    );

                    if (!exists) {
                        suggestions.push({
                            fromId: char.id,
                            fromType: 'character',
                            toId: costume.id,
                            toType: 'costume',
                            relationType: 'wears',
                            description: `${char.name} 穿着 ${costume.name}`,
                            strength: 0.9,
                        });
                    }
                }
            });
        });

        // 4. 分析角色-角色关系（基于描述中的关键词）
        characters.forEach((char1, i) => {
            characters.slice(i + 1).forEach(char2 => {
                const desc1 = (char1.description || '').toLowerCase();
                const desc2 = (char2.description || '').toLowerCase();
                const pers1 = (char1.personality || '').toLowerCase();
                const pers2 = (char2.personality || '').toLowerCase();

                let relationType: RelationType | null = null;
                let strength = 0.5;

                // 检测关系类型
                if (desc1.includes(char2.name.toLowerCase()) || desc2.includes(char1.name.toLowerCase())) {
                    if (desc1.includes('朋友') || desc2.includes('朋友') || pers1.includes('友好') || pers2.includes('友好')) {
                        relationType = 'friend';
                        strength = 0.7;
                    } else if (desc1.includes('敌人') || desc2.includes('敌人') || desc1.includes('对手') || desc2.includes('对手')) {
                        relationType = 'enemy';
                        strength = 0.8;
                    } else if (desc1.includes('家人') || desc2.includes('家人') || desc1.includes('亲人') || desc2.includes('亲人')) {
                        relationType = 'family';
                        strength = 0.9;
                    } else if (desc1.includes('恋人') || desc2.includes('恋人') || desc1.includes('爱人') || desc2.includes('爱人')) {
                        relationType = 'lover';
                        strength = 0.9;
                    } else if (desc1.includes('同事') || desc2.includes('同事') || desc1.includes('同僚') || desc2.includes('同僚')) {
                        relationType = 'colleague';
                        strength = 0.6;
                    } else if (desc1.includes('师父') || desc2.includes('徒弟') || desc1.includes('老师') || desc2.includes('学生')) {
                        relationType = 'master_student';
                        strength = 0.8;
                    } else {
                        relationType = 'related_to';
                        strength = 0.5;
                    }

                    if (relationType) {
                        const exists = relations.some(r =>
                            (r.fromId === char1.id && r.toId === char2.id) ||
                            (r.fromId === char2.id && r.toId === char1.id)
                        );

                        if (!exists) {
                            suggestions.push({
                                fromId: char1.id,
                                fromType: 'character',
                                toId: char2.id,
                                toType: 'character',
                                relationType,
                                description: `${char1.name} 与 ${char2.name} 的关系`,
                                strength,
                            });
                        }
                    }
                }
            });
        });

        return suggestions;
    }, [relations]);

    // 导出图谱数据（用于 RelationGraphDialog）
    const exportGraphData = useCallback((
        characters: Character[],
        scenes: Scene[],
        props: Prop[],
        costumes: Costume[]
    ) => {
        // 构建节点
        const nodes = [
            ...characters.map(c => ({
                id: c.id,
                label: c.name,
                type: 'character' as const,
                data: c,
            })),
            ...scenes.map(s => ({
                id: s.id,
                label: s.name,
                type: 'scene' as const,
                data: s,
            })),
            ...props.map(p => ({
                id: p.id,
                label: p.name,
                type: 'prop' as const,
                data: p,
            })),
            ...costumes.map(c => ({
                id: c.id,
                label: c.name,
                type: 'costume' as const,
                data: c,
            })),
        ];

        // 构建边
        const edges = relations.map(r => ({
            id: r.id,
            source: r.fromId,
            target: r.toId,
            label: getRelationLabel(r.relationType),
            type: r.relationType,
            strength: r.strength,
            description: r.description,
        }));

        return { nodes, edges };
    }, [relations]);

    return {
        relations,
        isLoading,
        loadRelations,
        addRelation,
        updateRelation,
        deleteRelation,
        batchAddRelations,
        clearRelations,
        analyzeRelations,
        exportGraphData,
    };
}

// 辅助函数：获取关系类型的中文标签
function getRelationLabel(type: RelationType): string {
    const labels: Record<RelationType, string> = {
        appears_in: '出现在',
        uses: '使用',
        wears: '穿着',
        friend: '朋友',
        enemy: '敌人',
        family: '家人',
        lover: '恋人',
        colleague: '同事',
        master_student: '师徒',
        related_to: '相关',
    };
    return labels[type] || type;
}

export type { RelationType };
