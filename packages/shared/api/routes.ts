import type {
  PartnerRouteDTO,
  UpdatePartnerRouteDTO,
  RouteDTO,
  RouteListResponseDTO,
  CreateRouteDTO,
  UpdateRouteDTO,
} from '@entities/routes/interface/PartnerRouteDTO';
import { apiGet, apiPost, apiPut, apiDelete, ApiRequestError } from './client';

export const routesApi = {
  updatePartnerRoute: async (
    routeId: string,
    data: UpdatePartnerRouteDTO,
  ): Promise<PartnerRouteDTO> => {
    const result = await apiPut<PartnerRouteDTO>(`/Route/Partner/self`, {
      routeId,
      price: data.price,
    });

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  getPartnerRoutes: async (partnerId: string): Promise<PartnerRouteDTO[]> => {
    const result = await apiGet<PartnerRouteDTO[]>(`/Route/Partner/${partnerId}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  createPartnerRoute: async (data: {
    startLocationId: string;
    endLocationId: string;
    price: number;
  }): Promise<PartnerRouteDTO> => {
    const result = await apiPost<PartnerRouteDTO>('/Route/Partner/self', data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  getRoutes: async (): Promise<RouteListResponseDTO> => {
    const result = await apiGet<RouteListResponseDTO>('/Route', {
      params: { Includes: ['StartLocation', 'EndLocation'] },
    });

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  getRouteById: async (id: string): Promise<RouteDTO> => {
    const result = await apiGet<RouteDTO>(`/Route/${id}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  createRoute: async (data: CreateRouteDTO): Promise<RouteDTO> => {
    const body = { ...data };
    const result = await apiPost<RouteDTO, typeof body>('/Route', body);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  updateRoute: async (id: string, data: UpdateRouteDTO): Promise<RouteDTO> => {
    const body = { ...data };
    const result = await apiPut<RouteDTO, typeof body>(`/Route/${id}`, body);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  deleteRoute: async (id: string): Promise<void> => {
    const result = await apiDelete(`/Route/${id}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }
  },
};
