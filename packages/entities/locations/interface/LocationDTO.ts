import type { LocationType } from '../enums/LocationType.enum';

export interface LocationImageDTO {
  id: string;
  path: string;
}

export interface PoiImageFileDTO {
  id: string;
  name: string;
  extension: string;
  size: number;
  createdAt: string;
  path: string;
}

export interface PoiItemDTO {
  name: string;
  image: PoiImageFileDTO | null;
}

/**
 * Интерфейс для локации
 * GET /Location/{uuid}
 */
export interface LocationDTO {
  /** Тип локации */
  type: LocationType;

  /** Название локации */
  name: string;

  /** Описание локации */
  description?: string | null;

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

  /** Закреплена в начале списка на лендинге */
  isLandingPagePinned?: boolean;

  /** Группа локации */
  group?: string | null;

  /** ID локации */
  id: string;

  /** Картинки локации */
  images?: LocationImageDTO[];

  /** Интересные места локации */
  poi?: PoiItemDTO[];
}
