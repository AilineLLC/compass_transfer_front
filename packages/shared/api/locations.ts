import type { LocationType } from '@entities/locations/enums';
import type { LocationDTO } from '@entities/locations/interface/LocationDTO';
import type { LocationListResponseDTO } from '@entities/locations/interface/LocationListDTO';
import { apiGet, apiPost, apiPut, apiDelete } from './client';

// Операторы поиска
type SearchOperator =
  | 'Equals'
  | 'NotEquals'
  | 'Contains'
  | 'NotContains'
  | 'StartsWith'
  | 'EndsWith'
  | 'IsEmpty'
  | 'IsNotEmpty';

// Поля для сортировки
type SortOrder = 'Asc' | 'Desc';

// Интерфейс для координатного бокса
interface CoordinateBox {
  latFrom?: number;
  latTo?: number;
  longFrom?: number;
  longTo?: number;
}

// Расширенный интерфейс для фильтров локаций
interface LocationFilters {
  // Пагинация (cursor-based)
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;

  // Фильтры по типу
  type?: LocationType[];

  // Поиск по полям
  name?: string;
  nameOp?: SearchOperator;
  address?: string;
  addressOp?: SearchOperator;
  district?: string;
  districtOp?: SearchOperator;
  city?: string;
  cityOp?: SearchOperator;
  country?: string;
  countryOp?: SearchOperator;
  region?: string;
  regionOp?: SearchOperator;

  // Координатный бокс
  coordinateBox?: CoordinateBox;

  // Булевые фильтры
  isActive?: boolean;
  popular1?: boolean;
  popular2?: boolean;
  isLandingOnly?: boolean;

  // Полнотекстовый поиск
  'FTS.Plain'?: string;
  'FTS.Query'?: string;

  // Сортировка
  sortBy?: string;
  sortOrder?: SortOrder;
}

interface LocationAdvicePayload {
  fullName: string;
  specialization: string | null;
  image: string | null;
  content: string;
}

// DTO для создания локации
interface CreateLocationDTO {
  type: LocationType;
  name: string;
  description?: string | null;
  address: string;
  district?: string | null;
  city: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  popular1?: boolean;
  popular2?: boolean;
  isLandingOnly?: boolean | null;
  isLandingPagePinned?: boolean | null;
  images?: string[];
  poi?: { name: string; image: string; type: string }[];
  tags?: string[];
  advice?: LocationAdvicePayload | null;
  polyPriceCoefficient?: number[] | null;
  group?: string | null;
}

// DTO для обновления локации
interface UpdateLocationDTO {
  type?: LocationType;
  name?: string;
  description?: string | null;
  address?: string;
  district?: string | null;
  city?: string;
  country?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  popular1?: boolean;
  popular2?: boolean;
  isLandingOnly?: boolean | null;
  isLandingPagePinned?: boolean;
  images?: string[];
  poi?: { name: string; image: string; type: string }[];
  tags?: string[];
  advice?: LocationAdvicePayload | null;
  polyPriceCoefficient?: number[] | null;
  group?: string | null;
}

// DTO для отправки текущих координат водителя
interface CurrentLocationDTO {
  latitude: number;
  longitude: number;
}

export const locationsApi = {
  // Получение списка локаций с расширенными фильтрами
  getLocations: async (params?: LocationFilters): Promise<LocationListResponseDTO> => {
    const result = await apiGet<LocationListResponseDTO>('/Location', { params });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение локации по ID
  getLocationById: async (id: string): Promise<LocationDTO> => {
    const result = await apiGet<LocationDTO>(`/Location/${id}`, {
      params: { Includes: ['Profile'] },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Создание локации
  createLocation: async (data: CreateLocationDTO): Promise<LocationDTO> => {
    const result = await apiPost<LocationDTO, CreateLocationDTO>('/Location', data);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Обновление локации
  updateLocation: async (id: string, data: UpdateLocationDTO): Promise<LocationDTO> => {
    const result = await apiPut<LocationDTO, UpdateLocationDTO>(`/Location/${id}`, data);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Удаление локации
  deleteLocation: async (id: string): Promise<void> => {
    const result = await apiDelete(`/Location/${id}`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  // Поиск локаций по названию или адресу (для обратной совместимости)
  searchLocations: async (query: string, limit: number = 10): Promise<LocationDTO[]> => {
    const result = await apiGet<LocationListResponseDTO>('/Location', {
      params: {
        'FTS.Plain': query,
        size: limit,
        sortBy: 'name',
        sortOrder: 'Asc',
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!.data;
  },

  // Получение популярных локаций (для обратной совместимости)
  getPopularLocations: async (limit: number = 10): Promise<LocationDTO[]> => {
    const result = await apiGet<LocationListResponseDTO>('/Location', {
      params: {
        popular1: true,
        size: limit,
        sortBy: 'name',
        sortOrder: 'Asc',
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!.data;
  },

  // Отправка текущих координат водителя
  updateCurrentLocation: async (data: CurrentLocationDTO): Promise<void> => {
    const result = await apiPost<void, CurrentLocationDTO>('/Location/CurrentLocation/self', data);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  // Получение локаций по группе
  getLocationsByGroup: async (groupId: string): Promise<LocationListResponseDTO> => {
    const result = await apiGet<LocationListResponseDTO>('/Location', { 
      params: { Group: groupId } 
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },
};

export type { LocationFilters, CreateLocationDTO, UpdateLocationDTO, CoordinateBox, CurrentLocationDTO };
