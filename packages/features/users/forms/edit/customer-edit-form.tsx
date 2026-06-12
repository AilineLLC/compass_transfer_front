'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger, applyServerErrors } from '@shared/lib';
import type { UpdateCustomerDTO } from '@entities/users/interface/UpdateCustomerDTO';
import {
  customerUpdateSchema,
  type CustomerUpdateFormData,
} from '@entities/users/schemas/customerUpdateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useCustomerEditFormLogic({
  customerId,
  initialData,
  onBack,
  onSuccess,
}: {
  customerId: string;
  initialData: {
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    loyaltyPoints: number;
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(customerUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: initialData.fullName,
      phoneNumber: initialData.phoneNumber || '',
      avatarUrl: initialData.avatarUrl || null,
      loyaltyPoints: initialData.loyaltyPoints,
    },
  });

  const {
    formState: { errors },
    handleSubmit,
    watch,
    trigger,
    setFocus,
  } = form;

  const formData = watch();

  const onSubmit = useCallback(
    async (data: CustomerUpdateFormData) => {
      setIsSubmitting(true);
      try {
        const apiData: UpdateCustomerDTO = {
          ...data,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: data.avatarUrl || null,
        };
        const result = await usersApi.updateCustomer(customerId, apiData);

        if (result && result.fullName) {
          toast.success(`Клиент ${result.fullName} успешно обновлен!`);
        } else {
          toast.success('Клиент успешно обновлен!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления клиента:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            toast.error(applyServerErrors(axiosError.response.data.errors, form.setError));
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка обновления клиента');
          }
        } else {
          toast.error('Неизвестная ошибка при обновлении клиента');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, customerId],
  );

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        // Для формы редактирования проверяем только основные поля (без email и password)
        const hasErrors = errors.fullName || errors.phoneNumber;
        const allRequiredFilled = formData.fullName && formData.fullName.length > 0;

        if (hasErrors) return 'error';
        if (allRequiredFilled) return 'complete';

        return 'pending';
      }

      return 'pending';
    };
  }, [formData, errors]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        // Для формы редактирования собираем ошибки только по основным полям
        const errorList: string[] = [];

        if (errors.fullName?.message) errorList.push(errors.fullName.message);
        if (errors.phoneNumber?.message) errorList.push(errors.phoneNumber.message);

        return errorList;
      }

      return [];
    };
  }, [errors]);

  const onUpdate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof CustomerUpdateFormData);
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
