'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { notificationsApi, type GetNotificationDTO } from '@shared/api/notifications';
import { NotificationViewHeader } from './components/notification-view-header';
import { NotificationViewActions } from './components/notification-view-actions';
import { NotificationViewContent } from './components/notification-view-content';
import { NotificationViewLoading } from './components/notification-view-loading';
import { NotificationViewError } from './components/notification-view-error';

interface NotificationViewProps {
  notificationId: string;
  isMyNotification?: boolean;
}

export function NotificationView({ notificationId, isMyNotification = false }: NotificationViewProps) {
  const router = useRouter();
  const [notification, setNotification] = useState<GetNotificationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных уведомления
  useEffect(() => {
    const loadNotification = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const notificationData = await notificationsApi.getNotificationById(notificationId);
        setNotification(notificationData);
      } catch (err) {
        console.error('Ошибка загрузки уведомления:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки уведомления');
      } finally {
        setLoading(false);
      }
    };

    if (notificationId) {
      loadNotification();
    }
  }, [notificationId]);

  // Обработчик возврата к списку
  const handleBackToList = () => {
    router.push('/notifications');
  };

  // Обработчик редактирования
  const handleEdit = () => {
    router.push(`/notifications/edit/${notificationId}`);
  };

  // Обработчик удаления
  const handleDelete = async () => {
    if (!notification) return;

    try {
      await notificationsApi.deleteNotification(notificationId);
      toast.success('Уведомление успешно удалено');
      router.push('/notifications');
    } catch (err) {
      console.error('Ошибка удаления уведомления:', err);
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления уведомления');
    }
  };

  // Обработчик отметки как прочитанное
  const handleMarkAsRead = async () => {
    if (!notification || notification.isRead) return;

    try {
      await notificationsApi.markAsRead([notificationId]);
      toast.success('Уведомление отмечено как прочитанное');
      setNotification({ ...notification, isRead: true });
    } catch (err) {
      console.error('Ошибка обновления статуса:', err);
      toast.error(err instanceof Error ? err.message : 'Ошибка обновления статуса');
    }
  };

  if (loading) {
    return <NotificationViewLoading />;
  }

  if (error) {
    return (
      <NotificationViewError 
        error={error} 
        onRetry={() => window.location.reload()}
        onBack={handleBackToList}
      />
    );
  }

  if (!notification) {
    return (
      <NotificationViewError 
        error="Уведомление не найдено" 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className='pr-2 border rounded-2xl overflow-hidden shadow-sm h-full bg-white flex flex-col gap-6 p-6 overflow-y-auto'>
      {/* Заголовок */}
      <NotificationViewHeader notification={notification} />

      {/* Двухколоночный layout */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Левая колонка - основная информация (3/4 ширины) */}
        <div className='lg:col-span-3'>
          <NotificationViewContent notification={notification} />
        </div>

        {/* Правая колонка - кнопки действий (1/4 ширины) */}
        <div className='lg:col-span-1'>
          <NotificationViewActions
            notification={notification}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBack={handleBackToList}
            onMarkAsRead={handleMarkAsRead}
            isMyNotification={isMyNotification}
          />
        </div>
      </div>
    </div>
  );
}
