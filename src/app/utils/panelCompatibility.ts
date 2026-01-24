/**
 * 字段兼容性辅助工具
 * 在过渡期间提供旧字段的读写兼容
 */

import type { StoryboardPanel } from '../types';
import { getShotTypeByCN, getCameraAngleByCN, getCameraMovementByCN } from '../constants/cinematography';

/**
 * 规范化分镜面板（确保使用新字段）
 * 用于读取数据时的兼容处理
 */
export function normalizePanel(panel: any): StoryboardPanel {
    const normalized: any = { ...panel };
    
    // 1. 景别字段兼容
    if (!normalized.shot || typeof normalized.shot === 'string') {
        if (normalized.shotSize) {
            normalized.shot = normalized.shotSize;
        } else if (typeof normalized.shot === 'string') {
            const code = getShotTypeByCN(normalized.shot);
            normalized.shot = code || 'MS';
        }
    }
    delete normalized.shotSize;
    
    // 2. 角度字段兼容
    if (!normalized.angle || typeof normalized.angle === 'string') {
        if (normalized.cameraAngle) {
            normalized.angle = normalized.cameraAngle;
        } else if (typeof normalized.angle === 'string') {
            const code = getCameraAngleByCN(normalized.angle);
            normalized.angle = code || 'EYE_LEVEL';
        }
    }
    delete normalized.cameraAngle;
    
    // 3. 运动字段兼容
    if (!normalized.movement) {
        if (normalized.movementType) {
            normalized.movement = normalized.movementType;
        } else if (normalized.cameraMovement) {
            const code = getCameraMovementByCN(normalized.cameraMovement);
            normalized.movement = code || 'STATIC';
        }
    }
    delete normalized.movementType;
    delete normalized.cameraMovement;
    
    // 4. 提示词字段兼容
    if (normalized.aiPrompt !== undefined) {
        normalized.imagePrompt = normalized.aiPrompt;
        delete normalized.aiPrompt;
    }
    if (normalized.aiVideoPrompt !== undefined) {
        normalized.videoPrompt = normalized.aiVideoPrompt;
        delete normalized.aiVideoPrompt;
    }
    if (normalized.generatedImage !== undefined) {
        normalized.generatedImageUrl = normalized.generatedImage;
        delete normalized.generatedImage;
    }
    if (normalized.isGenerating !== undefined) {
        normalized.isImageGenerating = normalized.isGenerating;
        delete normalized.isGenerating;
    }
    
    return normalized as StoryboardPanel;
}

/**
 * 批量规范化分镜面板
 */
export function normalizePanels(panels: any[]): StoryboardPanel[] {
    return panels.map(normalizePanel);
}

/**
 * 获取面板的显示名称（用于 UI 显示）
 */
export function getPanelDisplayNames(panel: StoryboardPanel) {
    const { SHOT_TYPES, CAMERA_ANGLES, CAMERA_MOVEMENTS } = require('../constants/cinematography');
    
    return {
        shot: SHOT_TYPES[panel.shot]?.cn || panel.shot,
        angle: CAMERA_ANGLES[panel.angle]?.cn || panel.angle,
        movement: CAMERA_MOVEMENTS[panel.movement]?.cn || panel.movement,
    };
}

/**
 * 创建新的空白分镜面板（使用新字段）
 */
export function createEmptyPanel(overrides?: Partial<StoryboardPanel>): Partial<StoryboardPanel> {
    return {
        shot: 'MS',
        angle: 'EYE_LEVEL',
        movement: 'STATIC',
        duration: 3,
        characters: [],
        props: [],
        notes: '',
        imagePrompt: '',
        videoPrompt: '',
        soundEffects: [],
        characterActions: [],
        motionSpeed: 'normal',
        ...overrides,
    };
}

/**
 * 检查面板是否使用旧字段
 */
export function hasLegacyFields(panel: any): boolean {
    return !!(
        panel.shotSize ||
        panel.cameraAngle ||
        panel.movementType ||
        panel.cameraMovement ||
        panel.aiPrompt !== undefined ||
        panel.aiVideoPrompt !== undefined ||
        panel.generatedImage !== undefined ||
        panel.isGenerating !== undefined
    );
}

/**
 * 获取迁移建议
 */
export function getMigrationSuggestions(panel: any): string[] {
    const suggestions: string[] = [];
    
    if (panel.shotSize) {
        suggestions.push(`shotSize (${panel.shotSize}) → shot`);
    }
    if (panel.cameraAngle) {
        suggestions.push(`cameraAngle (${panel.cameraAngle}) → angle`);
    }
    if (panel.movementType) {
        suggestions.push(`movementType (${panel.movementType}) → movement`);
    }
    if (panel.cameraMovement) {
        suggestions.push(`cameraMovement (${panel.cameraMovement}) → movement`);
    }
    if (panel.aiPrompt !== undefined) {
        suggestions.push('aiPrompt → imagePrompt');
    }
    if (panel.aiVideoPrompt !== undefined) {
        suggestions.push('aiVideoPrompt → videoPrompt');
    }
    if (panel.generatedImage !== undefined) {
        suggestions.push('generatedImage → generatedImageUrl');
    }
    
    return suggestions;
}
