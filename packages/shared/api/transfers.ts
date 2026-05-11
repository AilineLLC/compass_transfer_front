import { apiGet, apiDelete, apiPost, apiPut } from './client';

export interface TransferPassenger {
  customerId: string | null;
  reservedSeats: number;
  name: string;
  phone: string;
}

export interface TransferLocation {
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
}

export interface TransferCarDriver {
  driverId: string;
  isActive: boolean;
  assignedAt: string;
}

export interface TransferCarImage {
  id: string;
  name: string | null;
  extension: string;
  size: number;
  createdAt: string;
  path: string;
}

export interface TransferCar {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: string;
  serviceClass: string;
  status: string;
  passengerCapacity: number;
  features: string[];
  id: string;
  drivers: TransferCarDriver[];
  image: TransferCarImage | null;
}

export interface TransferDriverLocation {
  latitude: number;
  longitude: number;
}

export interface TransferDriver {
  id: string;
  email: string;
  role: string;
  phoneNumber: string | null;
  fullName: string;
  avatarUrl: string | null;
  online: boolean | null;
  status: string;
  activeCar: TransferCar | null;
  currentLocation: TransferDriverLocation | null;
}

export interface GetTransferDTO {
  id: string;
  departureTime: string;
  duration: number | null;
  price: number;
  driverPrice?: number | null;
  allowPartialReservations: boolean;
  isHot: boolean;
  passengers: TransferPassenger[];
  startLocation: TransferLocation;
  endLocation: TransferLocation;
  car: TransferCar | null;
  driver: TransferDriver | null;
  createdAt: string;
  updatedAt: string;
  freeSeats: number;
}

export interface TransferApiResponse {
  data: GetTransferDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface TransferFilters {
  first?: boolean;
  after?: string;
  before?: string;
  size?: number;
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
  departureTimeFrom?: string;
  departureTimeTo?: string;
  startLocationId?: string;
  endLocationId?: string;
  includes?: string;
}

export interface CreateTransferPassengerDTO {
  customerId: string | null;
  reservedSeats: number;
  name: string;
  phone: string;
}

export interface CreateTransferDTO {
  departureTime: string;
  duration: number | null;
  price: number;
  driverPrice?: number | null;
  allowPartialReservations: boolean;
  isHot: boolean;
  passengers: CreateTransferPassengerDTO[];
  startLocation: string;
  endLocation: string;
  car: string;
  driver: string;
}

export const transfersApi = {
  getTransfers: async (filters: TransferFilters = {}): Promise<TransferApiResponse> => {
    const result = await apiGet<TransferApiResponse>('/Transfer', { params: { includes: 'Passengers', ...filters } });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  getTransferById: async (id: string): Promise<GetTransferDTO> => {
    const result = await apiGet<GetTransferDTO>(`/Transfer/${id}?includes=Passengers`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  deleteTransfer: async (id: string): Promise<void> => {
    const result = await apiDelete(`/Transfer/${id}`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  createTransfer: async (data: CreateTransferDTO): Promise<{ id: string }> => {
    const result = await apiPost<{ id: string }, CreateTransferDTO>('/Transfer', data);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  updateTransfer: async (id: string, data: CreateTransferDTO): Promise<void> => {
    const result = await apiPut<void, CreateTransferDTO>(`/Transfer/${id}`, data);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },
};
