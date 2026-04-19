'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@shared/lib/conditional-toast';
import { notificationsApi } from '@shared/api/notifications';
import { logger } from '@shared/lib';
import { NotificationType } from '@entities/notifications/enums/NotificationType.enum';
import {
  getBasicNotificationDataStatusForUpdate,
  getRelationsNotificationDataStatusForUpdate,
  getBasicNotificationDataErrorsForUpdate,
  getRelationsNotificationDataErrorsForUpdate,
} from '@entities/notifications/model/validation/ui';
import {
  notificationUpdateSchema,
  type NotificationUpdateFormData,
} from '@entities/notifications/schemas/notificationUpdateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useNotificationEditFormLogic({
  notificationId,
  initialData,
  onBack,
  onSuccess,
}: {
  notificationId: string;
  initialData: {
    type: NotificationType;
    title: string;
    content?: string | null;
    orderId?: string | null;
    rideId?: string | null;
    orderType?: string;
    isRead: boolean;
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(notificationUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      type: initialData.type,
      title: initialData.title,
      content: initialData.content || '',
      orderId: initialData.orderId || '',
      rideId: initialData.rideId || '',
      orderType: initialData.orderType || 'Unknown',
      isRead: initialData.isRead,
    },
  });

  const {
    formState: { errors, isSubmitted },
    handleSubmit,
    watch,
    trigger,
    setFocus,
  } = form;

  const formData = watch();

  const onSubmit = useCallback(
    async (data: NotificationUpdateFormData) => {
      setIsSubmitting(true);
      try {
        // PUT /Notification отсутствует в API — доступна только отметка прочитанным
        if (data.isRead && initialData.isRead === false) {
          await notificationsApi.markAsRead([notificationId]);
          toast.success('Уведомление отмечено как прочитанное');
        } else {
          toast.info('Изменений нет');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления уведомления:', error);
        const axiosError = error as AxiosError<ApiError>;

        toast.error(axiosError.response?.data?.detail || 'Ошибка обновления уведомления');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSuccess, notificationId, initialData.isRead],
  );

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        return getBasicNotificationDataStatusForUpdate(formData, errors, isSubmitted);
      }
      if (chapterId === 'relations') {
        return getRelationsNotificationDataStatusForUpdate(formData, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicNotificationDataErrorsForUpdate(formData, errors, isSubmitted);
      }
      if (chapterId === 'relations') {
        return getRelationsNotificationDataErrorsForUpdate(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onUpdate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof NotificationUpdateFormData);
      }

      return;
    }
    await handleSubmit(onSubmit)();
  }, [trigger, handleSubmit, onSubmit, form.formState.errors, setFocus]);

  const handleChapterClick = useCallback((chapterId: string) => {
    const element = document.getElementById(`chapter-${chapterId}`);

    if (element) {
      const yOffset = -20;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  return {
    form,
    isSubmitting,
    getChapterStatus,
    getChapterErrors,
    onUpdate,
    handleChapterClick,
    onBack,
  };
}
