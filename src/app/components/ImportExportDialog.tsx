/**
 * 项目导入导出对话框
 */
import React, { useState, useRef } from 'react';
import { Upload, Download, FileJson, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import {
  downloadProjectBackup,
  importProjectFromFile,
  type ImportResult,
} from '../utils/dataImportExport';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectTitle?: string;
  mode: 'import' | 'export';
  onImportSuccess?: (result: ImportResult) => void;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  mode,
  onImportSuccess,
}: ImportExportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const success = await downloadProjectBackup(projectId, {
        includeImages,
        compress: false,
      });

      if (success) {
        toast.success('项目导出成功');
        onOpenChange(false);
      } else {
        toast.error('导出失败，请重试');
      }
    } catch (error) {
      toast.error('导出失败: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        toast.error('请选择 JSON 文件');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const result = await importProjectFromFile(selectedFile);
      setImportResult(result);

      if (result.success) {
        toast.success(`项目 "${result.projectTitle}" 导入成功`);
        onImportSuccess?.(result);
      } else {
        toast.error('导入失败: ' + result.error);
      }
    } catch (error) {
      toast.error('导入失败: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'export' ? (
              <>
                <Download className="w-5 h-5 text-blue-600" />
                导出项目
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-green-600" />
                导入项目
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'export'
              ? `将 "${projectTitle}" 导出为 JSON 备份文件`
              : '从 JSON 备份文件恢复项目数据'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === 'export' ? (
            // 导出选项
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>包含图片数据</Label>
                  <p className="text-xs text-gray-500">
                    包含分镜图片会增加文件大小
                  </p>
                </div>
                <Switch
                  checked={includeImages}
                  onCheckedChange={setIncludeImages}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  导出内容包括：项目信息、所有章节、剧本、分镜、资源库、导演风格
                </p>
              </div>
            </div>
          ) : (
            // 导入选项
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileJson className="w-10 h-10 mx-auto text-green-600" />
                    <p className="font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="text-gray-600">点击选择或拖拽 JSON 文件</p>
                    <p className="text-xs text-gray-400">支持项目备份文件</p>
                  </div>
                )}
              </div>

              {importResult && (
                <div
                  className={`rounded-lg p-3 ${
                    importResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {importResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">导入成功</span>
                      </div>
                      <div className="text-sm text-green-600 space-y-1">
                        <p>项目: {importResult.projectTitle}</p>
                        <p>章节: {importResult.stats?.chapters} 个</p>
                        <p>剧本: {importResult.stats?.scripts} 个</p>
                        <p>分镜: {importResult.stats?.storyboards} 个</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span>{importResult.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importResult?.success ? '完成' : '取消'}
          </Button>
          {mode === 'export' ? (
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={isLoading || !selectedFile || importResult?.success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  导入
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImportExportDialog;
