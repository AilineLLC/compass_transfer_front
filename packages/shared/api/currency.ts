// API для получения курсов валют от НБКР (Национальный банк Кыргызской Республики)
const NBKR_API_BASE = 'https://www.nbkr.kg/XML';

// Интерфейсы для данных валют
export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  change?: number; // изменение за день в %
  flag: string; // эмодзи флага
}

export interface CurrencyData {
  baseCurrency: string;
  lastUpdated: string;
  rates: CurrencyRate[];
}

// Основные валюты для отображения с их кодами в НБКР
export const MAIN_CURRENCIES = [
  { code: 'USD', name: 'Доллар США', flag: '🇺🇸', nbkrCode: 'USD' },
  { code: 'EUR', name: 'Евро', flag: '🇪🇺', nbkrCode: 'EUR' },
  { code: 'RUB', name: 'Российский рубль', flag: '🇷🇺', nbkrCode: 'RUB' },
  { code: 'KZT', name: 'Казахский тенге', flag: '🇰🇿', nbkrCode: 'KZT' },
  { code: 'UZS', name: 'Узбекский сум', flag: '🇺🇿', nbkrCode: 'UZS' },
  { code: 'CNY', name: 'Китайский юань', flag: '🇨🇳', nbkrCode: 'CNY' },
] as const;

// Функция для получения курсов валют относительно сома от НБКР
export async function getCurrencyRates(): Promise<CurrencyData> {
  try {
    // Получаем курсы от НБКР (JSON формат без даты - берет последние доступные)
    const response = await fetch(`${NBKR_API_BASE}/daily_json.js`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();

    // НБКР возвращает объект, где ключи - это коды валют
    // Например: { "USD": { "ISOCode": "USD", "Value": "87.4471", "Nominal": "1" }, ... }
    const rates: CurrencyRate[] = MAIN_CURRENCIES.map(currency => {
      // Ищем валюту в ответе НБКР по ключу
      const currencyData = data[currency.nbkrCode];

      if (currencyData && currencyData.Value) {
        // Курс = Value / Nominal
        const value = typeof currencyData.Value === 'string' 
          ? parseFloat(currencyData.Value.replace(',', '.'))
          : parseFloat(currencyData.Value);
        const nominal = currencyData.Nominal 
          ? (typeof currencyData.Nominal === 'string' 
              ? parseFloat(currencyData.Nominal.replace(',', '.'))
              : parseFloat(currencyData.Nominal))
          : 1;
        
        const rate = value / nominal;
        
        return {
          code: currency.code,
          name: currency.name,
          rate: rate,
          flag: currency.flag,
        };
      }

      return {
        code: currency.code,
        name: currency.name,
        rate: 0,
        flag: currency.flag,
      };
    }).filter(rate => rate.rate > 0); // Убираем валюты без курса

    return {
      baseCurrency: 'KGS',
      lastUpdated: new Date().toLocaleString('ru-RU'),
      rates,
    };
  } catch (error) {
    // Если не удалось получить от НБКР, используем запасной вариант
    console.warn('Не удалось получить курсы от НБКР, используем запасной источник:', error);
    return getFallbackCurrencyRates();
  }
}

// Запасная функция для получения курсов (если НБКР недоступен)
async function getFallbackCurrencyRates(): Promise<CurrencyData> {
  try {
    // Пробуем exchangerate.host (более точный чем exchangerate-api)
    const response = await fetch('https://api.exchangerate.host/latest?base=KGS');
    
    if (!response.ok) {
      throw new Error('Ошибка получения запасных курсов');
    }

    const data = await response.json();

    // exchangerate.host возвращает курсы ОТ KGS к другим валютам
    // Нам нужно инвертировать: 1 USD = X KGS
    const rates: CurrencyRate[] = MAIN_CURRENCIES.map(currency => {
      const rateFromKgs = data.rates[currency.code]; // Сколько USD за 1 KGS
      
      if (rateFromKgs && rateFromKgs > 0) {
        const rate = 1 / rateFromKgs; // Инвертируем: сколько KGS за 1 USD

        return {
          code: currency.code,
          name: currency.name,
          rate: rate,
          flag: currency.flag,
        };
      }
      
      return {
        code: currency.code,
        name: currency.name,
        rate: 0,
        flag: currency.flag,
      };
    }).filter(rate => rate.rate > 0);

    return {
      baseCurrency: 'KGS',
      lastUpdated: new Date().toLocaleString('ru-RU') + ' (резервный источник)',
      rates,
    };
  } catch (_error) {
    // Если и это не сработало, пробуем последний вариант
    return getLastResortCurrencyRates();
  }
}

// Последний резервный вариант
async function getLastResortCurrencyRates(): Promise<CurrencyData> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('Ошибка получения курсов');
    }

    const data = await response.json();

    const rates: CurrencyRate[] = MAIN_CURRENCIES.map(currency => {
      if (currency.code === 'USD') {
        const kgsRate = data.rates['KGS'];
        return {
          code: currency.code,
          name: currency.name,
          rate: kgsRate || 0,
          flag: currency.flag,
        };
      } else {
        const currencyToUsdRate = data.rates[currency.code];
        const kgsToUsdRate = data.rates['KGS'];

        if (currencyToUsdRate && kgsToUsdRate) {
          const rate = kgsToUsdRate / currencyToUsdRate;

          return {
            code: currency.code,
            name: currency.name,
            rate: rate,
            flag: currency.flag,
          };
        }
        
        return {
          code: currency.code,
          name: currency.name,
          rate: 0,
          flag: currency.flag,
        };
      }
    }).filter(rate => rate.rate > 0);

    return {
      baseCurrency: 'KGS',
      lastUpdated: new Date().toLocaleString('ru-RU') + ' (приблизительно)',
      rates,
    };
  } catch (_error) {
    throw new Error('Не удалось получить курсы валют из всех источников');
  }
}

// Функция для получения курсов валют (без исторических данных)
export async function getCurrencyRatesWithHistory(): Promise<CurrencyData> {
  // Просто возвращаем текущие курсы без попыток получить исторические данные
  return getCurrencyRates();
}

// Функция для форматирования курса валюты
export function formatCurrencyRate(rate: number): string {
  if (rate >= 1000) {
    return rate.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return rate.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Функция для получения цвета изменения курса
export function getChangeColor(change?: number): string {
  if (!change) return 'text-gray-500';
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  
  return 'text-gray-500';
}

// Функция для получения иконки изменения курса
export function getChangeIcon(change?: number): string {
  if (!change) return '';
  if (change > 0) return '↗️';
  if (change < 0) return '↘️';
  
  return '';
}

// Функция для получения текста изменения
export function getChangeText(change?: number): string {
  if (!change) return '';
  
  const absChange = Math.abs(change);
  const sign = change > 0 ? '+' : '';
  
  return `${sign}${absChange.toFixed(2)}%`;
}
