'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { locationsApi } from '@shared/api/locations';
import { filesApi } from '@shared/api/files';
import { logger } from '@shared/lib';
import { LocationType } from '@entities/locations/enums';
import { parseAddress } from '@entities/locations/lib/address-parser';
import {
  getBasicLocationDataStatus,
  getMapLocationDataStatus,
  getCoordinatesLocationDataStatus,
  getBasicLocationDataErrors,
  getMapLocationDataErrors,
  getCoordinatesLocationDataErrors,
} from '@entities/locations/model/validation/ui';
import {
  locationCreateSchema,
  type LocationCreateFormData,
} from '@entities/locations/schemas/locationCreateSchema';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useLocationFormLogic({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageItemsRef = useRef<import('@entities/locations').ImageItem[]>([]);
  const poiItemsRef = useRef<import('@entities/locations').PoiItemState[]>([]);

  const form = useForm<LocationCreateFormData>({
    resolver: zodResolver(locationCreateSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      description: '', // Оставляем для схемы, но не показываем в UI
      type: LocationType.Airport,
      address: '',
      country: '',
      region: '',
      city: '',
      latitude: 42.856219, // Центр Бишкека по умолчанию
      longitude: 74.603967,
      isActive: true,
      popular: false,
      isLandingOnly: false,
      isLandingPagePinned: false,
      group: '',
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
    async (data: LocationCreateFormData) => {
      setIsSubmitting(true);
      try {
        // Загружаем картинки в порядке очереди
        const orderedImageIds = await Promise.all(
          imageItemsRef.current
            .filter(item => item.kind !== 'pending' || !item.error)
            .map(item =>
              item.kind === 'existing'
                ? Promise.resolve(item.id)
                : filesApi.uploadFile('LocationImage', item.file),
            ),
        );

        // Парсим адрес для извлечения компонентов
        const addressComponents = parseAddress(data.address);

        // Используем пользовательское название, если оно задано, иначе формируем из адреса
        const locationName = data.name.trim() ||
          [addressComponents.houseNumber, addressComponents.street]
            .filter(Boolean)
            .join(', ') ||
          'Новая локация';

        // Подготавливаем данные для API
        const apiData = {
          name: locationName,
          description: data.description || null,
          type: data.type,
          address: data.address,
          city: addressComponents.city || 'Не известно',
          country: addressComponents.country || 'Кыргызстан',
          region: addressComponents.region || data.region || 'Не известно',
          latitude: data.latitude,
          longitude: data.longitude,
          isActive: data.isActive,
          popular1: data.popular,
          isLandingOnly: data.isLandingOnly ?? false,
          isLandingPagePinned: data.isLandingPagePinned ?? false,
          group: data.group,
          images: orderedImageIds,
        };
        // Обрабатываем POI: загружаем картинки и собираем массив
        const poiData = await Promise.all(
          poiItemsRef.current.map(async item => {
            let imageId = '';
            if (item.imageState.kind === 'existing') {
              imageId = item.imageState.id;
            } else if (item.imageState.kind === 'pending' && !item.imageState.error) {
              imageId = await filesApi.uploadFile('LocationImage', item.imageState.file);
            }
            return { name: item.name, image: imageId };
          }),
        );

        const result = await locationsApi.createLocation({ ...apiData, poi: poiData });

        if (result && result.name) {
          toast.success(`Локация "${result.name}" успешно создана!`);
        } else {
          toast.success('Локация успешно создана!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка создания локации:', error);

        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;

          if (axiosError.response?.data?.errors) {
            const serverErrors = axiosError.response.data.errors;

            Object.keys(serverErrors).forEach(field => {
              const fieldKey = field as keyof LocationCreateFormData;

              if (serverErrors[field] && serverErrors[field].length > 0) {
                form.setError(fieldKey, {
                  type: 'server',
                  message: serverErrors[field][0],
                });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка создания локации');
          }
        } else {
          toast.error('Неизвестная ошибка при создании локации');
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
        return getBasicLocationDataStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'map') {
        return getMapLocationDataStatus(formData, errors, isSubmitted);
      }
      if (chapterId === 'coordinates') {
        return getCoordinatesLocationDataStatus(formData, errors, isSubmitted);
      }

      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') {
        return getBasicLocationDataErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'map') {
        return getMapLocationDataErrors(formData, errors, isSubmitted);
      }
      if (chapterId === 'coordinates') {
        return getCoordinatesLocationDataErrors(formData, errors, isSubmitted);
      }

      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onCreate = useCallback(async () => {
    const isValid = await trigger();

    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];

      if (firstErrorField) {
        setFocus(firstErrorField as keyof LocationCreateFormData);
      }

      return;
    }
    await handleSubmit(onSubmit as (data: LocationCreateFormData) => Promise<void>)();
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
    poiItemsRef,
    getChapterStatus,
    getChapterErrors,
    onCreate,
    handleChapterClick,
    onBack,
  };
}
