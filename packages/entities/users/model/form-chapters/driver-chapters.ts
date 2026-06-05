// Главы форм для водителя

import { BASE_CHAPTERS, type FormChapter } from './base-chapters';

// Специфичные главы для водителя
export const DRIVER_CHAPTERS = {
  LICENSE: {
    id: 'driver-license',
    title: 'Водительское удостоверение',
    description: 'Номер, категории, даты выдачи и окончания',
  } as FormChapter,

  PERSONAL: {
    id: 'personal-info',
    title: 'Личная информация',
    description: 'Дата рождения, гражданство, опыт',
  } as FormChapter,

  PASSPORT: {
    id: 'passport-data',
    title: 'Паспортные данные',
    description: 'Номер, серия, тип документа',
  } as FormChapter,

  EMPLOYMENT: {
    id: 'employment',
    title: 'Трудоустройство',
    description: 'Компания, тип занятости, условия',
  } as FormChapter,

  RIDE_PREFERENCES: {
    id: 'ride-preferences',
    title: 'Предпочтения поездок',
    description: 'Классы обслуживания, зоны',
  } as FormChapter,

  ADDITIONAL: {
    id: 'additional',
    title: 'Дополнительная информация',
    description: 'Статистика, предпочтения, обучение',
  } as FormChapter,

  WORK_EXPERIENCE: {
    id: 'work-experience',
    title: 'Опыт работы',
    description: 'Предыдущие места работы',
  } as FormChapter,

  EDUCATION: {
    id: 'education',
    title: 'Образование',
    description: 'Учебные заведения и степени',
  } as FormChapter,

  TESTS: {
    id: 'tests',
    title: 'Тесты',
    description: 'Результаты тестов водителя',
  } as FormChapter,
} as const;

// Готовые наборы глав для форм водителя
export const DRIVER_FORM_CHAPTERS = {
  CREATE: [
    BASE_CHAPTERS.BASIC,
    BASE_CHAPTERS.SECURITY,
    DRIVER_CHAPTERS.LICENSE,
    DRIVER_CHAPTERS.PERSONAL,
    DRIVER_CHAPTERS.PASSPORT,
    DRIVER_CHAPTERS.EMPLOYMENT,
    DRIVER_CHAPTERS.RIDE_PREFERENCES,
    DRIVER_CHAPTERS.ADDITIONAL,
    DRIVER_CHAPTERS.WORK_EXPERIENCE,
    DRIVER_CHAPTERS.EDUCATION,
  ],
  EDIT: [
    BASE_CHAPTERS.BASIC,
    DRIVER_CHAPTERS.LICENSE,
    DRIVER_CHAPTERS.PERSONAL,
    DRIVER_CHAPTERS.PASSPORT,
    DRIVER_CHAPTERS.EMPLOYMENT,
    DRIVER_CHAPTERS.RIDE_PREFERENCES,
    DRIVER_CHAPTERS.ADDITIONAL,
    DRIVER_CHAPTERS.WORK_EXPERIENCE,
    DRIVER_CHAPTERS.EDUCATION,
    DRIVER_CHAPTERS.TESTS,
  ],
} as const;
