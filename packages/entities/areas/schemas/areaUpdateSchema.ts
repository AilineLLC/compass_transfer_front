import { z } from 'zod';

export const areaUpdateSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Название области обязательно' })
    .max(200, { message: 'Название не должно превышать 200 символов' }),
  city: z
    .string()
    .min(1, { message: 'Город/область обязательна' }),
  latitude: z.number().default(42.856219),
  longitude: z.number().default(74.603967),
  poly: z
    .array(z.number())
    .min(6, { message: 'Необходимо минимум 3 точки (6 координат)' }),
});

export type AreaUpdateFormData = z.infer<typeof areaUpdateSchema>;
