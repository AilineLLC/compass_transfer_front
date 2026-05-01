'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { tariffsApi } from '@shared/api/tariffs';
import { logger } from '@shared/lib';
import { ServiceClass } from '@entities/tariffs/enums/ServiceClass.enum';
import { CarType } from '@entities/tariffs/enums/CarType.enum';
import {
  getBasicTariffDataStatusForUpdate,
  getPricingTariffDataStatusForUpdate,
  getBasicTariffDataErrorsForUpdate,
  getPricingTariffDataErrorsForUpdate,
} from '@entities/tariffs/model/validation/ui';
import {
  tariffUpdateSchema,
  type TariffUpdateFormData,
} from '@entities/tariffs/schemas/tariffUpdateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useTariffEditFormLogic({
  tariffId,
  initialData,
  onBack,
  onSuccess,
}: {
  tariffId: string;
  initialData: {
    name: string;
    serviceClass: ServiceClass;
    carType: CarType;
    basePrice: number;
    minutePrice: number;
    minimumPrice: number;
    perKmPrice: number;
    freeWaitingTimeMinutes: number;
    isLanding: boolean | null;
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(tariffUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: initialData.name,
      serviceClass: initialData.serviceClass,
      carType: initialData.carType,
      basePrice: initialData.basePrice,
      minutePrice: initialData.minutePrice,
      minimumPrice: 0, // Всегда 0
      perKmPrice: initialData.perKmPrice,
      freeWaitingTimeMinutes: initialData.freeWaitingTimeMinutes,
      isLanding: initialData.isLanding,
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
    async (data: TariffUpdateFormData) => {
      setIsSubmitting(true);
      try {
        const apiData = {
          name: data.name,
          serviceClass: data.serviceClass,
          carType: data.carType,
          basePrice: data.basePrice,
          minutePrice: data.minutePrice,
          minimumPrice: 0, // Всегда передаем 0
          perKmPrice: data.perKmPrice,
          freeWaitingTimeMinutes: data.freeWaitingTimeMinutes,
          isLanding: data.isLanding,
        };
        
        const result = await tariffsApi.updateTariff(tariffId, apiData);

        if (result && result.name) {
          toast.success(`Тариф "${result.name}" успешно обновлен!`);
        } else {
          toast.success('Тариф успешно обновлен!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления тарифа:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            const serverErrors = axiosError.response.data.errors;

            Object.keys(serverErrors).forEach(field => {
              const fieldKey = field as keyof TariffUpdateFormData;

              if (serverErrors[field] && serverErrors[field].length > 0) {
                form.setError(fieldKey, {
                  type: 'server',
                  message: serverErrors[field][0],
                });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка обновления тарифа');
          }
        } else {
          toast.error('Неизвестная ошибка при обновлении тарифа');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, tariffId],
  );

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        return getBasicTariffDataStatusForUpdate(formData, errors, isSubmitted);
      }
      if (chapterId === 'pricing') {
        return getPricingTariffDataStatusForUpdate(formData, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicTariffDataErrorsForUpdate(formData, errors, isSubmitted);
      }
      if (chapterId === 'pricing') {
        return getPricingTariffDataErrorsForUpdate(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onUpdate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof TariffUpdateFormData);
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
