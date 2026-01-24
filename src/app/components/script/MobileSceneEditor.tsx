/**
 * 移动端场景编辑器
 * 全屏编辑剧本场景
 */
import React, { useState } from 'react';
import { X, Save, MapPin, Clock, Users, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { ScriptScene, Dialogue } from '../../types';
import { toast } from 'sonner';

export interface MobileSceneEditorProps {
  scene: ScriptScene;
  sceneNumber: number;
  open: boolean;
  onClose: () => void;
  onUpdate: (scene: ScriptScene) => void;
}

/**
 * 移动端场景编辑器
 */
export function MobileSceneEditor({
  scene,
  sceneNumber,
  open,
  onClose,
  onUpdate,
}: MobileSceneEditorProps) {
  const [localScene, setLocalScene] = useState<ScriptScene>(scene);

  if (!open) return null;

  const handleSave = () => {
    onUpdate(localScene);
    toast.success('已保存');
    onClose();
  };

  const handleChange = (field: keyof ScriptScene, value: any) => {
    setLocalScene(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDialogue = () => {
    const newDialogue: Dialogue = {
      id: `dialogue-${Date.now()}`,
      character: '',
      lines: ''
    };
    setLocalScene(prev => ({
      ...prev,
      dialogues: [...(prev.dialogues || []), newDialogue]
    }));
  };

  const handleUpdateDialogue = (index: number, field: keyof Dialogue, value: any) => {
    setLocalScene(prev => ({
      ...prev,
      dialogues: prev.dialogues?.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  const handleDeleteDialogue = (index: number) => {
    setLocalScene(prev => ({
      ...prev,
      dialogues: prev.dialogues?.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-11 h-11"
          >
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">编辑场景 {sceneNumber}</h2>
            <p className="text-xs text-gray-500">{localScene.location || '未设置地点'}</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="gap-2 h-11 px-6"
        >
          <Save className="w-4 h-4" />
          保存
        </Button>
      </div>

      {/* 内容区 - 分标签页 */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full grid grid-cols-2 sticky top-0 z-10 bg-white">
            <TabsTrigger value="basic" className="py-3">
              <MapPin className="w-4 h-4 mr-2" />
              基础信息
            </TabsTrigger>
            <TabsTrigger value="dialogues" className="py-3">
              <MessageSquare className="w-4 h-4 mr-2" />
              对白
            </TabsTrigger>
          </TabsList>

          {/* 基础信息 */}
          <TabsContent value="basic" className="p-4 space-y-6">
            {/* 场景标题 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">场景标题</Label>
              <Input
                value={localScene.slugline || ''}
                onChange={(e) => handleChange('slugline', e.target.value)}
                className="h-12 text-base"
                placeholder="例如：INT. 咖啡厅 - 白天"
              />
            </div>

            {/* 地点 */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                地点
              </Label>
              <Input
                value={localScene.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                className="h-12 text-base"
                placeholder="咖啡厅"
              />
            </div>

            {/* 时间 */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                时间
              </Label>
              <Select 
                value={localScene.timeOfDay || '白天'} 
                onValueChange={(v) => handleChange('timeOfDay', v)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="白天">白天</SelectItem>
                  <SelectItem value="夜晚">夜晚</SelectItem>
                  <SelectItem value="黄昏">黄昏</SelectItem>
                  <SelectItem value="清晨">清晨</SelectItem>
                  <SelectItem value="傍晚">傍晚</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 场景类型 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">场景类型</Label>
              <Select 
                value={localScene.sceneType || 'INT'} 
                onValueChange={(v) => handleChange('sceneType', v)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INT">内景 (INT)</SelectItem>
                  <SelectItem value="EXT">外景 (EXT)</SelectItem>
                  <SelectItem value="INT/EXT">内外景 (INT/EXT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 场景描述 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">场景描述</Label>
              <Textarea
                value={localScene.action || ''}
                onChange={(e) => handleChange('action', e.target.value)}
                className="min-h-[150px] text-base"
                placeholder="描述场景的氛围、环境、人物动作等..."
              />
              <p className="text-sm text-gray-500">
                字数：{(localScene.action || '').length}
              </p>
            </div>

            {/* 角色列表 */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                出场角色
              </Label>
              <Input
                value={(localScene.characters || []).join(', ')}
                onChange={(e) => handleChange('characters', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="h-12 text-base"
                placeholder="角色名称，用逗号分隔"
              />
            </div>
          </TabsContent>

          {/* 对白 */}
          <TabsContent value="dialogues" className="p-4 space-y-4">
            {/* 对白列表 */}
            {localScene.dialogues && localScene.dialogues.length > 0 ? (
              <div className="space-y-4">
                {localScene.dialogues.map((dialogue, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">对白 {index + 1}</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDialogue(index)}
                        className="w-9 h-9 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* 角色名 */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">角色</Label>
                      <Input
                        value={dialogue.character}
                        onChange={(e) => handleUpdateDialogue(index, 'character', e.target.value)}
                        className="h-11 text-base"
                        placeholder="角色名"
                      />
                    </div>

                    {/* 对白类型 */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">类型</Label>
                      <Select 
                        value={dialogue.type || 'dialogue'} 
                        onValueChange={(v) => handleUpdateDialogue(index, 'type', v)}
                      >
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dialogue">对白</SelectItem>
                          <SelectItem value="parenthetical">旁白</SelectItem>
                          <SelectItem value="action">动作</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 对白内容 */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">内容</Label>
                      <Textarea
                        value={dialogue.lines}
                        onChange={(e) => handleUpdateDialogue(index, 'lines', e.target.value)}
                        className="min-h-[80px] text-base"
                        placeholder="输入对白内容..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>暂无对白</p>
                <p className="text-sm mt-1">点击下方按钮添加</p>
              </div>
            )}

            {/* 添加对白按钮 */}
            <Button
              onClick={handleAddDialogue}
              variant="outline"
              className="w-full h-12 gap-2"
            >
              <Plus className="w-4 h-4" />
              添加对白
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* 底部保存按钮 */}
      <div className="p-4 border-t bg-white sticky bottom-0">
        <Button
          onClick={handleSave}
          className="w-full h-12 text-base gap-2"
        >
          <Save className="w-5 h-5" />
          保存修改
        </Button>
      </div>
    </div>
  );
}

export default MobileSceneEditor;
