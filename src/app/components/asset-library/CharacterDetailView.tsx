/**
 * CharacterDetailView - 角色详情视图组件
 * 从 CharacterTab 拆分出来，负责显示单个角色的详细信息
 */
import { useState, useEffect, useRef } from 'react';
import {
    Users, Trash2, Tag, X,
    Sparkles, ArrowLeft, Copy, RotateCw, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { PromptEngine } from '../../utils/promptEngine';
import { enhanceCharacterDescription } from '../../utils/descriptionEnhancer';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { AssetUsagePanel } from '../AssetUsagePanel';
import { PromptTemplateSelector } from '../PromptTemplateSelector';
import { ClickableImage } from '../ImagePreviewDialog';
import { type UsageLocation } from '../../utils/assetTracker';
import type { Character, Project } from '../../types';

export interface CharacterDetailViewProps {
    character: Character;
    project?: Project | null;
    usageLocations: UsageLocation[];
    usageCount: number;
    onBack: () => void;
    onUpdate: (id: string, updates: Partial<Character>) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, type: 'character', tag: string) => void;
    onRemoveTag: (id: string, type: 'character', tag: string) => void;
    onGenerateFullBody: (id: string) => Promise<void>;
    onGenerateFace: (id: string) => Promise<void>;
}

export function CharacterDetailView({
    character,
    project,
    usageLocations,
    usageCount,
    onBack,
    onUpdate,
    onDelete,
    onAddTag,
    onRemoveTag,
    onGenerateFullBody,
    onGenerateFace,
}: CharacterDetailViewProps) {
    const [newTag, setNewTag] = useState('');
    
    // 🆕 描述变化检测
    const [lastDescription, setLastDescription] = useState(character.description);
    const [lastAppearance, setLastAppearance] = useState(character.appearance);
    const [showSyncWarning, setShowSyncWarning] = useState(false);
    const descriptionRef = useRef(character.description);
    const appearanceRef = useRef(character.appearance);

    // 检测描述变化
    useEffect(() => {
        const descChanged = character.description !== descriptionRef.current;
        const appearChanged = character.appearance !== appearanceRef.current;
        
        if ((descChanged || appearChanged) && (character.fullBodyPrompt || character.facePrompt)) {
            setShowSyncWarning(true);
        }
    }, [character.description, character.appearance, character.fullBodyPrompt, character.facePrompt]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('已复制到剪切板');
    };

    // 🆕 AI智能生成提示词（带描述增强）
    const handleAIGenerate = (type: 'fullBody' | 'face') => {
        // 1. 检查描述
        if (!character.description && !character.appearance) {
            toast.error('请先填写角色描述或外貌特征');
            return;
        }
        
        // 2. 检查导演风格（可选）
        if (!project?.directorStyle) {
            toast.warning('未设定导演风格，将使用默认风格生成');
        }
        
        // 3. 🆕 智能增强描述
        const enhancedDescription = enhanceCharacterDescription(
            character.description || '',
            character.appearance || ''
        );
        
        // 创建增强后的角色对象
        const enhancedCharacter = {
            ...character,
            description: enhancedDescription,
        };
        
        // 4. 生成提示词
        const engine = new PromptEngine(project?.directorStyle);
        let result;
        
        if (type === 'fullBody') {
            result = engine.forCharacterFullBody(enhancedCharacter);
            onUpdate(character.id, { fullBodyPrompt: result.positive });
            toast.success('✨ 全身图提示词已生成！已智能延展描述');
        } else {
            result = engine.forCharacterFace(enhancedCharacter);
            onUpdate(character.id, { facePrompt: result.positive });
            toast.success('✨ 脸部图提示词已生成！已智能延展描述');
        }
        
        // 5. 更新描述快照，隐藏同步警告
        descriptionRef.current = character.description;
        appearanceRef.current = character.appearance;
        setShowSyncWarning(false);
    };

    const handleOptimize = (type: 'fullBody' | 'face') => {
        if (!project?.directorStyle) {
            toast.error('未设定导演风格，无法优化');
            return;
        }
        const engine = new PromptEngine(project.directorStyle);
        let result;
        if (type === 'fullBody') {
            result = engine.forCharacterFullBody(character, character.fullBodyPrompt);
            onUpdate(character.id, { fullBodyPrompt: result.positive });
        } else {
            result = engine.forCharacterFace(character, character.facePrompt);
            onUpdate(character.id, { facePrompt: result.positive });
        }
        toast.success('提示词已根据导演风格优化');
    };

    const handleAddCharacterTag = () => {
        if (!newTag.trim()) return;
        onAddTag(character.id, 'character', newTag.trim());
        setNewTag('');
    };

    return (
        <div className="space-y-4">
            <Button
                variant="outline"
                onClick={onBack}
                className="gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                返回列表
            </Button>

            <div className="border rounded-lg p-6 bg-gray-50">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <Input
                            value={character.name}
                            onChange={(e) => onUpdate(character.id, { name: e.target.value })}
                            className="text-2xl font-bold mb-2 border-none bg-transparent p-0 h-auto focus-visible:ring-1"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(character.tags || []).map(tag => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                    {tag}
                                    <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                                        onClick={() => onRemoveTag(character.id, 'character', tag)}
                                    />
                                </Badge>
                            ))}
                            <div className="flex gap-1">
                                <Input
                                    placeholder="添加标签..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleAddCharacterTag();
                                    }}
                                    className="h-6 w-24 text-xs"
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={handleAddCharacterTag}
                                >
                                    <Tag className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            onDelete(character.id);
                            onBack();
                        }}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border space-y-4">
                            <h5 className="font-semibold text-gray-700">基本信息</h5>
                            
                            {/* 🆕 描述变化同步警告 */}
                            {showSyncWarning && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 text-xs">
                                        <p className="text-amber-800 font-medium mb-1">描述已修改</p>
                                        <p className="text-amber-700">建议重新生成提示词以保持一致性</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                                        onClick={() => setShowSyncWarning(false)}
                                    >
                                        忽略
                                    </Button>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label>角色描述</Label>
                                <Textarea
                                    value={character.description}
                                    onChange={(e) => onUpdate(character.id, { description: e.target.value })}
                                    rows={8}
                                    placeholder="描述角色的背景、故事、特点等..."
                                    className="max-h-60 overflow-y-auto"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>性格特征</Label>
                                    <Input
                                        value={character.personality || ''}
                                        onChange={(e) => onUpdate(character.id, { personality: e.target.value })}
                                        placeholder="如：开朗、冷静..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>外貌特征</Label>
                                    <Input
                                        value={character.appearance || ''}
                                        onChange={(e) => onUpdate(character.id, { appearance: e.target.value })}
                                        placeholder="如：金发碧眼、高大..."
                                    />
                                </div>
                            </div>
                        </div>

                        <AssetUsagePanel
                            usageLocations={usageLocations}
                            usageCount={usageCount}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">全身预览</Label>
                                {character.fullBodyPreview ? (
                                    <ClickableImage
                                        src={character.fullBodyPreview}
                                        alt={`${character.name} - 全身照`}
                                        className="w-full h-full object-cover"
                                        containerClassName="aspect-[9/16] bg-white rounded border border-blue-300 overflow-hidden"
                                        immediate
                                    />
                                ) : (
                                    <div className="aspect-[9/16] bg-white rounded border border-dashed border-blue-300 overflow-hidden flex items-center justify-center">
                                        <Users className="w-8 h-8 text-blue-200" />
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-7 gap-1 border-blue-300 text-blue-600"
                                    onClick={() => onGenerateFullBody(character.id)}
                                    disabled={character.isGeneratingFullBody}
                                >
                                    <Sparkles className="w-3 h-3" />
                                    {character.isGeneratingFullBody ? '...' : '生成全身照'}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">面部预览</Label>
                                {character.facePreview ? (
                                    <ClickableImage
                                        src={character.facePreview}
                                        alt={`${character.name} - 面部特写`}
                                        className="w-full h-full object-cover"
                                        containerClassName="aspect-[3/4] bg-white rounded border border-blue-300 overflow-hidden"
                                        immediate
                                    />
                                ) : (
                                    <div className="aspect-[3/4] bg-white rounded border border-dashed border-blue-300 overflow-hidden flex items-center justify-center">
                                        <Users className="w-8 h-8 text-blue-200" />
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-7 gap-1 border-blue-300 text-blue-600"
                                    onClick={() => onGenerateFace(character.id)}
                                    disabled={character.isGeneratingFace}
                                >
                                    <Sparkles className="w-3 h-3" />
                                    {character.isGeneratingFace ? '...' : '生成面部特写'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-blue-700">
                                <Sparkles className="w-4 h-4" />
                                AI 角色提示词
                            </Label>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs text-gray-400">全身照提示词 (Full Body)</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                onClick={() => handleAIGenerate('fullBody')}
                                                title="基于角色描述生成全新提示词"
                                            >
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                AI生成
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleOptimize('fullBody')}
                                                title="优化现有提示词"
                                            >
                                                <RotateCw className="w-3 h-3 mr-1" />
                                                智能优化
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-gray-500"
                                                onClick={() => handleCopy(character.fullBodyPrompt || '')}
                                            >
                                                <Copy className="w-3 h-3 mr-1" />
                                                复制
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={character.fullBodyPrompt || ''}
                                        onChange={(e) => onUpdate(character.id, { fullBodyPrompt: e.target.value })}
                                        rows={6}
                                        className="bg-white border-blue-100 text-xs"
                                    />
                                    <div className="mt-2 text-right">
                                        <PromptTemplateSelector
                                            type="character"
                                            subType="fullBody"
                                            onSelect={(template) => {
                                                const currentPrompt = character.fullBodyPrompt || '';
                                                onUpdate(character.id, {
                                                    fullBodyPrompt: currentPrompt ? `${currentPrompt}, ${template}` : template
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs text-gray-400">面部特写提示词 (Face Detail)</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                onClick={() => handleAIGenerate('face')}
                                                title="基于角色描述生成全新提示词"
                                            >
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                AI生成
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleOptimize('face')}
                                                title="优化现有提示词"
                                            >
                                                <RotateCw className="w-3 h-3 mr-1" />
                                                智能优化
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-gray-500"
                                                onClick={() => handleCopy(character.facePrompt || '')}
                                            >
                                                <Copy className="w-3 h-3 mr-1" />
                                                复制
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={character.facePrompt || ''}
                                        onChange={(e) => onUpdate(character.id, { facePrompt: e.target.value })}
                                        rows={6}
                                        className="bg-white border-blue-100 text-xs"
                                    />
                                    <div className="mt-2 text-right">
                                        <PromptTemplateSelector
                                            type="character"
                                            subType="face"
                                            onSelect={(template) => {
                                                const currentPrompt = character.facePrompt || '';
                                                onUpdate(character.id, {
                                                    facePrompt: currentPrompt ? `${currentPrompt}, ${template}` : template
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
