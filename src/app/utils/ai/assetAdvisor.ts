import { AssetLibrary } from '../../types';
import { AssetAnalytics } from '../../hooks/useAssetAnalytics';
import { calculateSimilarity } from '../stringSimilarity';
import { generateId } from '../storage';

export interface AssetAdvice {
    id: string;
    type: 'merge' | 'complete' | 'cleanup' | 'optimize' | 'refine';
    title: string;
    description: string;
    actionLabel: string;
    affectedIds: string[];
    priority: 'high' | 'medium' | 'low';
    metadata?: any;
}

export class AssetAdvisor {
    /**
     * 根据统计数据和资产列表生成优化建议
     */
    static generateAdvice(
        assets: AssetLibrary,
        analytics: AssetAnalytics
    ): AssetAdvice[] {
        const advice: AssetAdvice[] = [];

        // 1. 识别潜在的重复项（语义聚类）
        this.checkPotentialMerge(assets, advice);

        // 2. 识别信息缺失严重的资产
        this.checkIncompleteAssets(analytics, advice);

        // 3. 识别低使用率资产
        this.checkLowUsageAssets(analytics, advice);

        // 4. 图片覆盖率建议
        this.checkImageCoverage(analytics, advice);

        // 5. 提示词质量建议 (🆕)
        this.checkPromptQuality(assets, advice);

        return advice.sort((a, b) => {
            const priorityMap = { high: 3, medium: 2, low: 1 };
            return priorityMap[b.priority] - priorityMap[a.priority];
        });
    }

    private static checkPotentialMerge(assets: AssetLibrary, advice: AssetAdvice[]) {
        const categories: { list: any[], label: string, key: keyof AssetLibrary }[] = [
            { list: assets.characters, label: '角色', key: 'characters' },
            { list: assets.scenes, label: '场景', key: 'scenes' },
            { list: assets.props, label: '道具', key: 'props' },
            { list: assets.costumes, label: '服饰', key: 'costumes' }
        ];

        categories.forEach(({ list, label, key }) => {
            for (let i = 0; i < list.length; i++) {
                for (let j = i + 1; j < list.length; j++) {
                    const similarity = calculateSimilarity(list[i].name, list[j].name);
                    if (similarity >= 0.7 && similarity < 0.95) { // 极高相似度通过一键整理解决，这里建议中等相似度
                        advice.push({
                            id: generateId(),
                            type: 'merge',
                            title: `潜在重复${label}`,
                            description: `[${list[i].name}] 与 [${list[j].name}] 相似度较高 (${Math.round(similarity * 100)}%)，建议核对并一键合并。`,
                            actionLabel: '一键合并',
                            affectedIds: [list[i].id, list[j].id],
                            priority: similarity > 0.85 ? 'high' : 'medium',
                            metadata: { category: key }
                        });
                    }
                }
            }
        });
    }

    private static checkIncompleteAssets(analytics: AssetAnalytics, advice: AssetAdvice[]) {
        if (analytics.incompleteAssets.length > 5) {
            advice.push({
                id: generateId(),
                type: 'complete',
                title: '资产信息不完整',
                description: `库中共有 ${analytics.incompleteAssets.length} 项资产缺失关键描述或外貌特征，这将严重影响 AI 绘图质量。`,
                actionLabel: '前往补充',
                affectedIds: analytics.incompleteAssets.slice(0, 5).map(a => a.id),
                priority: 'high'
            });
        }
    }

    private static checkLowUsageAssets(analytics: AssetAnalytics, advice: AssetAdvice[]) {
        const neverUsed = analytics.leastUsedAssets.filter(a => a.count === 0);
        if (neverUsed.length > 3) {
            advice.push({
                id: generateId(),
                type: 'cleanup',
                title: '清理闲置资产',
                description: `有 ${neverUsed.length} 项资产在剧本中从未被使用，建议清理冗余以保持资料库纯净。`,
                actionLabel: '查看闲置',
                affectedIds: neverUsed.map(a => a.id),
                priority: 'low'
            });
        }
    }

    private static checkImageCoverage(analytics: AssetAnalytics, advice: AssetAdvice[]) {
        if (analytics.imageGenerationRate < 30 && analytics.totalAssets > 5) {
            advice.push({
                id: generateId(),
                type: 'optimize',
                title: '视觉素材匮乏',
                description: `资产图片覆盖率仅为 ${analytics.imageGenerationRate}%。丰富的参考图能让分镜生成更稳定。`,
                actionLabel: '批量生成',
                affectedIds: [],
                priority: 'medium'
            });
        }
    }

    private static checkPromptQuality(assets: AssetLibrary, advice: AssetAdvice[]) {
        const categories = [
            { list: assets.characters, label: '角色', key: 'characters' },
            { list: assets.scenes, label: '场景', key: 'scenes' },
            { list: assets.props, label: '道具', key: 'props' },
            { list: assets.costumes, label: '服饰', key: 'costumes' }
        ];

        categories.forEach(({ list, label, key }) => {
            list.forEach(asset => {
                const prompt = (
                    (asset as any).aiPrompt ||
                    (asset as any).fullBodyPrompt ||
                    asset.description ||
                    ''
                ).trim();

                // 质量评估逻辑
                const isVeryShort = prompt.length > 0 && prompt.length < 30;
                const isVague = prompt.length >= 30 && prompt.length < 60; // 稍短，可能缺乏细节

                if (isVeryShort || isVague) {
                    advice.push({
                        id: generateId(),
                        type: 'refine',
                        title: `提示词待优化: ${asset.name}`,
                        description: isVeryShort
                            ? `[${label}] 提示词过于简略(${prompt.length}字)，AI 绘图时可能出现偏色或形变，建议拓写视觉细节。`
                            : `[${label}] 提示词细节度不足，建议补充材质、光影及环境细节以提升稳定性。`,
                        actionLabel: 'AI 智能优化',
                        affectedIds: [asset.id],
                        priority: isVeryShort ? 'high' : 'medium',
                        metadata: {
                            category: key,
                            currentVal: prompt,
                            assetName: asset.name
                        }
                    });
                }
            });
        });
    }
}
