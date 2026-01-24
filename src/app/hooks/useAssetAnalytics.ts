import { useMemo } from 'react';
import type { AssetLibrary } from '../types';

export interface AssetAnalytics {
  // 基础统计
  totalAssets: number;
  characterCount: number;
  sceneCount: number;
  propCount: number;
  costumeCount: number;
  
  // 图片生成统计
  imagesGenerated: number;
  imageGenerationRate: number;
  characterImagesRate: number;
  sceneImagesRate: number;
  propImagesRate: number;
  costumeImagesRate: number;
  
  // 使用率统计
  mostUsedCharacters: Array<{ id: string; name: string; count: number }>;
  mostUsedScenes: Array<{ id: string; name: string; count: number }>;
  leastUsedAssets: Array<{ id: string; name: string; type: string; count: number }>;
  
  // 标签统计
  topTags: Array<{ tag: string; count: number }>;
  tagDistribution: Record<string, number>;
  
  // 时间统计
  recentlyCreated: Array<{ id: string; name: string; type: string; createdAt: string }>;
  recentlyUpdated: Array<{ id: string; name: string; type: string; updatedAt?: string }>;
  
  // 提示词统计
  averagePromptLength: number;
  promptLengthDistribution: {
    short: number;  // < 100
    medium: number; // 100-500
    long: number;   // > 500
  };
  
  // 完整度统计
  completionRate: number;
  incompleteAssets: Array<{ id: string; name: string; type: string; missingFields: string[] }>;
}

export function useAssetAnalytics(
  assets: AssetLibrary | null,
  usageMap: Map<string, number>
): AssetAnalytics | null {
  return useMemo(() => {
    if (!assets) return null;

    const { characters, scenes, props, costumes } = assets;
    const totalAssets = characters.length + scenes.length + props.length + costumes.length;

    // 图片生成统计
    const charactersWithImages = characters.filter(c => c.fullBodyPreview || c.facePreview).length;
    const scenesWithImages = scenes.filter(s => s.widePreview || s.mediumPreview || s.closeupPreview).length;
    const propsWithImages = props.filter(p => p.preview).length;
    const costumesWithImages = costumes.filter(c => c.preview).length;
    const imagesGenerated = charactersWithImages + scenesWithImages + propsWithImages + costumesWithImages;

    // 使用率统计
    const mostUsedCharacters = characters
      .map(c => ({ id: c.id, name: c.name, count: usageMap.get(c.id) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostUsedScenes = scenes
      .map(s => ({ id: s.id, name: s.name, count: usageMap.get(s.id) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const allAssets = [
      ...characters.map(c => ({ id: c.id, name: c.name, type: 'character', count: usageMap.get(c.id) || 0 })),
      ...scenes.map(s => ({ id: s.id, name: s.name, type: 'scene', count: usageMap.get(s.id) || 0 })),
      ...props.map(p => ({ id: p.id, name: p.name, type: 'prop', count: usageMap.get(p.id) || 0 })),
      ...costumes.map(c => ({ id: c.id, name: c.name, type: 'costume', count: usageMap.get(c.id) || 0 })),
    ];
    const leastUsedAssets = allAssets
      .sort((a, b) => a.count - b.count)
      .slice(0, 10);

    // 标签统计
    const tagCounts: Record<string, number> = {};
    [...characters, ...scenes, ...props, ...costumes].forEach(asset => {
      asset.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 时间统计
    const recentlyCreated = allAssets
      .filter(a => (a as any).createdAt)
      .sort((a, b) => {
        const aTime = new Date((a as any).createdAt).getTime();
        const bTime = new Date((b as any).createdAt).getTime();
        return bTime - aTime;
      })
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        createdAt: (a as any).createdAt,
      }));

    // 提示词统计
    const allPrompts = [
      ...characters.flatMap(c => [c.fullBodyPrompt, c.facePrompt]),
      ...scenes.flatMap(s => [s.widePrompt, s.mediumPrompt, s.closeupPrompt]),
      ...props.map(p => p.aiPrompt),
      ...costumes.map(c => c.aiPrompt),
    ].filter(Boolean) as string[];

    const promptLengths = allPrompts.map(p => p.length);
    const averagePromptLength = promptLengths.length > 0
      ? Math.round(promptLengths.reduce((sum, len) => sum + len, 0) / promptLengths.length)
      : 0;

    const promptLengthDistribution = {
      short: promptLengths.filter(len => len < 100).length,
      medium: promptLengths.filter(len => len >= 100 && len <= 500).length,
      long: promptLengths.filter(len => len > 500).length,
    };

    // 完整度统计
    const incompleteAssets: Array<{ id: string; name: string; type: string; missingFields: string[] }> = [];
    
    characters.forEach(c => {
      const missing: string[] = [];
      if (!c.description) missing.push('描述');
      if (!c.appearance) missing.push('外貌');
      if (!c.personality) missing.push('性格');
      if (!c.fullBodyPrompt) missing.push('全身提示词');
      if (!c.facePrompt) missing.push('面部提示词');
      if (missing.length > 0) {
        incompleteAssets.push({ id: c.id, name: c.name, type: 'character', missingFields: missing });
      }
    });

    scenes.forEach(s => {
      const missing: string[] = [];
      if (!s.description) missing.push('描述');
      if (!s.location) missing.push('地点');
      if (!s.environment) missing.push('环境');
      if (missing.length > 0) {
        incompleteAssets.push({ id: s.id, name: s.name, type: 'scene', missingFields: missing });
      }
    });

    const completionRate = totalAssets > 0
      ? Math.round(((totalAssets - incompleteAssets.length) / totalAssets) * 100)
      : 0;

    return {
      totalAssets,
      characterCount: characters.length,
      sceneCount: scenes.length,
      propCount: props.length,
      costumeCount: costumes.length,
      
      imagesGenerated,
      imageGenerationRate: totalAssets > 0 ? Math.round((imagesGenerated / totalAssets) * 100) : 0,
      characterImagesRate: characters.length > 0 ? Math.round((charactersWithImages / characters.length) * 100) : 0,
      sceneImagesRate: scenes.length > 0 ? Math.round((scenesWithImages / scenes.length) * 100) : 0,
      propImagesRate: props.length > 0 ? Math.round((propsWithImages / props.length) * 100) : 0,
      costumeImagesRate: costumes.length > 0 ? Math.round((costumesWithImages / costumes.length) * 100) : 0,
      
      mostUsedCharacters,
      mostUsedScenes,
      leastUsedAssets,
      
      topTags,
      tagDistribution: tagCounts,
      
      recentlyCreated,
      recentlyUpdated: [],
      
      averagePromptLength,
      promptLengthDistribution,
      
      completionRate,
      incompleteAssets,
    };
  }, [assets, usageMap]);
}
