'use client';

import { useEffect, useState } from 'react';
import { getCurrencyRates, type CurrencyRate } from '@shared/api/currency';

// Хук для получения курса USD от НБКР
export function useUsdRate(): number | null {
  const [usdRate, setUsdRate] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUsdRate = async () => {
      try {
        const currencyData = await getCurrencyRates();
        const usdCurrency = currencyData.rates.find(
          (rate: CurrencyRate) => rate.code === 'USD'
        );

        if (isMounted && usdCurrency && usdCurrency.rate > 0) {
          setUsdRate(usdCurrency.rate);
        }
      } catch (error) {
        console.warn('Не удалось получить курс USD:', error);
      }
    };

    fetchUsdRate();

    const interval = setInterval(fetchUsdRate, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return usdRate;
}
