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

export const analyticsApi = {
  getDriverAnalytics: async (driverId: string): Promise<DriverAnalytics> => {
    const result = await apiGet<DriverAnalytics>(`/Analytics/Driver/${driverId}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },
};
