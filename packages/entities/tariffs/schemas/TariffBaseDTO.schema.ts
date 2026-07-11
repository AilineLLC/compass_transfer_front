import { z } from 'zod';
import { CarTypeSchema } from '@entities/tariffs/schemas/CarType.schema';
import { ServiceClassSchema } from '@entities/tariffs/schemas/ServiceClass.schema';

/**
 * Схема валидации для TariffBaseDTO
 */
const TariffBaseDTORawSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Название тарифа обязательно' })
    .max(127, { message: 'Название тарифа не должно превышать 127 символов' })
    .describe('Название тарифа (Эконом, Комфорт)'),
  serviceClass: ServiceClassSchema.describe('Класс обслуживания'),
  carType: CarTypeSchema.describe('Тип автомобиля'),
  basePrice: z
    .preprocess(
      v => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z
        .number({ invalid_type_error: 'Должно быть числом' })
        .min(0, { message: 'Значение не может быть отрицательным' }),
    )
    .describe('Базовая стоимость подачи / минимальная стоимость'),
  minutePrice: z
    .number()
    .min(0, { message: 'Стоимость минуты не может быть отрицательной' })
    .describe('Стоимость минуты поездки'),
  minimumPrice: z
    .preprocess(
      v => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z
        .number({ invalid_type_error: 'Должно быть числом' })
        .min(0, { message: 'Значение не может быть отрицательным' }),
    )
    .optional()
    .describe('Минимальная стоимость поездки по тарифу'),
  perKmPrice: z
    .number()
    .min(0, { message: 'Стоимость километра не может быть отрицательной' })
    .describe('Стоимость километра поездки (сом)'),
  freeWaitingTimeMinutes: z
    .number()
    .min(0, { message: 'Время ожидания не может быть отрицательным' })
    .describe('Бесплатное время ожидания в минутах'),
  isLanding: z
    .boolean()
    .nullable()
    .default(false)
    .describe('Отображать тариф на лендинг-сайте'),
});

export const TariffBaseDTOSchema = TariffBaseDTORawSchema.transform(data => ({
  ...data,
  minimumPrice: data.minimumPrice ?? data.basePrice,
}));

/**
 * Тип, выведенный из схемы TariffBaseDTOSchema
 */
export type TariffBaseDTOType = z.infer<typeof TariffBaseDTOSchema>;

export { TariffBaseDTORawSchema };
