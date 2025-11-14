'use client';

import { Edit, Trash2, ChevronUp, ChevronDown, MoreHorizontal, Eye } from 'lucide-react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import React from 'react';
import { Badge } from '@shared/ui/data-display/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/data-display/table';
import { Button } from '@shared/ui/forms/button';
import { DeleteConfirmationModal } from '@shared/ui/modals';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import { useUserRole } from '@shared/contexts';
import { type GetOrderDTO, type OrderStatus, type OrderSubStatus, type OrderType, orderTypeLabels, orderStatusLabels, orderSubStatusLabels, orderStatusColors, getOrderEditRoute, getOrderViewRoute } from '@entities/orders';
import { Role } from '@entities/users/enums';
import { useDeleteOrder } from '@features/orders/hooks/use-delete-order';

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

interface OrdersTableContentProps {
  paginatedOrders: GetOrderDTO[];
  columnVisibility: ColumnVisibility;
  router: AppRouterInstance;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  onDeleteOrder?: (order: GetOrderDTO) => void;
  onRefetch?: () => void;
}

// Компонент для сортируемых заголовков
interface SortableHeaderProps {
  field: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  children: React.ReactNode;
}

function SortableHeader({ field, sortBy, sortOrder, onSort, children }: SortableHeaderProps) {
  const isActive = sortBy === field;

  return (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && (
          sortOrder === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );
}



export function OrdersTableContent({
  paginatedOrders,
  columnVisibility,
  router,
  sortBy,
  sortOrder,
  handleSort,
  onDeleteOrder,
  onRefetch,
}: OrdersTableContentProps) {
  const { userRole } = useUserRole();
  const {
    isModalOpen,
    orderToDelete,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    getDeleteModalProps,
  } = useDeleteOrder({
    onSuccess: () => {
      onDeleteOrder?.(orderToDelete!);
      onRefetch?.();
    },
  });

  // Проверяем, может ли пользователь удалять заказы (все роли кроме Operator и Partner)
  const canDeleteOrders = userRole !== Role.Operator && userRole !== Role.Partner;

  // Проверяем, может ли пользователь редактировать заказы (все роли кроме Partner)
  const canEditOrders = userRole !== Role.Partner;
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (paginatedOrders.length === 0) {
    return;
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {columnVisibility.orderNumber && <SortableHeader field='orderNumber' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Номер заказа</SortableHeader>}
            {columnVisibility.type && <SortableHeader field='type' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Тип</SortableHeader>}
            {columnVisibility.status && <SortableHeader field='status' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Статус</SortableHeader>}
            {columnVisibility.subStatus && <SortableHeader field='subStatus' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Подстатус</SortableHeader>}
            {columnVisibility.initialPrice && <SortableHeader field='initialPrice' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Начальная цена</SortableHeader>}
            {columnVisibility.finalPrice && <SortableHeader field='finalPrice' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Итоговая цена</SortableHeader>}
            {columnVisibility.createdAt && <SortableHeader field='createdAt' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Создан</SortableHeader>}
            {columnVisibility.completedAt && <SortableHeader field='completedAt' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Завершен</SortableHeader>}
            {columnVisibility.scheduledTime && <SortableHeader field='scheduledTime' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Запланирован</SortableHeader>}
            {columnVisibility.actions && <TableHead className='w-[120px]'>Действия</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedOrders.map((order) => (
            <TableRow key={order.id} className='hover:bg-muted/50'>
              {columnVisibility.orderNumber && (
                <TableCell className='font-medium'>{orderNumberToString(order.orderNumber)}</TableCell>
              )}
              {columnVisibility.type && (
                <TableCell>
                  <Badge variant='outline'>
                    {orderTypeLabels[order.type as OrderType] || order.type}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.status && (
                <TableCell>
                  <Badge variant={orderStatusColors[order.status as OrderStatus] as "default" | "secondary" | "destructive" | "outline"}>
                    {orderStatusLabels[order.status as OrderStatus] || order.status}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.subStatus && (
                <TableCell>
                  <Badge variant='secondary'>
                    {orderSubStatusLabels[order.subStatus as OrderSubStatus] || order.subStatus}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.initialPrice && (
                <TableCell>{formatPrice(order.initialPrice)}</TableCell>
              )}
              {columnVisibility.finalPrice && (
                <TableCell>
                  {order.finalPrice ? formatPrice(order.finalPrice) : '—'}
                </TableCell>
              )}
              {columnVisibility.createdAt && (
                <TableCell>{formatDate(order.createdAt)}</TableCell>
              )}
              {columnVisibility.completedAt && (
                <TableCell>
                  {order.completedAt ? formatDate(order.completedAt) : '—'}
                </TableCell>
              )}
              {columnVisibility.scheduledTime && (
                <TableCell>
                  {order.scheduledTime ? formatDate(order.scheduledTime) : '—'}
                </TableCell>
              )}
              {columnVisibility.actions && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0'
                      >
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => router.push(getOrderViewRoute(order.id, order.type as OrderType))}>
                        <Eye className='mr-2 h-4 w-4' />
                        Просмотр
                      </DropdownMenuItem>
                      {canEditOrders && (
                        <DropdownMenuItem onClick={() => router.push(getOrderEditRoute(order.id, order.type as OrderType))}>
                          <Edit className='mr-2 h-4 w-4' />
                          Редактировать
                        </DropdownMenuItem>
                      )}
                      {canDeleteOrders && (
                        <DropdownMenuItem
                          className='text-red-600'
                          onClick={() => openDeleteModal(order)}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Удалить
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        {...getDeleteModalProps()}
      />
    </div>
  );
}
