'use client';

import { useState } from 'react';
import type { DragEvent } from 'react';
import { Navigation, Plus } from 'lucide-react';
import type { RoutePoint } from '@shared/components/map/types';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import { RoutePointItem } from './RoutePointItem';

interface RoutePointsListProps {
  routePoints: RoutePoint[];
  selectedPointIndex: number | null;
  isInstantOrder?: boolean;
  onPointSelect: (index: number) => void;
  onPointClear: (index: number) => void;
  onAddIntermediatePoint: () => void;
  onReorderPoints?: (fromIndex: number, toIndex: number) => void;
}

export function RoutePointsList({
  routePoints,
  selectedPointIndex,
  isInstantOrder = false,
  onPointSelect,
  onPointClear,
  onAddIntermediatePoint,
  onReorderPoints,
}: RoutePointsListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragStart = (_e: DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (routePoints[index]?.type === 'intermediate') {
      setDropIndex(index);
    }
  };

  const handleDrop = (_e: DragEvent<HTMLDivElement>, index: number) => {
    if (dragIndex !== null && dragIndex !== index && onReorderPoints) {
      onReorderPoints(dragIndex, index);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Navigation className='h-5 w-5' />
          Построение маршрута
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='space-y-1'>
            {(() => {
              let waypointCounter = 0;
              return routePoints.map((point: RoutePoint, index: number) => {
                const isIntermediate = point.type === 'intermediate';
                if (isIntermediate) waypointCounter++;
                const waypointNumber = waypointCounter;
                return (
                  <RoutePointItem
                    key={point.id}
                    point={point}
                    index={index}
                    waypointNumber={waypointNumber}
                    isSelected={selectedPointIndex === index}
                    isDraggable={isIntermediate && !!onReorderPoints}
                    isDragging={dragIndex === index}
                    isDragOver={dropIndex === index && dragIndex !== index}
                    onSelect={onPointSelect}
                    onClear={onPointClear}
                    onDragStart={isIntermediate ? handleDragStart : undefined}
                    onDragOver={isIntermediate ? handleDragOver : undefined}
                    onDrop={isIntermediate ? handleDrop : undefined}
                    onDragEnd={isIntermediate ? handleDragEnd : undefined}
                  />
                );
              });
            })()}
          </div>

          {!isInstantOrder && routePoints.length < 5 && (
            <Button variant='outline' onClick={onAddIntermediatePoint} className='w-full'>
              <Plus className='h-4 w-4 mr-2' />
              Добавить остановку
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
