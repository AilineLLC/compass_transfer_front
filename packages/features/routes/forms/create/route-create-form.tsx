'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiRequestError } from '@shared/api/client';
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { routesApi } from '@shared/api/routes';

const routeCreateSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(255),
  startLocationId: z.string().min(1, 'Выберите начальную точку'),
  endLocationId: z.string().min(1, 'Выберите конечную точку'),
  isPopular: z.boolean(),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  duration: z.number().min(0, 'Длительность не может быть отрицательной').int('Введите целое число'),
});

export type RouteCreateFormData = z.infer<typeof routeCreateSchema>;


export function useRouteCreateForm({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RouteCreateFormData>({
    resolver: zodResolver(routeCreateSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      startLocationId: '',
      endLocationId: '',
      isPopular: false,
      price: 0,
      duration: 0,
    },
  });

  const onSubmit = useCallback(async (data: RouteCreateFormData) => {
    setIsSubmitting(true);
    try {
      const result = await routesApi.createRoute({
        name: data.name,
        startLocationId: data.startLocationId,
        endLocationId: data.endLocationId,
        isPopular: data.isPopular,
        price: data.price,
        duration: data.duration,
      });

      toast.success(`Направление "${result.name}" успешно создано!`);
      onSuccess();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const { errors: serverErrors, message } = error.apiError;
        if (serverErrors && Object.keys(serverErrors).length > 0) {
          const formFields: (keyof RouteCreateFormData)[] = [
            'name', 'startLocationId', 'endLocationId', 'isPopular', 'price', 'duration',
          ];
          const nonFieldMessages: string[] = [];

          Object.keys(serverErrors).forEach(field => {
            if ((formFields as string[]).includes(field)) {
              if (serverErrors[field]?.length > 0) {
                form.setError(field as keyof RouteCreateFormData, { type: 'server', message: serverErrors[field][0] });
              }
            } else if (serverErrors[field]?.length > 0) {
              nonFieldMessages.push(...serverErrors[field]);
            }
          });

          if (nonFieldMessages.length > 0) {
            toast.error(nonFieldMessages[0]);
          } else {
            toast.error('Исправьте ошибки в форме');
          }
        } else {
          toast.error(message);
        }
      } else {
        toast.error(error instanceof Error ? error.message : 'Ошибка создания направления');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSuccess]);

  const onCreate = useCallback(async () => {
    const isValid = await form.trigger();

    if (!isValid) return;
    await form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  return {
    form,
    isSubmitting,
    onCreate,
    onBack,
  };
}
