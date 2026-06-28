'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { locationGroupsApi } from '@shared/api/location-groups';
import {
  getBasicAreaDataStatus,
  getMapAreaDataStatus,
  getBasicAreaDataErrors,
  getMapAreaDataErrors,
} from '@entities/areas/model/validation/ui';
import {
  areaCreateSchema,
  type AreaCreateFormData,
} from '@entities/areas/schemas/areaCreateSchema';

export function useAreaCreateForm({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AreaCreateFormData>({
    resolver: zodResolver(areaCreateSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      city: '',
      latitude: 42.856219,
      longitude: 74.603967,
      poly: [],
    },
  });

  const { handleSubmit, watch, trigger, setFocus, formState: { errors, isSubmitted } } = form;
  const formData = watch();

  const onSubmit = useCallback(
    async (data: AreaCreateFormData) => {
      setIsSubmitting(true);
      try {
        const result = await locationGroupsApi.createLocationGroup({
          name: data.name,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          poly: data.poly,
        });
        toast.success(`Область "${result.name}" успешно создана!`);
        onSuccess();
      } catch {
        toast.error('Ошибка создания области');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSuccess],
  );

  const onCreate = useCallback(async () => {
    const isValid = await trigger();
    if (!isValid) {
      const firstErrorField = Object.keys(form.formState.errors)[0];
      if (firstErrorField) setFocus(firstErrorField as keyof AreaCreateFormData);
      return;
    }
    await handleSubmit(onSubmit as (data: AreaCreateFormData) => Promise<void>)();
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
    onCreate,
    handleChapterClick,
    onBack,
  };
}
