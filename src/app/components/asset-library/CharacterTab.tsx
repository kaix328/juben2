/**
 * CharacterTab - 角色标签页主组件
 * 重构后作为主入口，引用 CharacterDetailView、CharacterListView、CharacterToolbar 子组件
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import type { AssetLibrary, Character, Project } from '../../types';
import { type UsageLocation } from '../../utils/assetTracker';

// 子组件
import { CharacterDetailView } from './CharacterDetailView';
import { CharacterListView } from './CharacterListView';
import { CharacterToolbar } from './CharacterToolbar';

// Hooks
import { useBatchSelection } from '../../hooks/useBatchSelection';
import { useVersionHistory } from '../../hooks/useVersionHistory';
import { useTemplateSystem } from '../../hooks/useTemplateSystem';


// 对话框组件
import { BatchActionsBar } from '../BatchActionsBar';
import { BatchAddTagDialog } from '../BatchAddTagDialog';
import { AdvancedSearchDialog, type AdvancedSearchFilters } from '../AdvancedSearchDialog';
import { VersionHistoryDialog } from '../VersionHistoryDialog';
import { TemplateLibraryDialog } from '../TemplateLibraryDialog';

export interface CharacterTabProps {
    assets: AssetLibrary;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCharacterId: string | null;
    setSelectedCharacterId: (id: string | null) => void;
    handleAddCharacter: () => void;
    handleUpdateCharacter: (id: string, updates: Partial<Character>) => void;
    handleBatchUpdateCharacter: (updates: Record<string, Partial<Character>>) => void;
    handleDeleteCharacter: (id: string) => void;
    handleAddTag: (id: string, type: 'character' | 'scene' | 'prop' | 'costume', tag: string) => void;
    handleRemoveTag: (id: string, type: 'character' | 'scene' | 'prop' | 'costume', tag: string) => void;
    getCharacterUsageLocations: (character: Character) => UsageLocation[];
    usageMap: Map<string, number>;
    handleGenerateCharacterFullBody: (id: string) => Promise<void>;
    handleGenerateCharacterFace: (id: string) => Promise<void>;
    projectId: string;
    project?: Project | null;
    onReorder: (startIndex: number, endIndex: number) => void;
    groupBy?: 'none' | 'tags' | 'source';
}

export function CharacterTab({
    assets,
    searchTerm,
    setSearchTerm,
    selectedCharacterId,
    setSelectedCharacterId,
    handleAddCharacter,
    handleUpdateCharacter,
    handleBatchUpdateCharacter,
    handleDeleteCharacter,
    handleAddTag,
    handleRemoveTag,
    getCharacterUsageLocations,
    usageMap,
    handleGenerateCharacterFullBody,
    handleGenerateCharacterFace,
    projectId,
    project,
    onReorder,
    groupBy = 'none',
}: CharacterTabProps) {
    // ========== 状态管理 ==========
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    // 对话框状态
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [showBatchTagDialog, setShowBatchTagDialog] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

    const [searchFilters, setSearchFilters] = useState<AdvancedSearchFilters | null>(null);

    // ========== Hooks 初始化 ==========
    const {
        selectedIds,
        isBatchMode,
        toggleBatchMode,
        toggleSelect,
        selectAll,
        clearSelection,
        isSelected,
        selectedCount,
    } = useBatchSelection(assets.characters.length);

    const { getVersions, rollbackToVersion } = useVersionHistory(projectId);



    const {
        getAllTemplates,
        getCategories,
        applyTemplate,
        createTemplateFromAsset,
        deleteTemplate: deleteTemplateFunc,
        exportTemplate,
        importTemplate,
    } = useTemplateSystem(projectId);



    // ========== useRef 防止重复触发 ==========
    const cleanupExecutedRef = useRef(false);
    const handleUpdateCharacterRef = useRef(handleUpdateCharacter);

    useEffect(() => {
        handleUpdateCharacterRef.current = handleUpdateCharacter;
    }, [handleUpdateCharacter]);

    // 自动清理旧的 standardAppearance 字段
    useEffect(() => {
        if (cleanupExecutedRef.current || !assets.characters.length) return;

        const charactersNeedingCleanup = assets.characters.filter(char =>
            char.standardAppearance &&
            char.standardAppearance.trim() &&
            char.standardAppearance !== '默认外貌'
        );

        if (charactersNeedingCleanup.length > 0) {
            console.log(`Log: [AssetLibrary] 清理 ${charactersNeedingCleanup.length} 个角色的旧 standardAppearance 字段...`);
            cleanupExecutedRef.current = true;

            const updates: Record<string, Partial<Character>> = {};
            charactersNeedingCleanup.forEach(character => {
                updates[character.id] = { standardAppearance: '' };
            });

            handleBatchUpdateCharacter(updates);
        }
    }, [assets.characters.length]);

    // ========== 过滤逻辑 ==========
    const filteredCharacters = useMemo(() => {
        let result = assets.characters;

        if (searchFilters) {
            if (searchFilters.keyword) {
                result = result.filter(c =>
                    c.name.toLowerCase().includes(searchFilters.keyword.toLowerCase()) ||
                    (c.description || '').toLowerCase().includes(searchFilters.keyword.toLowerCase())
                );
            }

            if (searchFilters.tags.length > 0) {
                result = result.filter(c =>
                    c.tags?.some(tag => searchFilters.tags.includes(tag))
                );
            }

            if (searchFilters.hasImage !== null) {
                result = result.filter(c =>
                    searchFilters.hasImage
                        ? (c.fullBodyPreview || c.facePreview)
                        : (!c.fullBodyPreview && !c.facePreview)
                );
            }

            if (searchFilters.usageCount) {
                result = result.filter(c => {
                    const count = usageMap.get(c.id) || 0;
                    return count >= searchFilters.usageCount!.min && count <= searchFilters.usageCount!.max;
                });
            }

            result.sort((a, b) => {
                const order = searchFilters.sortOrder === 'asc' ? 1 : -1;
                if (searchFilters.sortBy === 'name') {
                    return a.name.localeCompare(b.name) * order;
                } else if (searchFilters.sortBy === 'usage') {
                    const aCount = usageMap.get(a.id) || 0;
                    const bCount = usageMap.get(b.id) || 0;
                    return (aCount - bCount) * order;
                }
                return 0;
            });
        } else if (searchTerm) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return result;
    }, [assets.characters, searchTerm, searchFilters, usageMap]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        assets.characters.forEach(c => c.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags);
    }, [assets.characters]);

    // ========== 事件处理 ==========
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        if (onReorder) {
            onReorder(draggedIndex, index);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };



    // 批量操作
    const handleBatchDelete = () => {
        if (confirm(`确定要删除选中的 ${selectedCount} 个角色吗？`)) {
            selectedIds.forEach(id => handleDeleteCharacter(id));
            clearSelection();
            toast.success(`已删除 ${selectedCount} 个角色`);
        }
    };

    const handleBatchAddTag = (tags: string[]) => {
        selectedIds.forEach(id => {
            const character = assets.characters.find(c => c.id === id);
            if (character) {
                const newTags = [...new Set([...(character.tags || []), ...tags])];
                handleUpdateCharacter(id, { tags: newTags });
            }
        });
        clearSelection();
        toast.success(`已为 ${selectedCount} 个角色添加标签`);
    };

    const handleBatchGenerateImages = async () => {
        toast.info(`开始为 ${selectedCount} 个角色生成图片...`);
        for (const id of Array.from(selectedIds)) {
            try {
                await handleGenerateCharacterFullBody(id);
                await handleGenerateCharacterFace(id);
            } catch (error) {
                console.error(`生成图片失败:`, error);
            }
        }
        clearSelection();
        toast.success('批量生成完成');
    };

    const handleApplyTemplate = (templateId: string) => {
        const templateData = applyTemplate<Character>(templateId);
        if (templateData) {
            handleAddCharacter();
            setTimeout(() => {
                const newCharacter = assets.characters[assets.characters.length - 1];
                if (newCharacter) {
                    handleUpdateCharacter(newCharacter.id, templateData);
                    toast.success('模板已应用');
                }
            }, 100);
        }
    };

    const handleCreateTemplateFromCurrent = () => {
        if (!selectedCharacterId) return;
        const character = assets.characters.find(c => c.id === selectedCharacterId);
        if (!character) return;

        const name = prompt('模板名称:');
        if (!name) return;
        const description = prompt('模板描述:');
        if (!description) return;
        const category = prompt('模板分类 (如: 现代都市、古装、科幻):');
        if (!category) return;

        createTemplateFromAsset(character, name, description, category, 'character');
        toast.success('模板已创建');
    };

    // ========== 渲染 ==========
    // 如果选中了角色，显示详情视图
    if (selectedCharacterId !== null) {
        const character = assets.characters.find(c => c.id === selectedCharacterId);
        if (!character) return null;

        return (
            <CharacterDetailView
                character={character}
                project={project}
                usageLocations={getCharacterUsageLocations(character)}
                usageCount={usageMap.get(character.id) || 0}
                onBack={() => setSelectedCharacterId(null)}
                onUpdate={handleUpdateCharacter}
                onDelete={handleDeleteCharacter}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onGenerateFullBody={handleGenerateCharacterFullBody}
                onGenerateFace={handleGenerateCharacterFace}
            />
        );
    }

    // 显示列表视图
    return (
        <>
            {/* 工具栏 */}
            <CharacterToolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchFilters={searchFilters}
                isBatchMode={isBatchMode}
                toggleBatchMode={toggleBatchMode}
                onShowAdvancedSearch={() => setShowAdvancedSearch(true)}
                onShowTemplateLibrary={() => setShowTemplateLibrary(true)}
                onShowVersionHistory={selectedCharacterId ? () => setShowVersionHistory(true) : undefined}
                onAddCharacter={handleAddCharacter}
                showVersionHistoryButton={!!selectedCharacterId}
            />

            {/* 批量操作栏 */}
            {isBatchMode && selectedCount > 0 && (
                <BatchActionsBar
                    selectedCount={selectedCount}
                    totalCount={assets.characters.length}
                    isAllSelected={selectedCount > 0 && selectedCount === assets.characters.length}
                    onSelectAll={() => selectAll(assets.characters.map(c => c.id))}
                    onClearSelection={clearSelection}
                    onBatchDelete={handleBatchDelete}
                    onBatchAddTag={() => setShowBatchTagDialog(true)}
                    onBatchGenerate={handleBatchGenerateImages}
                />
            )}

            {/* 角色列表 */}
            <CharacterListView
                characters={filteredCharacters}
                usageMap={usageMap}
                selectedCharacterId={selectedCharacterId}
                isBatchMode={isBatchMode}
                isSelected={isSelected}
                toggleSelect={toggleSelect}
                groupBy={groupBy}
                draggedIndex={draggedIndex}
                dragOverIndex={dragOverIndex}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onSelectCharacter={setSelectedCharacterId}
                onDeleteCharacter={handleDeleteCharacter}
                onAddCharacter={handleAddCharacter}
                onGenerateFullBody={handleGenerateCharacterFullBody}
                onGenerateFace={handleGenerateCharacterFace}
            />

            {/* ========== 对话框 ========== */}
            <AdvancedSearchDialog
                open={showAdvancedSearch}
                onOpenChange={setShowAdvancedSearch}
                availableTags={allTags || []}
                onSearch={(filters) => {
                    setSearchFilters(filters);
                    setShowAdvancedSearch(false);
                }}
            />

            <BatchAddTagDialog
                open={showBatchTagDialog}
                onOpenChange={setShowBatchTagDialog}
                onConfirm={handleBatchAddTag}
                existingTags={allTags}
                selectedCount={selectedCount}
            />

            <VersionHistoryDialog
                open={showVersionHistory}
                onOpenChange={setShowVersionHistory}
                assetName={assets.characters.find(c => c.id === selectedCharacterId)?.name || ''}
                versions={getVersions(selectedCharacterId || '')}
                onRollback={(versionId) => {
                    const data = rollbackToVersion(versionId, selectedCharacterId || '');
                    if (data && selectedCharacterId) {
                        handleUpdateCharacter(selectedCharacterId, data);
                        toast.success('已回滚到历史版本');
                    }
                }}
            />



            <TemplateLibraryDialog
                open={showTemplateLibrary}
                onOpenChange={setShowTemplateLibrary}
                templates={getAllTemplates('character')}
                categories={getCategories('character')}
                onApply={handleApplyTemplate}
                onDelete={deleteTemplateFunc}
                onExport={exportTemplate}
                onImport={async (file) => {
                    const importedTemplate = await importTemplate(file);
                    if (importedTemplate) {
                        toast.success('模板已导入');
                    }
                }}
                onCreateFromCurrent={selectedCharacterId ? handleCreateTemplateFromCurrent : undefined}
                type="character"
            />


        </>
    );
}
