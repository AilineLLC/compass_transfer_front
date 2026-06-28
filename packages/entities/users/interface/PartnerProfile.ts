import type { BusinessType } from '@entities/users/enums';

/**
 * Интерфейс PartnerProfile
 * @interface
 */
export interface PartnerProfile {
  companyName: string;
  companyType?: BusinessType;
  registrationNumber?: string | null;
  taxIdentifier?: string | null;
  legalAddress: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  /** Массив ID маршрутов, доступных партнеру */
  partnerRoutes?: string[];
  /** Массив ID загруженных документов партнёра */
  documents?: string[] | null;
}