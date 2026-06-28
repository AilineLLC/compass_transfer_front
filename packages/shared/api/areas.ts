import {
  locationGroupsApi,
  type LocationGroupDTO,
  type CreateLocationGroupDTO,
  type UpdateLocationGroupDTO,
  type LocationGroupListResponseDTO,
} from './location-groups';

export type GetAreaDTO = LocationGroupDTO;
export type CreateAreaDTO = CreateLocationGroupDTO;
export type UpdateAreaDTO = UpdateLocationGroupDTO;
export type AreaApiResponse = LocationGroupListResponseDTO;

interface AreaFilters {
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

export const areasApi = {
  getAreas: (params?: AreaFilters) => locationGroupsApi.getLocationGroups(params),
  getAreaById: (id: string) => locationGroupsApi.getLocationGroupById(id),
  createArea: (data: CreateAreaDTO) => locationGroupsApi.createLocationGroup(data),
  updateArea: (id: string, data: UpdateAreaDTO) => locationGroupsApi.updateLocationGroup(id, data),
  deleteArea: (id: string) => locationGroupsApi.deleteLocationGroup(id),
};

export type { AreaFilters };
