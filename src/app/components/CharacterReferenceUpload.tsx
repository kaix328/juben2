/**
 * 角色参考图上传组件
 * 支持多图上传、预览、删除
 */
import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import type { Character } from '../../types';

interface CharacterReferenceUploadProps {
    character: Character;
    onUpdate: (updates: Partial<Character>) => void;
    maxImages?: number;
}

export function CharacterReferenceUpload({
    character,
    onUpdate,
    maxImages = 4
}: CharacterReferenceUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const referenceImages = character.referenceImages || [];

    // 处理文件上传
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        try {
            const newImages: string[] = [];

            for (let i = 0; i < Math.min(files.length, maxImages - referenceImages.length); i++) {
                const file = files[i];

                // 验证文件类型
                if (!file.type.startsWith('image/')) continue;

                // 验证文件大小（最大 5MB）
                if (file.size > 5 * 1024 * 1024) continue;

                // 转为 Base64
                const base64 = await fileToBase64(file);
                newImages.push(base64);
            }

            if (newImages.length > 0) {
                onUpdate({
                    referenceImages: [...referenceImages, ...newImages]
                });
            }
        } catch (error) {
            console.error('Failed to upload images:', error);
        } finally {
            setIsUploading(false);
            // 清空 input
            e.target.value = '';
        }
    }, [referenceImages, maxImages, onUpdate]);

    // 删除图片
    const handleRemoveImage = useCallback((index: number) => {
        const newImages = [...referenceImages];
        newImages.splice(index, 1);
        onUpdate({ referenceImages: newImages });
    }, [referenceImages, onUpdate]);

    // 更新 LoRA 设置
    const handleLoraChange = useCallback((model: string) => {
        onUpdate({ loraModel: model });
    }, [onUpdate]);

    const handleLoraWeightChange = useCallback((value: number[]) => {
        onUpdate({ loraWeight: value[0] });
    }, [onUpdate]);

    const handleIPAdapterWeightChange = useCallback((value: number[]) => {
        onUpdate({ ipAdapterWeight: value[0] });
    }, [onUpdate]);

    return (
        <div className="space-y-4">
            {/* 参考图上传区域 */}
            <div>
                <Label className="text-sm font-medium mb-2 block">
                    参考图片 ({referenceImages.length}/{maxImages})
                </Label>

                <div className="grid grid-cols-2 gap-2">
                    {/* 已上传的图片 */}
                    {referenceImages.map((img, index) => (
                        <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group"
                        >
                            <img
                                src={img}
                                alt={`参考图 ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {/* 上传按钮 */}
                    {referenceImages.length < maxImages && (
                        <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    <Plus className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">添加图片</span>
                                </>
                            )}
                        </label>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    💡 上传角色参考图可提高 AI 生成的一致性（支持 jpg/png，最大 5MB）
                </p>
            </div>

            {/* LoRA 模型设置 */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">LoRA / IP-Adapter 设置</Label>

                <div className="space-y-2">
                    <Label className="text-xs text-gray-500">LoRA 模型名称</Label>
                    <Input
                        placeholder="例如：character_lora_v1"
                        value={character.loraModel || ''}
                        onChange={(e) => handleLoraChange(e.target.value)}
                        className="text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label className="text-xs text-gray-500">LoRA 权重</Label>
                        <span className="text-xs text-purple-600 font-medium">
                            {(character.loraWeight ?? 0.8).toFixed(2)}
                        </span>
                    </div>
                    <Slider
                        value={[character.loraWeight ?? 0.8]}
                        onValueChange={handleLoraWeightChange}
                        min={0}
                        max={1}
                        step={0.05}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label className="text-xs text-gray-500">IP-Adapter 权重</Label>
                        <span className="text-xs text-purple-600 font-medium">
                            {(character.ipAdapterWeight ?? 0.5).toFixed(2)}
                        </span>
                    </div>
                    <Slider
                        value={[character.ipAdapterWeight ?? 0.5]}
                        onValueChange={handleIPAdapterWeightChange}
                        min={0}
                        max={1}
                        step={0.05}
                        className="w-full"
                    />
                </div>
            </div>

            {/* 触发词显示 */}
            {character.triggerWord && (
                <div className="p-2 bg-purple-50 rounded-lg">
                    <Label className="text-xs text-purple-600">触发词</Label>
                    <code className="block text-sm font-mono text-purple-800 mt-1">
                        {character.triggerWord}
                    </code>
                </div>
            )}
        </div>
    );
}

// 工具函数：文件转 Base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
