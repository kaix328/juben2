import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ZoomIn, ZoomOut, Maximize2, Filter, Sparkles, RefreshCw, Link as LinkIcon, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import type { RelationType } from '../hooks/useRelationGraph';
import { RelationEditDialog } from './asset-library/RelationEditDialog';
import { toast } from 'sonner';

interface RelationGraphDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Array<{
    id: string;
    label: string;
    type: 'character' | 'scene' | 'prop' | 'costume';
    data: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    type: RelationType;
    strength?: number;
    description?: string;
  }>;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onAutoAnalyze?: () => void;
  onRefresh?: () => void;
  isAnalyzing?: boolean;
  onAddRelation?: (relation: any) => void;
  onUpdateRelation?: (id: string, updates: any) => void;
  onDeleteRelation?: (id: string) => void;
  onClearRelations?: () => void;
}

export function RelationGraphDialog({
  open,
  onOpenChange,
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
  onAutoAnalyze,
  onRefresh,
  isAnalyzing = false,
  onAddRelation,
  onUpdateRelation,
  onDeleteRelation,
  onClearRelations,
}: RelationGraphDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 连线与编辑状态
  const [isConnecting, setIsConnecting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [editData, setEditData] = useState<any>({});
  const [connectionNodes, setConnectionNodes] = useState<{
    source?: { id: string; label: string; type: string };
    target?: { id: string; label: string; type: string };
  }>({});

  useEffect(() => {
    if (!open || !containerRef.current) return;

    // 过滤节点和边
    let filteredNodes = nodes;
    let filteredEdges = edges;

    if (filterType !== 'all') {
      filteredNodes = nodes.filter(n => n.type === filterType);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = edges.filter(e =>
        nodeIds.has(e.source) && nodeIds.has(e.target)
      );
    }

    // 转换为 vis-network 格式
    const visNodes = new DataSet(
      filteredNodes.map(node => ({
        id: node.id,
        label: node.label,
        shape: getNodeShape(node.type),
        color: getNodeColor(node.type),
        font: { size: 14, color: '#333' },
        size: 25,
      }))
    );

    const visEdges = new DataSet(
      filteredEdges.map(edge => ({
        id: edge.id,
        from: edge.source,
        to: edge.target,
        label: edge.label,
        arrows: 'to',
        color: { color: getEdgeColor(edge.type), opacity: edge.strength || 0.5 },
        width: (edge.strength || 0.5) * 3,
        font: { size: 10, align: 'middle' },
      }))
    );

    // 创建网络
    const options = {
      nodes: {
        borderWidth: 2,
        borderWidthSelected: 4,
        shadow: true,
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5,
        },
        shadow: true,
      },
      manipulation: {
        enabled: false, // 通过按钮手动触发
        addEdge: (data: any, callback: any) => {
          if (data.from === data.to) {
            toast.warning('不能连接到自身');
            callback(null);
            return;
          }

          const source = nodes.find(n => n.id === data.from);
          const target = nodes.find(n => n.id === data.to);

          if (source && target) {
            setConnectionNodes({ source, target });
            setEditMode('create');
            setEditData({});
            setShowEditDialog(true);
            setIsConnecting(false); // 连线完成后退出连线模式
            if (networkRef.current) {
              networkRef.current.disableEditMode();
            }
          }
          callback(null); // 不由 vis-network 直接添加，而是通过我们的对话框
        }
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09,
        },
        stabilization: {
          iterations: 200,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
        multiselect: false,
      },
      layout: {
        improvedLayout: true,
      },
    };

    networkRef.current = new Network(
      containerRef.current,
      { nodes: visNodes, edges: visEdges },
      options
    );

    // 事件监听
    networkRef.current.on('click', (params) => {
      // 节点点击
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          setSelectedNode(node);
          setSelectedEdgeId(null);
          onNodeClick?.(nodeId, node.type);
        }
      }
      // 边点击
      else if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        setSelectedEdgeId(edgeId);
        setSelectedNode(null);
        onEdgeClick?.(edgeId);
      }
      // 空白点击
      else {
        setSelectedNode(null);
        setSelectedEdgeId(null);
      }
    });

    // 双击编辑边
    networkRef.current.on('doubleClick', (params) => {
      if (params.edges.length > 0 && params.nodes.length === 0) {
        const edgeId = params.edges[0];
        const edge = edges.find(e => e.id === edgeId);
        if (edge && onUpdateRelation) {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);

          if (source && target) {
            setConnectionNodes({ source, target });
            setEditMode('edit');
            setEditData({
              relationType: edge.type,
              strength: edge.strength,
              description: edge.description
            });
            setShowEditDialog(true);
            setSelectedEdgeId(edgeId);
          }
        }
      }
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [open, nodes, edges, filterType, onNodeClick, onEdgeClick, onUpdateRelation]);

  // 处理连线模式切换
  const toggleConnectMode = () => {
    if (!networkRef.current) return;

    if (isConnecting) {
      networkRef.current.disableEditMode();
      setIsConnecting(false);
    } else {
      networkRef.current.addEdgeMode();
      setIsConnecting(true);
      toast.info('请拖拽连接两个节点');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedEdgeId && onDeleteRelation) {
      if (confirm('确定要删除这条关系吗？')) {
        onDeleteRelation(selectedEdgeId);
        setSelectedEdgeId(null);
      }
    }
  };

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.2 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 0.8 });
    }
  };

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>关系图谱</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {nodes.length} 个节点
              </Badge>
              <Badge variant="secondary">
                {edges.length} 个关系
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* 工具栏 */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="character">角色</SelectItem>
                <SelectItem value="scene">场景</SelectItem>
                <SelectItem value="prop">道具</SelectItem>
                <SelectItem value="costume">服装</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {onAddRelation && (
              <Button
                variant={isConnecting ? "default" : "outline"}
                size="sm"
                onClick={toggleConnectMode}
                className="gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                {isConnecting ? '取消连线' : '手动连线'}
              </Button>
            )}

            {selectedEdgeId && onDeleteRelation && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除关系
              </Button>
            )}

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {onAutoAnalyze && (
              <Button
                variant="default"
                size="sm"
                onClick={onAutoAnalyze}
                disabled={isAnalyzing}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isAnalyzing ? '分析中...' : '自动分析关系'}
              </Button>
            )}

            {onClearRelations && edges.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-muted-foreground hover:text-destructive"
              >
                清空图谱
              </Button>
            )}

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                刷新
              </Button>
            )}

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFit}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 图谱容器 */}
        <div className="flex">
          <div
            ref={containerRef}
            className="flex-1 bg-gray-50"
            style={{ height: '70vh' }}
          />

          {/* 侧边栏 - 显示选中节点信息 */}
          {selectedNode && (
            <div className="w-64 border-l p-4 overflow-y-auto">
              <h3 className="font-semibold mb-2">{selectedNode.label}</h3>
              <Badge variant="outline" className="mb-4">
                {getTypeLabel(selectedNode.type)}
              </Badge>

              {selectedNode.data.description && (
                <div className="text-sm text-gray-600 mb-4">
                  {selectedNode.data.description}
                </div>
              )}

              {selectedNode.data.tags && selectedNode.data.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">标签</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.data.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 编辑对话框 */}
        <RelationEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          initialData={editData}
          sourceNode={connectionNodes.source}
          targetNode={connectionNodes.target}
          mode={editMode}
          onConfirm={(data) => {
            if (editMode === 'create' && onAddRelation && connectionNodes.source && connectionNodes.target) {
              onAddRelation({
                ...data,
                fromId: connectionNodes.source.id,
                fromType: connectionNodes.source.type,
                toId: connectionNodes.target.id,
                toType: connectionNodes.target.type,
              });
              toast.success('关系已添加');
            } else if (editMode === 'edit' && onUpdateRelation && selectedEdgeId) {
              onUpdateRelation(selectedEdgeId, data);
              toast.success('关系已更新');
            }
          }}
        />

        {/* 图例 */}
        <div className="px-6 py-3 border-t bg-gray-50">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span>角色</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span>场景</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span>道具</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <span>服装</span>
            </div>
          </div>
        </div>

        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确定要清空所有关系吗？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作将删除当前项目下的所有关系数据。此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (onClearRelations) {
                    onClearRelations();
                    toast.success('关系图谱已清空');
                  }
                  setShowClearConfirm(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                确认清空
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function getNodeShape(type: string): string {
  const shapes: Record<string, string> = {
    character: 'dot',
    scene: 'square',
    prop: 'triangle',
    costume: 'diamond',
  };
  return shapes[type] || 'dot';
}

function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    character: '#3B82F6',
    scene: '#10B981',
    prop: '#F59E0B',
    costume: '#8B5CF6',
  };
  return colors[type] || '#6B7280';
}

function getEdgeColor(type: RelationType): string {
  const colors: Record<string, string> = {
    appears_in: '#10B981',
    uses: '#F59E0B',
    wears: '#8B5CF6',
    friend: '#3B82F6',
    enemy: '#EF4444',
    family: '#EC4899',
    lover: '#F43F5E',
    colleague: '#6366F1',
    master_student: '#14B8A6',
    related_to: '#6B7280',
  };
  return colors[type] || '#6B7280';
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    character: '角色',
    scene: '场景',
    prop: '道具',
    costume: '服装',
  };
  return labels[type] || type;
}
