import { DirectorStyle } from '../types';

const STORAGE_KEY = 'director_style_custom_presets';

export interface CustomPreset {
    id: string;
    name: string;
    style: DirectorStyle;
    createdAt: string;
}

export const directorStylePresets = {
    /**
     * 获取所有自定义预设
     */
    getAll: (): CustomPreset[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load custom presets', e);
            return [];
        }
    },

    /**
     * 保存新预设
     */
    save: (name: string, style: DirectorStyle): CustomPreset => {
        const presets = directorStylePresets.getAll();
        const newPreset: CustomPreset = {
            id: Date.now().toString(),
            name,
            style: { ...style }, // 浅拷贝以断开引用
            createdAt: new Date().toISOString(),
        };

        // 放入数组开头
        presets.unshift(newPreset);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
        return newPreset;
    },

    /**
     * 删除预设
     */
    delete: (id: string): void => {
        const presets = directorStylePresets.getAll();
        const filtered = presets.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
};

/**
 * 内置的大师级预设，用于验证系统的统一性
 */
export const DEFAULT_MASTER_PRESET: DirectorStyle = {
    artStyle: "Cinematic, Photorealistic, 8k",
    colorTone: "Teal and Orange, High Contrast",
    lightingStyle: "Rembrandt Lighting, Volumetric Fog, Dramatic Shadows",
    cameraStyle: "low angle shot, wide contextual framing, shallow depth of field",
    mood: "Epic, Intense, Dramatic",
    customPrompt: "Kodak Portra 400 film grain, anamorphic lens flares, movie poster composition",
    negativePrompt: "cartoon, anime, 3d render, low quality, washed out colors"
};
