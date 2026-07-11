'use client';

import {
  Bell,
  X,
  Inbox,
  Eye,
  EyeOff,
  MoreHorizontal,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { toast } from 'sonner';
import type { GetNotificationDTO } from '@shared/api/notifications';
import { notificationsEvents } from '@shared/lib/notifications-events';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui/modals/sheet';
import { SimpleTooltip } from '@shared/ui/modals/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import { useNotificationContext } from '@entities/notifications/context';

// ──────────────────────────────────────────────────────────────
// Превью структурированных данных уведомления
// ──────────────────────────────────────────────────────────────

type NotifData = Record<string, unknown>;

function NotificationDataPreview({ data, type }: { data: unknown; type: string }) {
  if (!data || typeof data !== 'object') return null;

  const d = data as NotifData;

  // Маршрут (Waypoints)
  const waypoints = (d.Waypoints || d.waypoints) as Array<{ Location?: { Address?: string; Name?: string }; location?: { address?: string; name?: string } }> | undefined;
  const start = waypoints?.[0];
  const end = waypoints?.[waypoints.length - 1];
  const startAddr = start?.Location?.Address || start?.location?.address;
  const endAddr = end?.Location?.Address || end?.location?.address;
  const hasRoute = startAddr && endAddr && waypoints && waypoints.length >= 2;

  // Водитель (RideAccepted / DriverAssigned)
  const driver = d.Driver as { FullName?: string; fullName?: string; Rating?: number; rating?: number } | undefined;
  const car = d.Car as { Model?: string; model?: string; Color?: string; color?: string; LicensePlate?: string; licensePlate?: string } | undefined;

  // Номер заказа
  const orderNumber = d.OrderNumber || d.orderNumber;

  const hasDriver = driver?.FullName || driver?.fullName;
  const hasCar = car?.Model || car?.model;

  if (!hasRoute && !hasDriver && !orderNumber) return null;

  return (
    <div className='mt-1 mb-1 space-y-1 text-xs text-muted-foreground border-l-2 border-muted pl-2'>
      {orderNumber && (
        <div className='font-medium text-foreground'>№ {String(orderNumber)}</div>
      )}
      {hasRoute && (
        <div className='space-y-0.5'>
          <div className='flex gap-1'>
            <span className='text-blue-500'>●</span>
            <span className='line-clamp-1'>{startAddr}</span>
          </div>
          {waypoints && waypoints.length > 2 && (
            <div className='flex gap-1 text-orange-500'>
              <span>●</span>
              <span>+{waypoints.length - 2} остановок</span>
            </div>
          )}
          <div className='flex gap-1'>
            <span className='text-gray-400'>●</span>
            <span className='line-clamp-1'>{endAddr}</span>
          </div>
        </div>
      )}
      {(hasDriver || hasCar) && (
        <div className='flex flex-wrap gap-x-3'>
          {hasDriver && (
            <span>🧑‍✈️ {driver?.FullName || driver?.fullName}
              {(driver?.Rating || driver?.rating) ? ` ★${driver.Rating || driver.rating}` : ''}
            </span>
          )}
          {hasCar && (
            <span>🚗 {car?.Model || car?.model} {car?.Color || car?.color} {car?.LicensePlate || car?.licensePlate}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const [activeCategory, setActiveCategory] = React.useState('all');

  const {
    notifications: notificationsData,
    isLoading,
    unreadCount,
    actions: { refresh, markAsRead, deleteNotification },
  } = useNotificationContext();

  const filteredNotifications = React.useMemo(() => {
    switch (activeCategory) {
      case 'unread':
        return notificationsData.filter((n: GetNotificationDTO) => !n.isRead);
      case 'read':
        return notificationsData.filter((n: GetNotificationDTO) => n.isRead);
      default:
        return notificationsData;
    }
  }, [notificationsData, activeCategory]);

  const categories = React.useMemo(
    () => [
      {
        id: 'all',
        label: 'Все',
        count: notificationsData.length,
        icon: Inbox,
      },
      {
        id: 'unread',
        label: 'Непрочитанные',
        count: notificationsData.filter((n: GetNotificationDTO) => !n.isRead).length,
        icon: EyeOff,
      },
      {
        id: 'read',
        label: 'Прочитанные',
        count: notificationsData.filter((n: GetNotificationDTO) => n.isRead).length,
        icon: Eye,
      },
    ],
    [notificationsData],
  );

  const handleMarkAsRead = React.useCallback(async (id: string) => {
    try {
      await markAsRead(id);
      notificationsEvents.emit();
    } catch {
      toast.error('Ошибка при отметке уведомления как прочитанного');
    }
  }, [markAsRead]);

  const handleDeleteNotification = React.useCallback(async (id: string) => {
    try {
      await deleteNotification(id);
      notificationsEvents.emit();
    } catch {
      toast.error('Ошибка при удалении уведомления');
    }
  }, [deleteNotification]);

  // Обновляем список при открытии шторки
  React.useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-[400px] sm:w-[540px]' side='right'>
        <SheetHeader className='flex flex-row items-center justify-between space-y-0 px-3'>
          <SheetTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5' />
            Уведомления
            {unreadCount > 0 && (
              <Badge variant='destructive' className='ml-2'>
                {unreadCount}
              </Badge>
            )}
          </SheetTitle>
          <Button variant='ghost' size='sm' onClick={() => onOpenChange(false)} className='h-8 w-8 p-0'>
            <X className='h-4 w-4' />
          </Button>
        </SheetHeader>

        <div className='flex h-[calc(100vh-3.5rem)] gap-4'>
          {/* Категории */}
          <div className='w-16 border-r flex flex-col items-center justify-start gap-1 p-2'>
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <SimpleTooltip key={category.id} content={category.label}>
                  <button
                    onClick={() => setActiveCategory(category.id)}
                    className={`relative w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                      activeCategory === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                    {category.count > 0 && (
                      <Badge
                        variant='secondary'
                        className='absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground'
                      >
                        {category.count}
                      </Badge>
                    )}
                  </button>
                </SimpleTooltip>
              );
            })}
          </div>

          {/* Список */}
          <div className='flex-1 overflow-y-auto min-h-0'>
            <div className='flex flex-col gap-4 p-4'>
              {isLoading ? (
                <div className='text-center py-8'>
                  <div className='animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2' />
                  <p className='text-sm text-muted-foreground'>Загрузка уведомлений...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <Bell className='h-12 w-12 mx-auto mb-3 opacity-50' />
                  <p>Уведомлений нет</p>
                  <p className='text-sm'>
                    {activeCategory === 'unread'
                      ? 'Все уведомления прочитаны'
                      : 'Новых уведомлений пока нет'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      notification.isRead
                        ? 'bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:border-green-800 dark:hover:bg-green-900'
                        : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950 dark:border-yellow-800 dark:hover:bg-yellow-900'
                    }`}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h4
                            className={`font-medium text-sm ${
                              notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {notification.title}
                          </h4>
                        </div>

                        {/* Content с поддержкой переносов строк */}
                        {notification.content && (
                          <p className='text-sm text-muted-foreground mb-2 whitespace-pre-line'>
                            {notification.content}
                          </p>
                        )}

                        {/* Дополнительные данные из поля data */}
                        <NotificationDataPreview data={notification.data} type={notification.type} />

                        <div className='flex items-center justify-between mt-2'>
                          <p className='text-xs text-muted-foreground'>
                            {notification.createdAt
                              ? new Date(notification.createdAt).toLocaleString('ru-RU')
                              : 'Недавно'}
                          </p>
                          {notification.orderId && (
                            <Link
                              href={`/orders/edit/${notification.orderType?.toLowerCase() || 'instant'}/${notification.orderId}`}
                              onClick={e => {
                                e.stopPropagation();
                                onOpenChange(false);
                              }}
                              className='inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium'
                            >
                              <ExternalLink className='h-3 w-3' />
                              Перейти к заказу
                            </Link>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0'
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {!notification.isRead && (
                            <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                              <Eye className='h-4 w-4 mr-2' />
                              Отметить как прочитанное
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteNotification(notification.id)}
                            className='text-destructive'
                          >
                            <Trash2 className='h-4 w-4 mr-2' />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
