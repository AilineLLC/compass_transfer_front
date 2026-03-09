import type { Role, ActivityStatus } from '@entities/users/enums';
import type { AdminProfile } from './AdminProfile';
import type { DriverProfile } from './DriverProfile';
import type { OperatorProfile } from './OperatorProfile';
import type { PartnerProfile } from './PartnerProfile';
import type { TerminalProfile } from './TerminalProfile';
import type { CustomerProfile } from './CustomerProfile';

/**
 * Базовый интерфейс для ответа GET /User/self/profile
 * @interface
 */
export interface GetUserSelfProfileBaseDTO {
  id: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  online?: boolean | null;
  lastActive?: string | null;
  status: ActivityStatus;
  locationId?: string | null;
}

/**
 * Интерфейс для профиля терминала
 * @interface
 */
export interface GetUserSelfProfileTerminalDTO extends GetUserSelfProfileBaseDTO {
  role: Role.Terminal;
  profile: TerminalProfile;
}

/**
 * Интерфейс для профиля водителя
 * @interface
 */
export interface GetUserSelfProfileDriverDTO extends GetUserSelfProfileBaseDTO {
  role: Role.Driver;
  profile: DriverProfile;
}

/**
 * Интерфейс для профиля администратора
 * @interface
 */
export interface GetUserSelfProfileAdminDTO extends GetUserSelfProfileBaseDTO {
  role: Role.Admin;
  profile: AdminProfile;
}

/**
 * Интерфейс для профиля оператора
 * @interface
 */
export interface GetUserSelfProfileOperatorDTO extends GetUserSelfProfileBaseDTO {
  role: Role.Operator;
  profile: OperatorProfile;
}

/**
 * Интерфейс для профиля партнера
 * @interface
 */
export interface GetUserSelfProfilePartnerDTO extends GetUserSelfProfileBaseDTO {
  role: Role.Partner;
  profile: PartnerProfile;
  /** Процент скидки партнера */
  sale: number | null;
}

/**
 * Интерфейс для профиля клиента
 * @interface
 */
export interface GetUserSelfProfileCustomerDTO extends GetUserSelfProfileBaseDTO {
  role: Role.Customer;
  profile: CustomerProfile;
}

/**
 * Объединенный тип для всех возможных ответов GET /User/self/profile
 * @type
 */
export type GetUserSelfProfileDTO =
  | GetUserSelfProfileTerminalDTO
  | GetUserSelfProfileDriverDTO
  | GetUserSelfProfileAdminDTO
  | GetUserSelfProfileOperatorDTO
  | GetUserSelfProfilePartnerDTO
  | GetUserSelfProfileCustomerDTO;
