import { z } from 'zod';
import { VerificationStatus, BusinessType } from '@entities/users/enums';

/**
 * Схема валидации для создания партнера
 */
export const partnerCreateSchema = z
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
    verificationStatus: z.nativeEnum(VerificationStatus, {
      message: 'Выберите статус верификации',
    }),
    profile: z.object({
      companyName: z.string().min(1, { message: 'Название компании обязательно' }),
      companyType: z.nativeEnum(BusinessType, {
        message: 'Выберите тип компании',
      }),
      registrationNumber: z
        .string()
        .max(31, { message: 'Регистрационный номер не должен превышать 31 символ' })
        .nullable(),
      taxIdentifier: z
        .string()
        .max(31, { message: 'ИНН не должен превышать 31 символ' })
        .nullable(),
      legalAddress: z
        .string()
        .min(1, { message: 'Юридический адрес обязателен' })
        .max(255, { message: 'Юридический адрес не должен превышать 255 символов' }),
      contactEmail: z
        .string()
        .max(255, { message: 'Контактный email не должен превышать 255 символов' })
        .email({ message: 'Введите корректный email' })
        .nullable(),
      contactPhone: z
        .string()
        .max(63, { message: 'Контактный телефон не должен превышать 63 символа' })
        .nullable(),
      website: z
        .string()
        .max(255, { message: 'Веб-сайт не должен превышать 255 символов' })
        .nullable(),
    }),
    sale: z
      .number({ message: 'Скидка должна быть числом' } as any)
      .min(0, { message: 'Скидка не может быть меньше 0' })
      .max(1, { message: 'Скидка не может превышать 1 (100%)' })
      .nullable()
      .default(null),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'], // Ошибка будет привязана к полю confirmPassword
  });
/**
 * Тип данных формы создания партнера
 */
export type PartnerCreateFormData = z.infer<typeof partnerCreateSchema>;
