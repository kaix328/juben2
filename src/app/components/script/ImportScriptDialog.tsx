/**
 * 导入剧本对话框
 * 支持 Fountain、Final Draft XML、JSON、TXT 等格式
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Upload, FileText, FileCode, FileJson, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { importScriptFromFile, FORMAT_INFO, type ScriptFormat } from '../../utils/scriptFormats';
import type { ScriptScene } from '../../types';

interface ImportScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (scenes: ScriptScene[]) => void;
}

export function ImportScriptDialog({
  open,
  onOpenChange,
  onImport,
}: ImportScriptDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<ScriptFormat | null>(null);
  const [previewInfo, setPreviewInfo] = useState<{ scenes: number; characters: number } | null>(null);

  const supportedFormats = [
    {
      format: 'fountain' as ScriptFormat,
      icon: FileText,
      name: 'Fountain',
      description: '纯文本剧本格式，行业标准',
      extensions: ['.fountain', '.txt'],
      color: 'text-blue-500',
    },
    {
      format: 'fdx' as ScriptFormat,
      icon: FileCode,
      name: 'Final Draft',
      description: '最流行的专业编剧软件格式',
      extensions: ['.fdx', '.xml'],
      color: 'text-green-500',
    },
    {
      format: 'json' as ScriptFormat,
      icon: FileJson,
      name: 'JSON',
      description: '数据交换格式',
      extensions: ['.json'],
      color: 'text-purple-500',
    },
    {
      format: 'txt' as ScriptFormat,
      icon: FileText,
      name: '纯文本',
      description: '简单文本格式',
      extensions: ['.txt'],
      color: 'text-gray-500',
    },
  ];

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setDetectedFormat(null);
    setPreviewInfo(null);

    try {
      // 读取文件内容检测格式
      const content = await selectedFile.text();
      const { scriptConverter } = await import('../../utils/scriptFormats');
      const format = scriptConverter.detectFormat(content);
      setDetectedFormat(format);

      // 预览解析
      const parsed = scriptConverter.import(content, format);
      const sceneCount = parsed.elements.filter(e => e.type === 'scene_heading').length;
      const characterSet = new Set(
        parsed.elements.filter(e => e.type === 'character').map(e => e.content)
      );

      setPreviewInfo({
        scenes: sceneCount,
        characters: characterSet.size,
      });

      toast.success(`检测到 ${FORMAT_INFO[format].name} 格式`);
    } catch (error) {
      console.error('File preview failed:', error);
      toast.error('文件预览失败，但仍可尝试导入');
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) {
      toast.error('请选择文件');
      return;
    }

    setImporting(true);
    try {
      // 导入并解析
      const parsedScript = await importScriptFromFile(file);

      // 转换为内部格式
      const { generateId } = await import('../../utils/storage');
      const scenes: ScriptScene[] = [];
      let currentScene: Partial<ScriptScene> | null = null;
      let sceneNumber = 1;

      for (const element of parsedScript.elements) {
        switch (element.type) {
          case 'scene_heading':
            // 保存上一个场景
            if (currentScene) {
              scenes.push(currentScene as ScriptScene);
            }

            // 解析场景标题
            const match = element.content.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+(.+?)\s+-\s+(.+)$/i);
            const sceneType = match ? match[1].replace('.', '').toUpperCase() : 'INT';
            const location = match ? match[2].trim() : element.content;
            const timeOfDay = match ? match[3].trim() : '白天';

            currentScene = {
              id: generateId(),
              sceneNumber: sceneNumber++,
              episodeNumber: 1,
              location,
              timeOfDay,
              sceneType: sceneType as 'INT' | 'EXT',
              characters: [],
              action: '',
              dialogues: [],
              estimatedDuration: 15,
            };
            break;

          case 'action':
            if (currentScene) {
              currentScene.action = (currentScene.action || '') + element.content + '\n';
            }
            break;

          case 'character':
            if (currentScene && element.metadata?.dialogue) {
              const character = element.content;
              if (!currentScene.characters?.includes(character)) {
                currentScene.characters?.push(character);
              }

              // 添加对白
              for (const d of element.metadata.dialogue) {
                currentScene.dialogues?.push({
                  id: generateId(),
                  character,
                  lines: d.content,
                  parenthetical: d.type === 'parenthetical' ? d.content : undefined,
                });
              }
            }
            break;

          case 'transition':
            if (currentScene) {
              currentScene.transition = element.content;
            }
            break;

          case 'note':
            if (currentScene) {
              currentScene.notes = (currentScene.notes || '') + element.content + '\n';
            }
            break;
        }
      }

      // 保存最后一个场景
      if (currentScene) {
        scenes.push(currentScene as ScriptScene);
      }

      if (scenes.length === 0) {
        toast.error('未能解析出有效场景');
        return;
      }

      onImport(scenes);
      toast.success(`成功导入 ${scenes.length} 个场景`);
      onOpenChange(false);
      setFile(null);
      setDetectedFormat(null);
      setPreviewInfo(null);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('导入失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setImporting(false);
    }
  }, [file, onImport, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            导入剧本
          </DialogTitle>
          <DialogDescription>
            支持 Fountain、Final Draft XML、JSON 等专业剧本格式
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 支持的格式 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">支持的格式</Label>
            <div className="grid grid-cols-2 gap-3">
              {supportedFormats.map((format) => (
                <div
                  key={format.format}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50"
                >
                  <format.icon className={`w-5 h-5 mt-0.5 ${format.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{format.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{format.description}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {format.extensions.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 文件选择 */}
          <div className="space-y-3">
            <Label htmlFor="file-upload" className="text-base font-semibold">
              选择文件
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="file-upload"
                type="file"
                accept=".fountain,.fdx,.xml,.json,.txt"
                onChange={handleFileChange}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {/* 文件信息 */}
          {file && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-blue-900">已选择文件</p>
                  <p className="text-sm text-blue-700 mt-1 truncate">{file.name}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    大小: {(file.size / 1024).toFixed(2)} KB
                  </p>
                  {detectedFormat && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="default" className="text-xs">
                        {FORMAT_INFO[detectedFormat].name}
                      </Badge>
                      {previewInfo && (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            {previewInfo.scenes} 个场景
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {previewInfo.characters} 个角色
                          </Badge>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-medium mb-1">导入说明：</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>导入的剧本将替换当前所有场景</li>
                  <li>建议先备份当前剧本</li>
                  <li>Fountain 格式是推荐的纯文本格式</li>
                  <li>Final Draft 格式需要 .fdx 扩展名</li>
                  <li>导入后可能需要手动调整格式</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={!file || importing} className="gap-2">
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                开始导入
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
