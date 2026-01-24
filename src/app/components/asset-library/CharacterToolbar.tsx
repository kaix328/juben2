/**
 * CharacterToolbar - 角色列表工具栏组件
 * 从 CharacterTab 拆分出来，负责搜索、过滤、批量操作等工具按钮
 */
import {
    Plus, Search, Filter,
    History, FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import type { AdvancedSearchFilters } from '../AdvancedSearchDialog';

export interface CharacterToolbarProps {
    // 搜索相关
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchFilters: AdvancedSearchFilters | null;

    // 批量操作
    isBatchMode: boolean;
    toggleBatchMode: () => void;

    // 弹窗控制
    onShowAdvancedSearch: () => void;
    onShowTemplateLibrary: () => void;
    onShowVersionHistory?: () => void;

    // 其他
    onAddCharacter: () => void;
    showVersionHistoryButton: boolean;
}

export function CharacterToolbar({
    searchTerm,
    setSearchTerm,
    searchFilters,
    isBatchMode,
    toggleBatchMode,
    onShowAdvancedSearch,
    onShowTemplateLibrary,
    onShowVersionHistory,
    onAddCharacter,
    showVersionHistoryButton,
}: CharacterToolbarProps) {
    return (
        <>
            {/* 功能按钮工具栏 (Top) */}
            <div className="flex items-center gap-2 mb-4">
                {showVersionHistoryButton && onShowVersionHistory && (
                    <Button variant="ghost" size="sm" onClick={onShowVersionHistory}>
                        <History className="w-4 h-4 mr-2" />
                        版本历史
                    </Button>
                )}

                {searchFilters && (
                    <Badge variant="secondary" className="ml-auto">
                        筛选中
                    </Badge>
                )}
            </div>

            {/* 搜索与操作工具栏 */}
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="搜索角色..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Button variant="outline" onClick={onShowAdvancedSearch} className="gap-2">
                    <Filter className="w-4 h-4" />
                    高级搜索
                </Button>

                <Button
                    variant={isBatchMode ? "default" : "outline"}
                    onClick={toggleBatchMode}
                >
                    批量操作
                </Button>

                <Button variant="outline" onClick={onShowTemplateLibrary} className="gap-2">
                    <FileText className="w-4 h-4" />
                    模板
                </Button>

                <Button onClick={onAddCharacter} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    添加角色
                </Button>
            </div>
        </>
    );
}
