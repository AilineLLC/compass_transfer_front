'use client';

import React from 'react';
import { Badge } from '@shared/ui/data-display/badge';
import { Card, CardContent } from '@shared/ui/layout';
import type { GetNotificationDTO } from '@shared/api/notifications';
import {
  getNotificationTypeIcon,
  getNotificationTypeLabel,
  getNotificationTypeColor
} from '@entities/notifications';

interface NotificationViewHeaderProps {
  notification: GetNotificationDTO;
}

export function NotificationViewHeader({ notification }: NotificationViewHeaderProps) {
  const NotificationIcon = getNotificationTypeIcon(notification.type);

  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-start gap-4'>
          {/* Иконка */}
          <div className='flex-shrink-0'>
            <div className='w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center'>
              <NotificationIcon className='h-8 w-8 text-blue-600' />
            </div>
          </div>

          {/* Основная информация */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-3 mb-2 flex-wrap'>
              <h1 className='text-2xl font-bold text-gray-900'>
                {notification.title || 'Без заголовка'}
              </h1>
              <Badge variant={getNotificationTypeColor(notification.type)}>
                {getNotificationTypeLabel(notification.type)}
              </Badge>
              <Badge className={notification.isRead ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                {notification.isRead ? 'Прочитано' : 'Новое'}
              </Badge>
            </div>

            <div className='flex items-center gap-4 text-sm text-gray-500'>
              <div className='flex items-center gap-1'>
                <span className='font-medium'>ID:</span>
                <span className='font-mono text-xs'>{notification.id}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
