/**
 * 移动端全屏编辑器
 * 用于在手机上编辑分镜的全屏界面
 */
import React, { useState } from 'react';
import { X, Save, Camera, MessageSquare, Film, Clock, Users, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { StoryboardPanel } from '../../types';
import { toast } from 'sonner';

export interface MobileShotEditorProps {
  panel: StoryboardPanel;
  open: boolean;
  onClose: () => void;
  onUpdate: (params: Partial<StoryboardPanel>) => void;
  onGeneratePrompts?: () => void;
}

/**
 * 移动端全屏分镜编辑器
 */
export function MobileShotEditor({
  panel,
  open,
  onClose,
  onUpdate,
  onGeneratePrompts,
}: MobileShotEditorProps) {
  const [localPanel, setLocalPanel] = useState(panel);

  if (!open) return null;

  const handleSave = () => {
    onUpdate(localPanel);
    toast.success('已保存');
    onClose();
  };

  const handleChange = (field: keyof StoryboardPanel, value: any) => {
    setLocalPanel(prev => ({ ...prev, [field]: value }));
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
            <h2 className="text-lg font-bold">编辑分镜 #{panel.panelNumber}</h2>
            <p className="text-xs text-gray-500">{panel.shot}</p>
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
          <TabsList className="w-full grid grid-cols-3 sticky top-0 z-10 bg-white">
            <TabsTrigger value="basic" className="py-3">
              <Camera className="w-4 h-4 mr-2" />
              基础
            </TabsTrigger>
            <TabsTrigger value="dialogue" className="py-3">
              <MessageSquare className="w-4 h-4 mr-2" />
              对白
            </TabsTrigger>
            <TabsTrigger value="prompts" className="py-3">
              <Wand2 className="w-4 h-4 mr-2" />
              提示词
            </TabsTrigger>
          </TabsList>

          {/* 基础信息 */}
          <TabsContent value="basic" className="p-4 space-y-6">
            {/* 画面描述 */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Camera className="w-4 h-4" />
                画面描述
              </Label>
              <Textarea
                value={localPanel.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="min-h-[120px] text-base"
                placeholder="描述画面内容..."
              />
            </div>

            {/* 景别 */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Film className="w-4 h-4" />
                景别
              </Label>
              <Select 
                value={localPanel.shot} 
                onValueChange={(v) => handleChange('shot', v)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全景">全景 (WS)</SelectItem>
                  <SelectItem value="中景">中景 (MS)</SelectItem>
                  <SelectItem value="特写">特写 (CU)</SelectItem>
                  <SelectItem value="大特写">大特写 (ECU)</SelectItem>
                  <SelectItem value="远景">远景 (EWS)</SelectItem>
                  <SelectItem value="近景">近景 (MCU)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 角度 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">角度</Label>
              <Select 
                value={localPanel.angle} 
                onValueChange={(v) => handleChange('angle', v)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="平视">平视</SelectItem>
                  <SelectItem value="俯视">俯视</SelectItem>
                  <SelectItem value="仰视">仰视</SelectItem>
                  <SelectItem value="鸟瞰">鸟瞰</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 镜头运动 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">镜头运动</Label>
              <Select 
                value={localPanel.cameraMovement || '静止'} 
                onValueChange={(v) => handleChange('cameraMovement', v)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="静止">静止</SelectItem>
                  <SelectItem value="推">推</SelectItem>
                  <SelectItem value="拉">拉</SelectItem>
                  <SelectItem value="跟">跟</SelectItem>
                  <SelectItem value="摇">摇</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 时长 */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                时长（秒）
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                value={localPanel.duration || 3}
                onChange={(e) => handleChange('duration', parseFloat(e.target.value) || 3)}
                className="h-12 text-base"
              />
            </div>

            {/* 角色 */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                角色
              </Label>
              <Input
                value={(localPanel.characters || []).join(', ')}
                onChange={(e) => handleChange('characters', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="h-12 text-base"
                placeholder="角色名称，用逗号分隔"
              />
            </div>
          </TabsContent>

          {/* 对白 */}
          <TabsContent value="dialogue" className="p-4 space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                角色对白
              </Label>
              <Textarea
                value={localPanel.dialogue || ''}
                onChange={(e) => handleChange('dialogue', e.target.value)}
                className="min-h-[200px] text-base"
                placeholder="输入角色台词..."
              />
              <p className="text-sm text-gray-500">
                字数：{(localPanel.dialogue || '').length}
              </p>
            </div>

            {/* 音效 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">音效</Label>
              <Input
                value={(localPanel.soundEffects || []).join(', ')}
                onChange={(e) => handleChange('soundEffects', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="h-12 text-base"
                placeholder="脚步声, 风声..."
              />
            </div>

            {/* 背景音乐 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">背景音乐</Label>
              <Input
                value={localPanel.music || ''}
                onChange={(e) => handleChange('music', e.target.value)}
                className="h-12 text-base"
                placeholder="紧张氛围音乐..."
              />
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">备注</Label>
              <Textarea
                value={localPanel.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="min-h-[100px] text-base"
                placeholder="其他备注信息..."
              />
            </div>
          </TabsContent>

          {/* 提示词 */}
          <TabsContent value="prompts" className="p-4 space-y-6">
            {/* 刷新提示词按钮 */}
            {onGeneratePrompts && (
              <Button
                onClick={onGeneratePrompts}
                variant="outline"
                className="w-full h-12 gap-2"
              >
                <Wand2 className="w-4 h-4" />
                AI 生成提示词
              </Button>
            )}

            {/* 绘画提示词 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">绘画提示词</Label>
              <Textarea
                value={localPanel.aiPrompt || ''}
                onChange={(e) => handleChange('aiPrompt', e.target.value)}
                className="min-h-[150px] text-sm font-mono"
                placeholder="AI 绘图提示词..."
              />
              <p className="text-sm text-gray-500">
                字数：{(localPanel.aiPrompt || '').length}
              </p>
            </div>

            {/* 视频提示词 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">视频提示词</Label>
              <Textarea
                value={localPanel.aiVideoPrompt || ''}
                onChange={(e) => handleChange('aiVideoPrompt', e.target.value)}
                className="min-h-[150px] text-sm font-mono"
                placeholder="AI 视频提示词..."
              />
              <p className="text-sm text-gray-500">
                字数：{(localPanel.aiVideoPrompt || '').length}
              </p>
            </div>
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

export default MobileShotEditor;
