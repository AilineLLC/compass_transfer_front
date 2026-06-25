'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { locationGroupsApi } from '@shared/api/location-groups';
import type { LocationGroupDTO } from '@shared/api/location-groups';
import {
  getBasicAreaDataStatus,
  getMapAreaDataStatus,
  getBasicAreaDataErrors,
  getMapAreaDataErrors,
} from '@entities/areas/model/validation/ui';
import {
  areaUpdateSchema,
  type AreaUpdateFormData,
} from '@entities/areas/schemas/areaUpdateSchema';

export function useAreaEditForm({
  area,
  onBack,
  onSuccess,
}: {
  area: LocationGroupDTO;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AreaUpdateFormData>({
    resolver: zodResolver(areaUpdateSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: area.name,
      city: area.city,
      latitude: area.latitude,
      longitude: area.longitude,
      poly: area.poly,
    },
  });

  const { handleSubmit, watch, trigger, setFocus, reset, formState: { errors, isSubmitted } } = form;
  const formData = watch();

  useEffect(() => {
    reset({
      name: area.name,
      city: area.city,
      latitude: area.latitude,
      longitude: area.longitude,
      poly: area.poly,
    });
  }, [area, reset]);

  const onSubmit = useCallback(
    async (data: AreaUpdateFormData) => {
      setIsSubmitting(true);
      try {
        await locationGroupsApi.updateLocationGroup(area.id, {
          name: data.name,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          poly: data.poly,
        });
        toast.success(`Область "${data.name}" успешно обновлена!`);
        onSuccess();
      } catch {
        toast.error('Ошибка обновления области');
      } finally {
        setIsSubmitting(false);
      }
    },
    [area.id, onSuccess],
  );

  const onSave = useCallback(async () => {
    const isValid = await trigger();
    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];
      if (firstErrorField) setFocus(firstErrorField as keyof AreaUpdateFormData);
      return;
    }
    await handleSubmit(onSubmit as (data: AreaUpdateFormData) => Promise<void>)();
  }, [trigger, handleSubmit, onSubmit, form.formState.errors, setFocus]);

  const getChapterStatus = useMemo(() => {
    return (chapterId: string): 'complete' | 'warning' | 'error' | 'pending' => {
      if (chapterId === 'basic') return getBasicAreaDataStatus(formData, errors, isSubmitted);
      if (chapterId === 'map') return getMapAreaDataStatus(formData, errors, isSubmitted);
      return 'pending';
    };
  }, [formData, errors, isSubmitted]);

  const getChapterErrors = useMemo(() => {
    return (chapterId: string): string[] => {
      if (chapterId === 'basic') return getBasicAreaDataErrors(formData, errors, isSubmitted);
      if (chapterId === 'map') return getMapAreaDataErrors(formData, errors, isSubmitted);
      return [];
    };
  }, [formData, errors, isSubmitted]);

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
    errors,
    watch,
    getChapterStatus,
    getChapterErrors,
    onSave,
    handleChapterClick,
    onBack,
  };
}
