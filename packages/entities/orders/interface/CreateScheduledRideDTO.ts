/**
 * Интерфейс для waypoint в поездке
 */
export interface RideWaypoint {
  /** ID локации */
  locationId: string;
  
  /** Время прибытия на точку */
  arrivalTime?: string | null;
  
  /** Время отправления с точки */
  departureTime?: string | null;
}

/**
 * Интерфейс для создания поездки по запланированному заказу
 * POST /Order/scheduled/{uuid}/ride
 */
export interface CreateScheduledRideDTO {
  /** ID водителя */
  driverId: string;

  /** ID автомобиля */
  carId: string;

  /** Промежуточные точки маршрута поездки (опционально) */
  waypoints?: RideWaypoint[];

  /** Индексная сигнатура для совместимости с API */
  [key: string]: unknown;
}

/**
 * Интерфейс для обновления поездки
 */
export interface UpdateScheduledRideDTO extends Partial<CreateScheduledRideDTO> {
  /** ID поездки для обновления */
  rideId: string;
}
