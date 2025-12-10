import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { Column } from "../../business-logic/request-management";

interface DraggableHeaderProps {
  column: Column;
  index: number;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

export const DraggableHeader: React.FC<DraggableHeaderProps> = ({ 
  column, 
  index, 
  onSort, 
  sortConfig, 
  onMove 
}) => {
  const ref = React.useRef<HTMLTableHeaderCellElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'tableColumn',
    item: { index, column },
    collect: (m) => ({ isDragging: m.isDragging() }),
  });
  const [, drop] = useDrop({
    accept: 'tableColumn',
    hover(item: { index: number }) {
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });
  drag(drop(ref));
  return (
    <th 
      ref={ref} 
      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div 
        onClick={() => column.isSortable && onSort(column.key)} 
        style={{ cursor: column.isSortable ? 'pointer' : 'default' }}
      >
        {column.title}
        {sortConfig && sortConfig.key === column.key && <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
      </div>
    </th>
  );
};