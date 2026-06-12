import type { FormChapter } from '@shared/ui/layout/form-sidebar';

export const LOCATION_FORM_CHAPTERS = {
  CREATE: [
    {
      id: 'basic',
      title: 'Основная информация',
      description: 'Название, тип и группа локации',
    },
    {
      id: 'map',
      title: 'Местоположение на карте',
      description: 'Выберите точное местоположение на карте',
    },
    {
      id: 'settings',
      title: 'Настройки',
      description: 'Активность, видимость на лендинге',
    },
    {
      id: 'profile',
      title: 'Профиль локации',
      description: 'Описание, фотографии, POI, теги, совет',
    },
  ] as FormChapter[],

  EDIT: [
    {
      id: 'basic',
      title: 'Основная информация',
      description: 'Название, тип и группа локации',
    },
    {
      id: 'map',
      title: 'Местоположение на карте',
      description: 'Выберите точное местоположение на карте',
    },
    {
      id: 'settings',
      title: 'Настройки',
      description: 'Активность, видимость на лендинге',
    },
    {
      id: 'profile',
      title: 'Профиль локации',
      description: 'Описание, фотографии, POI, теги, совет',
    },
  ] as FormChapter[],
};
