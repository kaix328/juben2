import { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';

interface BatchAddTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tags: string[]) => void;
  selectedCount: number;
  existingTags?: string[];
}

export function BatchAddTagDialog({
  open,
  onOpenChange,
  onConfirm,
  selectedCount,
  existingTags = [],
}: BatchAddTagDialogProps) {
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (selectedTags.includes(newTag.trim())) return;
    setSelectedTags([...selectedTags, newTag.trim()]);
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleConfirm = () => {
    if (selectedTags.length === 0) return;
    onConfirm(selectedTags);
    setSelectedTags([]);
    setNewTag('');
    onOpenChange(false);
  };

  const handleSelectExistingTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            批量添加标签
          </DialogTitle>
          <p className="text-sm text-gray-500">
            为选中的 {selectedCount} 个项目添加标签
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 输入新标签 */}
          <div className="space-y-2">
            <Label>添加新标签</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入标签名称..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 已选标签 */}
          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <Label>待添加的标签</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 现有标签（快速选择） */}
          {existingTags.length > 0 && (
            <div className="space-y-2">
              <Label>从现有标签中选择</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border max-h-40 overflow-y-auto">
                {existingTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => handleSelectExistingTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedTags.length === 0}
          >
            确定添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
