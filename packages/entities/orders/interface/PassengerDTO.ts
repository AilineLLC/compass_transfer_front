/**
 * Интерфейс для информации о пассажире в заказе
 * @interface PassengerDTO
 */
export interface PassengerDTO {
  customerId?: string | null;
  phone?: string | null;
  firstName: string;
  lastName: string | null;
  isMainPassenger: boolean;
}
