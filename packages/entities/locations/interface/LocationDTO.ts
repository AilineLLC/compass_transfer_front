import type { LocationType } from '../enums/LocationType.enum';

/**
 * Интерфейс для локации
 * GET /Location/{uuid}
 */
export interface LocationDTO {
  /** Тип локации */
  type: LocationType;

  /** Название локации */
  name: string;

  /** Адрес локации */
  address: string;

  /** Район */
  district: string | null;

  /** Город */
  city: string;

  /** Страна */
  country: string;

  /** Регион */
  region: string;

  /** Широта */
  latitude: number;

  /** Долгота */
  longitude: number;

  /** Активна ли локация */
  isActive: boolean;

  /** Популярная локация 1 */
  popular1: boolean;

  /** Популярная локация 2 */
  popular2: boolean;

  /** Отображать на лендинг-сайте */
  isLandingOnly: boolean | null;

  /** Группа локации */
  group?: string | null;

  /** ID локации */
  id: string;
}
