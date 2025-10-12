'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useLayoutEffect } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { notificationsApi, type GetNotificationDTO } from '@shared/api/notifications';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { NotificationBasicSection, NotificationRelationsSection } from '@entities/notifications';
import { NotificationType } from '@entities/notifications/enums/NotificationType.enum';
import { NOTIFICATION_FORM_CHAPTERS } from '@entities/notifications/model/form-chapters/notification-chapters';
import type { NotificationUpdateFormData } from '@entities/notifications/schemas/notificationUpdateSchema';
import { useNotificationEditFormLogic } from '@features/notifications/forms/edit/notification-edit-form';

// Тип для заказов, определенный локально, так как модуль не найден
type NotificationOrderType = 'Unknown' | 'Instant' | 'Scheduled' | 'Partner' | 'Shuttle' | 'Subscription';

// Объект для доступа к типам заказов как к значениям
const NotificationOrderType = {
  Unknown: 'Unknown' as NotificationOrderType,
  Instant: 'Instant' as NotificationOrderType,
  Scheduled: 'Scheduled' as NotificationOrderType,
  Partner: 'Partner' as NotificationOrderType,
  Shuttle: 'Shuttle' as NotificationOrderType,
  Subscription: 'Subscription' as NotificationOrderType
};

interface NotificationEditViewProps {
  notificationId: string;
}

interface NotificationEditFormViewProps {
  form: UseFormReturn<NotificationUpdateFormData>;
  isSubmitting: boolean;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onUpdate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
}

export function NotificationEditView({ notificationId }: NotificationEditViewProps) {
  const router = useRouter();
  const [notification, setNotification] = useState<GetNotificationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные уведомления
  useEffect(() => {
    const loadNotification = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const notificationData = await notificationsApi.getNotificationById(notificationId);

        setNotification(notificationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    if (notificationId) {
      loadNotification();
    }
  }, [notificationId]);

  // Всегда вызываем хук, но с условными данными
  const logic = useNotificationEditFormLogic({
    notificationId: notificationId,
    initialData: {
      type: NotificationType.System,
      title: '',
      content: '',
      orderId: '',
      rideId: '',
      orderType: NotificationOrderType.Unknown,
      isRead: false,
    },
    onBack: () => router.push('/notifications'),
    onSuccess: () => router.push('/notifications'),
  });

  // Заполняем форму через useLayoutEffect с reset()
  useLayoutEffect(() => {
    if (notification && logic.form) {
      logic.form.reset({
        type: notification.type,
        title: notification.title || '',
        content: notification.content || '',
        orderId: notification.orderId || '',
        rideId: notification.rideId || '',
        orderType: notification.orderType || 'Unknown',
        isRead: notification.isRead,
      });
    }
  }, [notification, logic.form]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4' />
          <p>Загрузка данных уведомления...</p>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    notFound();
  }

  return <NotificationEditFormView {...logic} />;
}

function NotificationEditFormView({
  form,
  isSubmitting,
  getChapterStatus,
  getChapterErrors,
  onUpdate,
  handleChapterClick,
  onBack,
}: NotificationEditFormViewProps) {
  return (
    <FormProvider {...form}>
      <div className='flex overflow-hidden h-full pb-2'>
        <div className='shadow-md flex-1 h-full p-4 overflow-auto border bg-white rounded-2xl md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-[0_10px_40px_rgba(255,255,255,0.3)]'>
          <Card className='h-full flex flex-col overflow-auto pr-4'>
            <CardContent className='p-0'>
              <form className='flex flex-col gap-4'>
                {/* Глава 1: Основная информация */}
                <div id='chapter-basic' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={1}
                    title='Основная информация'
                    status={getChapterStatus('basic')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <NotificationBasicSection
                      _showOptionalWarning={getChapterStatus('basic') === 'warning'}
                      labels={{
                        type: 'Тип уведомления *',
                        title: 'Заголовок уведомления *',
                        content: 'Содержимое уведомления',
                        orderType: 'Тип заказа',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 2: Связанные данные */}
                <div id='chapter-relations' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Связанные данные'
                    status={getChapterStatus('relations')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <NotificationRelationsSection
                      labels={{
                        orderId: 'ID заказа',
                        rideId: 'ID поездки',
                        isRead: 'Уведомление прочитано',
                      }}
                      showIsRead
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className='w-80 flex-shrink-0 flex flex-col h-full'>
          {/* Сайдбар */}
          <FormSidebar
            chapters={NOTIFICATION_FORM_CHAPTERS.EDIT}
            getChapterStatus={getChapterStatus}
            getChapterErrors={getChapterErrors}
            onChapterClick={handleChapterClick}
            onUpdate={onUpdate}
            isSubmitting={isSubmitting}
            onBack={onBack}
            updateButtonText='Обновить уведомление'
          />
        </div>
      </div>
    </FormProvider>
  );
}
