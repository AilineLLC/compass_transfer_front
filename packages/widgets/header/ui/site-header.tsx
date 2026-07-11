'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { notificationsEvents } from '@shared/lib/notifications-events';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Separator } from '@shared/ui/layout/separator';
import { SidebarTrigger } from '@shared/ui/layout/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@shared/ui/navigation/breadcrumb';
import { useNotificationContext } from '@entities/notifications/context';
import { NotificationsSheet } from '@features/sheet';
import { CurrencyWidget } from '@widgets/currency';
import { WeatherWidget } from '@widgets/weather';

export function SiteHeader() {
  const pathname = usePathname();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const { unreadCount, actions: { refresh } } = useNotificationContext();

  // Подписываемся на события обновления уведомлений из других компонентов
  React.useEffect(() => {
    const unsubscribe = notificationsEvents.subscribe(() => {
      refresh();
    });
    return unsubscribe;
  }, [refresh]);

  // Перезагружаем при закрытии шторки
  React.useEffect(() => {
    if (!isNotificationsOpen) {
      const timer = setTimeout(() => refresh(), 300);
      return () => clearTimeout(timer);
    }
  }, [isNotificationsOpen, refresh]);

  // Полинг каждые 30 секунд как резервный механизм
  React.useEffect(() => {
    const interval = setInterval(() => refresh(), 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const SEGMENT_TRANSLATIONS: Record<string, string> = {
    users: 'Пользователи',
    admin: 'Администраторы',
    driver: 'Водители',
    customer: 'Клиенты',
    operator: 'Операторы',
    partner: 'Партнёры',
    terminal: 'Терминалы',
    create: 'Создание',
    edit: 'Редактирование',
    view: 'Просмотр',
    cars: 'Автомобили',
    locations: 'Локации',
    notifications: 'Уведомления',
    me: 'Мои',
    orders: 'Заказы',
    instant: 'Срочные',
    scheduled: 'Запланированные',
    payments: 'Платежи',
    profile: 'Профиль',
    services: 'Услуги',
    support: 'Поддержка',
    tariffs: 'Тарифы',
    documentation: 'Документация',
    routes: 'Маршруты',
    areas: 'Области',
    finances: 'Финансы',
    transfers: 'Трансферы',
    tariffs: 'Тарифы',
    drivers: 'Водители',
  };

  const SKIP_BREADCRUMB_PATHS = new Set([
    '/users/edit',
    '/users/edit/driver',
    '/users/edit/admin',
    '/users/edit/customer',
    '/users/edit/operator',
    '/users/edit/partner',
    '/users/edit/terminal',
    '/cars/edit',
    '/locations/edit',
    '/areas/edit',
    '/notifications/edit',
    '/orders/edit/partner',
    '/routes/edit',
    '/services/edit',
    '/tariffs/edit',
  ]);

  const pathSegments = pathname.split('/').filter(Boolean);

  const breadcrumbItems = pathSegments
    .map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const isLast = index === pathSegments.length - 1;
      const segmentName =
        SEGMENT_TRANSLATIONS[segment.toLowerCase()] ??
        segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      return { href, name: segmentName, isLast };
    })
    .filter(item => item.isLast || !SKIP_BREADCRUMB_PATHS.has(item.href));

  if (pathSegments.length === 0) {
    breadcrumbItems.push({ href: '/', name: 'Главная', isLast: true });
  }

  return (
    <>
      <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
        <div className='flex items-center gap-2 px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href='/'>Главная</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              {breadcrumbItems.map(item => (
                <React.Fragment key={item.href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {item.isLast ? (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.name}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className='ml-auto px-3 flex items-center gap-2'>
          <CurrencyWidget />
          <WeatherWidget />

          <Button
            variant='ghost'
            size='sm'
            className='relative'
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell className='h-4 w-4' />
            {unreadCount > 0 && (
              <Badge
                variant='destructive'
                className='absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center'
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <NotificationsSheet
        open={isNotificationsOpen}
        onOpenChange={setIsNotificationsOpen}
      />
    </>
  );
}
