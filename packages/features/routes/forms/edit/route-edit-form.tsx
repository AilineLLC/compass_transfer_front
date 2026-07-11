'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { routesApi } from '@shared/api/routes';
import type { RouteDTO } from '@entities/routes/interface/PartnerRouteDTO';

const routePriceSchema = z.object({
  tariffId: z.string().min(1, 'Выберите тариф'),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
});

const routeEditSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(255),
  startLocationId: z.string().min(1, 'Выберите начальную точку'),
  endLocationId: z.string().min(1, 'Выберите конечную точку'),
  isPopular: z.boolean(),
  prices: z.array(routePriceSchema).default([]),
  duration: z.number().min(0, 'Длительность не может быть отрицательной').int('Введите целое число'),
});

export type RouteEditFormData = z.infer<typeof routeEditSchema>;

type ApiError = {
  detail?: string;
  errors?: Record<string, string[]>;
};

export function useRouteEditForm({
  routeId,
  onBack,
  onSuccess,
}: {
  routeId: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [route, setRoute] = useState<RouteDTO | null>(null);

  const form = useForm<RouteEditFormData>({
    resolver: zodResolver(routeEditSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      startLocationId: '',
      endLocationId: '',
      isPopular: false,
      prices: [],
      duration: 0,
    },
  });

  useEffect(() => {
    const loadRoute = async () => {
      setIsLoadingRoute(true);
      try {
        const data = await routesApi.getRouteById(routeId);
        setRoute(data);
        form.reset({
          name: data.name,
          startLocationId: data.startLocationId,
          endLocationId: data.endLocationId,
          isPopular: data.isPopular,
          prices: (data.prices ?? []).map(p => ({
            tariffId: p.tariffId ?? '',
            price: p.price ?? 0,
          })),
          duration: data.duration ?? 0,
        });
      } catch {
        toast.error('Ошибка загрузки направления');
      } finally {
        setIsLoadingRoute(false);
      }
    };

    loadRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const onSubmit = useCallback(async (data: RouteEditFormData) => {
    setIsSubmitting(true);
    try {
      const result = await routesApi.updateRoute(routeId, {
        name: data.name,
        startLocationId: data.startLocationId,
        endLocationId: data.endLocationId,
        isPopular: data.isPopular,
        prices: data.prices,
        duration: data.duration,
      });

      toast.success(`Направление "${result.name}" успешно обновлено!`);
      onSuccess();
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          const serverErrors = axiosError.response.data.errors;
          Object.keys(serverErrors).forEach(field => {
            const fieldKey = field as keyof RouteEditFormData;
            if (serverErrors[field]?.length > 0) {
              form.setError(fieldKey, { type: 'server', message: serverErrors[field][0] });
            }
          });
          toast.error('Исправьте ошибки в форме');
        } else {
          toast.error(axiosError.response?.data?.detail || 'Ошибка обновления направления');
        }
      } else {
        toast.error('Неизвестная ошибка при обновлении направления');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [form, routeId, onSuccess]);

  const onUpdate = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    await form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  return {
    form,
    route,
    isSubmitting,
    isLoadingRoute,
    onUpdate,
    onBack,
  };
}
