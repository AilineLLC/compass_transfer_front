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
import type { LocationType } from '@entities/locations/enums';
import { parseAddress } from '@entities/locations/lib/address-parser';
import {
  getBasicLocationDataStatusForUpdate,
  getMapLocationDataStatus,
  getCoordinatesLocationDataStatusForUpdate,
  getBasicLocationDataErrorsForUpdate,
  getMapLocationDataErrors,
  getCoordinatesLocationDataErrorsForUpdate,
} from '@entities/locations/model/validation/ui';
import {
  locationUpdateSchema,
  type LocationUpdateFormData,
} from '@entities/locations/schemas/locationUpdateSchema';
import type { LocationImageDTO, PoiItemDTO } from '@entities/locations/interface/LocationDTO';
import type { ImageItem } from '@entities/locations/ui/location-images-section';
import type { PoiItemState } from '@entities/locations/ui/location-poi-section';
import type { AdviceImageItem } from '@entities/locations/ui/location-profile-section';

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useLocationEditFormLogic({
  locationId,
  initialData,
  onBack,
  onSuccess,
}: {
  locationId: string;
  initialData: {
    name: string;
    description?: string | null;
    type: LocationType;
    address: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
    popular: boolean;
    popular2: boolean;
    isLandingOnly?: boolean | null;
    isLandingPagePinned?: boolean;
    group?: string | null;
    tags?: string[];
    priceCoefficient?: number | null;
    advice?: { fullName: string; specialization: string | null; content: string } | null;
    adviceImage?: { id: string; path: string } | null;
    images?: LocationImageDTO[];
    poi?: PoiItemDTO[];
  };
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageItemsRef = useRef<ImageItem[]>(
    (initialData.images ?? []).map(img => ({ kind: 'existing' as const, id: img.id, path: img.path })),
  );
  const poiItemsRef = useRef<PoiItemState[]>(
    (initialData.poi ?? []).map(p => ({
      name: p.name,
      imageState: p.image
        ? { kind: 'existing' as const, id: p.image.id, path: p.image.path }
        : { kind: 'empty' as const },
    })),
  );
  const adviceImageRef = useRef<AdviceImageItem | null>(
    initialData.adviceImage
      ? { kind: 'existing', id: initialData.adviceImage.id, path: initialData.adviceImage.path }
      : null,
  );

  const form = useForm<LocationUpdateFormData>({
    resolver: zodResolver(locationUpdateSchema) as Resolver<LocationUpdateFormData>,
    mode: 'onSubmit',
    defaultValues: {
      name: initialData.name,
      description: initialData.description || '',
      type: initialData.type,
      address: initialData.address,
      latitude: initialData.latitude,
      longitude: initialData.longitude,
      isActive: initialData.isActive,
      popular: initialData.popular,
      popular2: initialData.popular2,
      isLandingOnly: initialData.isLandingOnly ?? false,
      isLandingPagePinned: initialData.isLandingPagePinned ?? false,
      group: initialData.group || '',
      tags: initialData.tags ?? [],
      advice: initialData.advice ?? null,
      priceCoefficient: initialData.priceCoefficient ?? null,
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
    async (data: LocationUpdateFormData) => {
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
          'Локация без названия';

        let groupId: string | null = null;
        try {
          const areasResponse = await locationGroupsApi.getLocationGroups({ size: 500 });
          const matchedArea = findBestAreaForPoint(data.latitude, data.longitude, areasResponse.data);
          groupId = matchedArea?.id ?? null;
        } catch {
          // не блокируем обновление если области недоступны
        }

        const apiData = {
          name: locationName,
          description: data.description || null,
          type: data.type,
          address: data.address,
          city: data.city || addressComponents.city || 'Бишкек',
          country: addressComponents.country || 'Кыргызстан',
          region: data.region || addressComponents.region || 'Не известно',
          latitude: data.latitude,
          longitude: data.longitude,
          isActive: data.isActive,
          popular1: data.popular,
          popular2: data.popular2,
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

        const result = await locationsApi.updateLocation(locationId, apiData);

        if (result && result.name) {
          toast.success(`Локация "${result.name}" успешно обновлена!`);
        } else {
          toast.success('Локация успешно обновлена!');
        }
        onSuccess();
      } catch (error) {
        logger.warn('Ошибка обновления локации:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<ApiError>;
          if (axiosError.response?.data?.errors) {
            const serverErrors = axiosError.response.data.errors;
            Object.keys(serverErrors).forEach(field => {
              const fieldKey = field as keyof LocationUpdateFormData;
              if (serverErrors[field]?.length > 0) {
                form.setError(fieldKey, { type: 'server', message: serverErrors[field][0] });
              }
            });
            toast.error('Исправьте ошибки в форме');
          } else {
            toast.error(axiosError.response?.data?.detail || 'Ошибка обновления локации');
          }
        } else {
          toast.error('Неизвестная ошибка при обновлении локации');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSuccess, locationId],
  );

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') return getBasicLocationDataStatusForUpdate(formData, errors, isSubmitted);
      if (chapterId === 'map') return getMapLocationDataStatus(formData, errors, isSubmitted);
      if (chapterId === 'settings') return getCoordinatesLocationDataStatusForUpdate(formData, errors, isSubmitted);
      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') return getBasicLocationDataErrorsForUpdate(formData, errors, isSubmitted);
      if (chapterId === 'map') return getMapLocationDataErrors(formData, errors, isSubmitted);
      if (chapterId === 'settings') return getCoordinatesLocationDataErrorsForUpdate(formData, errors, isSubmitted);
      return [];
    };
  }, [formData, errors, isSubmitted]);

  const onUpdate = useCallback(async () => {
    const isValid = await trigger();
    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];
      if (firstErrorField) setFocus(firstErrorField as keyof LocationUpdateFormData);
      return;
    }
    await handleSubmit(onSubmit)();
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
    onUpdate,
    handleChapterClick,
    onBack,
  };
}
