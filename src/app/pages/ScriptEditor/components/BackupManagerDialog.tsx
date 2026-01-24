/**
 * 备份管理对话框组件
 * 显示所有备份，支持恢复和删除
 */

import { useState } from 'react';
import { Clock, Download, Trash2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import {
  getBackups,
  restoreBackup,
  deleteBackup,
  formatBackupTime,
  getBackupStats,
  type ScriptBackup,
} from '../../../utils/scriptBackup';
import type { Script } from '../../../types';

interface BackupManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
  onRestore: (script: Script) => void;
}

export function BackupManagerDialog({
  open,
  onOpenChange,
  chapterId,
  onRestore,
}: BackupManagerDialogProps) {
  const [backups, setBackups] = useState<ScriptBackup[]>(() => getBackups(chapterId));
  const [selectedBackup, setSelectedBackup] = useState<ScriptBackup | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  const stats = getBackupStats(chapterId);

  // 刷新备份列表
  const refreshBackups = () => {
    setBackups(getBackups(chapterId));
  };

  // 恢复备份
  const handleRestore = (backup: ScriptBackup) => {
    const script = restoreBackup(backup.id, chapterId);
    if (script) {
      onRestore(script);
      onOpenChange(false);
    }
  };

  // 删除备份
  const handleDelete = (backupId: string) => {
    setBackupToDelete(backupId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (backupToDelete) {
      deleteBackup(backupToDelete, chapterId);
      refreshBackups();
      setBackupToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              备份管理
            </DialogTitle>
            <DialogDescription>
              查看和恢复剧本的历史备份
            </DialogDescription>
          </DialogHeader>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">总备份数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.auto}</div>
              <div className="text-sm text-muted-foreground">自动备份</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.manual}</div>
              <div className="text-sm text-muted-foreground">手动备份</div>
            </div>
          </div>

          {/* 备份列表 */}
          <ScrollArea className="h-[400px] pr-4">
            {backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无备份</p>
                <p className="text-sm text-muted-foreground mt-2">
                  系统会每分钟自动备份一次
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      selectedBackup?.id === backup.id ? 'border-primary bg-muted/50' : ''
                    }`}
                    onClick={() => setSelectedBackup(backup)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={backup.type === 'auto' ? 'secondary' : 'default'}>
                            {backup.type === 'auto' ? '自动备份' : '手动备份'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatBackupTime(backup.timestamp)}
                          </span>
                        </div>
                        {backup.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {backup.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          场景数: {backup.script.scenes.length} | 
                          ID: {backup.id.slice(0, 8)}...
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(backup);
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          恢复
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(backup.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              最多保留最近 10 个备份
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除备份？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。删除后将无法恢复此备份。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
