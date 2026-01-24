/**
 * 项目资源库分析数据导出工具
 */
import type { AssetAnalytics } from '../../hooks/useAssetAnalytics';

/**
 * 导出资产分析报告为 CSV
 */
export function exportAssetAnalyticsCSV(analytics: AssetAnalytics) {
    if (!analytics) return;

    const rows = [];

    // 1. 基础统计
    rows.push(['项目资源库数据分析报告']);
    rows.push(['生成时间', new Date().toLocaleString()]);
    rows.push([]);
    rows.push(['模块', '统计项', '数值']);
    rows.push(['基础统计', '总资产', analytics.totalAssets]);
    rows.push(['基础统计', '角色数', analytics.characterCount]);
    rows.push(['基础统计', '场景数', analytics.sceneCount]);
    rows.push(['基础统计', '道具数', analytics.propCount]);
    rows.push(['基础统计', '服饰数', analytics.costumeCount]);
    rows.push(['图片生成', '总计已生成', analytics.imagesGenerated]);
    rows.push(['图片生成', '总生成率', `${analytics.imageGenerationRate}%`]);
    rows.push(['质量保证', '平均提示词长度', analytics.averagePromptLength]);
    rows.push(['质量保证', '资产完整度', `${analytics.completionRate}%`]);
    rows.push([]);

    // 2. 最常用资产
    rows.push(['最常用角色 Top 10']);
    rows.push(['排名', '名称', '使用次数']);
    analytics.mostUsedCharacters.forEach((item, i) => {
        rows.push([i + 1, item.name, item.count]);
    });
    rows.push([]);

    rows.push(['最常用场景 Top 10']);
    rows.push(['排名', '名称', '使用次数']);
    analytics.mostUsedScenes.forEach((item, i) => {
        rows.push([i + 1, item.name, item.count]);
    });
    rows.push([]);

    // 3. 不完整资产
    rows.push(['待完善资产 (仅展示前 50 条)']);
    rows.push(['名称', '类型', '缺失字段']);
    analytics.incompleteAssets.slice(0, 50).forEach(item => {
        rows.push([item.name, item.type, item.missingFields.join('; ')]);
    });

    // 转换为 CSV 字符串
    const csvContent = rows
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    // 触发下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `项目资源库分析报告_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
