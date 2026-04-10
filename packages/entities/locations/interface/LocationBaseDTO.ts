import type { LocationType } from '@entities/locations/enums';

/**
 * Базовый интерфейс для локации с географическими координатами и адресной информацией
 * @interface LocationBaseDTO
 */
export interface LocationBaseDTO {
  type: LocationType;
  name: string;
  address: string;
  district?: string | null;
  city: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  popular1?: boolean;
  popular2?: boolean;
  group?: string | null;
  images?: string[];
}
