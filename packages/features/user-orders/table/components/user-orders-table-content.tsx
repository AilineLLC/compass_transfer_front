'use client';

import { ShoppingCart, Eye, Calendar, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Skeleton } from '@shared/ui/data-display/skeleton';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import type { GetOrderDTO } from '@entities/orders/interface';
import { orderTypeLabels, orderStatusLabels, orderSubStatusLabels } from '@entities/orders';

interface ColumnVisibility {
  orderNumber: boolean;
  type: boolean;
  status: boolean;
  subStatus: boolean;
  initialPrice: boolean;
  finalPrice: boolean;
  createdAt: boolean;
  completedAt: boolean;
  scheduledTime: boolean;
  actions: boolean;
}

interface UserOrdersTableContentProps {
  orders: GetOrderDTO[];
  loading: boolean;
  columnVisibility: ColumnVisibility;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string, order: 'asc' | 'desc') => void;
  onViewDetails: (orderId: string, orderType: string) => void;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'InProgress':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
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

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
  }).format(price);
}

export function UserOrdersTableContent({
  orders,
  loading,
  columnVisibility,
  sortBy,
  sortOrder,
  onSortChange,
  onViewDetails,
}: UserOrdersTableContentProps) {
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
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border rounded-lg p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Заказы не найдены</h3>
            <p className="text-muted-foreground">У этого пользователя пока нет заказов или они не соответствуют фильтрам.</p>
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
              {columnVisibility.orderNumber && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('orderNumber')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Номер заказа
                    {getSortIcon('orderNumber')}
                  </Button>
                </th>
              )}
              {columnVisibility.type && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('type')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Тип
                    {getSortIcon('type')}
                  </Button>
                </th>
              )}
              {columnVisibility.status && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Статус
                    {getSortIcon('status')}
                  </Button>
                </th>
              )}
              {columnVisibility.subStatus && (
                <th className="text-left p-3 font-medium">Подстатус</th>
              )}
              {columnVisibility.initialPrice && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('initialPrice')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Начальная цена
                    {getSortIcon('initialPrice')}
                  </Button>
                </th>
              )}
              {columnVisibility.finalPrice && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('finalPrice')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Итоговая цена
                    {getSortIcon('finalPrice')}
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
              {columnVisibility.completedAt && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('completedAt')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Завершен
                    {getSortIcon('completedAt')}
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
                    Запланирован
                    {getSortIcon('scheduledTime')}
                  </Button>
                </th>
              )}
              {columnVisibility.actions && (
                <th className="text-left p-3 font-medium"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t hover:bg-muted/25">
                {columnVisibility.orderNumber && (
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">#{orderNumberToString(order.orderNumber)}</span>
                    </div>
                  </td>
                )}
                {columnVisibility.type && (
                  <td className="p-3">
                    <Badge variant="outline">
                      {orderTypeLabels[order.type] || order.type}
                    </Badge>
                  </td>
                )}
                {columnVisibility.status && (
                  <td className="p-3">
                    <Badge className={`${getStatusColor(order.status)} w-fit`}>
                      {orderStatusLabels[order.status] || order.status}
                    </Badge>
                  </td>
                )}
                {columnVisibility.subStatus && (
                  <td className="p-3">
                    {order.subStatus ? (
                      <Badge variant="outline" className="text-xs">
                        {orderSubStatusLabels[order.subStatus] || order.subStatus}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                {columnVisibility.initialPrice && (
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatPrice(order.initialPrice)}</span>
                    </div>
                  </td>
                )}
                {columnVisibility.finalPrice && (
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{formatPrice(order.finalPrice)}</span>
                    </div>
                  </td>
                )}
                {columnVisibility.createdAt && (
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(order.createdAt)}</span>
                    </div>
                  </td>
                )}
                {columnVisibility.completedAt && (
                  <td className="p-3">
                    {order.completedAt ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{formatDate(order.completedAt)}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                {columnVisibility.scheduledTime && (
                  <td className="p-3">
                    {order.scheduledTime ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">{formatDate(order.scheduledTime)}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                {columnVisibility.actions && (
                  <td className="p-3">
                    <Button
                      onClick={() => onViewDetails(order.id, order.type)}
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
