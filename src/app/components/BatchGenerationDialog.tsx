import React from 'react';
import { CheckCircle2, Circle, XCircle, Loader2, Pause, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

export interface BatchTask {
  id: string;
  type: 'character-full' | 'character-face' | 'scene-wide' | 'scene-medium' | 'scene-closeup' | 'prop' | 'costume';
  name: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
}

interface BatchGenerationDialogProps {
  open: boolean;
  tasks: BatchTask[];
  currentIndex: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export const BatchGenerationDialog: React.FC<BatchGenerationDialogProps> = ({
  open,
  tasks,
  currentIndex,
  isPaused,
  onPause,
  onResume,
  onCancel,
  onClose,
}) => {
  const successCount = tasks.filter(t => t.status === 'success').length;
  const failedCount = tasks.filter(t => t.status === 'failed').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const isCompleted = currentIndex >= tasks.length;
  const progress = tasks.length > 0 ? (currentIndex / tasks.length) * 100 : 0;

  // 获取任务类型的中文名称
  const getTypeLabel = (type: BatchTask['type']) => {
    const labels: Record<BatchTask['type'], string> = {
      'character-full': '角色全身图',
      'character-face': '角色头像',
      'scene-wide': '场景远景',
      'scene-medium': '场景中景',
      'scene-closeup': '场景特写',
      'prop': '道具',
      'costume': '服饰',
    };
    return labels[type];
  };

  // 获取状态图标
  const getStatusIcon = (status: BatchTask['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            批量生成进度 ({currentIndex}/{tasks.length})
          </DialogTitle>
          <DialogDescription>
            {isCompleted
              ? '批量生成已完成'
              : isPaused
              ? '批量生成已暂停'
              : '正在批量生成图片，请稍候...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 进度条 */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>进度: {Math.round(progress)}%</span>
              <span>
                成功: {successCount} | 失败: {failedCount} | 剩余: {pendingCount}
              </span>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-green-700">成功</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-red-700">失败</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
              <div className="text-sm text-gray-700">待处理</div>
            </div>
          </div>

          {/* 任务列表 */}
          <ScrollArea className="h-[300px] border rounded-lg p-3">
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    task.status === 'processing'
                      ? 'bg-blue-50 border border-blue-200'
                      : task.status === 'success'
                      ? 'bg-green-50 border border-green-100'
                      : task.status === 'failed'
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  {/* 状态图标 */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(task.status)}
                  </div>

                  {/* 任务信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {task.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(task.type)}
                      </Badge>
                    </div>
                    
                    {/* 状态文本 */}
                    {task.status === 'processing' && (
                      <div className="text-sm text-blue-600">正在生成...</div>
                    )}
                    {task.status === 'success' && (
                      <div className="text-sm text-green-600">生成成功</div>
                    )}
                    {task.status === 'failed' && (
                      <div className="text-sm text-red-600">
                        生成失败{task.error ? `: ${task.error}` : ''}
                      </div>
                    )}
                    {task.status === 'pending' && (
                      <div className="text-sm text-gray-500">等待中...</div>
                    )}
                  </div>

                  {/* 序号 */}
                  <div className="flex-shrink-0 text-sm text-gray-400">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          {!isCompleted ? (
            <>
              {isPaused ? (
                <Button onClick={onResume} variant="default">
                  继续
                </Button>
              ) : (
                <Button onClick={onPause} variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  暂停
                </Button>
              )}
              <Button onClick={onCancel} variant="destructive">
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
            </>
          ) : (
            <Button onClick={onClose} variant="default">
              关闭
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
