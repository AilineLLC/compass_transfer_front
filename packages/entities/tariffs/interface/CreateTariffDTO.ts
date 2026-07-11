import type { TariffBaseDTO } from './TariffBaseDTO';

/**
 * Интерфейс для создания тарифа
 * @interface
 */
export interface CreateTariffDTO extends Omit<TariffBaseDTO, 'id'> {
  iconId: string | null;
}
