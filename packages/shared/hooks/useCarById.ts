'use client'

import { useState, useEffect } from 'react';
import { carsApi } from '@shared/api/cars';
import type { GetCarDTO } from '@entities/cars/interface';

export function useCarById(carId: string | null | undefined) {
  const [car, setCar] = useState<GetCarDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) {
      setCar(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const loadCar = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const carData = await carsApi.getCarById(carId);
        setCar(carData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки автомобиля');
      } finally {
        setIsLoading(false);
      }
    };

    loadCar();
  }, [carId]);

  return { car, isLoading, error };
}
