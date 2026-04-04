import { z } from 'zod';
import { createDateTimeTransform } from '@shared/lib/utils';
import { PaymentMethodType } from '@entities/orders/enums';
import { OrderServiceDTOSchema } from '@entities/orders/schemas/OrderServiceDTO.schema';
import { PassengerDTOSchema } from '@entities/orders/schemas/PassengerDTO.schema';
/**
 * Схема валидации для RideWaypoint
 */
const RideWaypointSchema = z.object({
  locationId: z
    .string({ required_error: 'Выберите локацию' })
    .uuid({ message: 'Выберите корректную локацию' }),
  arrivalTime: z.string().nullable().optional(),
  departureTime: z.string().nullable().optional(),
});

/**
 * Схема валидации для CreateScheduledOrderDTO
 */
export const CreateScheduledOrderDTOSchema = z
  .object({
    tariffId: z
      .string({ required_error: 'Выберите тариф' })
      .uuid({ message: 'Выберите корректный тариф' }),

    // Поле для UI (не отправляется на сервер)
    routeType: z.enum(['template', 'manual']).optional(),

    // Маршрут: либо готовый routeId, либо ручной выбор локаций
    routeId: z
      .union([
        z.string().uuid({ message: 'Выберите корректный маршрут' }),
        z.null(),
        z.literal('').transform(() => null),
      ])
      .optional(),
    startLocationId: z
      .union([
        z.string().uuid({ message: 'Выберите корректную начальную точку' }),
        z.null(),
        z.literal('').transform(() => null),
      ])
      .optional(),
    endLocationId: z
      .union([
        z.string().uuid({ message: 'Выберите корректную конечную точку' }),
        z.null(),
        z.literal('').transform(() => null),
      ])
      .optional(),
    additionalStops: z
      .array(z.string().uuid({ message: 'Некорректная промежуточная точка' }))
      .default([]),

    services: z.array(OrderServiceDTOSchema).default([]),
    initialPrice: z.preprocess(
      val => {
        if (typeof val === 'string') {
          const parsed = parseFloat(val);

          return isNaN(parsed) ? val : parsed;
        }

        return val;
      },
      z
        .number({
          required_error: 'Укажите стоимость',
          invalid_type_error: 'Стоимость должна быть числом',
        })
        .min(0, { message: 'Стоимость должна быть положительным числом' }),
    ),
    scheduledTime: createDateTimeTransform().refine(val => val && val.length > 0, {
      message: 'Выберите дату и время отправки',
    }),
    passengers: z
      .array(PassengerDTOSchema)
      .min(1, { message: 'Добавьте хотя бы одного пассажира' }),

    // Дополнительные поля для формы (опциональные, так как клиент определяется через пассажиров)
    clientType: z
      .enum(['existing', 'new'], { required_error: 'Выберите тип клиента' })
      .default('new')
      .optional(),
    customerId: z.string().optional(),
    firstName: z.string().default('Нет имени').optional(),
    lastName: z.string().optional(),

    // Поля для назначения водителя и поездки (будут заполняться через карту)
    driverId: z.string().optional(), // Будет выбираться на карте
    carId: z.string().optional(), // Будет выбираться на карте
    waypoints: z.array(RideWaypointSchema).optional().default([]), // Будут выбираться на карте

    // Дополнительные поля заказа
    description: z
      .string()
      .max(511, { message: 'Описание не должно превышать 511 символов' })
      .nullable()
      .optional(),
    airFlight: z
      .string()
      .max(63, { message: 'Номер рейса прилета не должен превышать 63 символа' })
      .nullable()
      .optional(),
    flyReis: z
      .string()
      .max(20, { message: 'Номер рейса вылета не должен превышать 20 символов' })
      .refine(
        val => {
          // Если поле пустое или null - не применяем regex
          if (!val || val.trim() === '') return true;

          // Если заполнено - проверяем regex
          return /^[A-Z0-9\s-]+$/.test(val);
        },
        {
          message:
            'Номер рейса вылета должен содержать только заглавные буквы, цифры, пробелы и дефисы',
        },
      )
      .nullable()
      .optional(),
    paymentMethodType: z.nativeEnum(PaymentMethodType).default(PaymentMethodType.Cash),
    driverPrice: z.preprocess(
      val => {
        if (typeof val === 'string') {
          const parsed = parseFloat(val);

          return isNaN(parsed) ? null : parsed;
        }

        return val ?? null;
      },
      z
        .number()
        .min(0, { message: 'Сумма водителя не может быть отрицательной' })
        .nullable()
        .optional(),
    ),
  })
  .refine(
    data => {
      // Если указан тип маршрута, проверяем соответствующие поля
      if (data.routeType === 'template') {
        // В режиме шаблона требуется routeId
        return data.routeId !== null && data.routeId !== undefined && data.routeId !== '';
      }

      if (data.routeType === 'manual') {
        // В ручном режиме требуются startLocationId и endLocationId
        return (
          data.startLocationId !== null &&
          data.startLocationId !== undefined &&
          data.startLocationId !== '' &&
          data.endLocationId !== null &&
          data.endLocationId !== undefined &&
          data.endLocationId !== ''
        );
      }

      // Если routeType не указан, используем старую логику (обратная совместимость)
      const hasRoute = data.routeId !== null && data.routeId !== undefined && data.routeId !== '';
      const hasManualLocations =
        data.startLocationId !== null &&
        data.startLocationId !== undefined &&
        data.startLocationId !== '' &&
        data.endLocationId !== null &&
        data.endLocationId !== undefined &&
        data.endLocationId !== '';

      // Должен быть указан хотя бы один из вариантов
      return hasRoute || hasManualLocations;
    },
    {
      message: 'Укажите либо готовый маршрут, либо начальную и конечную точки',
      path: ['routeId'],
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
 * Тип, выведенный из схемы CreateScheduledOrderDTOSchema
 */
export type CreateScheduledOrderDTOType = z.infer<typeof CreateScheduledOrderDTOSchema>;
/**
 * Тип для отправки на сервер (без поля routeType)
 */
export type CreateScheduledOrderDTOForAPI = Omit<CreateScheduledOrderDTOType, 'routeType'>;

/**
 * Функция для подготовки данных перед отправкой на сервер
 * Убирает поле routeType и очищает неиспользуемые поля в зависимости от выбранного типа маршрута
 */
export function prepareCreateScheduledOrderForAPI(
  data: CreateScheduledOrderDTOType,
): CreateScheduledOrderDTOForAPI {
  const { routeType, ...apiData } = data;

  // Если выбран готовый маршрут, очищаем поля ручного выбора
  if (routeType === 'template') {
    return {
      ...apiData,
      startLocationId: null,
      endLocationId: null,
    };
  }
  // Если выбран ручной выбор, очищаем поле готового маршрута
  if (routeType === 'manual') {
    return {
      ...apiData,
      routeId: null,
    };
  }

  // Если тип не указан, возвращаем как есть
  return apiData;
}
