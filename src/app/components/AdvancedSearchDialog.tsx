import { useState } from 'react';
import { Search, Filter, X, Calendar, Image, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface AdvancedSearchFilters {
  keyword: string;
  tags: string[];
  hasImage: boolean | null;
  dateRange: {
    start: string;
    end: string;
  } | null;
  usageCount: {
    min: number;
    max: number;
  } | null;
  sortBy: 'name' | 'date' | 'usage';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (filters: AdvancedSearchFilters) => void;
  availableTags: string[];
  currentFilters?: Partial<AdvancedSearchFilters>;
}

export function AdvancedSearchDialog({
  open,
  onOpenChange,
  onSearch,
  availableTags,
  currentFilters = {},
}: AdvancedSearchDialogProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    keyword: currentFilters.keyword || '',
    tags: currentFilters.tags || [],
    hasImage: currentFilters.hasImage ?? null,
    dateRange: currentFilters.dateRange || null,
    usageCount: currentFilters.usageCount || null,
    sortBy: currentFilters.sortBy || 'name',
    sortOrder: currentFilters.sortOrder || 'asc',
  });

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      tags: [],
      hasImage: null,
      dateRange: null,
      usageCount: null,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  const handleSearch = () => {
    onSearch(filters);
    onOpenChange(false);
  };

  const activeFiltersCount = [
    filters.keyword,
    filters.tags.length > 0,
    filters.hasImage !== null,
    filters.dateRange !== null,
    filters.usageCount !== null,
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            高级搜索
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} 个筛选条件
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 关键词搜索 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              关键词
            </Label>
            <Input
              placeholder="搜索名称、描述..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </div>

          {/* 标签筛选 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              标签筛选
            </Label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border max-h-40 overflow-y-auto">
              {availableTags.length > 0 ? (
                availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-400">暂无标签</p>
              )}
            </div>
            {filters.tags.length > 0 && (
              <p className="text-xs text-gray-500">
                已选择 {filters.tags.length} 个标签
              </p>
            )}
          </div>

          {/* 图片筛选 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              图片状态
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.hasImage === true}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasImage: checked ? true : null })
                  }
                />
                <span className="text-sm">有图片</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.hasImage === false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasImage: checked ? false : null })
                  }
                />
                <span className="text-sm">无图片</span>
              </label>
            </div>
          </div>

          {/* 使用次数筛选 */}
          <div className="space-y-2">
            <Label>使用次数范围</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="最小"
                min={0}
                value={filters.usageCount?.min ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    usageCount: {
                      min: parseInt(e.target.value) || 0,
                      max: filters.usageCount?.max ?? 999,
                    },
                  })
                }
                className="w-24"
              />
              <span className="text-gray-400">-</span>
              <Input
                type="number"
                placeholder="最大"
                min={0}
                value={filters.usageCount?.max ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    usageCount: {
                      min: filters.usageCount?.min ?? 0,
                      max: parseInt(e.target.value) || 999,
                    },
                  })
                }
                className="w-24"
              />
            </div>
          </div>

          {/* 日期范围 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              创建日期
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.dateRange?.start ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: {
                      start: e.target.value,
                      end: filters.dateRange?.end ?? '',
                    },
                  })
                }
              />
              <span className="text-gray-400">至</span>
              <Input
                type="date"
                value={filters.dateRange?.end ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: {
                      start: filters.dateRange?.start ?? '',
                      end: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* 排序 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>排序方式</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">名称</SelectItem>
                  <SelectItem value="date">创建日期</SelectItem>
                  <SelectItem value="usage">使用次数</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>排序顺序</Label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value: any) => setFilters({ ...filters, sortOrder: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">升序</SelectItem>
                  <SelectItem value="desc">降序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <X className="w-4 h-4 mr-2" />
            重置
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              搜索
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
