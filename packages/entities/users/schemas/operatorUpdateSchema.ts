import { z } from 'zod';

/**
 * Схема валидации для обновления оператора
 */
export const operatorUpdateSchema = z.object({
  phoneNumber: z
    .string()
    .max(63, { message: 'Номер телефона не должен превышать 63 символа' })
    .nullable()
    .optional(),
  fullName: z
    .string()
    .min(1, { message: 'Полное имя обязательно' })
    .max(255, { message: 'Полное имя не должно превышать 255 символов' }),
  avatarUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  isMainSupportOperator: z.boolean(),
  profile: z.object({
    employeeId: z
      .string()
      .min(1, { message: 'Табельный номер обязателен' })
      .max(63, { message: 'Табельный номер не должен превышать 63 символа' }),
    department: z
      .string()
      .min(1, { message: 'Отдел обязателен' })
      .max(127, { message: 'Отдел не должен превышать 127 символов' }),
    position: z
      .string()
      .min(1, { message: 'Должность обязательна' })
      .max(127, { message: 'Должность не должна превышать 127 символов' }),
    hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Дата найма должна быть в формате YYYY-MM-DD',
    }),
  }),
});

/**
 * Тип данных формы обновления оператора
 */
export type OperatorUpdateFormData = z.infer<typeof operatorUpdateSchema>;
