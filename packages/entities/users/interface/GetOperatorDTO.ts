import type { Role } from '@entities/users/enums';
import type { OperatorProfile } from '@entities/users/interface/OperatorProfile';

/**
 * Интерфейс GetOperatorDTO
 * @interface
 */
export interface GetOperatorDTO {
  id: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  online?: boolean | null;
  isActive?: boolean;
  /** true только у одного оператора — того, кто ведёт чат с водителями */
  isMainSupportOperator?: boolean;
  profile: OperatorProfile;
}