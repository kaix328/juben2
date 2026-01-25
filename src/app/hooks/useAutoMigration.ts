/**
 * 自动迁移脚本
 * 在应用启动时自动检测并迁移旧版本数据
 */

import { migrateStoryboard, generateMigrationReport } from '../utils/migrations/storyboardMigrations';
import { validateStoryboard } from '../utils/validation/storyboardValidation';

/**
 * 自动迁移 Hook
 * 在 useStoryboard 中使用
 */
export async function autoMigrateStoryboard(storyboard: any): Promise<any> {
    // 安全检查：确保 storyboard 存在且有效
    if (!storyboard) {
        console.log('[AutoMigration] 数据为空，跳过迁移');
        return null;
    }
    
    // 确保 panels 数组存在
    if (!storyboard.panels) {
        console.log('[AutoMigration] panels 数组不存在，初始化为空数组');
        storyboard.panels = [];
    }
    
    // 确保 panels 是数组
    if (!Array.isArray(storyboard.panels)) {
        console.warn('[AutoMigration] panels 不是数组，修复为空数组');
        storyboard.panels = [];
    }
    
    // 检查是否需要迁移
    const needsMigration = 
        !storyboard.version || 
        storyboard.version < 2 ||
        storyboard.panels.some((p: any) => 
            p.shotSize || p.cameraAngle || p.movementType || 
            p.aiPrompt !== undefined || p.aiVideoPrompt !== undefined || 
            p.generatedImage !== undefined
        );
    
    if (!needsMigration) {
        console.log('[AutoMigration] 数据已是最新版本，跳过迁移');
        return storyboard;
    }
    
    console.log('[AutoMigration] 检测到旧版本数据，开始自动迁移...');
    
    try {
        const { storyboard: migratedStoryboard, result } = migrateStoryboard(storyboard);
        
        // 生成报告
        const report = generateMigrationReport(result);
        console.log(report);
        
        if (result.success) {
            console.log('[AutoMigration] ✅ 迁移成功');
            
            // 验证迁移后的数据（安全检查）
            if (migratedStoryboard && migratedStoryboard.panels) {
                const validation = validateStoryboard(migratedStoryboard);
                if (!validation.success) {
                    console.warn('[AutoMigration] ⚠️ 迁移后数据验证失败：', validation.errors);
                }
            }
            
            return migratedStoryboard;
        } else {
            console.warn('[AutoMigration] ⚠️ 迁移部分失败，但数据已尽可能修复');
            return migratedStoryboard;
        }
    } catch (error) {
        console.error('[AutoMigration] ❌ 迁移失败：', error);
        // 迁移失败时返回原数据
        return storyboard;
    }
}

/**
 * 批量迁移所有分镜数据
 * 可在设置页面手动触发
 */
export async function batchMigrateAllStoryboards(): Promise<{
    total: number;
    migrated: number;
    failed: number;
    errors: string[];
}> {
    console.log('[BatchMigration] 开始批量迁移所有分镜数据...');
    
    const { storyboardStorage } = await import('../utils/storage');
    const allStoryboards = await storyboardStorage.getAll();
    
    let migrated = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const storyboard of allStoryboards) {
        try {
            const { storyboard: migratedStoryboard, result } = migrateStoryboard(storyboard);
            
            if (result.success || result.migratedCount > 0) {
                await storyboardStorage.save(migratedStoryboard);
                migrated++;
                console.log(`[BatchMigration] ✅ 迁移成功: ${storyboard.id}`);
            } else {
                failed++;
                errors.push(`${storyboard.id}: 无需迁移或迁移失败`);
            }
        } catch (error: any) {
            failed++;
            errors.push(`${storyboard.id}: ${error.message}`);
            console.error(`[BatchMigration] ❌ 迁移失败: ${storyboard.id}`, error);
        }
    }
    
    console.log(`[BatchMigration] 完成: 总计 ${allStoryboards.length}, 成功 ${migrated}, 失败 ${failed}`);
    
    return {
        total: allStoryboards.length,
        migrated,
        failed,
        errors,
    };
}
