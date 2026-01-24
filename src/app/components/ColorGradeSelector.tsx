/**
 * 调色风格选择器组件
 * Color Grade Selector Component
 * 
 * 用于分镜编辑器中选择调色风格
 */
import React, { useMemo } from 'react';
import { getPresetsByCategory, CATEGORY_NAMES, type ColorGradePreset } from '../../utils/prompts/colorGrading';

interface ColorGradeSelectorProps {
    value?: string;
    onChange: (colorGradeId: string) => void;
    showPreview?: boolean;
    className?: string;
}

/**
 * 调色色块预览
 */
const ColorSwatch: React.FC<{ primary: string; secondary: string }> = ({ primary, secondary }) => (
    <div className="color-swatch" style={{
        display: 'inline-flex',
        width: '32px',
        height: '16px',
        borderRadius: '3px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.2)',
        marginRight: '8px',
        flexShrink: 0,
    }}>
        <div style={{ flex: 1, backgroundColor: primary }} />
        <div style={{ flex: 1, backgroundColor: secondary }} />
    </div>
);

/**
 * 调色选项
 */
const ColorOption: React.FC<{ preset: ColorGradePreset }> = ({ preset }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <ColorSwatch primary={preset.hex.primary} secondary={preset.hex.secondary} />
        <span>{preset.name}</span>
    </div>
);

/**
 * 调色风格选择器
 */
export const ColorGradeSelector: React.FC<ColorGradeSelectorProps> = ({
    value,
    onChange,
    showPreview = true,
    className = ''
}) => {
    // 按类别分组的预设
    const groupedPresets = useMemo(() => getPresetsByCategory(), []);

    // 当前选中的预设
    const currentPreset = useMemo(() => {
        if (!value) return null;
        for (const presets of Object.values(groupedPresets)) {
            const found = presets.find(p => p.id === value);
            if (found) return found;
        }
        return null;
    }, [value, groupedPresets]);

    return (
        <div className={`color-grade-selector ${className}`}>
            <label style={{
                display: 'block',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '4px'
            }}>
                调色风格
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* 预览色块 */}
                {showPreview && currentPreset && (
                    <ColorSwatch
                        primary={currentPreset.hex.primary}
                        secondary={currentPreset.hex.secondary}
                    />
                )}

                {/* 下拉选择器 */}
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        outline: 'none',
                    }}
                >
                    <option value="">自动推断</option>

                    {Object.entries(groupedPresets).map(([category, presets]) => (
                        <optgroup key={category} label={CATEGORY_NAMES[category] || category}>
                            {presets.map(preset => (
                                <option key={preset.id} value={preset.id}>
                                    {preset.name} ({preset.nameEn})
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            {/* 当前调色描述 */}
            {currentPreset && (
                <p style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.5)',
                    margin: '4px 0 0 0',
                    lineHeight: 1.4,
                }}>
                    {currentPreset.description}
                </p>
            )}
        </div>
    );
};

export default ColorGradeSelector;
