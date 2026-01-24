import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import type { RelationType, AssetRelation } from '../../hooks/useRelationGraph';

interface RelationEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<AssetRelation>;
    sourceNode?: { id: string; label: string; type: string };
    targetNode?: { id: string; label: string; type: string };
    mode: 'create' | 'edit';
    onConfirm: (data: Partial<AssetRelation>) => void;
}

const RELATION_TYPES: { value: RelationType; label: string }[] = [
    { value: 'appears_in', label: '出现在 (场景)' },
    { value: 'uses', label: '使用 (道具)' },
    { value: 'wears', label: '穿着 (服装)' },
    { value: 'friend', label: '朋友' },
    { value: 'enemy', label: '敌人' },
    { value: 'family', label: '家人' },
    { value: 'lover', label: '恋人' },
    { value: 'colleague', label: '同事' },
    { value: 'master_student', label: '师徒' },
    { value: 'related_to', label: '相关' },
];

export function RelationEditDialog({
    open,
    onOpenChange,
    initialData,
    sourceNode,
    targetNode,
    mode,
    onConfirm,
}: RelationEditDialogProps) {
    const [relationType, setRelationType] = useState<RelationType>('related_to');
    const [strength, setStrength] = useState<number>(0.5);
    const [description, setDescription] = useState<string>('');

    useEffect(() => {
        if (open) {
            setRelationType(initialData?.relationType || 'related_to');
            setStrength(initialData?.strength || 0.5);
            setDescription(initialData?.description || '');
        }
    }, [open, initialData]);

    const handleConfirm = () => {
        onConfirm({
            relationType,
            strength,
            description,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? '添加关系' : '编辑关系'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* 节点信息展示 */}
                    {mode === 'create' && sourceNode && targetNode && (
                        <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                            <span className="font-medium text-blue-600">{sourceNode.label}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-green-600">{targetNode.label}</span>
                        </div>
                    )}

                    {/* 关系类型 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            类型
                        </Label>
                        <Select
                            value={relationType}
                            onValueChange={(val) => setRelationType(val as RelationType)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RELATION_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 关系强度 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="strength" className="text-right">
                            强度
                        </Label>
                        <div className="col-span-3 space-y-2">
                            <Slider
                                value={[strength]}
                                onValueChange={([val]) => setStrength(val)}
                                max={1}
                                step={0.1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>弱</span>
                                <span>{strength.toFixed(1)}</span>
                                <span>强</span>
                            </div>
                        </div>
                    </div>

                    {/* 描述 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            描述
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="可选：描述关系细节"
                            className="col-span-3"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleConfirm}>
                        确定
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
