import { z } from 'zod';

/**
 * Схема валидации для PassengerDTO
 */
export const PassengerDTOSchema = z.object({
  customerId: z.string().uuid({ message: 'Выберите корректного клиента' }).nullable().optional(),
  firstName: z
    .string({ required_error: 'Имя пассажира обязательно' })
    .min(1, { message: 'Имя пассажира обязательно' }),
  lastName: z.string().nullable(),
  phone: z.string().nullable().optional(),
  isMainPassenger: z.boolean({ required_error: 'Укажите основного пассажира' }),
});
/**
 * Тип, выведенный из схемы PassengerDTOSchema
 */
export type PassengerDTOType = z.infer<typeof PassengerDTOSchema>;
