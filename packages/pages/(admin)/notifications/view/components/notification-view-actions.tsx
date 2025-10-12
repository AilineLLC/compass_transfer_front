'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import { DeleteConfirmationModal } from '@shared/ui/modals/delete-confirmation-modal';
import type { GetNotificationDTO } from '@shared/api/notifications';

interface NotificationViewActionsProps {
  notification: GetNotificationDTO;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onMarkAsRead?: () => void;
  isMyNotification?: boolean;
}

export function NotificationViewActions({
  notification,
  onEdit,
  onDelete,
  onBack,
  onMarkAsRead,
  isMyNotification = false
}: NotificationViewActionsProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    await onDelete();
    setIsDeleteModalOpen(false);
  };

  const handleGoToOrder = () => {
    if (!notification.orderId) return;

    const orderPath = notification.orderType === 'Instant'
      ? `/orders/instant/${notification.orderId}`
      : `/orders/scheduled/${notification.orderId}`;
    router.push(orderPath);
  };

  return (
    <div className='sticky top-4 flex flex-col gap-4'>
      {/* Основные действия */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Действия</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Кнопка "Назад" */}
          <Button
            variant='outline'
            onClick={onBack}
            className='w-full justify-start'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Назад к списку
          </Button>

          {/* Кнопка "Отметить прочитанным" - только для моих уведомлений */}
          {!notification.isRead && onMarkAsRead && isMyNotification && (
            <Button
              variant='default'
              onClick={onMarkAsRead}
              className='w-full justify-start'
            >
              <Mail className='mr-2 h-4 w-4' />
              Отметить прочитанным
            </Button>
          )}

          {/* Кнопка "Перейти к заказу" */}
          {notification.orderId && (
            <Button
              variant='outline'
              onClick={handleGoToOrder}
              className='w-full justify-start'
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              Перейти к заказу
            </Button>
          )}

          {/* Кнопка "Редактировать" */}
          <Button
            variant='outline'
            onClick={onEdit}
            className='w-full justify-start'
          >
            <Edit className='mr-2 h-4 w-4' />
            Редактировать
          </Button>

          {/* Кнопка "Удалить" */}
          <Button
            variant='destructive'
            onClick={() => setIsDeleteModalOpen(true)}
            className='w-full justify-start'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Удалить
          </Button>
        </CardContent>
      </Card>

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Удалить уведомление"
        description={`Вы уверены, что хотите удалить уведомление "${notification.title || 'Без заголовка'}"? Это действие нельзя отменить.`}
      />
    </div>
  );
}
