'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { carsApi } from '@shared/api/cars';
import { filesApi } from '@shared/api/files';
import type { CarImageItem } from '@entities/cars/ui/car-image-section';
import { logger } from '@shared/lib';
import { CarColor, VehicleType, ServiceClass, VehicleStatus, CarFeature, VEHICLE_TYPE_CAPACITY } from '@entities/cars/enums';
import {
  getBasicCarDataStatus,
  getFeaturesCarDataStatus,
  getBasicCarDataErrors,
  getFeaturesCarDataErrors,
} from '@entities/cars/model/validation/ui';
import {
  carCreateSchema,
  type CarCreateFormData,
} from '@entities/cars/schemas/carCreateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useCarFormLogic({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageItemRef = useRef<CarImageItem>(null);

  const form = useForm<CarCreateFormData>({
    resolver: zodResolver(carCreateSchema),
    mode: 'onSubmit',
    defaultValues: {
      make: '',
      model: '',
      year: undefined,
      color: CarColor.White,
      licensePlate: '',
      type: VehicleType.Sedan,
      serviceClass: ServiceClass.Economy,
      status: VehicleStatus.Available,
      passengerCapacity: VEHICLE_TYPE_CAPACITY[VehicleType.Sedan], // Автоматически устанавливаем для седана
      features: [],
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
    async (data: CarCreateFormData) => {
      setIsSubmitting(true);
      try {
        // Загружаем изображение если есть
        let imageId: string | null = null;
        const imageItem = imageItemRef.current;
        if (imageItem) {
          if (imageItem.kind === 'existing') {
            imageId = imageItem.id;
          } else if (!imageItem.error) {
            imageId = await filesApi.uploadFile('CarImage', imageItem.file);
          }
        }

        // Подготавливаем данные для API
        const apiData = {
          make: data.make,
          model: data.model,
          year: data.year,
          color: data.color,
          licensePlate: data.licensePlate,
          type: data.type,
          serviceClass: data.serviceClass,
          status: data.status,
          passengerCapacity: data.passengerCapacity,
          features: data.features,
          image: imageId,
        };

        const result = await carsApi.createCar(apiData);

        if (result && result.make && result.model) {
          toast.success(`Автомобиль "${result.make} ${result.model}" успешно создан!`);
        } else {
          toast.success('Автомобиль успешно создан!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка создания автомобиля:', error);

        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            const serverErrors = axiosError.response.data.errors;

            Object.keys(serverErrors).forEach(field => {
              const fieldKey = field as keyof CarCreateFormData;

              if (serverErrors[field] && serverErrors[field].length > 0) {
                form.setError(fieldKey, {
                  type: 'server',
                  message: serverErrors[field][0],
                });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка создания автомобиля');
          }
        } else {
          toast.error('Неизвестная ошибка при создании автомобиля');
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
        return getBasicCarDataStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'features') {
        return getFeaturesCarDataStatus(formData, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicCarDataErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'features') {
        return getFeaturesCarDataErrors(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onCreate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof CarCreateFormData);
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
    imageItemRef,
    getChapterStatus,
    getChapterErrors,
    onCreate,
    handleChapterClick,
    onBack,
  };
}
