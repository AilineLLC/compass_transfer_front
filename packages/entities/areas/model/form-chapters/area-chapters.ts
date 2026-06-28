import type { FormChapter } from '@shared/ui/layout/form-sidebar';

export const AREA_FORM_CHAPTERS = {
  CREATE: [
    {
      id: 'basic',
      title: 'Основная информация',
      description: 'Название и описание области',
    },
    {
      id: 'map',
      title: 'Область на карте',
      description: 'Нарисуйте границы области',
    },
  ] as FormChapter[],

  EDIT: [
    {
      id: 'basic',
      title: 'Основная информация',
      description: 'Название и описание области',
    },
    {
      id: 'map',
      title: 'Область на карте',
      description: 'Редактируйте границы области',
    },
  ] as FormChapter[],
};
