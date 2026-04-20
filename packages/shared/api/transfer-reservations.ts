import { apiGet, apiPost, apiDelete, apiPut } from './client';
import type { GetCustomerDTO } from '@entities/users/interface';

export interface TransferReservationDTO {
  id: string;
  status: string;
  transfer: string;
  customer: GetCustomerDTO;
  createdAt: string;
  updatedAt: string;
  reservedSeats: number;
  name: string;
  phone: string;
}

export interface TransferReservationsApiResponse {
  data: TransferReservationDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface TransferReservationFilters {
  page?: number;
  size?: number;
  status?: string;
  Transfer?: string;
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
}

export const transferReservationsApi = {
  getReservations: async (
    filters: TransferReservationFilters = {},
  ): Promise<TransferReservationsApiResponse> => {
    const result = await apiGet<TransferReservationsApiResponse>('/TransferReservationForm', {
      params: filters,
    });
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },

  getReservationById: async (id: string): Promise<TransferReservationDTO> => {
    const result = await apiGet<TransferReservationDTO>(`/TransferReservationForm/${id}`);
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },

  approveReservation: async (id: string): Promise<void> => {
    const result = await apiPost<void, object>(`/TransferReservationForm/${id}/approve`, {});
    if (result.error) throw new Error(result.error.message);
  },

  rejectReservation: async (r: TransferReservationDTO): Promise<void> => {
    const result = await apiPut<void, object>(`/TransferReservationForm/${r.id}`, { ...r });
    if (result.error) throw new Error(result.error.message);
  },

  deleteReservation: async (id: string): Promise<void> => {
    const result = await apiDelete(`/TransferReservationForm/${id}`);
    if (result.error) throw new Error(result.error.message);
  },
};
