import { apiGet, apiPost } from './client';

export type CustomerOrderFormStatus = 'Pending' | 'Verified' | 'Rejected';

export interface CustomerOrderFormService {
  service: {
    name: string;
    description: string | null;
    price: number;
    isQuantifiable: boolean;
    id: string;
  };
  quantity: number;
  notes: string | null;
}

export interface CustomerOrderFormLocation {
  type: string;
  name: string;
  address: string;
  district: string | null;
  city: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  popular1: boolean;
  popular2: boolean;
  group: string | null;
  isLandingOnly: boolean | null;
  id: string;
  transient: boolean;
  images: {
    id: string;
    name: string | null;
    extension: string;
    size: number;
    createdAt: string;
    path: string;
  }[];
  poiCount: number;
}

export interface CustomerOrderFormCar {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: string;
  serviceClass: string;
  passengerCapacity: number;
  features: string[];
  status: string;
  drivers: unknown[];
}

export interface CustomerOrderFormDTO {
  id: string;
  status: CustomerOrderFormStatus;
  startLocation: CustomerOrderFormLocation | null;
  endLocation: CustomerOrderFormLocation | null;
  services: CustomerOrderFormService[];
  name: string | null;
  phone: string | null;
  scheduledTime: string | null;
  car: CustomerOrderFormCar | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderFormListResponse {
  data: CustomerOrderFormDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface CustomerOrderFormFilters {
  page?: number;
  size?: number;
  status?: CustomerOrderFormStatus;
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
}

export const customerOrderFormsApi = {
  getForms: async (filters: CustomerOrderFormFilters = {}): Promise<CustomerOrderFormListResponse> => {
    const result = await apiGet<CustomerOrderFormListResponse>('/CustomerOrderForm', { params: filters });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  getFormById: async (id: string): Promise<CustomerOrderFormDTO> => {
    const result = await apiGet<CustomerOrderFormDTO>(`/CustomerOrderForm/${id}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  updateStatus: async (id: string, status: CustomerOrderFormStatus): Promise<void> => {
    const result = await apiPost<void, CustomerOrderFormStatus>(
      `/CustomerOrderForm/${id}/status`,
      status,
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (result.error) {
      throw new Error(result.error.message);
    }
  },
};
