import { z } from 'zod';
import { LocationType } from '../enums';

/**
 * Схема валидации для создания локации
 */
export const locationCreateSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Название локации обязательно' })
    .max(127, { message: 'Название локации не должно превышать 127 символов' }),
  
  description: z
    .string()
    .optional()
    .or(z.literal('')),
  
  type: z
    .nativeEnum(LocationType, {
      required_error: 'Тип локации обязателен',
      invalid_type_error: 'Неверный тип локации',
    }),
  
  address: z
    .string()
    .min(1, { message: 'Адрес локации обязателен' })
    .max(255, { message: 'Адрес не должен превышать 255 символов' }),

  country: z
    .string()
    .max(100, { message: 'Название страны не должно превышать 100 символов' })
    .optional()
    .or(z.literal('')),

  region: z
    .string()
    .max(100, { message: 'Название региона не должно превышать 100 символов' })
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .max(100, { message: 'Название города не должно превышать 100 символов' })
    .optional()
    .or(z.literal('')),
  
  latitude: z
    .number({
      required_error: 'Широта обязательна',
      invalid_type_error: 'Широта должна быть числом',
    })
    .min(-90, { message: 'Широта должна быть от -90 до 90' })
    .max(90, { message: 'Широта должна быть от -90 до 90' }),

  longitude: z
    .number({
      required_error: 'Долгота обязательна',
      invalid_type_error: 'Долгота должна быть числом',
    })
    .min(-180, { message: 'Долгота должна быть от -180 до 180' })
    .max(180, { message: 'Долгота должна быть от -180 до 180' }),
  
  isActive: z
    .boolean({
      required_error: 'Необходимо указать статус активности',
      invalid_type_error: 'Поле должно быть логическим значением',
    }),
  
  popular: z
    .boolean({
      required_error: 'Необходимо указать популярность',
      invalid_type_error: 'Поле должно быть логическим значением',
    }),

  group: z
    .string()
    .optional()
    .or(z.literal('')),

  isLandingOnly: z
    .boolean()
    .nullable()
    .default(false),

  images: z
    .array(z.string())
    .optional()
    .default([]),

  poi: z
    .array(
      z.object({
        name: z.string(),
        image: z.string(),
      }),
    )
    .optional()
    .default([]),
});

/**
 * Тип данных формы создания локации
 */
export type LocationCreateFormData = z.infer<typeof locationCreateSchema>;
