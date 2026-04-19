// Курсы валют через api.exchangerate-api.com (разрешён в CSP)
const EXCHANGE_API_BASE = 'https://api.exchangerate-api.com/v4/latest/USD';

export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  change?: number;
  flag: string;
}

export interface CurrencyData {
  baseCurrency: string;
  lastUpdated: string;
  rates: CurrencyRate[];
}

export const MAIN_CURRENCIES = [
  { code: 'USD', name: 'Доллар США', flag: '🇺🇸' },
  { code: 'EUR', name: 'Евро', flag: '🇪🇺' },
  { code: 'RUB', name: 'Российский рубль', flag: '🇷🇺' },
  { code: 'KZT', name: 'Казахский тенге', flag: '🇰🇿' },
  { code: 'UZS', name: 'Узбекский сум', flag: '🇺🇿' },
  { code: 'CNY', name: 'Китайский юань', flag: '🇨🇳' },
] as const;

export async function getCurrencyRates(): Promise<CurrencyData> {
  const response = await fetch(EXCHANGE_API_BASE);

  if (!response.ok) {
    throw new Error(`Ошибка получения курсов: ${response.status}`);
  }

  const data = await response.json();
  // data.rates — курсы относительно USD: { KGS: 87.44, EUR: 0.92, ... }
  const kgsPerUsd: number = data.rates['KGS'] ?? 0;

  const rates: CurrencyRate[] = MAIN_CURRENCIES.map(currency => {
    let rate = 0;

    if (currency.code === 'USD') {
      rate = kgsPerUsd;
    } else {
      const unitsPerUsd: number = data.rates[currency.code] ?? 0;
      // сколько KGS за 1 единицу валюты
      rate = unitsPerUsd > 0 ? kgsPerUsd / unitsPerUsd : 0;
    }

    return { code: currency.code, name: currency.name, rate, flag: currency.flag };
  }).filter(r => r.rate > 0);

  return {
    baseCurrency: 'KGS',
    lastUpdated: new Date().toLocaleString('ru-RU'),
    rates,
  };
}

export async function getCurrencyRatesWithHistory(): Promise<CurrencyData> {
  return getCurrencyRates();
}

export function formatCurrencyRate(rate: number): string {
  return rate.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getChangeColor(change?: number): string {
  if (!change) return 'text-gray-500';
  return change > 0 ? 'text-green-500' : 'text-red-500';
}

export function getChangeIcon(change?: number): string {
  if (!change) return '';
  return change > 0 ? '↗️' : '↘️';
}

export function getChangeText(change?: number): string {
  if (!change) return '';
  const sign = change > 0 ? '+' : '';
  return `${sign}${Math.abs(change).toFixed(2)}%`;
}
