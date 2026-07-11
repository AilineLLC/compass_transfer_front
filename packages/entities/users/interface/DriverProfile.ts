import type { CitizenshipCountry, DriverType, ServiceClass } from '@entities/users/enums';
import type { Education } from '@entities/users/interface/Education';
import type { Passport } from '@entities/users/interface/Passport';
import type { TestScore } from '@entities/users/interface/TestScore';
import type { WorkExperience } from '@entities/users/interface/WorkExperience';

/**
 * Интерфейс DriverProfile
 * @interface
 */
export interface DriverProfile {
  licenseNumber?: string | null;
  licenseCategories?: Array<string>;
  licenseIssueDate?: string | null;
  licenseExpiryDate?: string | null;
  dateOfBirth?: string | null;
  birthPlace?: string | null;
  citizenship?: string | null;
  citizenshipCountry?: CitizenshipCountry;
  drivingExperience?: number | null;
  languages?: Array<string>;
  taxIdentifier?: string | null;
  totalRides?: number;
  totalDistance?: number;
  lastRideDate?: string | null;
  medicalExamDate?: string | null;
  backgroundCheckDate?: string | null;
  profilePhoto?: string | null;
  type?: DriverType;
  preferredRideTypes: ServiceClass[];
  preferredWorkZones?: Array<string>;
  trainingCompleted?: boolean;
  passport?: Passport | null;
  workExperience?: WorkExperience[];
  education?: Education[];
  testScore?: TestScore[];
}
