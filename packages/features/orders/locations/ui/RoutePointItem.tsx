'use client';

import { GripVertical, X } from 'lucide-react';
import type { DragEvent } from 'react';
import type { RoutePoint } from '@shared/components/map/types';
import { Button } from '@shared/ui/forms/button';
import { locationTypeIcons } from '@entities/locations/enums/LocationType.enum';

interface RoutePointItemProps {
  point: RoutePoint;
  index: number;
  isSelected: boolean;
  isDraggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onSelect: (index: number) => void;
  onClear?: (index: number) => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd?: () => void;
}

export function RoutePointItem({
  point,
  index,
  isSelected,
  isDraggable = false,
  isDragging = false,
  isDragOver = false,
  onSelect,
  onClear,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: RoutePointItemProps) {
  const getPointLabel = (p: RoutePoint, i: number) => {
    if (p.type === 'start') return 'A';
    if (p.type === 'end') return 'B';
    return String.fromCharCode(67 + i - 1);
  };

  const getPointColor = (p: RoutePoint) => {
    if (p.type === 'start') return 'bg-green-500';
    if (p.type === 'end') return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={isDraggable && onDragStart ? e => onDragStart(e, index) : undefined}
      onDragOver={isDraggable && onDragOver ? e => onDragOver(e, index) : undefined}
      onDrop={isDraggable && onDrop ? e => onDrop(e, index) : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
      className={[
        'p-2 transition-all border rounded',
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200',
        isDragging ? 'opacity-40' : '',
        isDragOver ? 'border-t-2 border-t-blue-500' : '',
        isDraggable ? 'cursor-grab active:cursor-grabbing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className='flex flex-col gap-1'>
        <div className='flex flex-row items-center gap-3'>
          {/* Drag handle для промежуточных точек */}
          {isDraggable ? (
            <GripVertical className='h-4 w-4 shrink-0 text-gray-400' />
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${getPointColor(point)}`}
            >
              {getPointLabel(point, index)}
            </div>
          )}

          {/* Иконка точки (для промежуточных рядом с ручкой) */}
          {isDraggable && (
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${getPointColor(point)}`}
            >
              {getPointLabel(point, index)}
            </div>
          )}

          {/* Информация о точке */}
          <div className='flex-1 min-w-0'>
            <p className='font-medium truncate'>{point.label}</p>
            {point.location ? (
              <p className='text-sm text-gray-600 flex items-center gap-1'>
                <span>
                  {locationTypeIcons[point.location.type as keyof typeof locationTypeIcons]}
                </span>
                <span className='truncate'>{point.location.name}</span>
              </p>
            ) : (
              <p className='text-sm text-gray-400'>Не выбрано</p>
            )}
          </div>

          {/* Действия */}
          <div className='flex items-center gap-2 shrink-0'>
            {point.location && point.location.name ? (
              <Button
                variant='outline'
                size='sm'
                onClick={() => onClear?.(index)}
                className='text-red-600 hover:text-red-700'
              >
                <X className='h-4 w-4' />
              </Button>
            ) : (
              <Button
                variant={isSelected ? 'default' : 'outline'}
                size='sm'
                onClick={() => onSelect(index)}
              >
                Выбрать
              </Button>
            )}
          </div>
        </div>

        {/* Адрес локации */}
        {point.location?.address && (
          <p className='text-xs text-gray-500 mt-1'>{point.location.address}</p>
        )}
      </div>
    </div>
  );
}
