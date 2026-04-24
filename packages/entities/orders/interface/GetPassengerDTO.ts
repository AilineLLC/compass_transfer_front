/**
 * Интерфейс GetPassengerDTO
 * @interface
 */
export interface GetPassengerDTO {
  /**
   * ID пассажира
   */
  id: string;

  /**
   * Ссылка на Customer (если пассажир зарегистрирован)
   */
  customerId?: string | null;

  /**
   * Имя пассажира
   */
  firstName: string;

  phone: string;

  /**
   * Фамилия пассажира
   */
  lastName?: string | null;

  /**
   * Главный пассажир
   */
  isMainPassenger: boolean;
  IsMainPassenger: boolean;
}
