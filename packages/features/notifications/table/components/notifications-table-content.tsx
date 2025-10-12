'use client';

import { Edit, Trash2, Mail, ChevronUp, ChevronDown, MoreHorizontal, Eye } from 'lucide-react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import React from 'react';
import type { GetNotificationDTO } from '@shared/api/notifications';
import { Badge } from '@shared/ui/data-display/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/data-display/table';
import { Button } from '@shared/ui/forms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import {
  getNotificationTypeIcon,
  getNotificationTypeLabel,
  getNotificationTypeColor
} from '@entities/notifications';
import { getOrderTypeLabel } from '@entities/orders/utils/order-type-labels';

interface ColumnVisibility {
  type: boolean;
  title: boolean;
  content: boolean;
  orderId: boolean;
  rideId: boolean;
  orderType: boolean;
  isRead: boolean;
  createdAt: boolean;
  actions: boolean;
}

interface NotificationsTableContentProps {
  paginatedNotifications: GetNotificationDTO[];
  columnVisibility: ColumnVisibility;
  router: AppRouterInstance;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  onDeleteNotification: (notification: GetNotificationDTO) => void;
  onToggleReadStatus: (notification: GetNotificationDTO) => void;
  isUpdating: boolean;
  showMyNotifications: boolean;
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

export function NotificationsTableContent({
  paginatedNotifications,
  columnVisibility,
  router,
  sortBy,
  sortOrder,
  handleSort,
  onDeleteNotification,
  onToggleReadStatus,
  isUpdating,
  showMyNotifications,
}: NotificationsTableContentProps) {
  if (paginatedNotifications.length === 0) {
    return;
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {columnVisibility.type && <SortableHeader field='Type' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Тип</SortableHeader>}
            {columnVisibility.title && <SortableHeader field='Title' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Заголовок</SortableHeader>}
            {columnVisibility.content && <SortableHeader field='Content' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Содержимое</SortableHeader>}
            {columnVisibility.orderType && <SortableHeader field='OrderType' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Тип заказа</SortableHeader>}
            {columnVisibility.orderId && <TableHead>Заказ</TableHead>}
            {columnVisibility.isRead && <SortableHeader field='IsRead' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Статус</SortableHeader>}
            {showMyNotifications && <TableHead className='w-[150px]'>Отметить</TableHead>}
            {columnVisibility.actions && <TableHead className='w-[120px]'>Действия</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedNotifications.map((notification) => (
            <TableRow 
              key={notification.id} 
              className={`hover:bg-muted/50 ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
            >
              {columnVisibility.type && (
                <TableCell>
                  <div className='flex items-center gap-2'>
                    {React.createElement(getNotificationTypeIcon(notification.type), { className: 'h-4 w-4' })}
                    <Badge variant={getNotificationTypeColor(notification.type)}>
                      {getNotificationTypeLabel(notification.type)}
                    </Badge>
                  </div>
                </TableCell>
              )}
              {columnVisibility.title && (
                <TableCell className='font-medium'>
                  {notification.title || <span className='text-muted-foreground italic'>—</span>}
                </TableCell>
              )}
              {columnVisibility.content && (
                <TableCell className='max-w-xs'>
                  {notification.content ? (
                    <span className='text-sm text-muted-foreground' title={notification.content}>
                      {notification.content.length > 100
                        ? `${notification.content.substring(0, 100)}...`
                        : notification.content
                      }
                    </span>
                  ) : (
                    <span className='text-muted-foreground italic'>—</span>
                  )}
                </TableCell>
              )}
              {columnVisibility.orderType && (
                <TableCell>
                  <Badge variant='outline'>
                    {getOrderTypeLabel(notification.orderType)}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.orderId && (
                <TableCell>
                  {notification.orderId ? (
                    <Button
                      variant='link'
                      size='sm'
                      className='h-auto p-0 text-blue-600'
                      onClick={() => {
                        const orderPath = notification.orderType === 'Instant' 
                          ? `/orders/instant/${notification.orderId}`
                          : `/orders/scheduled/${notification.orderId}`;
                        router.push(orderPath);
                      }}
                    >
                      Перейти к заказу
                    </Button>
                  ) : (
                    <span className='text-muted-foreground italic'>—</span>
                  )}
                </TableCell>
              )}
              {columnVisibility.isRead && (
                <TableCell>
                  <Badge className={notification.isRead ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                    {notification.isRead ? 'Прочитано' : 'Новое'}
                  </Badge>
                </TableCell>
              )}
              {showMyNotifications && (
                <TableCell>
                  {!notification.isRead ? (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onToggleReadStatus(notification)}
                      disabled={isUpdating}
                    >
                      <Mail className='mr-2 h-4 w-4' />
                      Прочитано
                    </Button>
                  ) : (
                    <span className='text-sm text-muted-foreground'>—</span>
                  )}
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
                      <DropdownMenuItem onClick={() => router.push(showMyNotifications ? `/notifications/me/${notification.id}` : `/notifications/${notification.id}`)}>
                        <Eye className='mr-2 h-4 w-4' />
                        Просмотр
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/notifications/edit/${notification.id}`)}>
                        <Edit className='mr-2 h-4 w-4' />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='text-red-600'
                        onClick={() => onDeleteNotification(notification)}
                        disabled={isUpdating}
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
