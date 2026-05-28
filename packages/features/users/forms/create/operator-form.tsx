'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiRequestError } from '@shared/api/client';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger } from '@shared/lib';
import type { CreateOperatorDTO } from '@entities/users/interface/CreateOperatorDTO';
import {
  getBasicDataStatus,
  getBasicDataErrors,
  getEmployeeProfileStatus,
  getEmployeeProfileErrors,
} from '@entities/users/model/validation/ui';
import { getSecurityStatus, getSecurityErrors } from '@entities/users/model/validation/ui/security';
import {
  operatorCreateSchema,
  type OperatorCreateFormData,
} from '@entities/users/schemas/operatorCreateSchema';


export type { OperatorCreateFormData as CreateOperatorFormData };

export function useOperatorFormLogic({
  selectedRole,
  onBack,
  onSuccess,
}: {
  selectedRole: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(operatorCreateSchema),
    mode: 'onSubmit',
    defaultValues: {
      phoneNumber: '',
      fullName: '',
      avatarUrl: null,
      isActive: true,
      profile: {
        employeeId: `OP-${Date.now()}`,
        department: 'Операторы',
        position: '',
        hireDate: '',
      },
      email: '',
      password: '',
      confirmPassword: '',
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

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        return getBasicDataStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'employee-profile') {
        return getEmployeeProfileStatus(formData.profile, errors, isSubmitted);
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
      if (chapterId === 'employee-profile') {
        return getEmployeeProfileErrors(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'security') {
        return getSecurityErrors(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onSubmit = useCallback(
    async (data: OperatorCreateFormData) => {
      setIsSubmitting(true);
      try {
        // Подготавливаем данные для API (исключаем confirmPassword)
        const { confirmPassword: _confirmPassword, ...formDataWithoutConfirm } = data;
        const apiData: CreateOperatorDTO = {
          ...formDataWithoutConfirm,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: data.avatarUrl || null,
        };
        const result = await usersApi.createOperator(apiData);

        if (result && result.fullName) {
          toast.success(`Оператор ${result.fullName} успешно создан!`);
        } else {
          toast.success('Оператор успешно создан!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка создания оператора:', error);
        if (error instanceof ApiRequestError) {
          const { errors: serverErrors, message } = error.apiError;
          if (serverErrors && Object.keys(serverErrors).length > 0) {
            Object.keys(serverErrors).forEach(field => {
              if (serverErrors[field]?.length > 0) {
                form.setError(field as keyof OperatorCreateFormData, {
                  type: 'server',
                  message: serverErrors[field][0],
                });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(message);
          }
        } else {
          toast.error(error instanceof Error ? error.message : 'Ошибка создания оператора');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess],
  );

  const onCreate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof OperatorCreateFormData);
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
