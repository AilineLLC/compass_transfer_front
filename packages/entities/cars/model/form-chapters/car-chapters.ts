import type { FormChapter } from '@shared/ui/layout/form-sidebar';

/**
 * Главы формы для автомобилей
 */
export const CAR_FORM_CHAPTERS = {
  CREATE: [
    {
      id: 'basic',
      title: 'Основная информация',
      description: 'Марка, модель, год, цвет и технические характеристики',
    },
    {
      id: 'features',
      title: 'Дополнительные опции',
      description: 'Комфорт, технологии, безопасность и другие опции',
    },
    {
      id: 'image',
      title: 'Фотография',
      description: 'Фотография автомобиля',
    },
  ] as FormChapter[],

  EDIT: [
    {
      id: 'basic',
      title: 'Основная информация',
      description: 'Марка, модель, год, цвет и технические характеристики',
    },
    {
      id: 'features',
      title: 'Дополнительные опции',
      description: 'Комфорт, технологии, безопасность и другие опции',
    },
    {
      id: 'image',
      title: 'Фотография',
      description: 'Фотография автомобиля',
    },
  ] as FormChapter[],
};
