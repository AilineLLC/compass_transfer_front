'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiRequestError } from '@shared/api/client';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger, applyServerErrors } from '@shared/lib';
import type { CreateAdminDTO } from '@entities/users/interface/CreateAdminDTO';
import {
  getBasicDataStatus,
  getBasicDataErrors,
  getSecurityStatus,
  getSecurityErrors,
  getAdminProfileStatus,
  getAdminProfileErrors,
} from '@entities/users/model/validation/ui';
import {
  adminCreateSchema,
  type AdminCreateFormData,
} from '@entities/users/schemas/adminCreateSchema';


export function useAdminFormLogic({
  selectedRole,
  onBack,
  onSuccess,
}: {
  selectedRole: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminCreateFormData>({
    resolver: zodResolver(adminCreateSchema),
    mode: 'onSubmit',
    defaultValues: {
      phoneNumber: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      profile: {
        accessLevel: '',
        department: null,
        position: null,
        employeeId: `ADM-${Date.now()}`,
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
    async (data: AdminCreateFormData) => {
      setIsSubmitting(true);
      try {
        // Подготавливаем данные для API (исключаем confirmPassword)
        const { confirmPassword: _confirmPassword, ...formDataWithoutConfirm } = data;
        const apiData: CreateAdminDTO = {
          ...formDataWithoutConfirm,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: null, // Пока не поддерживается
          profile: {
            ...formDataWithoutConfirm.profile,
            department: data.profile.department || null,
            position: data.profile.position || null,
          },
        };
        const result = await usersApi.createAdmin(apiData);

        if (result && result.fullName) {
          toast.success(`Администратор ${result.fullName} успешно создан!`);
        } else {
          toast.success('Администратор успешно создан!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка создания администратора:', error);
        if (error instanceof ApiRequestError) {
          const { errors: serverErrors, message } = error.apiError;
          if (serverErrors && Object.keys(serverErrors).length > 0) {
            toast.error(applyServerErrors(serverErrors, form.setError));
          } else {
            toast.error(message);
          }
        } else {
          toast.error(error instanceof Error ? error.message : 'Ошибка создания администратора');
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
        return getBasicDataStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'profile') {
        return getAdminProfileStatus(formData.profile, errors, isSubmitted);
      }

      if (chapterId === 'security') {
        return getSecurityStatus(formData, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicDataErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'profile') {
        return getAdminProfileErrors(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'security') {
        return getSecurityErrors(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onCreate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof AdminCreateFormData);
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
    selectedRole,
  };
}
