export * from './Role.enum';
export * from './VerificationStatus.enum';
export * from './CitizenshipCountry.enum';
export * from './ServiceClass.enum';
export * from './IdentityDocumentType.enum';
export * from './BusinessType.enum';
export * from './ActivityStatus.enum';
export * from './Language.enum';
export * from './EmploymentType.enum';
export * from './DriverType.enum';

// Опции для форм
import { ActivityStatus } from './ActivityStatus.enum';

/**
 * Опции статуса терминала для select компонентов
 */
export const TERMINAL_STATUS_OPTIONS = [
  { value: ActivityStatus.Active, label: 'Активен' },
  { value: ActivityStatus.Inactive, label: 'Неактивен' },
  { value: ActivityStatus.Suspended, label: 'Приостановлен' },
  { value: ActivityStatus.Blocked, label: 'Заблокирован' },
  { value: ActivityStatus.OnVacation, label: 'В отпуске' },
] as const;
