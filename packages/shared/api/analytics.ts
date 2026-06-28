import { apiGet } from './client';

export interface DriverAnalytics {
  id: string;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRevenue: number;
  pendingPayout: number;
  totalRides: number;
  totalMileage: number;
}

export interface DriverPayoutItem {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  email: string | null;
  status: string;
  pendingPayout: number;
  pendingPayoutCount: number;
  payoutPaid: number;
  payoutPaidCount: number;
}

export interface DriversPayoutResponse {
  data: DriverPayoutItem[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

type CompareOp = 'GreaterThan' | 'GreaterThanOrEqual' | 'Equal' | 'LessThanOrEqual' | 'LessThan';

export interface DriversPayoutFilters {
  first?: boolean;
  last?: boolean;
  size?: number;
  after?: string;
  before?: string;
  pendingPayout?: number;
  pendingPayoutOp?: CompareOp;
  pendingPayoutCount?: number;
  pendingPayoutCountOp?: CompareOp;
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
}

export const analyticsApi = {
  getDriverAnalytics: async (driverId: string): Promise<DriverAnalytics> => {
    const result = await apiGet<DriverAnalytics>(`/Analytics/Driver/${driverId}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  getDriversPayout: async (filters: DriversPayoutFilters = {}): Promise<DriversPayoutResponse> => {
    const result = await apiGet<DriversPayoutResponse>('/Analytics/Drivers', { params: filters });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },
};
