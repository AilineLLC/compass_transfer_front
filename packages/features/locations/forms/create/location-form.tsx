'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { locationsApi } from '@shared/api/locations';
import { locationGroupsApi } from '@shared/api/location-groups';
import { filesApi } from '@shared/api/files';
import { logger } from '@shared/lib';
import { findBestAreaForPoint } from '@shared/lib/geo';
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
import type { ImageItem } from '@entities/locations/ui/location-images-section';
import type { PoiItemState } from '@entities/locations/ui/location-poi-section';
import type { AdviceImageItem } from '@entities/locations/ui/location-profile-section';

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
  const imageItemsRef = useRef<ImageItem[]>([]);
  const poiItemsRef = useRef<PoiItemState[]>([]);
  const adviceImageRef = useRef<AdviceImageItem | null>(null);

  const form = useForm<LocationCreateFormData>({
    resolver: zodResolver(locationCreateSchema) as Resolver<LocationCreateFormData>,
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      description: '',
      type: LocationType.Airport,
      address: '',
      country: '',
      region: '',
      city: '',
      latitude: 42.856219,
      longitude: 74.603967,
      isActive: true,
      popular: false,
      isLandingOnly: false,
      isLandingPagePinned: false,
      group: '',
      tags: [],
      advice: null,
      priceCoefficient: null,
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

  const onAdviceImageChange = useCallback((item: AdviceImageItem | null) => {
    adviceImageRef.current = item;
  }, []);

  const onSubmit = useCallback(
    async (data: LocationCreateFormData) => {
      setIsSubmitting(true);
      try {
        // Upload location images
        const orderedImageIds = await Promise.all(
          imageItemsRef.current
            .filter(item => item.kind !== 'pending' || !item.error)
            .map(item =>
              item.kind === 'existing'
                ? Promise.resolve(item.id)
                : filesApi.uploadFile('LocationImage', item.file),
            ),
        );

        // Upload POI images
        const poiData = await Promise.all(
          poiItemsRef.current.map(async item => {
            let imageId = '';
            if (item.imageState.kind === 'existing') {
              imageId = item.imageState.id;
            } else if (item.imageState.kind === 'pending' && !item.imageState.error) {
              imageId = await filesApi.uploadFile('LocationImage', item.imageState.file);
            }
            return { name: item.name, image: imageId, type: 'Restaraunt' };
          }),
        );

        // Upload advice image
        let adviceImageId: string | null = null;
        const adviceImage = adviceImageRef.current;
        if (adviceImage?.kind === 'pending' && !adviceImage.error) {
          adviceImageId = await filesApi.uploadFile('LocationImage', adviceImage.file);
        } else if (adviceImage?.kind === 'existing') {
          adviceImageId = adviceImage.id;
        }

        const addressComponents = parseAddress(data.address);
        const locationName =
          data.name.trim() ||
          [addressComponents.houseNumber, addressComponents.street].filter(Boolean).join(', ') ||
          'Новая локация';

        let groupId: string | null = null;
        try {
          const areasResponse = await locationGroupsApi.getLocationGroups({ size: 500 });
          const matchedArea = findBestAreaForPoint(data.latitude, data.longitude, areasResponse.data);
          groupId = matchedArea?.id ?? null;
        } catch {
          // не блокируем создание если области недоступны
        }

        const apiData = {
          name: locationName,
          description: data.description || null,
          type: data.type,
          address: data.address,
          city: data.city || addressComponents.city || 'Не известно',
          country: addressComponents.country || 'Кыргызстан',
          region: data.region || addressComponents.region || 'Не известно',
          latitude: data.latitude,
          longitude: data.longitude,
          isActive: data.isActive,
          popular1: data.popular,
          isLandingOnly: data.isLandingOnly ?? false,
          isLandingPagePinned: data.isLandingPagePinned ?? false,
          priceCoefficient: data.priceCoefficient ?? null,
          group: groupId,
          images: orderedImageIds,
          poi: poiData,
          tags: data.tags ?? [],
          advice: data.advice
            ? {
                fullName: data.advice.fullName,
                specialization: data.advice.specialization ?? null,
                content: data.advice.content,
                image: adviceImageId,
              }
            : null,
        };

        const result = await locationsApi.createLocation(apiData);

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
              if (serverErrors[field]?.length > 0) {
                form.setError(fieldKey, { type: 'server', message: serverErrors[field][0] });
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
      if (chapterId === 'basic') return getBasicLocationDataStatus(formData, errors, isSubmitted);
      if (chapterId === 'map') return getMapLocationDataStatus(formData, errors, isSubmitted);
      if (chapterId === 'settings') return getCoordinatesLocationDataStatus(formData, errors, isSubmitted);
      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') return getBasicLocationDataErrors(formData, errors, isSubmitted);
      if (chapterId === 'map') return getMapLocationDataErrors(formData, errors, isSubmitted);
      if (chapterId === 'settings') return getCoordinatesLocationDataErrors(formData, errors, isSubmitted);
      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onCreate = useCallback(async () => {
    const isValid = await trigger();
    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];
      if (firstErrorField) setFocus(firstErrorField as keyof LocationCreateFormData);
      return;
    }
    await handleSubmit(onSubmit as (data: LocationCreateFormData) => Promise<void>)();
  }, [trigger, handleSubmit, onSubmit, form.formState.errors, setFocus]);

  const handleChapterClick = useCallback((chapterId: string) => {
    const element = document.getElementById(`chapter-${chapterId}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.pageYOffset - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  return {
    form,
    isSubmitting,
    imageItemsRef,
    poiItemsRef,
    onAdviceImageChange,
    getChapterStatus,
    getChapterErrors,
    onCreate,
    handleChapterClick,
    onBack,
  };
}
