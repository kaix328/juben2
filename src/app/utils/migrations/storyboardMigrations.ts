/**
 * 分镜数据迁移工具
 * 用于将旧版本数据迁移到新版本
 */

import { 
    getShotTypeByCN, 
    getCameraAngleByCN, 
    getCameraMovementByCN,
    type ShotTypeCode,
    type CameraAngleCode,
    type CameraMovementCode
} from '../../constants/cinematography';

export interface MigrationResult {
    success: boolean;
    migratedCount: number;
    skippedCount: number;
    errors: Array<{
        panelId: string;
        panelNumber: number;
        error: string;
    }>;
}

/**
 * 迁移单个分镜面板（V1 -> V2）
 * 主要变更：
 * 1. shot/shotSize -> shot (统一为 ShotTypeCode)
 * 2. angle/cameraAngle -> angle (统一为 CameraAngleCode)
 * 3. cameraMovement/movementType -> movement (统一为 CameraMovementCode)
 * 4. aiPrompt -> imagePrompt
 * 5. aiVideoPrompt -> videoPrompt
 * 6. generatedImage -> generatedImageUrl
 */
export function migratePanelV1toV2(oldPanel: any): any {
    const migrated: any = { ...oldPanel };
    
    // 1. 统一景别字段
    if (oldPanel.shotSize) {
        // 如果有 shotSize，优先使用（已经是代码格式）
        migrated.shot = oldPanel.shotSize;
        delete migrated.shotSize;
    } else if (typeof oldPanel.shot === 'string') {
        // 如果 shot 是中文字符串，转换为代码
        const code = getShotTypeByCN(oldPanel.shot);
        if (code) {
            migrated.shot = code;
        } else {
            // 无法识别，使用默认值
            console.warn(`[Migration] 无法识别的景别: ${oldPanel.shot}，使用默认值 MS`);
            migrated.shot = 'MS';
        }
    } else if (!oldPanel.shot) {
        // 如果没有 shot 字段，使用默认值
        migrated.shot = 'MS';
    }
    
    // 2. 统一角度字段
    if (oldPanel.cameraAngle) {
        // 如果有 cameraAngle，优先使用
        migrated.angle = oldPanel.cameraAngle;
        delete migrated.cameraAngle;
    } else if (typeof oldPanel.angle === 'string') {
        // 如果 angle 是中文字符串，转换为代码
        const code = getCameraAngleByCN(oldPanel.angle);
        if (code) {
            migrated.angle = code;
        } else {
            console.warn(`[Migration] 无法识别的角度: ${oldPanel.angle}，使用默认值 EYE_LEVEL`);
            migrated.angle = 'EYE_LEVEL';
        }
    } else if (!oldPanel.angle) {
        migrated.angle = 'EYE_LEVEL';
    }
    
    // 3. 统一运动字段
    if (oldPanel.movementType) {
        // 如果有 movementType，优先使用
        migrated.movement = oldPanel.movementType;
        delete migrated.movementType;
    } else if (oldPanel.cameraMovement) {
        // 如果有 cameraMovement，转换
        const code = getCameraMovementByCN(oldPanel.cameraMovement);
        if (code) {
            migrated.movement = code;
        } else {
            console.warn(`[Migration] 无法识别的运动: ${oldPanel.cameraMovement}，使用默认值 STATIC`);
            migrated.movement = 'STATIC';
        }
        delete migrated.cameraMovement;
    } else if (!oldPanel.movement) {
        migrated.movement = 'STATIC';
    }
    
    // 4. 统一提示词字段
    if (oldPanel.aiPrompt !== undefined) {
        migrated.imagePrompt = oldPanel.aiPrompt;
        delete migrated.aiPrompt;
    }
    
    if (oldPanel.aiVideoPrompt !== undefined) {
        migrated.videoPrompt = oldPanel.aiVideoPrompt;
        delete migrated.aiVideoPrompt;
    }
    
    if (oldPanel.generatedImage !== undefined) {
        migrated.generatedImageUrl = oldPanel.generatedImage;
        delete migrated.generatedImage;
    }
    
    // 5. 确保必填字段存在
    if (!migrated.characters) {
        migrated.characters = [];
    }
    if (!migrated.props) {
        migrated.props = [];
    }
    if (!migrated.notes) {
        migrated.notes = '';
    }
    
    return migrated;
}

/**
 * 批量迁移分镜数组
 */
export function migratePanels(oldPanels: any[]): { panels: any[]; result: MigrationResult } {
    const errors: MigrationResult['errors'] = [];
    let migratedCount = 0;
    let skippedCount = 0;
    
    const migratedPanels = oldPanels.map((panel, index) => {
        try {
            // 检查是否已经是新版本（有 version 字段或字段已经是代码格式）
            const isAlreadyMigrated = 
                panel.version === 2 ||
                (panel.shot && panel.shot.length <= 10 && panel.shot === panel.shot.toUpperCase());
            
            if (isAlreadyMigrated) {
                skippedCount++;
                return panel;
            }
            
            const migrated = migratePanelV1toV2(panel);
            migratedCount++;
            return migrated;
        } catch (error: any) {
            errors.push({
                panelId: panel.id || 'unknown',
                panelNumber: panel.panelNumber || index + 1,
                error: error.message || String(error),
            });
            // 出错时返回原数据
            return panel;
        }
    });
    
    return {
        panels: migratedPanels,
        result: {
            success: errors.length === 0,
            migratedCount,
            skippedCount,
            errors,
        }
    };
}

/**
 * 迁移完整的分镜对象
 */
export function migrateStoryboard(oldStoryboard: any): { storyboard: any; result: MigrationResult } {
    if (!oldStoryboard || !oldStoryboard.panels) {
        return {
            storyboard: oldStoryboard,
            result: {
                success: false,
                migratedCount: 0,
                skippedCount: 0,
                errors: [{ panelId: 'N/A', panelNumber: 0, error: '无效的分镜数据' }],
            }
        };
    }
    
    // 检查是否已经迁移过
    if (oldStoryboard.version === 2) {
        console.log('[Migration] 分镜已经是 V2 版本，跳过迁移');
        return {
            storyboard: oldStoryboard,
            result: {
                success: true,
                migratedCount: 0,
                skippedCount: oldStoryboard.panels.length,
                errors: [],
            }
        };
    }
    
    const { panels: migratedPanels, result } = migratePanels(oldStoryboard.panels);
    
    const migratedStoryboard = {
        ...oldStoryboard,
        panels: migratedPanels,
        version: 2,
        migratedAt: new Date().toISOString(),
    };
    
    return {
        storyboard: migratedStoryboard,
        result,
    };
}

/**
 * 生成迁移报告
 */
export function generateMigrationReport(result: MigrationResult): string {
    const lines: string[] = [];
    
    lines.push('=== 分镜数据迁移报告 ===');
    lines.push('');
    lines.push(`迁移状态: ${result.success ? '✅ 成功' : '⚠️ 部分失败'}`);
    lines.push(`迁移数量: ${result.migratedCount}`);
    lines.push(`跳过数量: ${result.skippedCount}`);
    lines.push(`错误数量: ${result.errors.length}`);
    lines.push('');
    
    if (result.errors.length > 0) {
        lines.push('错误详情:');
        result.errors.forEach((err, index) => {
            lines.push(`  ${index + 1}. 分镜 #${err.panelNumber} (${err.panelId}): ${err.error}`);
        });
    }
    
    return lines.join('\n');
}

/**
 * 验证迁移后的数据
 */
export function validateMigratedPanel(panel: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 检查必填字段
    if (!panel.id) {
        errors.push('缺少 id 字段');
    }
    if (typeof panel.panelNumber !== 'number') {
        errors.push('panelNumber 必须是数字');
    }
    if (!panel.sceneId) {
        errors.push('缺少 sceneId 字段');
    }
    
    // 检查字段格式
    if (panel.shot && typeof panel.shot !== 'string') {
        errors.push('shot 字段格式错误');
    }
    if (panel.angle && typeof panel.angle !== 'string') {
        errors.push('angle 字段格式错误');
    }
    if (panel.movement && typeof panel.movement !== 'string') {
        errors.push('movement 字段格式错误');
    }
    
    // 检查数组字段
    if (panel.characters && !Array.isArray(panel.characters)) {
        errors.push('characters 必须是数组');
    }
    if (panel.props && !Array.isArray(panel.props)) {
        errors.push('props 必须是数组');
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * 批量验证迁移后的数据
 */
export function validateMigratedPanels(panels: any[]): {
    validCount: number;
    invalidCount: number;
    invalidPanels: Array<{ panel: any; errors: string[] }>;
} {
    let validCount = 0;
    let invalidCount = 0;
    const invalidPanels: Array<{ panel: any; errors: string[] }> = [];
    
    panels.forEach(panel => {
        const { valid, errors } = validateMigratedPanel(panel);
        if (valid) {
            validCount++;
        } else {
            invalidCount++;
            invalidPanels.push({ panel, errors });
        }
    });
    
    return {
        validCount,
        invalidCount,
        invalidPanels,
    };
}
