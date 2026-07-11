import type { Role } from '@entities/users/enums';

/**
 * Интерфейс ответа GET /User/self
 * Базовые данные текущего пользователя + служебные флаги (напр. isMainSupportOperator)
 * @interface
 */
export interface GetUserSelfDTO {
  id: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  online?: boolean | null;
  /** true только у одного оператора — того, кто ведёт чат с водителями */
  isMainSupportOperator?: boolean | null;
}
