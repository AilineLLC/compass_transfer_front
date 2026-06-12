'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { tariffsApi } from '@shared/api/tariffs';
import { filesApi } from '@shared/api/files';
import { logger } from '@shared/lib';
import { CarType } from '@entities/tariffs/enums/CarType.enum';
import { ServiceClass } from '@entities/tariffs/enums/ServiceClass.enum';
import {
  getBasicTariffDataStatus,
  getPricingTariffDataStatus,
  getBasicTariffDataErrors,
  getPricingTariffDataErrors,
} from '@entities/tariffs/model/validation/ui';
import {
  tariffCreateSchema,
  type TariffCreateFormData,
} from '@entities/tariffs/schemas/tariffCreateSchema';
import type { TariffIconItem } from '@entities/tariffs/ui/tariff-basic-section';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useTariffFormLogic({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const iconItemRef = useRef<TariffIconItem | null>(null);

  const form = useForm<TariffCreateFormData>({
    resolver: zodResolver(tariffCreateSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      serviceClass: ServiceClass.Economy,
      carType: CarType.Sedan,
      basePrice: undefined,
      minutePrice: undefined,
      minimumPrice: 0,
      perKmPrice: undefined,
      freeWaitingTimeMinutes: undefined,
      isLanding: false,
      color: null,
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

  const onIconChange = useCallback((item: TariffIconItem | null) => {
    iconItemRef.current = item;
  }, []);

  const onSubmit = useCallback(
    async (data: TariffCreateFormData) => {
      setIsSubmitting(true);
      try {
        let iconId: string | null = null;
        const iconItem = iconItemRef.current;
        if (iconItem?.kind === 'pending' && !iconItem.error) {
          iconId = await filesApi.uploadFile('TariffIcon', iconItem.file);
        } else if (iconItem?.kind === 'existing') {
          iconId = iconItem.id;
        }

        const apiData = {
          name: data.name,
          serviceClass: data.serviceClass,
          carType: data.carType,
          basePrice: data.basePrice,
          minutePrice: data.minutePrice,
          minimumPrice: 0,
          perKmPrice: data.perKmPrice,
          freeWaitingTimeMinutes: data.freeWaitingTimeMinutes,
          isLanding: data.isLanding,
          color: data.color,
          iconId,
        };

        const result = await tariffsApi.createTariff(apiData);

        if (result && result.name) {
          toast.success(`Тариф "${result.name}" успешно создан!`);
        } else {
          toast.success('Тариф успешно создан!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка создания тарифа:', error);

        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            const serverErrors = axiosError.response.data.errors;

            Object.keys(serverErrors).forEach(field => {
              const fieldKey = field as keyof TariffCreateFormData;

              if (serverErrors[field] && serverErrors[field].length > 0) {
                form.setError(fieldKey, {
                  type: 'server',
                  message: serverErrors[field][0],
                });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка создания тарифа');
          }
        } else {
          toast.error('Неизвестная ошибка при создании тарифа');
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
        return getBasicTariffDataStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'pricing') {
        return getPricingTariffDataStatus(formData, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicTariffDataErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'pricing') {
        return getPricingTariffDataErrors(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onCreate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof TariffCreateFormData);
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
    onIconChange,
  };
}
