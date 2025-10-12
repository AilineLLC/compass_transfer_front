'use client';

import { Badge } from '@shared/ui/data-display/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import type { GetNotificationDTO } from '@shared/api/notifications';
import { getOrderTypeLabel } from '@entities/orders/utils/order-type-labels';

interface NotificationViewContentProps {
  notification: GetNotificationDTO;
}

export function NotificationViewContent({ notification }: NotificationViewContentProps) {

  return (
    <div className='space-y-6'>
      {/* Содержимое */}
      {notification.content && (
        <Card>
          <CardHeader>
            <CardTitle>Содержимое</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-gray-700 whitespace-pre-wrap'>{notification.content}</p>
          </CardContent>
        </Card>
      )}

      {/* Связанные объекты */}
      <Card>
        <CardHeader>
          <CardTitle>Связанные объекты</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <div className='text-sm text-muted-foreground'>Тип заказа</div>
            <Badge variant='outline' className='mt-1'>
              {getOrderTypeLabel(notification.orderType)}
            </Badge>
          </div>

          {notification.userId && (
            <div>
              <div className='text-sm text-muted-foreground'>ID пользователя</div>
              <div className='font-mono text-sm mt-1'>{notification.userId}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
