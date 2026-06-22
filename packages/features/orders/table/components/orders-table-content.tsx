'use client';

import { Edit, Trash2, ChevronUp, ChevronDown, MoreHorizontal, Eye, X } from 'lucide-react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import React, { useState, useEffect, useCallback } from 'react';
import { DriverCell } from './driver-cell';
import { Badge } from '@shared/ui/data-display/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/data-display/table';
import { Button } from '@shared/ui/forms/button';
import { DeleteConfirmationModal } from '@shared/ui/modals';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import { OrderStatus } from '@entities/orders/enums/OrderStatus.enum';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import OrdersApi from '@entities/orders/api/orders';
import { useUserRole } from '@shared/contexts';
import {
  type GetOrderDTO,
  type OrderSubStatus,
  type OrderType,
  orderStatusLabels,
  orderSubStatusLabels,
  orderStatusColors,
  getOrderEditRoute,
  getOrderViewRoute,
} from '@entities/orders';
import { Role } from '@entities/users/enums';
import { useDeleteOrder } from '@features/orders/hooks/use-delete-order';
import { useUsdRate } from '@shared/hooks';
import { formatPriceWithUsd } from '@shared/utils/format-price-with-usd';

interface ColumnVisibility {
  orderNumber: boolean;
  startLocation: boolean;
  endLocation: boolean;
  status: boolean;
  carLicensePlate: boolean;
  subStatus: boolean;
  initialPrice: boolean;
  finalPrice: boolean;
  timeUntilOrder: boolean;
  scheduledTime: boolean;
  airFlight: boolean;
  flyReis: boolean;
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

// Цветовые метки заказов
const MARK_COLORS = [
  { value: '#22c55e', label: 'Обработан' },
  { value: '#ef4444', label: 'Срочный' },
  { value: '#f97316', label: 'На контроле' },
  { value: '#eab308', label: 'Ожидание' },
  { value: '#3b82f6', label: 'В работе' },
  { value: '#8b5cf6', label: 'VIP' },
  { value: '#ec4899', label: 'Особый' },
];

function getRowStyle(color: string | null | undefined): React.CSSProperties | undefined {
  if (!color) return undefined;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`, borderLeft: `3px solid ${color}` };
}

// Компонент таймера обратного отсчёта до заказа
const STOPPED_STATUSES = [OrderStatus.InProgress, OrderStatus.Completed, OrderStatus.Cancelled];

function CountdownTimer({
  scheduledTime,
  status,
}: {
  scheduledTime: string | null | undefined;
  status: string | null | undefined;
}) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!scheduledTime) {
      setTimeLeft('—');
      return;
    }

    if (status && STOPPED_STATUSES.includes(status as OrderStatus)) {
      setTimeLeft('—');
      setIsUrgent(false);
      return;
    }

    const update = () => {
      const diff = new Date(scheduledTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Время истекло');
        setIsUrgent(true);
        return;
      }
      setIsUrgent(diff < 30 * 60 * 1000);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const timeParts = days > 0 ? `${days}д ${String(hours).padStart(2, '0')}ч ` : `${hours}ч `;
      setTimeLeft(
        `${timeParts}${String(minutes).padStart(2, '0')}м ${String(seconds).padStart(2, '0')}с`,
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [scheduledTime, status]);

  return <span className={isUrgent ? 'text-red-600 font-medium' : undefined}>{timeLeft}</span>;
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
      className='cursor-pointer hover:bg-muted/50 select-none'
      onClick={() => onSort(field)}
    >
      <div className='flex items-center gap-1'>
        {children}
        {isActive &&
          (sortOrder === 'asc' ? (
            <ChevronUp className='h-4 w-4' />
          ) : (
            <ChevronDown className='h-4 w-4' />
          ))}
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

  // Оптимистичное локальное состояние цветовых меток
  const [localColors, setLocalColors] = useState<Map<string, string | null>>(new Map());

  const handleMarkColor = useCallback(async (orderId: string, color: string | null) => {
    setLocalColors(prev => new Map(prev).set(orderId, color));
    try {
      await OrdersApi.markOrder(orderId, color);
    } catch {
      setLocalColors(prev => {
        const next = new Map(prev);
        next.delete(orderId);
        return next;
      });
    }
  }, []);

  const getEffectiveColor = useCallback((order: GetOrderDTO): string | null | undefined => {
    return localColors.has(order.id) ? localColors.get(order.id) : order.markColor;
  }, [localColors]);

  // Проверяем, может ли пользователь удалять заказы (все роли кроме Operator и Partner)
  const canDeleteOrders = userRole !== Role.Operator && userRole !== Role.Partner;

  // Проверяем, может ли пользователь редактировать заказы (все роли кроме Partner)
  const canEditOrders = userRole !== Role.Partner;
  const usdRate = useUsdRate();

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
            {columnVisibility.orderNumber && (
              <SortableHeader
                field='orderNumber'
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              >
                Номер заказа
              </SortableHeader>
            )}
            {columnVisibility.startLocation && <TableHead>Откуда</TableHead>}
            {columnVisibility.endLocation && <TableHead>Куда</TableHead>}
            {columnVisibility.status && (
              <SortableHeader
                field='status'
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              >
                Статус
              </SortableHeader>
            )}
            {columnVisibility.subStatus && (
              <SortableHeader
                field='subStatus'
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              >
                Подстатус
              </SortableHeader>
            )}
            {columnVisibility.carLicensePlate && <TableHead>Водитель</TableHead>}
            {/* {columnVisibility.initialPrice && <SortableHeader field='initialPrice' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Начальная цена</SortableHeader>} */}
            {columnVisibility.finalPrice && (
              <SortableHeader
                field='finalPrice'
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              >
                Итоговая цена
              </SortableHeader>
            )}
            {columnVisibility.timeUntilOrder && <TableHead>До заказа</TableHead>}
            {columnVisibility.scheduledTime && (
              <SortableHeader
                field='scheduledTime'
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              >
                Запланирован
              </SortableHeader>
            )}
            {columnVisibility.airFlight && <TableHead>Рейс (прилет)</TableHead>}
            {columnVisibility.flyReis && <TableHead>Рейс (вылет)</TableHead>}
            {columnVisibility.actions && <TableHead className='w-[50px]'>Действия</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedOrders.map(order => (
            <TableRow
              key={order.id}
              className='hover:brightness-95 transition-colors'
              style={getRowStyle(getEffectiveColor(order))}
            >
              {columnVisibility.orderNumber && (
                <TableCell className='flex items-center font-medium'>
                  {orderNumberToString(order.orderNumber)}
                  {(!order.creatorId || order.requestedCar) && <span className='text-[#1B59F8] animate-pulse text-xl mb-1 ml-2'>•</span> }
                </TableCell>
              )}
              {columnVisibility.startLocation && (
                <TableCell
                  className='max-w-[160px] truncate'
                  title={order.startLocation?.name || '—'}
                >
                  {order.startLocation?.name || '—'}
                </TableCell>
              )}
              {columnVisibility.endLocation && (
                <TableCell
                  className='max-w-[160px] truncate'
                  title={order.endLocation?.name || '—'}
                >
                  {order.endLocation?.name || '—'}
                </TableCell>
              )}
              {columnVisibility.status && (
                <TableCell>
                  <Badge
                    variant={
                      orderStatusColors[order.status as OrderStatus] as
                        | 'default'
                        | 'secondary'
                        | 'destructive'
                        | 'outline'
                    }
                  >
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
              {columnVisibility.carLicensePlate && (
                <TableCell>
                  <DriverCell order={order} onRefetch={onRefetch} />
                </TableCell>
              )}
              {/* {columnVisibility.initialPrice && (
                <TableCell>{formatPriceWithUsd(order.initialPrice, usdRate)}</TableCell>
              )} */}
              {columnVisibility.finalPrice && (
                <TableCell>
                  {order.finalPrice ? formatPriceWithUsd(order.finalPrice, usdRate) : '—'}
                </TableCell>
              )}
              {columnVisibility.timeUntilOrder && (
                <TableCell>
                  <CountdownTimer scheduledTime={order.scheduledTime} status={order.status} />
                </TableCell>
              )}
              {columnVisibility.scheduledTime && (
                <TableCell>{order.scheduledTime ? formatDate(order.scheduledTime) : '—'}</TableCell>
              )}
              {columnVisibility.airFlight && <TableCell>{order.airFlight || '—'}</TableCell>}
              {columnVisibility.flyReis && <TableCell>{order.flyReis || '—'}</TableCell>}
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
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(getOrderViewRoute(order.id, order.type as OrderType))
                        }
                      >
                        <Eye className='mr-2 h-4 w-4' />
                        Просмотр
                      </DropdownMenuItem>
                      {canEditOrders && (
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(getOrderEditRoute(order.id, order.type as OrderType))
                          }
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          Редактировать
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {/* Быстрая метка "Обработан" */}
                      <DropdownMenuItem
                        onClick={() =>
                          handleMarkColor(
                            order.id,
                            getEffectiveColor(order) === '#22c55e' ? null : '#22c55e',
                          )
                        }
                      >
                        <div
                          className='mr-2 h-3 w-3 rounded-full flex-shrink-0'
                          style={{ backgroundColor: '#22c55e' }}
                        />
                        {getEffectiveColor(order) === '#22c55e' ? 'Снять «Обработан»' : 'Обработан'}
                      </DropdownMenuItem>

                      {/* Подменю выбора цвета */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <div
                            className='mr-2 h-3 w-3 rounded-full flex-shrink-0 border border-gray-300'
                            style={{
                              backgroundColor: getEffectiveColor(order) ?? '#ffffff',
                            }}
                          />
                          Цветовая метка
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {MARK_COLORS.map(c => (
                            <DropdownMenuItem
                              key={c.value}
                              onClick={() => handleMarkColor(order.id, c.value)}
                            >
                              <div
                                className='mr-2 h-3 w-3 rounded-full flex-shrink-0'
                                style={{ backgroundColor: c.value }}
                              />
                              {c.label}
                              {getEffectiveColor(order) === c.value && (
                                <span className='ml-auto text-xs text-gray-400'>✓</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                          {getEffectiveColor(order) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleMarkColor(order.id, null)}>
                                <X className='mr-2 h-3.5 w-3.5 text-gray-400' />
                                Убрать метку
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      {canDeleteOrders && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-red-600'
                            onClick={() => openDeleteModal(order)}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Удалить
                          </DropdownMenuItem>
                        </>
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
