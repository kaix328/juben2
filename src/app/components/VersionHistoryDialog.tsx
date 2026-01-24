import { useState } from 'react';
import { History, RotateCcw, Eye, Trash2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { AssetVersion } from '../hooks/useVersionHistory';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: AssetVersion[];
  onRollback: (versionId: string) => void;
  onCompare?: (version1: AssetVersion, version2: AssetVersion) => void;
  assetName: string;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  versions,
  onRollback,
  onCompare,
  assetName,
}: VersionHistoryDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[string | null, string | null]>([null, null]);

  const handleVersionClick = (versionId: string) => {
    if (compareMode) {
      if (compareVersions[0] === null) {
        setCompareVersions([versionId, null]);
      } else if (compareVersions[1] === null && compareVersions[0] !== versionId) {
        setCompareVersions([compareVersions[0], versionId]);
        // 触发对比
        const v1 = versions.find(v => v.id === compareVersions[0]);
        const v2 = versions.find(v => v.id === versionId);
        if (v1 && v2 && onCompare) {
          onCompare(v1, v2);
        }
      } else {
        setCompareVersions([versionId, null]);
      }
    } else {
      setSelectedVersion(versionId);
    }
  };

  const handleRollback = (versionId: string) => {
    if (confirm('确定要回滚到此版本吗？当前的修改将被保存为新版本。')) {
      onRollback(versionId);
      onOpenChange(false);
    }
  };

  const getChangedFields = (changes: any) => {
    return Object.keys(changes).filter(key => changes[key] !== undefined);
  };

  const formatFieldName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      name: '名称',
      description: '描述',
      appearance: '外貌',
      personality: '性格',
      fullBodyPrompt: '全身提示词',
      facePrompt: '面部提示词',
      location: '地点',
      environment: '环境',
      category: '类别',
      tags: '标签',
    };
    return fieldNames[field] || field;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            版本历史 - {assetName}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">
              共 {versions.length} 个版本
            </Badge>
            {compareMode && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                对比模式
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareVersions([null, null]);
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            {compareMode ? '退出对比' : '对比版本'}
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无版本历史</p>
              </div>
            ) : (
              versions.map((version, index) => {
                const isSelected = selectedVersion === version.id;
                const isCompareSelected = compareVersions.includes(version.id);
                const changedFields = getChangedFields(version.changes);

                return (
                  <div
                    key={version.id}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'}
                      ${isCompareSelected ? 'border-green-500 bg-green-50' : ''}
                    `}
                    onClick={() => handleVersionClick(version.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          {index === 0 ? '最新' : `版本 ${versions.length - index}`}
                        </Badge>
                        {version.description && (
                          <span className="text-sm text-gray-600">{version.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRollback(version.id);
                          }}
                          disabled={index === 0}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(version.timestamp), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                      <span className="text-gray-300">•</span>
                      <span>{new Date(version.timestamp).toLocaleString('zh-CN')}</span>
                    </div>

                    {changedFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {changedFields.map(field => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {formatFieldName(field)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-xs font-semibold text-gray-700">修改内容：</p>
                        {changedFields.map(field => (
                          <div key={field} className="text-xs">
                            <span className="font-medium text-gray-600">
                              {formatFieldName(field)}:
                            </span>
                            <div className="mt-1 p-2 bg-gray-50 rounded text-gray-700 max-h-20 overflow-y-auto">
                              {typeof version.changes[field] === 'object'
                                ? JSON.stringify(version.changes[field], null, 2)
                                : String(version.changes[field] || '(空)')}
                            </div>
                          </div>
                        ))}
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
