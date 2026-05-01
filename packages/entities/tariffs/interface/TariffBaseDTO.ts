import type { ServiceClass, CarType } from '@entities/tariffs/enums';

/**
 * Интерфейс TariffBaseDTO
 * @interface
 */
export interface TariffBaseDTO {
  name: string;
  serviceClass: ServiceClass;
  carType: CarType;
  basePrice: number;
  minutePrice: number;
  minimumPrice: number;
  perKmPrice: number;
  freeWaitingTimeMinutes: number;
  isLanding: boolean | null;
}
