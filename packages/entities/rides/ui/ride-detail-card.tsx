'use client';

import { useState, useEffect } from 'react';
import { User, Car, Clock, Navigation, ExternalLink } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Skeleton } from '@shared/ui/data-display/skeleton';
import { Button } from '@shared/ui/forms/button';
import { ridesApi } from '@shared/api/rides/rides-api';
import { usersApi } from '@shared/api/users';
import { carsApi } from '@shared/api/cars';
import { carColorLabels, vehicleTypeLabels } from '@entities/cars';
import type { GetRideDTO } from '../interface';
import type { GetUserBasicDTO } from '@entities/users/interface';
import type { GetCarDTO } from '@entities/cars/interface';

interface RideDetailCardProps {
  rideId: string;
  rideIndex: number;
}

const rideStatusLabels: Record<string, string> = {
  'Requested': 'Запрошена',
  'Searching': 'Поиск водителя',
  'Accepted': 'Принята',
  'Arrived': 'Водитель прибыл',
  'InProgress': 'В процессе',
  'Completed': 'Завершена',
  'Cancelled': 'Отменена',
};

export function RideDetailCard({ rideId, rideIndex }: RideDetailCardProps) {
  const [ride, setRide] = useState<GetRideDTO | null>(null);
  const [driver, setDriver] = useState<GetUserBasicDTO | null>(null);
  const [car, setCar] = useState<GetCarDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRideData = async () => {
      try {
        setIsLoading(true);
        
        // Загружаем поездку
        const rideData = await ridesApi.getRide(rideId);
        setRide(rideData);

        // Загружаем водителя
        if (rideData.driverId) {
          try {
            const driverData = await usersApi.getUserById(rideData.driverId);
            setDriver(driverData);
          } catch (err) {
            console.error('Ошибка загрузки водителя:', err);
          }
        }

        // Загружаем машину
        if (rideData.carId) {
          try {
            const carData = await carsApi.getCarById(rideData.carId);
            setCar(carData);
          } catch (err) {
            console.error('Ошибка загрузки машины:', err);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки поездки');
      } finally {
        setIsLoading(false);
      }
    };

    loadRideData();
  }, [rideId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDistance = (distance: number | null | undefined) => {
    if (!distance) return '—';
    return `${distance.toFixed(2)} км`;
  };

  const formatDuration = (duration: string | null | undefined) => {
    if (!duration) return '—';
    
    // Парсим формат "00:00:00.7838770" или "HH:MM:SS"
    const parts = duration.split(':');
    if (parts.length >= 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = Math.floor(parseFloat(parts[2]));
      
      const result = [];
      if (hours > 0) result.push(`${hours} ч`);
      if (minutes > 0) result.push(`${minutes} мин`);
      if (seconds > 0 && hours === 0) result.push(`${seconds} сек`);
      
      return result.length > 0 ? result.join(' ') : '< 1 сек';
    }
    
    return duration;
  };

  if (isLoading) {
    return (
      <div className='p-3 bg-gray-50 rounded-lg space-y-2'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className='p-3 bg-red-50 rounded-lg'>
        <div className='text-sm text-red-600'>
          {error || 'Не удалось загрузить данные поездки'}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Заголовок */}
      <div className='flex items-center justify-between'>
        <div className='text-base font-medium'>
          Поездка #{rideIndex + 1}
        </div>
        <Badge variant='outline'>
          {rideStatusLabels[ride.status] || ride.status}
        </Badge>
      </div>

      {/* Информация о водителе и машине */}
      <div className='space-y-3 text-sm'>
        {driver && (
          <div className='flex items-start gap-2'>
            <User className='h-4 w-4 text-muted-foreground mt-0.5' />
            <div className='flex-1'>
              <div className='text-muted-foreground'>Водитель:</div>
              <div className='font-medium flex items-center gap-2'>
                {driver.fullName}
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-4 w-4 p-0'
                  onClick={() => {
                    const roleUrl = driver.role.toLowerCase();
                    window.open(`/users/${roleUrl}/${driver.id}`, '_blank');
                  }}
                >
                  <ExternalLink className='h-3 w-3' />
                </Button>
              </div>
              <div className='text-muted-foreground text-[10px]'>{driver.phoneNumber}</div>
            </div>
          </div>
        )}
        {car && (
          <div className='flex items-start gap-2'>
            <Car className='h-4 w-4 text-muted-foreground mt-0.5' />
            <div className='flex-1'>
              <div className='text-muted-foreground'>Машина:</div>
              <div className='font-medium flex items-center gap-2'>
                {car.make} {car.model} ({car.year})
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-4 w-4 p-0'
                  onClick={() => window.open(`/cars/${car.id}`, '_blank')}
                >
                  <ExternalLink className='h-3 w-3' />
                </Button>
              </div>
              <div className='text-muted-foreground text-[10px]'>
                {car.licensePlate} • {carColorLabels[car.color] || car.color} • {vehicleTypeLabels[car.type] || car.type}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Временные метки */}
      {(ride.startedAt || ride.endedAt || ride.driverArrivedAt) && (
        <div className='space-y-2 pt-3 border-t'>
          {ride.driverArrivedAt && (
            <div className='flex items-center gap-2 text-sm'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span className='text-muted-foreground'>Водитель прибыл:</span>
              <span>{formatDate(ride.driverArrivedAt)}</span>
            </div>
          )}
          {ride.startedAt && (
            <div className='flex items-center gap-2 text-sm'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span className='text-muted-foreground'>Начало поездки:</span>
              <span>{formatDate(ride.startedAt)}</span>
            </div>
          )}
          {ride.endedAt && (
            <div className='flex items-center gap-2 text-sm'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span className='text-muted-foreground'>Завершение:</span>
              <span>{formatDate(ride.endedAt)}</span>
            </div>
          )}
        </div>
      )}

      {/* Расстояние и длительность */}
      {(ride.distance || ride.duration) && (
        <div className='flex gap-6 text-sm pt-3 border-t'>
          {ride.distance && (
            <div className='flex items-center gap-2'>
              <Navigation className='h-4 w-4 text-muted-foreground' />
              <span className='text-muted-foreground'>Расстояние:</span>
              <span className='font-medium'>{formatDistance(ride.distance)}</span>
            </div>
          )}
          {ride.duration && (
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span className='text-muted-foreground'>Длительность:</span>
              <span className='font-medium'>{formatDuration(ride.duration)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
