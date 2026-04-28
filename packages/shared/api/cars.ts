import type {
  CarColor,
  VehicleType,
  ServiceClass,
  VehicleStatus,
  CarFeature,
} from '@entities/cars/enums';
import type { GetCarDTO, GetCarDTOKeysetPaginationResult } from '@entities/cars/interface';
import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { GetMyCarParams } from './cars/cars-api';

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

// Операторы сравнения для числовых полей
type ComparisonOperator =
  | 'GreaterThan'
  | 'GreaterThanOrEqual'
  | 'Equal'
  | 'LessThanOrEqual'
  | 'LessThan';

// Поля для сортировки
type SortOrder = 'Asc' | 'Desc';

// Типы для API фильтров
interface CarFilters {
  // Пагинация (cursor-based)
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;

  // Поиск по полям
  make?: string;
  makeOp?: SearchOperator;
  model?: string;
  modelOp?: SearchOperator;
  year?: number;
  yearOp?: ComparisonOperator;
  color?: CarColor[];
  licensePlate?: string;
  licensePlateOp?: SearchOperator;
  type?: VehicleType[];
  serviceClass?: ServiceClass[];
  status?: VehicleStatus[];
  passengerCapacity?: number;
  passengerCapacityOp?: ComparisonOperator;
  features?: CarFeature[];

  // Полнотекстовый поиск
  'FTS.Plain'?: string;
  'FTS.Query'?: string;

  // Сортировка
  sortBy?: string;
  sortOrder?: SortOrder;
}

interface CarApiResponse {
  data: GetCarDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
  startCursor?: string;
  endCursor?: string;
}

// DTO для создания автомобиля
interface CreateCarDTO {
  make: string;
  model: string;
  year: number;
  color: CarColor;
  licensePlate: string;
  type: VehicleType;
  serviceClass: ServiceClass;
  status: VehicleStatus;
  passengerCapacity: number;
  features: CarFeature[];
  image?: string | null;
}

// DTO для обновления автомобиля
interface UpdateCarDTO {
  make?: string;
  model?: string;
  year?: number;
  color?: CarColor;
  licensePlate?: string;
  type?: VehicleType;
  serviceClass?: ServiceClass;
  status?: VehicleStatus;
  passengerCapacity?: number;
  features?: CarFeature[];
  image?: string | null;
}

export const carsApi = {
  // Получение автомобилей текущего водителя
  getMyCars: async (params?: GetMyCarParams): Promise<GetCarDTOKeysetPaginationResult> => {
    const result = await apiGet<GetCarDTOKeysetPaginationResult>('/Car/my', { params });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение списка автомобилей
  getCars: async (params?: CarFilters): Promise<CarApiResponse> => {
    const result = await apiGet<CarApiResponse>('/Car', { params });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение автомобиля по ID
  getCarById: async (id: string): Promise<GetCarDTO> => {
    const result = await apiGet<GetCarDTO>(`/Car/${id}`, {
      params: { Includes: 'Image' },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Создание автомобиля
  createCar: async (data: CreateCarDTO): Promise<GetCarDTO> => {
    const result = await apiPost<GetCarDTO, CreateCarDTO>('/Car', data);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Обновление автомобиля
  updateCar: async (id: string, data: UpdateCarDTO): Promise<GetCarDTO> => {
    const result = await apiPut<GetCarDTO, UpdateCarDTO>(`/Car/${id}`, data);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Удаление автомобиля
  deleteCar: async (id: string): Promise<void> => {
    const result = await apiDelete(`/Car/${id}`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  // Назначить водителя на автомобиль
  assignDriver: async (carId: string, driverId: string): Promise<void> => {
    const result = await apiPost(`/Car/${carId}/drivers/${driverId}`, true);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  // Обновить привязку водителя
  updateDriverAssignment: async (carId: string, driverId: string, isActive: boolean = true): Promise<void> => {
    const result = await apiPut(`/Car/${carId}/drivers/${driverId}`, isActive);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  // Удалить привязку водителя
  removeDriver: async (carId: string, driverId: string): Promise<void> => {
    const result = await apiDelete(`/Car/${carId}/drivers/${driverId}`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  // Установить автомобиль активным для текущего водителя
  setActiveCar: async (carId: string): Promise<void> => {
    const result = await apiPost(`/Car/my/${carId}/set-active`, true);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },
};

// Экспортируем типы для получения моих автомобилей из cars-apiмодуля
export type { GetMyCarParams } from './cars/cars-api';

export type { CarFilters, CarApiResponse, CreateCarDTO, UpdateCarDTO };
