import { z } from 'zod';

/**
 * Схема валидации для создания оператора
 */
export const operatorCreateSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: 'Email обязателен' })
      .email({ message: 'Введите корректный email' })
      .max(255, { message: 'Email не должен превышать 255 символов' }),
    password: z.string().min(8, { message: 'Пароль должен содержать не менее 8 символов' }),
    confirmPassword: z.string().min(1, { message: 'Подтверждение пароля обязательно' }),
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
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'], // Ошибка будет привязана к полю confirmPassword
  });

/**
 * Тип данных формы создания оператора
 */
export type OperatorCreateFormData = z.infer<typeof operatorCreateSchema>;
