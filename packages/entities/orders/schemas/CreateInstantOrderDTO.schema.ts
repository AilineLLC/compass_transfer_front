import { z } from 'zod';
import { PaymentMethodType } from '@entities/orders/enums';
import { OrderServiceDTOSchema } from './OrderServiceDTO.schema';
import { PassengerDTOSchema } from './PassengerDTO.schema';

/**
 * Схема валидации для CreateInstantOrderDTO (оператором)
 * API: POST /Order/instant/by-operator
 */
export const CreateInstantOrderDTOSchema = z
  .object({
    tariffId: z
      .string({ required_error: 'Выберите тариф' })
      .uuid({ message: 'Выберите корректный тариф' }),
    routeId: z.string().uuid({ message: 'Некорректный маршрут' }).nullable().optional(),
    startLocationId: z
      .string()
      .uuid({ message: 'Некорректная начальная точка' })
      .nullable()
      .optional(),
    endLocationId: z
      .string()
      .uuid({ message: 'Некорректная конечная точка' })
      .nullable()
      .optional(),
    additionalStops: z
      .array(z.string().uuid({ message: 'Некорректная промежуточная точка' }))
      .default([]),
    services: z.array(OrderServiceDTOSchema).default([]),
    initialPrice: z
      .number({ required_error: 'Укажите стоимость' })
      .min(0, { message: 'Стоимость не может быть отрицательной' }),
    passengers: z
      .array(PassengerDTOSchema)
      .min(1, { message: 'Добавьте хотя бы одного пассажира' }),
    paymentId: z.string().min(1, { message: 'Некорректный ID платежа' }).optional(),
    paymentMethodType: z.nativeEnum(PaymentMethodType).default(PaymentMethodType.Cash),
    driverPrice: z
      .number()
      .min(0, { message: 'Сумма водителя не может быть отрицательной' })
      .nullable()
      .optional(),
  })
  .refine(
    data => {
      // Проверяем, что указан либо routeId, либо startLocationId и endLocationId
      const hasRoute = data.routeId !== null && data.routeId !== undefined && data.routeId !== '';
      const hasManualLocations =
        data.startLocationId !== null &&
        data.startLocationId !== undefined &&
        data.startLocationId !== '' &&
        data.endLocationId !== null &&
        data.endLocationId !== undefined &&
        data.endLocationId !== '';

      return hasRoute || hasManualLocations;
    },
    {
      message: 'Укажите либо готовый маршрут, либо начальную и конечную точки',
      path: ['routeId'],
    },
  )
  .refine(
    data => {
      // Проверяем, что есть хотя бы один главный пассажир
      const mainPassengers = data.passengers.filter(p => p.isMainPassenger);

      return mainPassengers.length === 1;
    },
    {
      message: 'Должен быть ровно один главный пассажир',
      path: ['passengers'],
    },
  )
  .refine(
    data => {
      // driverPrice не должна превышать стоимость поездки
      if (data.driverPrice != null && data.driverPrice > data.initialPrice) {
        return false;
      }

      return true;
    },
    {
      message: 'Сумма водителя не может превышать стоимость поездки',
      path: ['driverPrice'],
    },
  );

/**
 * Тип, выведенный из схемы CreateInstantOrderDTOSchema
 */
export type CreateInstantOrderDTOType = z.infer<typeof CreateInstantOrderDTOSchema>;
