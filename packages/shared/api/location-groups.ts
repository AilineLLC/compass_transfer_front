import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface LocationGroupDTO {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  poly: number[];
}

export interface LocationGroupListResponseDTO {
  data: LocationGroupDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface CreateLocationGroupDTO {
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  poly: number[];
}

export interface UpdateLocationGroupDTO {
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  poly: number[];
}

interface LocationGroupFilters {
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;
  name?: string;
  city?: string;
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
}

export const locationGroupsApi = {
  getLocationGroups: async (params?: LocationGroupFilters): Promise<LocationGroupListResponseDTO> => {
    const result = await apiGet<LocationGroupListResponseDTO>('/LocationGroup', { params });
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },

  getLocationGroupById: async (id: string): Promise<LocationGroupDTO> => {
    const result = await apiGet<LocationGroupDTO>(`/LocationGroup/${id}`);
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },

  getLocationGroupsByCity: async (city: string): Promise<LocationGroupListResponseDTO> => {
    const result = await apiGet<LocationGroupListResponseDTO>('/LocationGroup', { params: { city } });
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },

  createLocationGroup: async (data: CreateLocationGroupDTO): Promise<LocationGroupDTO> => {
    const result = await apiPost<LocationGroupDTO, CreateLocationGroupDTO>('/LocationGroup', data);
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },

  updateLocationGroup: async (id: string, data: UpdateLocationGroupDTO): Promise<LocationGroupDTO> => {
    const result = await apiPut<LocationGroupDTO, UpdateLocationGroupDTO>(`/LocationGroup/${id}`, data);
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },

  deleteLocationGroup: async (id: string): Promise<void> => {
    const result = await apiDelete(`/LocationGroup/${id}`);
    if (result.error) throw new Error(result.error.message);
  },
};
