'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { notificationsApi } from '@shared/api/notifications';
import { logger } from '@shared/lib';
import { toast } from '@shared/lib/conditional-toast';
import { NotificationType } from '@entities/notifications/enums/NotificationType.enum';
import {
  getBasicNotificationDataStatus,
  getRelationsNotificationDataStatus,
  getBasicNotificationDataErrors,
  getRelationsNotificationDataErrors,
} from '@entities/notifications/model/validation/ui';
import {
  notificationCreateSchema,
  type NotificationCreateFormData,
} from '@entities/notifications/schemas/notificationCreateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useNotificationFormLogic({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NotificationCreateFormData>({
    resolver: zodResolver(notificationCreateSchema),
    mode: 'onSubmit',
    defaultValues: {
      type: NotificationType.SystemMessage,
      title: '',
      content: '',
      orderId: '',
      rideId: '',
      orderType: 'Unknown',
      userId: '',
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
    async (data: NotificationCreateFormData) => {
      setIsSubmitting(true);
      try {
        // Подготавливаем данные для API
        const apiData = {
          type: data.type,
          title: data.title,
          content: data.content || undefined,
          orderId: data.orderId || undefined,
          rideId: data.rideId || undefined,
          orderType: data.orderType || undefined,
          userId: data.userId || undefined,
        };

        const result = await notificationsApi.createNotification(apiData);

        if (result && result.title) {
          toast.success(`Уведомление "${result.title}" успешно создано!`);
        } else {
          toast.success('Уведомление успешно создано!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка создания уведомления:', error);

        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            const serverErrors = axiosError.response.data.errors;

            Object.keys(serverErrors).forEach(field => {
              const fieldKey = field as keyof NotificationCreateFormData;

              if (serverErrors[field] && serverErrors[field].length > 0) {
                form.setError(fieldKey, {
                  type: 'server',
                  message: serverErrors[field][0],
                });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка создания уведомления');
          }
        } else {
          toast.error('Неизвестная ошибка при создании уведомления');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess],
  );

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        return getBasicNotificationDataStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'relations') {
        return getRelationsNotificationDataStatus(formData, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicNotificationDataErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'relations') {
        return getRelationsNotificationDataErrors(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onCreate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof NotificationCreateFormData);
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
    onCreate,
    handleChapterClick,
    onBack,
  };
}
