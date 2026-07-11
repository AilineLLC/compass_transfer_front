import type {
  CreateAdminDTO,
  CreateCustomerDTO,
  CreateOperatorDTO,
  CreatePartnerDTO,
  CreateTerminalDTO,
  CreateDriverDTO,
  UpdateAdminDTO,
  UpdateCustomerDTO,
  UpdateDriverDTO,
  UpdateOperatorDTO,
  UpdatePartnerDTO,
  UpdateTerminalDTO,
  GetUserBasicDTO,
  GetAdminDTO,
  GetCustomerDTO,
  GetDriverDTO,
  GetOperatorDTO,
  GetPartnerDTO,
  GetTerminalDTO,
  GetUserSelfProfileDTO,
  GetUserSelfDTO,
} from '@entities/users/interface';
import { apiGet, apiPost, apiPut, apiDelete, ApiRequestError } from './client';

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

// Типы для API фильтров
interface UserFilters {
  // Пагинация
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;
  page?: number;

  // Поиск по полям
  email?: string;
  emailOp?: SearchOperator;
  fullName?: string;
  fullNameOp?: SearchOperator;
  phoneNumber?: string;
  phoneNumberOp?: SearchOperator;
  online?: boolean;
  role?: string;

  // Полнотекстовый поиск
  'FTS.Plain'?: string;
  'FTS.Query'?: string;

  // Сортировка
  sortBy?: string;
  sortOrder?: SortOrder;
}

interface UserApiResponse {
  data: GetUserBasicDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

interface DriversApiResponse {
  data: GetDriverDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const usersApi = {
  // Создание клиента
  createCustomer: async (data: CreateCustomerDTO): Promise<GetCustomerDTO> => {
    const result = await apiPost<GetCustomerDTO, CreateCustomerDTO>('/User/Customer', data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Создание оператора
  createOperator: async (data: CreateOperatorDTO): Promise<GetOperatorDTO> => {
    const result = await apiPost<GetOperatorDTO, CreateOperatorDTO>('/User/Operator', data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Создание партнера
  createPartner: async (data: CreatePartnerDTO): Promise<GetPartnerDTO> => {
    const result = await apiPost<GetPartnerDTO, CreatePartnerDTO>('/User/Partner', data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Создание терминала
  createTerminal: async (data: CreateTerminalDTO): Promise<GetTerminalDTO> => {
    const result = await apiPost<GetTerminalDTO, CreateTerminalDTO>('/User/Terminal', data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Создание водителя
  createDriver: async (data: CreateDriverDTO): Promise<GetDriverDTO> => {
    console.log('Sending to API:', JSON.stringify(data, null, 2));

    const result = await apiPost<GetDriverDTO, CreateDriverDTO>('/User/Driver', data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Создание админа
  createAdmin: async (data: CreateAdminDTO): Promise<GetAdminDTO> => {
    const result = await apiPost<GetAdminDTO, CreateAdminDTO>('/User/Admin', data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Обновление админа
  updateAdmin: async (uuid: string, data: UpdateAdminDTO): Promise<GetAdminDTO> => {
    const result = await apiPut<GetAdminDTO, UpdateAdminDTO>(`/User/Admin/${uuid}`, data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Обновление клиента
  updateCustomer: async (uuid: string, data: UpdateCustomerDTO): Promise<GetCustomerDTO> => {
    const result = await apiPut<GetCustomerDTO, UpdateCustomerDTO>(`/User/Customer/${uuid}`, data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Обновление водителя
  updateDriver: async (uuid: string, data: UpdateDriverDTO): Promise<GetDriverDTO> => {
    const result = await apiPut<GetDriverDTO, UpdateDriverDTO>(`/User/Driver/${uuid}`, data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Обновление оператора
  updateOperator: async (uuid: string, data: UpdateOperatorDTO): Promise<GetOperatorDTO> => {
    const result = await apiPut<GetOperatorDTO, UpdateOperatorDTO>(`/User/Operator/${uuid}`, data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Обновление партнера
  updatePartner: async (uuid: string, data: UpdatePartnerDTO): Promise<GetPartnerDTO> => {
    const result = await apiPut<GetPartnerDTO, UpdatePartnerDTO>(`/User/Partner/${uuid}`, data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Обновление терминала
  updateTerminal: async (uuid: string, data: UpdateTerminalDTO): Promise<GetTerminalDTO> => {
    const result = await apiPut<GetTerminalDTO, UpdateTerminalDTO>(`/User/Terminal/${uuid}`, data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение профиля текущего пользователя
  getSelfProfile: async (): Promise<GetUserSelfProfileDTO> => {
    const result = await apiGet<GetUserSelfProfileDTO>('/User/self/profile');

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение базовых данных текущего пользователя (включая isMainSupportOperator)
  getSelf: async (): Promise<GetUserSelfDTO> => {
    const result = await apiGet<GetUserSelfDTO>('/User/self');

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение полной информации админа по UUID
  getAdmin: async (uuid: string): Promise<GetAdminDTO> => {
    const result = await apiGet<GetAdminDTO>(`/User/Admin/${uuid}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение полной информации клиента по UUID
  getCustomer: async (uuid: string): Promise<GetCustomerDTO> => {
    const result = await apiGet<GetCustomerDTO>(`/User/Customer/${uuid}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение полной информации водителя по UUID
  getDriver: async (uuid: string): Promise<GetDriverDTO> => {
    const result = await apiGet<GetDriverDTO>(`/User/Driver/${uuid}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение полной информации оператора по UUID
  getOperator: async (uuid: string): Promise<GetOperatorDTO> => {
    const result = await apiGet<GetOperatorDTO>(`/User/Operator/${uuid}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение полной информации партнера по UUID
  getPartner: async (uuid: string): Promise<GetPartnerDTO> => {
    const result = await apiGet<GetPartnerDTO>(`/User/Partner/${uuid}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение полной информации терминала по UUID
  getTerminal: async (uuid: string): Promise<GetTerminalDTO> => {
    const result = await apiGet<GetTerminalDTO>(`/User/Terminal/${uuid}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Утилитарная функция для получения пользователя по роли и UUID
  getUserByRole: async (role: string, uuid: string): Promise<GetUserBasicDTO> => {
    const roleMethods: Record<
      string,
      (
        uuid: string,
      ) => Promise<
        | GetUserBasicDTO
        | GetAdminDTO
        | GetCustomerDTO
        | GetDriverDTO
        | GetOperatorDTO
        | GetPartnerDTO
        | GetTerminalDTO
      >
    > = {
      Admin: usersApi.getAdmin,
      Customer: usersApi.getCustomer,
      Driver: usersApi.getDriver,
      Operator: usersApi.getOperator,
      Partner: usersApi.getPartner,
      Terminal: usersApi.getTerminal,
    };

    const method = roleMethods[role];

    if (!method) {
      throw new Error(`Неподдерживаемая роль: ${role}`);
    }

    return method(uuid);
  },

  // Получение пользователя по ID
  getUserById: async (uuid: string): Promise<GetUserBasicDTO> => {
    const result = await apiGet<GetUserBasicDTO>(`/User/${uuid}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение профиля пользователя по ID
  getUserProfile: async (uuid: string): Promise<GetUserBasicDTO> => {
    const result = await apiGet<GetUserBasicDTO>(`/User/${uuid}/profile`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Получение списка пользователей
  getUsers: async (params?: UserFilters): Promise<UserApiResponse> => {
    const result = await apiGet<UserApiResponse>('/User', { params });

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Обновление пользователя
  updateUser: async (id: string, data: Partial<GetUserBasicDTO>): Promise<GetUserBasicDTO> => {
    const result = await apiPut<GetUserBasicDTO>(`/User/${id}`, data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // Удаление пользователя
  deleteUser: async (id: string): Promise<void> => {
    const result = await apiDelete(`/User/${id}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }
  },

  // Получение списка водителей
  getDrivers: async (params?: {
    first?: boolean;
    before?: string;
    after?: string;
    last?: boolean;
    size?: number;
    vehicleServiceClass?: string[];
    licenseCategories?: string[];
    drivingExperience?: number;
    drivingExperienceOp?: 'GreaterThan' | 'GreaterThanOrEqual' | 'Equal' | 'LessThanOrEqual' | 'LessThan';
    preferredWorkZone?: string[];
    languages?: string[];
    email?: string;
    emailOp?: 'Equals' | 'NotEquals' | 'Contains' | 'NotContains' | 'StartsWith' | 'EndsWith' | 'IsEmpty' | 'IsNotEmpty';
    fullName?: string;
    fullNameOp?: 'Equals' | 'NotEquals' | 'Contains' | 'NotContains' | 'StartsWith' | 'EndsWith' | 'IsEmpty' | 'IsNotEmpty';
    phoneNumber?: string;
    phoneNumberOp?: 'Equals' | 'NotEquals' | 'Contains' | 'NotContains' | 'StartsWith' | 'EndsWith' | 'IsEmpty' | 'IsNotEmpty';
    online?: boolean;
    role?: string[];
    sortBy?: string;
    sortOrder?: 'Asc' | 'Desc';
  }): Promise<DriversApiResponse> => {
    const result = await apiGet<DriversApiResponse>('/User/Driver', { params });

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },
};
