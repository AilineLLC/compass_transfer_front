import type { TariffBaseDTO } from './TariffBaseDTO';

export interface TariffIconDTO {
  id: string;
  name: string | null;
  extension: string;
  size: number;
  createdAt: string;
  path: string;
}

/**
 * Интерфейс GetTariffDTO
 * @interface
 */
export interface GetTariffDTO extends TariffBaseDTO {
  id: string;
  archived: boolean;
  icon: TariffIconDTO | null;
}
