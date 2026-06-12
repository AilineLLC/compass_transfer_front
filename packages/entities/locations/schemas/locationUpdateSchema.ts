import { z } from 'zod';
import { LocationType } from '../enums';

export const locationUpdateSchema = z.object({
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

  country: z.string().max(100).optional().or(z.literal('')),
  region: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),

  latitude: z
    .number({ required_error: 'Широта обязательна', invalid_type_error: 'Широта должна быть числом' })
    .min(-90).max(90),

  longitude: z
    .number({ required_error: 'Долгота обязательна', invalid_type_error: 'Долгота должна быть числом' })
    .min(-180).max(180),

  isActive: z.boolean({ required_error: 'Необходимо указать статус активности' }),

  popular: z.boolean({ required_error: 'Необходимо указать популярность' }),

  popular2: z.boolean({ required_error: 'Необходимо указать популярность 2' }),

  group: z.string().optional().or(z.literal('')),

  isLandingOnly: z.boolean().nullable().default(false),
  isLandingPagePinned: z.boolean().default(false),

  tags: z.array(z.string()).default([]),

  advice: z
    .object({
      fullName: z.string().min(1, { message: 'Имя обязательно' }),
      specialization: z.string().nullable().optional(),
      content: z.string().min(1, { message: 'Текст совета обязателен' }),
    })
    .nullable()
    .default(null),
});

export type LocationUpdateFormData = z.infer<typeof locationUpdateSchema>;
