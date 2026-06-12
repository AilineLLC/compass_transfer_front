'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger, applyServerErrors } from '@shared/lib';
import type { UpdateOperatorDTO } from '@entities/users/interface/UpdateOperatorDTO';
import {
  getEmployeeProfileStatus,
  getEmployeeProfileErrors,
} from '@entities/users/model/validation/ui';
import {
  operatorUpdateSchema,
  type OperatorUpdateFormData,
} from '@entities/users/schemas/operatorUpdateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useOperatorEditFormLogic({
  operatorId,
  initialData,
  onBack,
  onSuccess,
}: {
  operatorId: string;
  initialData: {
    fullName: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    isActive: boolean;
    profile: Record<string, unknown>; // TODO: Использовать OperatorProfile после исправления несоответствий типов
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(operatorUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: initialData.fullName,
      phoneNumber: initialData.phoneNumber || '',
      avatarUrl: initialData.avatarUrl || null,
      isActive: initialData.isActive,
      profile: initialData.profile,
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
    async (data: OperatorUpdateFormData) => {
      setIsSubmitting(true);
      try {
        const apiData: UpdateOperatorDTO = {
          ...data,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: data.avatarUrl || null,
        };
        const result = await usersApi.updateOperator(operatorId, apiData);

        if (result && result.fullName) {
          toast.success(`Оператор ${result.fullName} успешно обновлен!`);
        } else {
          toast.success('Оператор успешно обновлен!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления оператора:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            toast.error(applyServerErrors(axiosError.response.data.errors, form.setError));
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка обновления оператора');
          }
        } else {
          toast.error('Неизвестная ошибка при обновлении оператора');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, operatorId],
  );

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        // Для формы редактирования используем упрощенную проверку
        const hasErrors = errors.fullName || errors.phoneNumber;
        const allRequiredFilled = formData.fullName && formData.fullName.length > 0;

        if (hasErrors) return 'error';
        if (allRequiredFilled) return 'complete';

        return 'pending';
      }
      if (chapterId === 'employee-profile') {
        return getEmployeeProfileStatus(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'security') {
        // В форме редактирования нет полей безопасности
        return 'complete';
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        // Для формы редактирования собираем ошибки только по основным полям
        const errorList: string[] = [];

        if (errors.fullName?.message) errorList.push(errors.fullName.message);
        if (errors.phoneNumber?.message) errorList.push(errors.phoneNumber.message);

        return errorList;
      }
      if (chapterId === 'employee-profile') {
        return getEmployeeProfileErrors(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'security') {
        // В форме редактирования нет полей безопасности
        return [];
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onUpdate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof OperatorUpdateFormData);
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
