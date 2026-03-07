// Главы форм для партнера

import { BASE_CHAPTERS, type FormChapter } from './base-chapters';

// Специфичные главы для партнера
export const PARTNER_CHAPTERS = {
  BUSINESS: {
    id: 'business',
    title: 'Данные компании',
    description: 'Название, тип, ИНН, адрес, контакты',
  } as FormChapter,
  SALE: {
    id: 'sale',
    title: 'Условия сотрудничества',
    description: 'Скидки и специальные условия',
  } as FormChapter,
} as const;

// Готовые наборы глав для форм партнера
export const PARTNER_FORM_CHAPTERS = {
  CREATE: [
    BASE_CHAPTERS.BASIC,
    BASE_CHAPTERS.SECURITY,
    PARTNER_CHAPTERS.BUSINESS,
    PARTNER_CHAPTERS.SALE,
  ],
  EDIT: [BASE_CHAPTERS.BASIC, PARTNER_CHAPTERS.BUSINESS, PARTNER_CHAPTERS.SALE],
} as const;
