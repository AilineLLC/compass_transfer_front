'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger, applyServerErrors } from '@shared/lib';
import type { ActivityStatus } from '@entities/users/enums';
import type { TerminalProfile } from '@entities/users/interface/TerminalProfile';
import type { UpdateTerminalDTO } from '@entities/users/interface/UpdateTerminalDTO';
import {
  terminalUpdateSchema,
  type TerminalUpdateFormData,
} from '@entities/users/schemas/terminalUpdateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useTerminalEditFormLogic({
  terminalId,
  initialData,
  onBack,
  onSuccess,
}: {
  terminalId: string;
  initialData: {
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    status: string;
    locationId?: string | null;
    profile: TerminalProfile;
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TerminalUpdateFormData>({
    resolver: zodResolver(terminalUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: initialData.fullName,
      phoneNumber: initialData.phoneNumber || '',
      avatarUrl: initialData.avatarUrl || undefined,
      status: initialData.status as ActivityStatus,
      locationId: initialData.locationId || '',
      profile: initialData.profile,
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
    async (data: TerminalUpdateFormData) => {
      setIsSubmitting(true);
      try {
        const apiData: UpdateTerminalDTO = {
          ...data,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: data.avatarUrl || null,
          locationId: data.locationId || null,
        };
        const result = await usersApi.updateTerminal(terminalId, apiData);

        if (result && result.fullName) {
          toast.success(`Терминал ${result.fullName} успешно обновлен!`);
        } else {
          toast.success('Терминал успешно обновлен!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления терминала:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            toast.error(applyServerErrors(axiosError.response.data.errors, form.setError));
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка обновления терминала');
          }
        } else {
          toast.error('Неизвестная ошибка при обновлении терминала');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, terminalId],
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
      if (chapterId === 'security') {
        // В форме редактирования нет полей безопасности
        return 'complete';
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
      if (chapterId === 'security') {
        // В форме редактирования нет полей безопасности
        return [];
      }

      return [];
    };
  }, [errors]);

  const onUpdate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof TerminalUpdateFormData);
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
