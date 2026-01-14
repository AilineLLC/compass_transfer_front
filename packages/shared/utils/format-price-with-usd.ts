/**
 * Форматирует цену в сомах с отображением эквивалента в долларах
 * @param priceInSoms - Цена в сомах
 * @param usdRate - Курс USD (сколько сомов за 1 доллар)
 * @returns Отформатированная строка вида "1 000 сом ($11.43)"
 */
export function formatPriceWithUsd(
  priceInSoms: number,
  usdRate: number | null
): string {

  const formattedSoms = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInSoms);

  if (!usdRate || usdRate <= 0) {
    return `${formattedSoms} сом`;
  }

  const priceInUsd = priceInSoms / usdRate;
  
  const formattedUsd = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceInUsd);

  return `${formattedSoms} сом ($${formattedUsd})`;
}

/**
 * Форматирует цену в сомах (без долларов)
 * @param price - Цена для форматирования
 * @returns Отформатированная строка с валютой
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KGS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}
