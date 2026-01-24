/**
 * CharacterListView - 角色列表视图组件
 * 从 CharacterTab 拆分出来，负责显示角色卡片网格
 * 
 * 注意：虚拟滚动功能暂时禁用，待解决 react-window 导入问题后启用
 * TODO: 修复 react-window 导入问题后恢复虚拟滚动
 */
import { Users } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { CharacterCard } from './CharacterCard';
import type { Character } from '../../types';

export interface CharacterListViewProps {
    characters: Character[];
    usageMap: Map<string, number>;
    selectedCharacterId: string | null;

    // 批量操作
    isBatchMode: boolean;
    isSelected: (id: string) => boolean;
    toggleSelect: (id: string) => void;

    // 拖拽排序
    groupBy: 'none' | 'tags' | 'source';
    draggedIndex: number | null;
    dragOverIndex: number | null;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;

    // 事件处理
    onSelectCharacter: (id: string | null) => void;
    onDeleteCharacter: (id: string) => void;
    onAddCharacter: () => void;
    onGenerateFullBody: (id: string) => Promise<void>;
    onGenerateFace: (id: string) => Promise<void>;
}

// 渲染单个角色卡片的组件
interface CharacterCellProps {
    character: Character;
    index: number;
    usageMap: Map<string, number>;
    selectedCharacterId: string | null;
    isBatchMode: boolean;
    isSelected: (id: string) => boolean;
    toggleSelect: (id: string) => void;
    dragOverIndex: number | null;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    onSelectCharacter: (id: string | null) => void;
    onDeleteCharacter: (id: string) => void;
    onGenerateFullBody: (id: string) => Promise<void>;
    onGenerateFace: (id: string) => Promise<void>;
}

function CharacterCell({
    character,
    index,
    usageMap,
    selectedCharacterId,
    isBatchMode,
    isSelected,
    toggleSelect,
    dragOverIndex,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onSelectCharacter,
    onDeleteCharacter,
    onGenerateFullBody,
    onGenerateFace,
}: CharacterCellProps) {
    return (
        <div
            draggable={!isBatchMode}
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            className={`group relative cursor-pointer transition-all duration-200 ${dragOverIndex === index ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${isSelected(character.id) ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => {
                if (isBatchMode) {
                    toggleSelect(character.id);
                } else {
                    onSelectCharacter(character.id);
                }
            }}
        >
            {isBatchMode && (
                <div className="absolute top-2 left-2 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected(character.id)}
                        onChange={() => toggleSelect(character.id)}
                        className="w-5 h-5 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <CharacterCard
                character={character}
                isSelected={selectedCharacterId === character.id}
                isBatchSelected={isSelected(character.id)}
                isBatchMode={isBatchMode}
                usageCount={usageMap.get(character.id) || 0}
                onSelect={onSelectCharacter}
                onDelete={onDeleteCharacter}
                onGenerateFullBody={onGenerateFullBody}
                onGenerateFace={onGenerateFace}
            />
        </div>
    );
}

export function CharacterListView({
    characters,
    usageMap,
    selectedCharacterId,
    isBatchMode,
    isSelected,
    toggleSelect,
    groupBy,
    draggedIndex,
    dragOverIndex,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onSelectCharacter,
    onDeleteCharacter,
    onAddCharacter,
    onGenerateFullBody,
    onGenerateFace,
}: CharacterListViewProps) {
    // 未使用的参数，保留以备后续虚拟滚动实现
    void draggedIndex;

    if (characters.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="没有找到角色"
                description="请尝试调整搜索条件或添加新角色。"
                actionLabel="添加角色"
                onAction={onAddCharacter}
            />
        );
    }

    // 无分组时的渲染
    if (groupBy === 'none') {
        return (
            <div className="asset-grid asset-list-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {characters.map((char, index) => (
                    <CharacterCell
                        key={char.id}
                        character={char}
                        index={index}
                        usageMap={usageMap}
                        selectedCharacterId={selectedCharacterId}
                        isBatchMode={isBatchMode}
                        isSelected={isSelected}
                        toggleSelect={toggleSelect}
                        dragOverIndex={dragOverIndex}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        onSelectCharacter={onSelectCharacter}
                        onDeleteCharacter={onDeleteCharacter}
                        onGenerateFullBody={onGenerateFullBody}
                        onGenerateFace={onGenerateFace}
                    />
                ))}
            </div>
        );
    }

    // 分组显示
    const groups: { [key: string]: Character[] } = {};

    if (groupBy === 'source') {
        groups['从分镜同步'] = characters.filter(c => c.tags?.includes('从分镜同步'));
        groups['手动添加'] = characters.filter(c => !c.tags?.includes('从分镜同步'));
    } else if (groupBy === 'tags') {
        characters.forEach(char => {
            if (!char.tags || char.tags.length === 0) {
                if (!groups['未分类']) groups['未分类'] = [];
                groups['未分类'].push(char);
            } else {
                char.tags.forEach(tag => {
                    if (!groups[tag]) groups[tag] = [];
                    if (!groups[tag].find(c => c.id === char.id)) {
                        groups[tag].push(char);
                    }
                });
            }
        });
    }

    return (
        <div className="space-y-8">
            {Object.entries(groups).map(([groupName, groupCharacters]) => (
                groupCharacters.length > 0 && (
                    <div key={groupName}>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                            {groupName} ({groupCharacters.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupCharacters.map((char, index) => (
                                <CharacterCell
                                    key={char.id}
                                    character={char}
                                    index={index}
                                    usageMap={usageMap}
                                    selectedCharacterId={selectedCharacterId}
                                    isBatchMode={isBatchMode}
                                    isSelected={isSelected}
                                    toggleSelect={toggleSelect}
                                    dragOverIndex={null}
                                    onDragStart={onDragStart}
                                    onDragEnd={onDragEnd}
                                    onDragOver={onDragOver}
                                    onDrop={onDrop}
                                    onSelectCharacter={onSelectCharacter}
                                    onDeleteCharacter={onDeleteCharacter}
                                    onGenerateFullBody={onGenerateFullBody}
                                    onGenerateFace={onGenerateFace}
                                />
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}
