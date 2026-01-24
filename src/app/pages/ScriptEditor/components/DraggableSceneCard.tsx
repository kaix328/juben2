/**
 * 可拖拽的场景卡片包装组件
 */

import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import { SceneCard } from './SceneCard';
import type { ScriptScene, Dialogue } from '../types';

const ITEM_TYPE = 'SCENE_CARD';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface DraggableSceneCardProps {
  scene: ScriptScene;
  index: number;
  batchMode: boolean;
  isSelected: boolean;
  onToggleSelect: (sceneId: string) => void;
  onUpdate: (sceneId: string, updates: Partial<ScriptScene>) => void;
  onDelete: (sceneId: string) => void;
  onAddDialogue: (sceneId: string) => void;
  onUpdateDialogue: (sceneId: string, dialogueId: string, updates: Partial<Dialogue>) => void;
  onDeleteDialogue: (sceneId: string, dialogueId: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

export function DraggableSceneCard({
  scene,
  index,
  batchMode,
  isSelected,
  onToggleSelect,
  onUpdate,
  onDelete,
  onAddDialogue,
  onUpdateDialogue,
  onDeleteDialogue,
  onMove,
}: DraggableSceneCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: ITEM_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // 不要替换自己
      if (dragIndex === hoverIndex) {
        return;
      }

      // 确定矩形边界
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // 获取中点
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // 确定鼠标位置
      const clientOffset = monitor.getClientOffset();

      // 获取相对于悬停项顶部的像素
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // 只在鼠标越过一半项目高度时执行移动
      // 向下拖动时，只在光标低于 50% 时移动
      // 向上拖动时，只在光标高于 50% 时移动

      // 向下拖动
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // 向上拖动
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // 执行移动
      onMove(dragIndex, hoverIndex);

      // 注意：我们在这里改变监视器项，因为我们实际上在改变索引
      // 通常最好避免突变，但为了性能起见，这里是可以的
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      return { id: scene.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className="transition-opacity"
    >
      <SceneCard
        scene={scene}
        batchMode={batchMode}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddDialogue={onAddDialogue}
        onUpdateDialogue={onUpdateDialogue}
        onDeleteDialogue={onDeleteDialogue}
      />
    </div>
  );
}
