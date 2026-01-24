import { useState } from 'react';
import { Users, Mountain, Package, Search, X, Sparkles, Copy, Info } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { AssetLibrary, Character, Scene, Prop } from '../../../types';
import { cn } from '../../../utils/classnames';
import { toast } from 'sonner';

interface ResourceSidebarProps {
    assets: AssetLibrary | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ResourceSidebar({ assets, open, onOpenChange }: ResourceSidebarProps) {
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<{ type: 'character' | 'scene' | 'prop'; data: Character | Scene | Prop } | null>(null);

    const filterAssets = (items: any[]) => {
        if (!search) return items;
        return items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    };

    const characters = filterAssets(assets?.characters || []);
    const scenes = filterAssets(assets?.scenes || []);
    const props = filterAssets(assets?.props || []);

    const handleItemClick = (type: 'character' | 'scene' | 'prop', item: Character | Scene | Prop) => {
        setSelectedItem({ type, data: item });
    };

    const handleCopyPrompt = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`已复制${label}`);
    };

    return (
        <>
            {/* 侧边栏模式 */}
            <div
                className={cn(
                    "flex-none h-full bg-white shadow-xl z-30 transition-all duration-300 ease-in-out overflow-hidden",
                    open ? "w-72 border-l opacity-100" : "w-0 border-l-0 opacity-0"
                )}
            >
                <div className="w-72 h-full flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            <h3 className="font-semibold text-gray-800">资源库</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="p-3 border-b">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                            <Input
                                placeholder="搜索资源..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-9 text-sm"
                            />
                        </div>
                    </div>

                    <Tabs defaultValue="characters" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-3 px-2 pt-2 bg-transparent">
                            <TabsTrigger value="characters" className="text-sm data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
                                <Users className="w-3.5 h-3.5 mr-1" />角色
                            </TabsTrigger>
                            <TabsTrigger value="scenes" className="text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                                <Mountain className="w-3.5 h-3.5 mr-1" />场景
                            </TabsTrigger>
                            <TabsTrigger value="props" className="text-sm data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                                <Package className="w-3.5 h-3.5 mr-1" />道具
                            </TabsTrigger>
                        </TabsList>

                        {/* 角色列表 */}
                        <TabsContent value="characters" className="flex-1 p-0 relative h-0 mt-0">
                            <ScrollArea className="h-full">
                                <div className="p-2 grid grid-cols-2 gap-2">
                                    {characters.map((char: Character) => (
                                        <div
                                            key={char.id}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/json', JSON.stringify({
                                                    type: 'character',
                                                    id: char.id,
                                                    name: char.name,
                                                    prompt: char.fullBodyPrompt || char.appearance, // 优先使用全身提示词
                                                    triggerWord: char.name
                                                }));
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            className="flex flex-col items-center p-2 rounded-lg border hover:bg-violet-50 hover:border-violet-200 cursor-grab active:cursor-grabbing transition-colors group bg-white relative text-center gap-1"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border">
                                                {char.avatar ? (
                                                    <img src={char.avatar} className="w-full h-full object-cover" alt={char.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-500">
                                                        <Users className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full min-w-0">
                                                <div className="font-medium text-xs truncate w-full">{char.name}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleItemClick('character', char);
                                                }}
                                            >
                                                <Info className="w-3 h-3 text-gray-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* 场景列表 */}
                        <TabsContent value="scenes" className="flex-1 p-0 relative h-0 mt-0">
                            <ScrollArea className="h-full">
                                <div className="p-2 grid grid-cols-2 gap-2">
                                    {scenes.map((scene: Scene) => (
                                        <div
                                            key={scene.id}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/json', JSON.stringify({
                                                    type: 'scene',
                                                    id: scene.id,
                                                    name: scene.name,
                                                    prompt: scene.widePrompt || scene.description,
                                                    triggerWord: scene.name
                                                }));
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            className="flex flex-col items-center p-2 rounded-lg border hover:bg-emerald-50 hover:border-emerald-200 cursor-grab active:cursor-grabbing transition-colors group bg-white relative text-center gap-1"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border">
                                                {scene.image ? (
                                                    <img src={scene.image} className="w-full h-full object-cover" alt={scene.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-500">
                                                        <Mountain className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full min-w-0">
                                                <div className="font-medium text-xs truncate w-full">{scene.name}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleItemClick('scene', scene);
                                                }}
                                            >
                                                <Info className="w-3 h-3 text-gray-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* 道具列表 */}
                        <TabsContent value="props" className="flex-1 p-0 relative h-0 mt-0">
                            <ScrollArea className="h-full">
                                <div className="p-2 grid grid-cols-2 gap-2">
                                    {props.map((prop: Prop) => (
                                        <div
                                            key={prop.id}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/json', JSON.stringify({
                                                    type: 'prop',
                                                    id: prop.id,
                                                    name: prop.name,
                                                    prompt: prop.aiPrompt || prop.description,
                                                    triggerWord: prop.name
                                                }));
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            className="flex flex-col items-center p-2 rounded-lg border hover:bg-orange-50 hover:border-orange-200 cursor-grab active:cursor-grabbing transition-colors group bg-white relative text-center gap-1"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border">
                                                {prop.preview ? (
                                                    <img src={prop.preview} className="w-full h-full object-cover" alt={prop.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-500">
                                                        <Package className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-full min-w-0">
                                                <div className="font-medium text-xs truncate w-full">{prop.name}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleItemClick('prop', prop);
                                                }}
                                            >
                                                <Info className="w-3 h-3 text-gray-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* 详情弹窗 */}
            {selectedItem && (
                <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <div className="flex items-start gap-4">
                                {/* 大图 */}
                                <div className={cn(
                                    "w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-white shadow-lg",
                                    selectedItem.type === 'character'
                                        ? "bg-gradient-to-br from-blue-100 to-violet-100"
                                        : "bg-gradient-to-br from-emerald-100 to-teal-100"
                                )}>
                                    {selectedItem.type === 'character' ? (
                                        (selectedItem.data as Character).avatar ? (
                                            <img src={(selectedItem.data as Character).avatar} className="w-full h-full object-cover" alt={selectedItem.data.name} />
                                        ) : (
                                            <Users className="w-12 h-12 text-violet-500" />
                                        )
                                    ) : selectedItem.type === 'scene' ? (
                                        (selectedItem.data as Scene).image ? (
                                            <img src={(selectedItem.data as Scene).image} className="w-full h-full object-cover" alt={selectedItem.data.name} />
                                        ) : (
                                            <Mountain className="w-12 h-12 text-emerald-500" />
                                        )
                                    ) : (
                                        (selectedItem.data as Prop).preview ? (
                                            <img src={(selectedItem.data as Prop).preview} className="w-full h-full object-cover" alt={selectedItem.data.name} />
                                        ) : (
                                            <Package className="w-12 h-12 text-orange-500" />
                                        )
                                    )}
                                </div>

                                <div className="flex-1">
                                    <DialogTitle className="text-2xl mb-2">{selectedItem.data.name}</DialogTitle>
                                    <Badge variant={selectedItem.type === 'character' ? 'default' : 'secondary'} className="mb-2">
                                        {selectedItem.type === 'character' ? '角色' : selectedItem.type === 'scene' ? '场景' : '道具'}
                                    </Badge>
                                    {selectedItem.data.description && (
                                        <DialogDescription className="text-base mt-2">
                                            {selectedItem.data.description}
                                        </DialogDescription>
                                    )}
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            {/* 角色特有信息 */}
                            {selectedItem.type === 'character' && (
                                <>
                                    {(selectedItem.data as Character).fullBodyPrompt && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-slate-700">全身照提示词</label>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCopyPrompt((selectedItem.data as Character).fullBodyPrompt || '', '全身照提示词')}
                                                    className="h-7 gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    复制
                                                </Button>
                                            </div>
                                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 max-h-32 overflow-y-auto">
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                    {(selectedItem.data as Character).fullBodyPrompt}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {(selectedItem.data as Character).facePrompt && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-slate-700">面部特写提示词</label>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCopyPrompt((selectedItem.data as Character).facePrompt || '', '面部特写提示词')}
                                                    className="h-7 gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    复制
                                                </Button>
                                            </div>
                                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 max-h-32 overflow-y-auto">
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                    {(selectedItem.data as Character).facePrompt}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* 场景特有信息 */}
                            {selectedItem.type === 'scene' && (
                                <>
                                    {((selectedItem.data as Scene).location || (selectedItem.data as Scene).environment) && (
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 mb-2 block">位置/环境</label>
                                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                                <p className="text-sm text-emerald-700">
                                                    {(selectedItem.data as Scene).location || (selectedItem.data as Scene).environment}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {(selectedItem.data as Scene).widePrompt && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-slate-700">全景提示词</label>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCopyPrompt((selectedItem.data as Scene).widePrompt || '', '全景提示词')}
                                                    className="h-7 gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    复制
                                                </Button>
                                            </div>
                                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 max-h-32 overflow-y-auto">
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                    {(selectedItem.data as Scene).widePrompt}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {(selectedItem.data as Scene).mediumPrompt && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-slate-700">中景提示词</label>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCopyPrompt((selectedItem.data as Scene).mediumPrompt || '', '中景提示词')}
                                                    className="h-7 gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    复制
                                                </Button>
                                            </div>
                                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 max-h-32 overflow-y-auto">
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                    {(selectedItem.data as Scene).mediumPrompt}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {(selectedItem.data as Scene).closeupPrompt && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-slate-700">特写提示词</label>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCopyPrompt((selectedItem.data as Scene).closeupPrompt || '', '特写提示词')}
                                                    className="h-7 gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    复制
                                                </Button>
                                            </div>
                                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 max-h-32 overflow-y-auto">
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                    {(selectedItem.data as Scene).closeupPrompt}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* 道具特有信息 */}
                            {selectedItem.type === 'prop' && (
                                <>
                                    {(selectedItem.data as Prop).aiPrompt && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-slate-700">AI 绘画提示词</label>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCopyPrompt((selectedItem.data as Prop).aiPrompt || '', 'AI 绘画提示词')}
                                                    className="h-7 gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    复制
                                                </Button>
                                            </div>
                                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 max-h-32 overflow-y-auto">
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                    {(selectedItem.data as Prop).aiPrompt}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
