'use client';

import { Car, Eye, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Skeleton } from '@shared/ui/data-display/skeleton';
import { Button } from '@shared/ui/forms/button';
import { orderStatusLabels, orderSubStatusLabels } from '@entities/orders';
import { orderTypeLabels } from '@entities/orders/constants/order-status-labels';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import type { RideWithOrder } from '../hooks/use-user-rides-table';

interface ColumnVisibility {
  status: boolean;
  subStatus: boolean;
  orderNumber: boolean;
  orderType: boolean;
  price: boolean;
  flight: boolean;
  duration: boolean;
  createdAt: boolean;
  scheduledTime: boolean;
  actions: boolean;
}

interface UserRidesTableContentProps {
  rides: RideWithOrder[];
  loading: boolean;
  columnVisibility: ColumnVisibility;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string, order: 'asc' | 'desc') => void;
  onViewDetails: (rideId: string) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UserRidesTableContent({
  rides,
  loading,
  columnVisibility,
  sortBy,
  sortOrder,
  onSortChange,
  onViewDetails,
}: UserRidesTableContentProps) {
  const handleSort = (column: string) => {
    if (sortBy === column) {
      onSortChange(column, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }

    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="border rounded-lg">
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <div className="border rounded-lg p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Car className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Поездки не найдены</h3>
            <p className="text-muted-foreground">У этого пользователя пока нет поездок или они не соответствуют фильтрам.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columnVisibility.status && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Статус заказа
                    {getSortIcon('status')}
                  </Button>
                </th>
              )}
              {columnVisibility.subStatus && (
                <th className="text-left p-3 font-medium">Подстатус заказа</th>
              )}
              {columnVisibility.orderNumber && (
                <th className="text-left p-3 font-medium">№ Заказа</th>
              )}
              {columnVisibility.orderType && (
                <th className="text-left p-3 font-medium">Тип заказа</th>
              )}
              {columnVisibility.price && (
                <th className="text-left p-3 font-medium">Цена</th>
              )}
              {columnVisibility.flight && (
                <th className="text-left p-3 font-medium">Рейс</th>
              )}
              {columnVisibility.duration && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('duration')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Длительность
                    {getSortIcon('duration')}
                  </Button>
                </th>
              )}
              {columnVisibility.createdAt && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('createdAt')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Создан
                    {getSortIcon('createdAt')}
                  </Button>
                </th>
              )}
              {columnVisibility.scheduledTime && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('scheduledTime')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Запланировано
                    {getSortIcon('scheduledTime')}
                  </Button>
                </th>
              )}
              {columnVisibility.actions && (
                <th className="text-left p-3 font-medium" />
              )}
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => (
              <tr key={ride.id} className="border-t hover:bg-muted/25">
                {columnVisibility.status && (
                  <td className="p-3">
                    <Badge className="w-fit">
                      {ride.order?.status ? orderStatusLabels[ride.order.status] : '-'}
                    </Badge>
                  </td>
                )}
                {columnVisibility.subStatus && (
                  <td className="p-3">
                    <span className="text-sm">
                      {ride.order?.subStatus ? orderSubStatusLabels[ride.order.subStatus] : '-'}
                    </span>
                  </td>
                )}
                {columnVisibility.orderNumber && (
                  <td className="p-3">
                    <span className="text-sm font-medium">
                      {ride.order?.orderNumber ? orderNumberToString(ride.order.orderNumber) : '-'}
                    </span>
                  </td>
                )}
                {columnVisibility.orderType && (
                  <td className="p-3">
                    <span className="text-sm">
                      {ride.order?.type ? orderTypeLabels[ride.order.type] : '-'}
                    </span>
                  </td>
                )}
                {columnVisibility.price && (
                  <td className="p-3">
                    <span className="text-sm font-medium">
                      {ride.order?.initialPrice ? `${ride.order.initialPrice} сом` : '-'}
                    </span>
                  </td>
                )}
                {columnVisibility.flight && (
                  <td className="p-3">
                    <span className="text-sm">
                      {ride.order?.airFlight || ride.order?.flyReis || '-'}
                    </span>
                  </td>
                )}
                {columnVisibility.duration && (
                  <td className="p-3">
                    {ride.duration ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{ride.duration}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                {columnVisibility.createdAt && (
                  <td className="p-3">
                    {ride.order?.createdAt ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">{formatDate(ride.order.createdAt)}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                {columnVisibility.scheduledTime && (
                  <td className="p-3">
                    {ride.order?.scheduledTime ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{formatDate(ride.order.scheduledTime)}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                {columnVisibility.actions && (
                  <td className="p-3">
                    <Button
                      onClick={() => onViewDetails(ride.id)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Подробнее"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
