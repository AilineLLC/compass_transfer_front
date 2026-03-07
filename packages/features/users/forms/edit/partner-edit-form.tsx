'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import { logger } from '@shared/lib';
import type { VerificationStatus } from '@entities/users/enums';
import type { PartnerProfile } from '@entities/users/interface/PartnerProfile';
import type { UpdatePartnerDTO } from '@entities/users/interface/UpdatePartnerDTO';
import { getCompanyDataStatus, getCompanyDataErrors } from '@entities/users/model/validation/ui';
import {
  partnerUpdateSchema,
  type PartnerUpdateFormData,
} from '@entities/users/schemas/partnerUpdateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function usePartnerEditFormLogic({
  partnerId,
  initialData,
  onBack,
  onSuccess,
}: {
  partnerId: string;
  initialData: {
    fullName: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    verificationStatus: string; // TODO: Должно быть VerificationStatus
    profile: PartnerProfile;
    sale: number | null;
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerUpdateFormData>({
    resolver: zodResolver(partnerUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      fullName: initialData.fullName,
      phoneNumber: initialData.phoneNumber || '',
      avatarUrl: initialData.avatarUrl || null,
      verificationStatus: initialData.verificationStatus as VerificationStatus,
      profile: initialData.profile,
      sale: initialData.sale,
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
    async (data: PartnerUpdateFormData) => {
      setIsSubmitting(true);
      try {
        const apiData: UpdatePartnerDTO = {
          ...data,
          phoneNumber: data.phoneNumber || null,
          avatarUrl: data.avatarUrl || null,
          sale: data.sale,
        };
        const result = await usersApi.updatePartner(partnerId, apiData);

        if (result && result.fullName) {
          toast.success(`Контр-агент ${result.fullName} успешно обновлен!`);
        } else {
          toast.success('Контр-агент успешно обновлен!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления Контр-агент:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            const serverErrors = axiosError.response.data.errors;

            Object.keys(serverErrors).forEach(field => {
              const fieldKey = field as keyof PartnerUpdateFormData;

              if (serverErrors[field] && serverErrors[field].length > 0) {
                form.setError(fieldKey, {
                  type: 'server',
                  message: serverErrors[field][0],
                });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка обновления партнера');
          }
        } else {
          toast.error('Неизвестная ошибка при обновлении партнера');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, partnerId],
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
      if (chapterId === 'business') {
        return getCompanyDataStatus(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'sale') {
        if (errors.sale) return 'error';
        if (formData.sale !== undefined && formData.sale !== null) return 'complete';
        return 'pending';
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
      if (chapterId === 'business') {
        return getCompanyDataErrors(formData.profile, errors, isSubmitted);
      }
      if (chapterId === 'sale') {
        const errorList: string[] = [];
        if (errors.sale?.message) errorList.push(errors.sale.message);
        return errorList;
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
        setFocus(firstErrorField as keyof PartnerUpdateFormData);
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
