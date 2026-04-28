'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { carsApi } from '@shared/api/cars';
import { filesApi } from '@shared/api/files';
import type { CarImagesItem } from '@entities/cars/ui/car-images-section';
import { logger } from '@shared/lib';
import { CarColor, VehicleType, ServiceClass, VehicleStatus, CarFeature, VEHICLE_TYPE_CAPACITY } from '@entities/cars/enums';
import {
  getBasicCarDataStatusForUpdate,
  getFeaturesCarDataStatusForUpdate,
  getBasicCarDataErrorsForUpdate,
  getFeaturesCarDataErrorsForUpdate,
} from '@entities/cars/model/validation/ui';
import {
  carUpdateSchema,
  type CarUpdateFormData,
} from '@entities/cars/schemas/carUpdateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useCarEditFormLogic({
  carId,
  initialData,
  onBack,
  onSuccess,
}: {
  carId: string;
  initialData: {
    make: string;
    model: string;
    year: number;
    color: CarColor;
    licensePlate: string;
    type: VehicleType;
    serviceClass: ServiceClass;
    status: VehicleStatus;
    passengerCapacity: number;
    features: CarFeature[];
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageItemsRef = useRef<CarImagesItem[]>([]);

  const form = useForm({
    resolver: zodResolver(carUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      id: carId,
      make: initialData.make,
      model: initialData.model,
      year: initialData.year,
      color: initialData.color,
      licensePlate: initialData.licensePlate,
      type: initialData.type,
      serviceClass: initialData.serviceClass,
      status: initialData.status,
      passengerCapacity: initialData.passengerCapacity,
      features: initialData.features,
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
    async (data: CarUpdateFormData) => {
      setIsSubmitting(true);
      try {
        const imageIds = await Promise.all(
          imageItemsRef.current
            .filter(item => item.kind !== 'pending' || !item.error)
            .map(item =>
              item.kind === 'existing'
                ? Promise.resolve(item.id)
                : filesApi.uploadFile('CarImage', item.file),
            ),
        );

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
          images: imageIds,
        };

        const result = await carsApi.updateCar(carId, apiData);

        if (result && result.make && result.model) {
          toast.success(`Автомобиль "${result.make} ${result.model}" успешно обновлен!`);
        } else {
          toast.success('Автомобиль успешно обновлен!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления автомобиля:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            const serverErrors = axiosError.response.data.errors;

            Object.keys(serverErrors).forEach(field => {
              const fieldKey = field as keyof CarUpdateFormData;

              if (serverErrors[field] && serverErrors[field].length > 0) {
                form.setError(fieldKey, {
                  type: 'server',
                  message: serverErrors[field][0],
                });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка обновления автомобиля');
          }
        } else {
          toast.error('Неизвестная ошибка при обновлении автомобиля');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, carId],
  );

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') {
        return getBasicCarDataStatusForUpdate(formData, errors, isSubmitted);
      }
      if (chapterId === 'features') {
        return getFeaturesCarDataStatusForUpdate(formData, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicCarDataErrorsForUpdate(formData, errors, isSubmitted);
      }
      if (chapterId === 'features') {
        return getFeaturesCarDataErrorsForUpdate(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onUpdate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof CarUpdateFormData);
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
    imageItemsRef,
    getChapterStatus,
    getChapterErrors,
    onUpdate,
    handleChapterClick,
    onBack,
  };
}
