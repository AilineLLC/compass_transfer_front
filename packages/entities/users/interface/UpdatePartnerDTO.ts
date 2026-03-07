import type { VerificationStatus } from '@entities/users/enums';
import type { PartnerProfile } from '@entities/users/interface/PartnerProfile';

/**
 * Интерфейс UpdatePartnerDTO
 * @interface
 */
export interface UpdatePartnerDTO {
  phoneNumber?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  verificationStatus: VerificationStatus;
  profile: PartnerProfile;
  /** Процент скидки партнера */
  sale?: number | null;
}