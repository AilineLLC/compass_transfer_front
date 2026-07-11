'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger, applyServerErrors } from '@shared/lib';
import type { AdminProfile, UpdateAdminDTO } from '@entities/users/interface';
import { getAdminProfileStatus, getAdminProfileErrors } from '@entities/users/model/validation/ui';
import {
  adminUpdateSchema,
  type AdminUpdateFormData,
} from '@entities/users/schemas/adminUpdateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useAdminEditFormLogic({
  adminId,
  initialData,
  onBack,
  onSuccess,
}: {
  adminId: string;
  initialData: {
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    profile: AdminProfile;
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(adminUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: initialData.fullName,
      phoneNumber: initialData.phoneNumber || '',
      avatarUrl: initialData.avatarUrl || null,
      profile: {
        accessLevel: initialData.profile.accessLevel,
        department: initialData.profile.department || null,
        position: initialData.profile.position,
      },
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
    async (data: AdminUpdateFormData) => {
      setIsSubmitting(true);
      try {
        const apiData: UpdateAdminDTO = {
          ...data,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: data.avatarUrl || null,
        };
        const result = await usersApi.updateAdmin(adminId, apiData);

        if (result && result.fullName) {
          toast.success(`Администратор ${result.fullName} успешно обновлен!`);
        } else {
          toast.success('Администратор успешно обновлен!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления администратора:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            toast.error(applyServerErrors(axiosError.response.data.errors, form.setError));
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка обновления администратора');
          }
        } else {
          toast.error('Неизвестная ошибка при обновлении администратора');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, adminId],
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
      if (chapterId === 'profile') {
        return getAdminProfileStatus(formData.profile, errors, isSubmitted);
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
      if (chapterId === 'profile') {
        return getAdminProfileErrors(formData.profile, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onUpdate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof AdminUpdateFormData);
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
