/**
 * Утилиты для конвертации номера заказа между integer (backend) и base36 string (frontend)
 * 
 * Backend использует Integer для поля OrderNumber
 * Frontend отображает его как строку в base36 формате
 * 
 * Примеры:
 * - 1679627 (integer) -> "1000b" (base36 string)
 * - "1000B" (base36 string) -> 1679627 (integer)
 */

/**
 * Конвертирует integer номер заказа в base36 строку для отображения
 * @param orderNumber - Номер заказа в integer формате
 * @returns Номер заказа в base36 строковом формате
 */
export function orderNumberToString(orderNumber: number): string {
  return orderNumber.toString(36).toUpperCase();
}

/**
 * Конвертирует base36 строку номера заказа в integer для отправки на backend
 * @param orderNumberString - Номер заказа в base36 строковом формате
 * @returns Номер заказа в integer формате
 */
export function orderNumberToInteger(orderNumberString: string): number {
  return parseInt(orderNumberString, 36);
}

/**
 * Проверяет, является ли строка валидным base36 номером заказа
 * @param orderNumberString - Строка для проверки
 * @returns true если строка является валидным base36 числом
 */
export function isValidOrderNumber(orderNumberString: string): boolean {
  if (!orderNumberString || typeof orderNumberString !== 'string') {
    return false;
  }
  
  const parsed = parseInt(orderNumberString, 36);
  return !isNaN(parsed) && parsed > 0;
}
