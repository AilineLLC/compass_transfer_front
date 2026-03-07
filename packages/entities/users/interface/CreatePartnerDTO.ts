import type { VerificationStatus } from '@entities/users/enums';
import type { PartnerProfile } from '@entities/users/interface/PartnerProfile';

/**
 * Интерфейс CreatePartnerDTO
 * @interface
 */
export interface CreatePartnerDTO {
  phoneNumber?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  verificationStatus: VerificationStatus;
  profile: PartnerProfile;
  email: string;
  password: string;
  /** Процент скидки партнера */
  sale: number | null;
}