/**
 * CharacterTab 组件测试
 * 覆盖拆分后的主入口组件和子组件
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterTab } from '../../app/components/asset-library/CharacterTab';
import { CharacterDetailView } from '../../app/components/asset-library/CharacterDetailView';
import { CharacterListView } from '../../app/components/asset-library/CharacterListView';
import { CharacterToolbar } from '../../app/components/asset-library/CharacterToolbar';
import type { Character, AssetLibrary } from '../../app/types';

// Mock 依赖
vi.mock('../../app/hooks/useBatchSelection', () => ({
    useBatchSelection: () => ({
        selectedIds: new Set<string>(),
        isBatchMode: false,
        toggleBatchMode: vi.fn(),
        toggleSelect: vi.fn(),
        selectAll: vi.fn(),
        clearSelection: vi.fn(),
        isSelected: () => false,
        selectedCount: 0,
    })
}));

vi.mock('../../app/hooks/useVersionHistory', () => ({
    useVersionHistory: () => ({
        getVersions: vi.fn(() => []),
        rollbackToVersion: vi.fn(),
        saveVersion: vi.fn(),
    })
}));

vi.mock('../../app/hooks/useAutoBackup', () => ({
    useAutoBackup: () => ({
        createBackup: vi.fn(),
        getBackups: vi.fn(() => []),
        restoreBackup: vi.fn(),
        deleteBackup: vi.fn(),
        exportBackup: vi.fn(),
        importBackup: vi.fn(),
        getStorageUsage: vi.fn(() => ({ used: 0, total: 100, percentage: 0 })),
    })
}));

vi.mock('../../app/hooks/useTemplateSystem', () => ({
    useTemplateSystem: () => ({
        getAllTemplates: vi.fn(() => []),
        getCategories: vi.fn(() => []),
        applyTemplate: vi.fn(),
        createTemplateFromAsset: vi.fn(),
        deleteTemplate: vi.fn(),
        exportTemplate: vi.fn(),
        importTemplate: vi.fn(),
    })
}));

vi.mock('../../app/hooks/useRelationGraph', () => ({
    useRelationGraph: () => ({
        exportGraphData: vi.fn(() => ({ nodes: [], edges: [] })),
        analyzeRelations: vi.fn(() => []),
        addRelation: vi.fn(),
        relations: [],
    })
}));

vi.mock('../../app/hooks/useAssetAnalytics', () => ({
    useAssetAnalytics: () => ({
        totalAssets: 0,
        completionRate: 0,
        topUsedAssets: [],
    })
}));

// 测试数据
const mockCharacter: Character = {
    id: 'char-1',
    name: '测试角色',
    description: '这是一个测试角色',
    appearance: '高大威猛',
    personality: '开朗',
    avatar: '',
    tags: ['主角'],
    createdAt: '2026-01-20',
    usageCount: 5,
};

const mockAssets: AssetLibrary = {
    projectId: 'test-project',
    characters: [mockCharacter],
    scenes: [],
    props: [],
    costumes: [],
};

const defaultProps = {
    assets: mockAssets,
    searchTerm: '',
    setSearchTerm: vi.fn(),
    selectedCharacterId: null,
    setSelectedCharacterId: vi.fn(),
    handleAddCharacter: vi.fn(),
    handleUpdateCharacter: vi.fn(),
    handleDeleteCharacter: vi.fn(),
    handleAddTag: vi.fn(),
    handleRemoveTag: vi.fn(),
    getCharacterUsageLocations: vi.fn(() => []),
    usageMap: new Map([['char-1', 5]]),
    handleGenerateCharacterFullBody: vi.fn(),
    handleGenerateCharacterFace: vi.fn(),
    projectId: 'test-project',
    project: null,
    onReorder: vi.fn(),
    groupBy: 'none' as const,
};

describe('CharacterToolbar', () => {
    const toolbarProps = {
        searchTerm: '',
        setSearchTerm: vi.fn(),
        searchFilters: null,
        isBatchMode: false,
        toggleBatchMode: vi.fn(),
        onShowAdvancedSearch: vi.fn(),
        onShowTemplateLibrary: vi.fn(),
        onShowRelationGraph: vi.fn(),
        onShowAnalytics: vi.fn(),
        onShowBackupManager: vi.fn(),
        onAddCharacter: vi.fn(),
        relationsCount: 0,
        showVersionHistoryButton: false,
    };

    it('应该渲染搜索框', () => {
        render(<CharacterToolbar {...toolbarProps} />);
        expect(screen.getByPlaceholderText('搜索角色...')).toBeInTheDocument();
    });

    it('应该渲染高级搜索按钮', () => {
        render(<CharacterToolbar {...toolbarProps} />);
        expect(screen.getByText('高级搜索')).toBeInTheDocument();
    });

    it('应该渲染批量操作按钮', () => {
        render(<CharacterToolbar {...toolbarProps} />);
        expect(screen.getByText('批量操作')).toBeInTheDocument();
    });

    it('应该渲染添加角色按钮', () => {
        render(<CharacterToolbar {...toolbarProps} />);
        expect(screen.getByText('添加角色')).toBeInTheDocument();
    });

    it('点击添加角色按钮应触发回调', () => {
        render(<CharacterToolbar {...toolbarProps} />);
        fireEvent.click(screen.getByText('添加角色'));
        expect(toolbarProps.onAddCharacter).toHaveBeenCalled();
    });

    it('搜索框输入应触发回调', () => {
        render(<CharacterToolbar {...toolbarProps} />);
        const input = screen.getByPlaceholderText('搜索角色...');
        fireEvent.change(input, { target: { value: '测试' } });
        expect(toolbarProps.setSearchTerm).toHaveBeenCalledWith('测试');
    });
});

describe('CharacterListView', () => {
    const listProps = {
        characters: [mockCharacter],
        usageMap: new Map([['char-1', 5]]),
        selectedCharacterId: null,
        isBatchMode: false,
        isSelected: () => false,
        toggleSelect: vi.fn(),
        groupBy: 'none' as const,
        draggedIndex: null,
        dragOverIndex: null,
        onDragStart: vi.fn(),
        onDragEnd: vi.fn(),
        onDragOver: vi.fn(),
        onDrop: vi.fn(),
        onSelectCharacter: vi.fn(),
        onDeleteCharacter: vi.fn(),
        onAddCharacter: vi.fn(),
        onGenerateFullBody: vi.fn(),
        onGenerateFace: vi.fn(),
    };

    it('应该渲染角色卡片', () => {
        render(<CharacterListView {...listProps} />);
        expect(screen.getByText('测试角色')).toBeInTheDocument();
    });

    it('空列表应该显示空状态', () => {
        render(<CharacterListView {...listProps} characters={[]} />);
        expect(screen.getByText('没有找到角色')).toBeInTheDocument();
    });

    it('点击角色卡片应触发选择回调', () => {
        render(<CharacterListView {...listProps} />);
        fireEvent.click(screen.getByText('测试角色'));
        expect(listProps.onSelectCharacter).toHaveBeenCalledWith('char-1');
    });

    it('批量模式下点击应触发切换选择', () => {
        render(<CharacterListView {...listProps} isBatchMode={true} />);
        fireEvent.click(screen.getByText('测试角色'));
        expect(listProps.toggleSelect).toHaveBeenCalledWith('char-1');
    });
});

describe('CharacterDetailView', () => {
    const detailProps = {
        character: mockCharacter,
        project: null,
        usageLocations: [],
        usageCount: 5,
        onBack: vi.fn(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
        onAddTag: vi.fn(),
        onRemoveTag: vi.fn(),
        onGenerateFullBody: vi.fn(),
        onGenerateFace: vi.fn(),
    };

    it('应该渲染角色名称', () => {
        render(<CharacterDetailView {...detailProps} />);
        expect(screen.getByDisplayValue('测试角色')).toBeInTheDocument();
    });

    it('应该渲染返回按钮', () => {
        render(<CharacterDetailView {...detailProps} />);
        expect(screen.getByText('返回列表')).toBeInTheDocument();
    });

    it('点击返回按钮应触发回调', () => {
        render(<CharacterDetailView {...detailProps} />);
        fireEvent.click(screen.getByText('返回列表'));
        expect(detailProps.onBack).toHaveBeenCalled();
    });

    it('应该显示标签', () => {
        render(<CharacterDetailView {...detailProps} />);
        expect(screen.getByText('主角')).toBeInTheDocument();
    });

    it('应该渲染生成按钮', () => {
        render(<CharacterDetailView {...detailProps} />);
        expect(screen.getByText('生成全身照')).toBeInTheDocument();
        expect(screen.getByText('生成面部特写')).toBeInTheDocument();
    });
});
