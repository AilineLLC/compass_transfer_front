import type { Role, VerificationStatus } from '@entities/users/enums';
import type { PartnerProfile } from '@entities/users/interface/PartnerProfile';

/**
 * Интерфейс GetPartnerDTO
 * @interface
 */
export interface GetPartnerDTO {
  id: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  online?: boolean | null;
  verificationStatus?: VerificationStatus;
  profile: PartnerProfile;
  /** Процент скидки партнера */
  sale: number | null;
}