/**
 * 分镜时间轴组件
 * 提供专业级时间轴视图，支持拖拽、缩放、节奏曲线等
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { StoryboardPanel } from '../types';

// ============ 类型定义 ============

interface TimelineProps {
  panels: StoryboardPanel[];
  currentTime: number;
  totalDuration: number;
  onTimeChange?: (time: number) => void;
  onPanelSelect?: (panelId: string) => void;
  onPanelReorder?: (fromIndex: number, toIndex: number) => void;
  onPanelDurationChange?: (panelId: string, duration: number) => void;
  className?: string;
}

interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'marker' | 'rhythm';
  visible: boolean;
  locked: boolean;
  height: number;
}

interface Marker {
  id: string;
  time: number;
  label: string;
  color: string;
  type: 'scene' | 'beat' | 'note';
}

// ============ 常量 ============

const MIN_ZOOM = 10;   // 最小缩放 (px/秒)
const MAX_ZOOM = 200;  // 最大缩放 (px/秒)
const DEFAULT_ZOOM = 50;
const SNAP_THRESHOLD = 5; // 吸附阈值 (px)

// ============ 时间轴组件 ============

export const StoryboardTimeline: React.FC<TimelineProps> = ({
  panels,
  currentTime,
  totalDuration,
  onTimeChange,
  onPanelSelect,
  onPanelReorder,
  onPanelDurationChange,
  className = ''
}) => {
  // 状态
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'playhead' | 'panel' | 'resize' | null>(null);
  const [dragData, setDragData] = useState<any>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [showRhythmCurve, setShowRhythmCurve] = useState(true);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    { id: 'video', name: '视频轨', type: 'video', visible: true, locked: false, height: 80 },
    { id: 'rhythm', name: '节奏曲线', type: 'rhythm', visible: true, locked: true, height: 40 },
    { id: 'markers', name: '标记', type: 'marker', visible: true, locked: false, height: 30 }
  ]);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // 计算时间轴宽度
  const timelineWidth = useMemo(() => totalDuration * zoom, [totalDuration, zoom]);

  // 计算分镜位置
  const panelPositions = useMemo(() => {
    let currentPos = 0;
    return panels.map(panel => {
      const pos = currentPos;
      const width = (panel.duration || 3) * zoom;
      currentPos += width;
      return { id: panel.id, left: pos, width, duration: panel.duration || 3 };
    });
  }, [panels, zoom]);

  // 时间转像素
  const timeToPixel = useCallback((time: number) => time * zoom, [zoom]);

  // 像素转时间
  const pixelToTime = useCallback((pixel: number) => pixel / zoom, [zoom]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 24);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  // 缩放处理
  const handleZoom = useCallback((delta: number, centerX?: number) => {
    setZoom(prev => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
      
      // 保持缩放中心
      if (centerX !== undefined && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const timeAtCenter = pixelToTime(scrollLeft + centerX);
        const newScrollLeft = timeAtCenter * newZoom - centerX;
        setScrollLeft(Math.max(0, newScrollLeft));
      }
      
      return newZoom;
    });
  }, [pixelToTime, scrollLeft]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      const centerX = rect ? e.clientX - rect.left : undefined;
      handleZoom(-e.deltaY * 0.1, centerX);
    } else {
      setScrollLeft(prev => Math.max(0, prev + e.deltaX));
    }
  }, [handleZoom]);

  // 播放头拖拽
  const handlePlayheadDrag = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(totalDuration, pixelToTime(x)));
    onTimeChange?.(time);
  }, [scrollLeft, totalDuration, pixelToTime, onTimeChange]);

  // 鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'playhead' | 'panel' | 'resize', data?: any) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragData(data);
    
    if (type === 'playhead') {
      handlePlayheadDrag(e);
    }
  }, [handlePlayheadDrag]);

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    
    switch (dragType) {
      case 'playhead':
        const time = Math.max(0, Math.min(totalDuration, pixelToTime(x)));
        onTimeChange?.(time);
        break;
        
      case 'resize':
        if (dragData?.panelId) {
          const panelPos = panelPositions.find(p => p.id === dragData.panelId);
          if (panelPos) {
            const newWidth = Math.max(zoom * 0.5, x - panelPos.left);
            const newDuration = Math.max(0.5, pixelToTime(newWidth));
            onPanelDurationChange?.(dragData.panelId, Math.round(newDuration * 10) / 10);
          }
        }
        break;
    }
  }, [isDragging, dragType, dragData, scrollLeft, totalDuration, pixelToTime, zoom, panelPositions, onTimeChange, onPanelDurationChange]);

  // 鼠标释放
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setDragData(null);
  }, []);

  // 全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMouseMove(e as any);
      };
      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };
      
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 计算节奏曲线
  const rhythmCurve = useMemo(() => {
    if (!showRhythmCurve || panels.length < 2) return '';
    
    const points: { x: number; y: number }[] = [];
    let currentTime = 0;
    
    panels.forEach((panel, index) => {
      const duration = panel.duration || 3;
      // 节奏值：时长越短节奏越快
      const rhythmValue = Math.max(0, Math.min(1, 1 - (duration - 1) / 10));
      
      points.push({
        x: timeToPixel(currentTime),
        y: 35 - rhythmValue * 30
      });
      points.push({
        x: timeToPixel(currentTime + duration),
        y: 35 - rhythmValue * 30
      });
      
      currentTime += duration;
    });
    
    // 生成平滑曲线
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q ${cpX} ${prev.y} ${curr.x} ${curr.y}`;
    }
    
    return path;
  }, [panels, showRhythmCurve, timeToPixel]);

  // 渲染时间刻度
  const renderTimeRuler = () => {
    const marks: JSX.Element[] = [];
    const majorInterval = zoom >= 100 ? 1 : zoom >= 50 ? 2 : zoom >= 25 ? 5 : 10;
    const minorInterval = majorInterval / 4;
    
    for (let t = 0; t <= totalDuration; t += minorInterval) {
      const x = timeToPixel(t);
      const isMajor = t % majorInterval === 0;
      
      marks.push(
        <g key={t}>
          <line
            x1={x}
            y1={isMajor ? 0 : 15}
            x2={x}
            y2={25}
            stroke={isMajor ? '#374151' : '#9ca3af'}
            strokeWidth={isMajor ? 1 : 0.5}
          />
          {isMajor && (
            <text
              x={x + 3}
              y={12}
              fontSize="10"
              fill="#374151"
            >
              {formatTime(t)}
            </text>
          )}
        </g>
      );
    }
    
    return marks;
  };

  // 渲染分镜块
  const renderPanels = () => {
    return panelPositions.map((pos, index) => {
      const panel = panels[index];
      const isSelected = selectedPanelId === panel.id;
      
      return (
        <div
          key={panel.id}
          className={`absolute top-1 bottom-1 rounded-lg cursor-pointer transition-all ${
            isSelected
              ? 'ring-2 ring-blue-500 z-10'
              : 'hover:ring-1 hover:ring-blue-300'
          }`}
          style={{
            left: pos.left,
            width: pos.width,
            background: panel.imageUrl
              ? `url(${panel.imageUrl}) center/cover`
              : `linear-gradient(135deg, hsl(${(index * 30) % 360}, 70%, 60%), hsl(${(index * 30 + 30) % 360}, 70%, 50%))`
          }}
          onClick={() => {
            setSelectedPanelId(panel.id);
            onPanelSelect?.(panel.id);
          }}
        >
          {/* 分镜信息 */}
          <div className="absolute inset-0 bg-black/30 rounded-lg p-2 flex flex-col justify-between">
            <div className="text-white text-xs font-medium truncate">
              #{panel.panelNumber}
            </div>
            <div className="text-white/80 text-xs">
              {pos.duration.toFixed(1)}s
            </div>
          </div>
          
          {/* 调整手柄 */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/50"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e, 'resize', { panelId: panel.id });
            }}
          />
        </div>
      );
    });
  };

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          {/* 当前时间 */}
          <div className="text-white font-mono text-sm">
            {formatTime(currentTime)}
          </div>
          
          {/* 总时长 */}
          <div className="text-gray-400 text-sm">
            / {formatTime(totalDuration)}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 节奏曲线开关 */}
          <button
            onClick={() => setShowRhythmCurve(!showRhythmCurve)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              showRhythmCurve
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📈 节奏曲线
          </button>
          
          {/* 缩放控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoom(-10)}
              className="w-6 h-6 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              −
            </button>
            <div className="w-20 text-center text-gray-300 text-xs">
              {Math.round(zoom)}px/s
            </div>
            <button
              onClick={() => handleZoom(10)}
              className="w-6 h-6 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              +
            </button>
          </div>
          
          {/* 适应宽度 */}
          <button
            onClick={() => {
              if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth - 100;
                setZoom(containerWidth / totalDuration);
                setScrollLeft(0);
              }
            }}
            className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            适应
          </button>
        </div>
      </div>

      {/* 时间轴主体 */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden"
        onWheel={handleWheel}
        style={{ height: tracks.reduce((sum, t) => sum + (t.visible ? t.height : 0), 0) + 30 }}
      >
        <div
          ref={timelineRef}
          className="relative"
          style={{ width: timelineWidth + 100, minWidth: '100%' }}
          onMouseDown={(e) => handleMouseDown(e, 'playhead')}
        >
          {/* 时间刻度 */}
          <svg
            className="absolute top-0 left-0"
            width={timelineWidth + 100}
            height={25}
            style={{ transform: `translateX(-${scrollLeft}px)` }}
          >
            {renderTimeRuler()}
          </svg>

          {/* 轨道区域 */}
          <div className="absolute top-[25px] left-0 right-0" style={{ transform: `translateX(-${scrollLeft}px)` }}>
            {/* 视频轨 */}
            {tracks.find(t => t.id === 'video')?.visible && (
              <div
                className="relative bg-gray-800 border-b border-gray-700"
                style={{ height: tracks.find(t => t.id === 'video')?.height }}
              >
                {renderPanels()}
              </div>
            )}

            {/* 节奏曲线轨 */}
            {tracks.find(t => t.id === 'rhythm')?.visible && showRhythmCurve && (
              <div
                className="relative bg-gray-850 border-b border-gray-700"
                style={{ height: tracks.find(t => t.id === 'rhythm')?.height }}
              >
                <svg width={timelineWidth} height="100%" className="absolute inset-0">
                  {/* 背景网格 */}
                  <defs>
                    <pattern id="grid" width="50" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 10" fill="none" stroke="#374151" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* 节奏曲线 */}
                  <path
                    d={rhythmCurve}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  
                  {/* 曲线下方填充 */}
                  <path
                    d={`${rhythmCurve} L ${timelineWidth} 40 L 0 40 Z`}
                    fill="url(#rhythmGradient)"
                    opacity="0.3"
                  />
                  
                  <defs>
                    <linearGradient id="rhythmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}

            {/* 标记轨 */}
            {tracks.find(t => t.id === 'markers')?.visible && (
              <div
                className="relative bg-gray-800"
                style={{ height: tracks.find(t => t.id === 'markers')?.height }}
              >
                {markers.map(marker => (
                  <div
                    key={marker.id}
                    className="absolute top-1 px-2 py-0.5 text-xs rounded"
                    style={{
                      left: timeToPixel(marker.time),
                      backgroundColor: marker.color
                    }}
                  >
                    {marker.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 播放头 */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{
              left: timeToPixel(currentTime) - scrollLeft,
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
            }}
          >
            {/* 播放头顶部 */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
          </div>
        </div>
      </div>

      {/* 底部信息栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div>
          {panels.length} 个分镜 | 总时长 {formatTime(totalDuration)}
        </div>
        <div className="flex items-center gap-4">
          <span>平均时长: {(totalDuration / panels.length || 0).toFixed(1)}s</span>
          <span>帧率: 24fps</span>
        </div>
      </div>
    </div>
  );
};

export default StoryboardTimeline;
