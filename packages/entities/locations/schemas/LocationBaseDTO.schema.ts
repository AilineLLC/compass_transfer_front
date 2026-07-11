import { z } from 'zod';
import { LocationTypeSchema } from '@entities/locations/schemas/LocationType.schema';

/**
 * Схема валидации для LocationBaseDTO
 */
export const LocationBaseDTOSchema = z.object({
  type: LocationTypeSchema.describe('Тип локации'),
  name: z
    .string()
    .max(127, { message: 'Название локации не должно превышать 127 символов' })
    .default(''),
  address: z
    .string()
    .min(1, { message: 'Адрес обязателен' })
    .max(255, { message: 'Адрес не должен превышать 255 символов' })
    .describe('Адрес'),
  district: z
    .string()
    .max(63, { message: 'Округ/район не должен превышать 63 символа' })
    .nullable()
    .optional()
    .describe('Округ/район'),
  city: z
    .string()
    .min(1, { message: 'Город обязателен' })
    .max(63, { message: 'Город не должен превышать 63 символа' })
    .describe('Город/Населенный пункт'),
  country: z
    .string()
    .max(63, { message: 'Страна не должна превышать 63 символа' })
    .default('Кыргызстан')
    .describe('Страна'),
  region: z
    .string()
    .min(1, { message: 'Область/регион обязательна' })
    .max(63, { message: 'Область/регион не должна превышать 63 символа' })
    .describe('Область/регион'),
  latitude: z
    .number()
    .min(-90, { message: 'Широта должна быть не менее -90' })
    .max(90, { message: 'Широта должна быть не более 90' })
    .describe('Географическая широта'),
  longitude: z
    .number()
    .min(-180, { message: 'Долгота должна быть не менее -180' })
    .max(180, { message: 'Долгота должна быть не более 180' })
    .describe('Географическая долгота'),
  isActive: z.boolean().describe('Активна ли локация'),
  popular1: z.boolean().optional().describe('Популярная локация 1'),
  popular2: z.boolean().optional().describe('Популярная локация 2'),
  priceCoefficient: z.number().min(0).nullable().optional().describe('Коэффициент стоимости поездки'),
});
/**
 * Тип, выведенный из схемы LocationBaseDTOSchema
 */
export type LocationBaseDTOType = z.infer<typeof LocationBaseDTOSchema>;
