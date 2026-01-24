import { useState } from 'react';
import { FileText, Search, Star, Download, Upload, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { AssetTemplate, AssetType } from '../hooks/useTemplateSystem';

interface TemplateLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: AssetTemplate[];
  categories: string[];
  onApply: (templateId: string) => void;
  onDelete?: (templateId: string) => void;
  onExport?: (templateId: string) => void;
  onImport?: (file: File) => void;
  onCreateFromCurrent?: () => void;
  type?: AssetType;
}

export function TemplateLibraryDialog({
  open,
  onOpenChange,
  templates,
  categories,
  onApply,
  onDelete,
  onExport,
  onImport,
  onCreateFromCurrent,
  type,
}: TemplateLibraryDialogProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<AssetTemplate | null>(null);

  // 过滤模板
  const filteredTemplates = templates.filter(t => {
    if (type && t.type !== type) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        t.name.toLowerCase().includes(keyword) ||
        t.description.toLowerCase().includes(keyword) ||
        t.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
    }
    return true;
  });

  // 按分类分组
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, AssetTemplate[]>);

  const handleApply = (templateId: string) => {
    onApply(templateId);
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            模板库
          </DialogTitle>
        </DialogHeader>

        {/* 工具栏 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索模板..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
          {onCreateFromCurrent && (
            <Button variant="outline" size="sm" onClick={onCreateFromCurrent}>
              <Plus className="w-4 h-4 mr-2" />
              从当前创建
            </Button>
          )}
          {onImport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('template-import')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                导入
              </Button>
              <input
                id="template-import"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
              />
            </>
          )}
        </div>

        {/* 分类标签 */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">全部</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* 模板列表 */}
        <div className="flex gap-4" style={{ height: '50vh' }}>
          <ScrollArea className="flex-1 pr-4">
            {Object.keys(groupedTemplates).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>未找到模板</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      {category}
                      <Badge variant="secondary" className="text-xs">
                        {categoryTemplates.length}
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryTemplates.map(template => (
                        <div
                          key={template.id}
                          className={`
                            border rounded-lg p-3 cursor-pointer transition-all
                            ${selectedTemplate?.id === template.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'hover:border-gray-300 hover:shadow-sm'
                            }
                          `}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{template.name}</h4>
                            {template.isBuiltIn && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* 详情面板 */}
          {selectedTemplate && (
            <div className="w-80 border-l pl-4 space-y-4">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{selectedTemplate.name}</h3>
                  {selectedTemplate.isBuiltIn && (
                    <Badge variant="outline" className="text-xs">
                      内置
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {selectedTemplate.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedTemplate.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">模板内容</h4>
                <div className="bg-gray-50 rounded p-3 text-xs space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(selectedTemplate.fields).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-gray-600">{key}:</span>
                      <div className="text-gray-700 mt-1">
                        {typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => handleApply(selectedTemplate.id)}
                >
                  应用模板
                </Button>
                <div className="flex gap-2">
                  {onExport && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onExport(selectedTemplate.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出
                    </Button>
                  )}
                  {onDelete && !selectedTemplate.isBuiltIn && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (confirm('确定要删除此模板吗？')) {
                          onDelete(selectedTemplate.id);
                          setSelectedTemplate(null);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </Button>
                  )}
                </div>
              </div>

              {selectedTemplate.usageCount > 0 && (
                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                  已使用 {selectedTemplate.usageCount} 次
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
