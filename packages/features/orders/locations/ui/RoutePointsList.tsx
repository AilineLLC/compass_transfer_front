'use client';

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
}

/**
 * Компонент для отображения списка точек маршрута
 */
export function RoutePointsList({
  routePoints,
  selectedPointIndex,
  isInstantOrder = false,
  onPointSelect,
  onPointClear,
  onAddIntermediatePoint
}: RoutePointsListProps) {

  console.log(routePoints)
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
          {/* Точки маршрута */}
          <div>
            {routePoints.map((point: RoutePoint, index: number) => (
              <RoutePointItem
                key={point.id}
                point={point}
                index={index}
                isSelected={selectedPointIndex === index}
                onSelect={onPointSelect}
                onClear={onPointClear}
              />
            ))}
          </div>

          {/* Добавить промежуточную точку - только для обычных заказов */}
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
