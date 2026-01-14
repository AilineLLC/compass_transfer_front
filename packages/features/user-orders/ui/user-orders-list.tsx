'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ShoppingCart, Eye, Calendar, DollarSign } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { DataTable } from '@shared/ui/data-table';
import { Button } from '@shared/ui/forms/button';
import type { GetOrderDTO } from '@entities/orders/interface';
import { useUsdRate } from '@shared/hooks';
import { formatPriceWithUsd } from '@shared/utils/format-price-with-usd';

interface UserOrdersListProps {
  orders: GetOrderDTO[];
  isLoading: boolean;
  onViewDetails: (orderId: string) => void;
}

const getStatusColor = (status: string) => {
  const colors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Scheduled: 'bg-blue-100 text-blue-800',
    InProgress: 'bg-purple-100 text-purple-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
    Expired: 'bg-orange-100 text-orange-800',
  };
  
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const labels = {
    Pending: 'В ожидании',
    Scheduled: 'Запланирован',
    InProgress: 'В процессе',
    Completed: 'Завершен',
    Cancelled: 'Отменен',
    Expired: 'Просрочен',
  };
  
  return labels[status as keyof typeof labels] || status;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function UserOrdersList({ orders, isLoading, onViewDetails }: UserOrdersListProps) {
  const usdRate = useUsdRate();
  const columns: ColumnDef<GetOrderDTO>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Номер заказа',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <ShoppingCart className='h-4 w-4 text-blue-600' />
          <span className='font-medium'>#{row.original.orderNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <div className='flex flex-col gap-1'>
          <Badge className={`${getStatusColor(row.original.status)} w-fit`}>
            {getStatusLabel(row.original.status)}
          </Badge>
          {row.original.subStatus && (
            <Badge variant='outline' className='text-xs w-fit'>
              {row.original.subStatus}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Создан',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm'>{formatDate(row.original.createdAt)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'initialPrice',
      header: 'Стоимость',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
          <div className='flex flex-col'>
            <span className='text-sm font-medium'>
              {row.original.finalPrice 
                ? formatPriceWithUsd(row.original.finalPrice, usdRate) 
                : formatPriceWithUsd(row.original.initialPrice, usdRate)}
            </span>
            {row.original.finalPrice && row.original.finalPrice !== row.original.initialPrice && (
              <span className='text-xs text-muted-foreground'>
                (было {formatPriceWithUsd(row.original.initialPrice, usdRate)})
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <Button
          onClick={() => onViewDetails(row.original.id)}
          variant='outline'
          size='sm'
          className='gap-2'
        >
          <Eye className='h-4 w-4' />
          Подробнее
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      isLoading={isLoading}
      emptyState={{
        icon: ShoppingCart,
        title: 'Заказы не найдены',
        description: 'У этого пользователя пока нет заказов.',
      }}
    />
  );
}
