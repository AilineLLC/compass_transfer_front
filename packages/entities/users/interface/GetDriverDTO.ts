import type { GetCarDTO } from '@entities/cars/interface/GetCarDTO';
import type { Role, VerificationStatus } from '@entities/users/enums';
import type { DriverProfile } from '@entities/users/interface/DriverProfile';
import type { Employment } from '@entities/users/interface/Employment';

/**
 * Интерфейс GetDriverDTO
 * @interface
 */
export interface GetDriverDTO {
  id: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  online?: boolean | null;
  activeRideStatus?: 'Arrived' | 'InProgress' | 'Paused' | null;
  rating?: number | null;
  isAvailable?: boolean;
  verificationStatus?: VerificationStatus;
  activeCarId?: string | null;
  activeCar?: GetCarDTO | null;
  currentLocationId?: string | null;
  currentLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  profile: DriverProfile;
  employment?: Employment | null;
}