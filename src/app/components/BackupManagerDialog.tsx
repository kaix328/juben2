import { useState } from 'react';
import { Database, Download, Upload, Trash2, RotateCcw, HardDrive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface BackupManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backups: Array<{ key: string; backup: { timestamp: string; data: any; version: string } }>;
  onRestore: (backupKey: string) => void;
  onDelete: (backupKey: string) => void;
  onExport: (backupKey: string) => void;
  onImport: (file: File) => void;
  onCreateBackup: () => void;
  storageUsage?: {
    totalSizeMB: string;
    maxSizeMB: number;
    usagePercent: number;
  } | null;
}

export function BackupManagerDialog({
  open,
  onOpenChange,
  backups,
  onRestore,
  onDelete,
  onExport,
  onImport,
  onCreateBackup,
  storageUsage,
}: BackupManagerDialogProps) {
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = ''; // 重置input
    }
  };

  const handleRestore = (backupKey: string) => {
    if (confirm('确定要恢复此备份吗？当前数据将被替换。')) {
      onRestore(backupKey);
      onOpenChange(false);
    }
  };

  const handleDelete = (backupKey: string) => {
    if (confirm('确定要删除此备份吗？此操作不可撤销。')) {
      onDelete(backupKey);
      if (selectedBackup === backupKey) {
        setSelectedBackup(null);
      }
    }
  };

  // 按时间排序（最新的在前）
  const sortedBackups = [...backups].sort((a, b) => 
    new Date(b.backup.timestamp).getTime() - new Date(a.backup.timestamp).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            备份管理
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">
              共 {backups.length} 个备份
            </Badge>
          </div>
        </DialogHeader>

        {/* 存储使用情况 */}
        {storageUsage && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">存储使用情况</span>
              </div>
              <span className="font-medium">
                {storageUsage.totalSizeMB} MB / {storageUsage.maxSizeMB} MB
              </span>
            </div>
            <Progress value={storageUsage.usagePercent} className="h-2" />
            {storageUsage.usagePercent > 80 && (
              <p className="text-xs text-orange-600">
                ⚠️ 存储空间使用率较高，建议清理旧备份
              </p>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button onClick={onCreateBackup} size="sm" className="flex-1">
            <Database className="w-4 h-4 mr-2" />
            立即备份
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => document.getElementById('backup-import')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            导入备份
          </Button>
          <input
            id="backup-import"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* 备份列表 */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {sortedBackups.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无备份</p>
                <p className="text-xs mt-1">系统会每5分钟自动备份一次</p>
              </div>
            ) : (
              sortedBackups.map((item, index) => {
                const isSelected = selectedBackup === item.key;
                const isLatest = index === 0;

                return (
                  <div
                    key={item.key}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'}
                    `}
                    onClick={() => setSelectedBackup(item.key)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={isLatest ? "default" : "outline"}>
                          {isLatest ? '最新备份' : `备份 ${sortedBackups.length - index}`}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          v{item.backup.version}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExport(item.key);
                          }}
                          title="导出"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(item.key);
                          }}
                          title="恢复"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.key);
                          }}
                          disabled={isLatest}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        {formatDistanceToNow(new Date(item.backup.timestamp), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </div>
                      <div className="text-gray-400">
                        {new Date(item.backup.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>

                    {isSelected && item.backup.data && (
                      <div className="mt-3 pt-3 border-t space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">角色数量:</span>
                          <span className="font-medium">{item.backup.data.characters?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">场景数量:</span>
                          <span className="font-medium">{item.backup.data.scenes?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">道具数量:</span>
                          <span className="font-medium">{item.backup.data.props?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">服装数量:</span>
                          <span className="font-medium">{item.backup.data.costumes?.length || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
