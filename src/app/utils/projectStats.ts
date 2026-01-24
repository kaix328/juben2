import type { ProjectStats, StoryboardAnalytics, AnalysisSuggestion, StoryboardPanel } from '../types';
import { chapterStorage, scriptStorage, storyboardStorage, assetStorage } from './storage';

/**
 * 计算项目统计数据 (宏观)
 */
export async function calculateProjectStats(projectId: string): Promise<ProjectStats> {
  // 获取章节
  const chapters = await chapterStorage.getByProjectId(projectId);

  // 获取所有剧本和分镜
  let totalScenes = 0;
  let totalPanels = 0;
  let totalDuration = 0;
  let completedPanels = 0;

  for (const chapter of chapters) {
    const script = await scriptStorage.getByChapterId(chapter.id);
    if (script) {
      totalScenes += script.scenes.length;
    }

    const storyboard = await storyboardStorage.getByChapterId(chapter.id);
    if (storyboard) {
      totalPanels += storyboard.panels.length;
      storyboard.panels.forEach(panel => {
        totalDuration += panel.duration || 0;
        if (panel.generatedImage) {
          completedPanels++;
        }
      });
    }
  }

  // 获取资源库
  const assets = (await assetStorage.getByProjectId(projectId)) || {
    projectId,
    characters: [],
    scenes: [],
    props: [],
    costumes: []
  };

  // 计算完成度
  let completionPoints = 0;
  let totalPoints = chapters.length * 100; // 4 categories * 25

  for (const c of chapters) {
    // 1. Text
    if (c.originalText && c.originalText.trim().length > 0) completionPoints += 25;

    // 2. Script
    const script = await scriptStorage.getByChapterId(c.id);
    if (script && script.scenes.length > 0) completionPoints += 25;

    // 3. Storyboard Structure
    const storyboard = await storyboardStorage.getByChapterId(c.id);
    if (storyboard && storyboard.panels.length > 0) {
      completionPoints += 25;
      // 4. Storyboard Images
      if (storyboard.panels.some(p => p.generatedImage)) {
        completionPoints += 25;
      }
    }
  }

  const completionRate = totalPoints > 0 ? Math.round((completionPoints / totalPoints) * 100) : 0;

  return {
    totalChapters: chapters.length,
    totalScenes,
    totalPanels,
    totalDuration,
    charactersCount: assets.characters.length,
    scenesCount: assets.scenes.length,
    propsCount: assets.props.length,
    completionRate
  };
}

/**
 * 计算分镜分析详尽数据 (微观)
 */
export function calculateStoryboardAnalytics(panels: StoryboardPanel[]): StoryboardAnalytics {
  if (panels.length === 0) {
    return getEmptyStoryboardAnalytics();
  }

  // 基础统计
  const totalPanels = panels.length;
  const scenes = new Set(panels.map(p => p.sceneId).filter(Boolean));
  const totalScenes = scenes.size || 1;
  const totalDuration = panels.reduce((sum, p) => sum + (p.duration || 3), 0);

  const allCharacters = new Set<string>();
  panels.forEach(p => {
    p.characters?.forEach(c => allCharacters.add(c));
  });
  const totalCharacters = allCharacters.size;

  // 进度统计
  const panelsWithImages = panels.filter(p => p.generatedImage).length;
  const panelsWithDialogue = panels.filter(p => p.dialogue).length;
  const completedPanels = panels.filter(p =>
    p.generatedImage && p.description && (p.shotSize || p.shot)
  ).length;
  const completionRate = (completedPanels / totalPanels) * 100;

  // 景别分布
  const shotDistribution: Record<string, number> = {};
  panels.forEach(p => {
    const shot = p.shotSize || p.shot || 'Unknown';
    shotDistribution[shot] = (shotDistribution[shot] || 0) + 1;
  });

  // 角度分布
  const angleDistribution: Record<string, number> = {};
  panels.forEach(p => {
    const angle = p.cameraAngle || p.angle || 'Unknown';
    angleDistribution[angle] = (angleDistribution[angle] || 0) + 1;
  });

  // 镜头运动分布
  const cameraMovementDistribution: Record<string, number> = {};
  panels.forEach(p => {
    const move = p.cameraMovement || 'STATIC';
    cameraMovementDistribution[move] = (cameraMovementDistribution[move] || 0) + 1;
  });

  // 时长分布
  const durationDistribution = { short: 0, medium: 0, long: 0 };
  panels.forEach(p => {
    const duration = p.duration || 3;
    if (duration < 2) durationDistribution.short++;
    else if (duration <= 5) durationDistribution.medium++;
    else durationDistribution.long++;
  });

  // 场景分布
  const sceneDistribution: Record<string, number> = {};
  panels.forEach(p => {
    const scene = p.sceneId || 'default';
    sceneDistribution[scene] = (sceneDistribution[scene] || 0) + 1;
  });

  // 对白统计
  const dialogueStats = {
    hasDialogue: panelsWithDialogue,
    silent: totalPanels - panelsWithDialogue,
    dialogueRatio: (panelsWithDialogue / totalPanels) * 100
  };

  // 质量指标
  const durations = panels.map(p => p.duration || 3);
  const averageDuration = totalDuration / totalPanels;
  const durationVariance = calculateVariance(durations);

  // 节奏评分
  const rhythmScore = calculateRhythmScore(durations);

  // 多样性评分
  const diversityScore = calculateDiversityScore(shotDistribution, angleDistribution);

  return {
    totalPanels,
    totalScenes,
    totalDuration,
    totalCharacters,
    completedPanels,
    panelsWithImages,
    panelsWithDialogue,
    completionRate,
    shotDistribution,
    angleDistribution,
    cameraMovementDistribution,
    durationDistribution,
    sceneDistribution,
    dialogueStats,
    averageDuration,
    durationVariance,
    rhythmScore,
    diversityScore
  };
}

// ============ 智能建议生成 ============

export function generateAnalyticSuggestions(stats: StoryboardAnalytics): AnalysisSuggestion[] {
  const suggestions: AnalysisSuggestion[] = [];

  // 完成度建议
  if (stats.completionRate < 50) {
    suggestions.push({
      type: 'warning',
      category: '进度',
      message: `项目完成度仅 ${stats.completionRate.toFixed(0)}%，还有 ${stats.totalPanels - stats.completedPanels} 个分镜需要完善`,
      action: '继续完善分镜内容'
    });
  } else if (stats.completionRate >= 90) {
    suggestions.push({
      type: 'success',
      category: '进度',
      message: '项目完成度很高，可以考虑进行最终审核'
    });
  }

  // 图片生成建议
  const imageRate = (stats.panelsWithImages / stats.totalPanels) * 100;
  if (imageRate < 30) {
    suggestions.push({
      type: 'warning',
      category: '图片',
      message: `仅 ${imageRate.toFixed(0)}% 的分镜有图片，建议批量生成`,
      action: '批量生成分镜图片'
    });
  }

  // 景别多样性建议
  const shotTypes = Object.keys(stats.shotDistribution).length;
  if (shotTypes < 3) {
    suggestions.push({
      type: 'warning',
      category: '景别',
      message: '景别类型较少，视觉可能单调',
      action: '增加景别变化，如远景、特写等'
    });
  }

  // 镜头运动建议
  const staticShots = stats.cameraMovementDistribution['STATIC'] || 0;
  const staticRatio = (staticShots / stats.totalPanels) * 100;
  if (staticRatio > 80) {
    suggestions.push({
      type: 'info',
      category: '运镜',
      message: `固定镜头占比 ${staticRatio.toFixed(0)}%，画面可能缺乏动感`,
      action: '适当增加推拉摇移等运镜'
    });
  }

  // 对白密度建议
  if (stats.dialogueStats.dialogueRatio > 80) {
    suggestions.push({
      type: 'info',
      category: '对白',
      message: `对白密集（${stats.dialogueStats.dialogueRatio.toFixed(0)}%），接近广播剧风格`,
      action: '尝试用画面语言替代部分对白'
    });
  } else if (stats.dialogueStats.dialogueRatio < 20) {
    suggestions.push({
      type: 'info',
      category: '对白',
      message: '对白较少，以纯画面叙事为主',
    });
  }

  // 景别分布建议
  const totalShots = Object.values(stats.shotDistribution).reduce((a, b) => a + b, 0);
  for (const [shot, count] of Object.entries(stats.shotDistribution)) {
    const percentage = (count / totalShots) * 100;
    if (percentage > 50) {
      suggestions.push({
        type: 'info',
        category: '景别',
        message: `${shot} 占比 ${percentage.toFixed(0)}%，可能过于集中`,
        action: '考虑增加其他景别的使用'
      });
    }
  }

  // 时长建议
  if (stats.averageDuration < 2) {
    suggestions.push({
      type: 'info',
      category: '节奏',
      message: '平均镜头时长较短，节奏偏快',
      action: '如非动作场景，可适当延长部分镜头'
    });
  } else if (stats.averageDuration > 5) {
    suggestions.push({
      type: 'info',
      category: '节奏',
      message: '平均镜头时长较长，节奏偏慢',
      action: '考虑拆分长镜头或加快剪辑节奏'
    });
  }

  // 节奏评分建议
  if (stats.rhythmScore < 60) {
    suggestions.push({
      type: 'warning',
      category: '节奏',
      message: '镜头节奏变化不足，可能显得单调',
      action: '增加镜头时长的变化，创造节奏感'
    });
  } else if (stats.rhythmScore >= 80) {
    suggestions.push({
      type: 'success',
      category: '节奏',
      message: '镜头节奏变化良好，视觉体验丰富'
    });
  }

  // 多样性评分建议
  if (stats.diversityScore < 50) {
    suggestions.push({
      type: 'warning',
      category: '多样性',
      message: '镜头类型多样性不足',
      action: '尝试使用更多不同的景别和角度'
    });
  }

  return suggestions;
}


// ============ 辅助函数 ============

function getEmptyStoryboardAnalytics(): StoryboardAnalytics {
  return {
    totalPanels: 0,
    totalScenes: 0,
    totalDuration: 0,
    totalCharacters: 0,
    completedPanels: 0,
    panelsWithImages: 0,
    panelsWithDialogue: 0,
    completionRate: 0,
    shotDistribution: {},
    angleDistribution: {},
    cameraMovementDistribution: {},
    durationDistribution: { short: 0, medium: 0, long: 0 },
    sceneDistribution: {},
    dialogueStats: { hasDialogue: 0, silent: 0, dialogueRatio: 0 },
    averageDuration: 0,
    durationVariance: 0,
    rhythmScore: 0,
    diversityScore: 0
  };
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function calculateRhythmScore(durations: number[]): number {
  if (durations.length < 2) return 50;

  // 计算相邻时长的变化
  let changes = 0;
  for (let i = 1; i < durations.length; i++) {
    if (Math.abs(durations[i] - durations[i - 1]) > 1) {
      changes++;
    }
  }

  // 变化率在30%-70%之间最佳
  const changeRate = changes / (durations.length - 1);
  if (changeRate >= 0.3 && changeRate <= 0.7) {
    return 80 + (0.5 - Math.abs(changeRate - 0.5)) * 40;
  }
  return 50 + changeRate * 30;
}

function calculateDiversityScore(
  shotDist: Record<string, number>,
  angleDist: Record<string, number>
): number {
  const shotTypes = Object.keys(shotDist).length;
  const angleTypes = Object.keys(angleDist).length;

  // 理想情况：4-6种景别，3-4种角度
  const shotScore = Math.min(100, (shotTypes / 5) * 100);
  const angleScore = Math.min(100, (angleTypes / 3) * 100);

  return (shotScore + angleScore) / 2;
}

/**
 * 格式化时长
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}

/**
 * 获取角色出场统计
 */
export async function getCharacterAppearances(projectId: string): Promise<Record<string, number>> {
  const chapters = await chapterStorage.getByProjectId(projectId);
  const appearances: Record<string, number> = {};

  for (const chapter of chapters) {
    const storyboard = await storyboardStorage.getByChapterId(chapter.id);
    if (storyboard) {
      storyboard.panels.forEach(panel => {
        panel.characters.forEach(char => {
          appearances[char] = (appearances[char] || 0) + 1;
        });
      });
    }
  }

  return appearances;
}

/**
 * 获取场景使用频率
 */
export async function getSceneUsageFrequency(projectId: string): Promise<Record<string, number>> {
  const chapters = await chapterStorage.getByProjectId(projectId);
  const usage: Record<string, number> = {};

  for (const chapter of chapters) {
    const script = await scriptStorage.getByChapterId(chapter.id);
    if (script) {
      script.scenes.forEach(scene => {
        const locationKey = `${scene.location} (${scene.sceneType})`;
        usage[locationKey] = (usage[locationKey] || 0) + 1;
      });
    }
  }

  return usage;
}
