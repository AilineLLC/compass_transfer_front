import type { FormChapter } from '@shared/ui/layout/form-sidebar';

/**
 * Главы формы для локаций
 */
export const LOCATION_FORM_CHAPTERS = {
  CREATE: [
    {
      id: 'basic',
      title: 'Основная информация',
      description: 'Название, описание, тип и адрес локации',
    },
    {
      id: 'map',
      title: 'Местоположение на карте',
      description: 'Выберите точное местоположение на карте',
    },
    {
      id: 'coordinates',
      title: 'Настройки локации',
      description: 'Параметры активности и популярности локации',
    },
    {
      id: 'images',
      title: 'Картинки локации',
      description: 'Добавьте фотографии локации',
    },
    {
      id: 'poi',
      title: 'Интересные места',
      description: 'Добавьте интересные места внутри локации',
    },
  ] as FormChapter[],

  EDIT: [
    {
      id: 'basic',
      title: 'Основная информация',
      description: 'Название, описание, тип и адрес локации',
    },
    {
      id: 'map',
      title: 'Местоположение на карте',
      description: 'Выберите точное местоположение на карте',
    },
    {
      id: 'coordinates',
      title: 'Настройки локации',
      description: 'Параметры активности и популярности локации',
    },
    {
      id: 'images',
      title: 'Картинки локации',
      description: 'Добавьте фотографии локации',
    },
    {
      id: 'poi',
      title: 'Интересные места',
      description: 'Добавьте интересные места внутри локации',
    },
  ] as FormChapter[],
};
