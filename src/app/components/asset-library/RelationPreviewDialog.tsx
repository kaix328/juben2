import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { AssetRelation } from '../../hooks/useRelationGraph';

interface RelationPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    relations: Partial<AssetRelation>[];
    onConfirm: (selectedRelations: Partial<AssetRelation>[]) => void;
}

export function RelationPreviewDialog({
    open,
    onOpenChange,
    relations,
    onConfirm,
}: RelationPreviewDialogProps) {
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
        new Set(relations.map((_, i) => i))
    );

    const handleToggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIndices(new Set(relations.map((_, i) => i)));
        } else {
            setSelectedIndices(new Set());
        }
    };

    const handleToggleOne = (index: number, checked: boolean) => {
        const newSet = new Set(selectedIndices);
        if (checked) {
            newSet.add(index);
        } else {
            newSet.delete(index);
        }
        setSelectedIndices(newSet);
    };

    const handleConfirm = () => {
        const selected = relations.filter((_, i) => selectedIndices.has(i));
        onConfirm(selected);
        onOpenChange(false);
    };

    const getRelationLabel = (type: string) => {
        const labels: Record<string, string> = {
            appears_in: '出现在',
            uses: '使用',
            wears: '穿着',
            friend: '朋友',
            enemy: '敌人',
            family: '家人',
            lover: '恋人',
            colleague: '同事',
            master_student: '师徒',
            related_to: '相关',
        };
        return labels[type] || type;
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            character: '角色',
            scene: '场景',
            prop: '道具',
            costume: '服装',
        };
        return labels[type] || type;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>确认添加关系</span>
                        <Badge variant="secondary">
                            已选 {selectedIndices.size} / {relations.length}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden border rounded-md">
                    <ScrollArea className="h-[50vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedIndices.size === relations.length}
                                            onCheckedChange={(checked) => handleToggleAll(!!checked)}
                                        />
                                    </TableHead>
                                    <TableHead>源节点</TableHead>
                                    <TableHead>关系类型</TableHead>
                                    <TableHead>目标节点</TableHead>
                                    <TableHead>可信度</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {relations.map((rel, index) => (
                                    <TableRow key={index} className="hover:bg-muted/50">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIndices.has(index)}
                                                onCheckedChange={(checked) => handleToggleOne(index, !!checked)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{/* 这里需要展示名称，但 Partial<AssetRelation> 中只有 ID。
                                                   在这个简化版本中，我们假设 relations 还没有 name 字段。
                                                   为了体验更好，调用方应该注入 name 或者我们在这里查 ID。
                                                   考虑到复杂性，我们先显示 ID 或者修改调用方传入更多信息。
                                                   
                                                   改进：修改 props relations 类型，使其包含 label 信息。
                                                */}
                                                    {/* 暂时显示 ID，稍后优化 */}
                                                    {(rel as any).fromLabel || rel.fromId}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{getTypeLabel(rel.fromType!)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{getRelationLabel(rel.relationType!)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{(rel as any).toLabel || rel.toId}</span>
                                                <span className="text-xs text-muted-foreground">{getTypeLabel(rel.toType!)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${(rel.strength || 0) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {Math.round((rel.strength || 0) * 100)}%
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleConfirm} disabled={selectedIndices.size === 0}>
                        确认添加 ({selectedIndices.size})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
