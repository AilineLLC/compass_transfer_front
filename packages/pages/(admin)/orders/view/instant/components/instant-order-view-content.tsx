'use client'

import { MapPin, User, Car, Info, DollarSign, ExternalLink, Settings } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '@shared/hooks/useServices';
import { useTariffById } from '@shared/hooks/useTariffById';
import { Badge } from '@shared/ui/data-display/badge';
import { Skeleton } from '@shared/ui/data-display/skeleton';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import type { GetOrderDTO } from '@entities/orders/interface';
import { useLocation } from '@features/locations/hooks/useLocation';
import { useUserById } from '@features/users';
import { DriverSheet } from '@widgets/sidebar/ui/driver-sheet';
import { RideDetailCard } from '@entities/rides';

interface InstantOrderViewContentProps {
  order: GetOrderDTO;
}

export function InstantOrderViewContent({ order }: InstantOrderViewContentProps) {
  // Запросы для получения данных
  const { location: startLocation, isLoading: startLocationLoading } = useLocation(order.startLocationId || '');
  const { location: endLocation, isLoading: endLocationLoading } = useLocation(order.endLocationId || '');
  const { user: creator, isLoading: creatorLoading } = useUserById(order.creatorId || '');
  const { tariff, isLoading: tariffLoading } = useTariffById(order.tariffId || '');
  const { services, isLoading: servicesLoading } = useServices();

  // Состояние для driver sheet
  const [isDriverSheetOpen, setIsDriverSheetOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('main');
  const [activeOrderType, setActiveOrderType] = useState('all');

  // Данные выбранного водителя получаются в DriverSheet при необходимости

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) return 'В процессе';

    return new Intl.NumberFormat('ru-RU').format(price) + ' сом';
  };

  const formatFinalPrice = (price: number | null | undefined) => {
    // Если заказ истек или отменен системой - показываем расчетную цену
    if (order.status === 'Expired' || order.subStatus === 'CancelledBySystem') {
      if (order.initialPrice && order.initialPrice > 0) {
        return new Intl.NumberFormat('ru-RU').format(order.initialPrice) + ' сом';
      }
      return 'Не применимо';
    }

    // Если заказ завершен, но цены нет - это ошибка
    if (order.status === 'Completed' && (!price || price === 0)) {
      return 'Ошибка расчета';
    }

    // Если заказ в процессе
    if (!price || price === 0) {
      return 'В процессе';
    }

    return new Intl.NumberFormat('ru-RU').format(price) + ' сом';
  };

  // Функция для поиска услуги по имени
  const findServiceByName = (serviceName: string) => {
    return services.find((service: { name: string }) => service.name === serviceName);
  };

  return (
    <div className='space-y-6'>
      {/* Маршрут */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            Маршрут
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-3'>
            <div className='flex flex-col items-center pt-1'>
              <div className='w-3 h-3 bg-green-500 rounded-full flex-shrink-0' />
              <div className='w-0.5 flex-1 bg-gray-300 my-2' style={{ minHeight: '60px' }} />
              <div className='w-3 h-3 bg-red-500 rounded-full flex-shrink-0' />
            </div>
            <div className='flex-1 space-y-8'>
              <div>
                <div className='font-medium text-sm text-muted-foreground mb-1'>Откуда</div>
                <div className='font-medium'>
                  {startLocationLoading ? (
                    <Skeleton className='h-4 w-48' />
                  ) : (
                    startLocation?.name || 'Не указано'
                  )}
                </div>
                {startLocation?.address && (
                  <div className='text-sm text-muted-foreground mt-1'>
                    {startLocation.address}
                  </div>
                )}
              </div>
              <div>
                <div className='font-medium text-sm text-muted-foreground mb-1'>Куда</div>
                <div className='font-medium'>
                  {endLocationLoading ? (
                    <Skeleton className='h-4 w-48' />
                  ) : (
                    endLocation?.name || 'Не указано'
                  )}
                </div>
                {endLocation?.address && (
                  <div className='text-sm text-muted-foreground mt-1'>
                    {endLocation.address}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Тариф */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            Тариф
            {tariff && (
              <Button
                variant='ghost'
                size='sm'
                className='ml-auto h-6 w-6 p-0'
                onClick={() => window.open(`/tariffs/${tariff.id}`, '_blank')}
              >
                <ExternalLink className='h-3 w-3' />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {tariffLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-28' />
            </div>
          ) : tariff ? (
            <div className='space-y-3'>
              <div>
                <div className='text-sm text-muted-foreground'>Название</div>
                <div className='font-medium'>{tariff.name}</div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-sm text-muted-foreground'>Класс обслуживания</div>
                  <div className='font-medium'>{tariff.serviceClass}</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Тип автомобиля</div>
                  <div className='font-medium'>{tariff.carType}</div>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-sm text-muted-foreground'>Базовая цена</div>
                  <div className='font-medium'>{tariff.basePrice} сом</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Цена за минуту</div>
                  <div className='font-medium'>{tariff.minutePrice} сом</div>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-sm text-muted-foreground'>Минимальная цена</div>
                  <div className='font-medium'>{tariff.minimumPrice} сом</div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Цена за км</div>
                  <div className='font-medium'>{tariff.perKmPrice} сом</div>
                </div>
              </div>
              <div>
                <div className='text-sm text-muted-foreground'>Бесплатное время ожидания</div>
                <div className='font-medium'>{tariff.freeWaitingTimeMinutes} мин</div>
              </div>
            </div>
          ) : (
            <div className='text-muted-foreground'>Тариф не указан</div>
          )}
        </CardContent>
      </Card>

      {/* Пассажиры */}
      {order.passengers && order.passengers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Пассажиры ({order.passengers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {order.passengers.map((passenger, index) => (
                <div key={index} className='flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                      <User className='h-4 w-4 text-blue-600' />
                    </div>
                    <div>
                      <div className='font-medium'>
                        {`${passenger.firstName} ${passenger.lastName || ''}`.trim() || 'Без имени'}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        {passenger.isMainPassenger ? 'Основной пассажир' : 'Пассажир'}
                      </div>
                    </div>
                  </div>
                  {passenger.customerId && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={() => window.open(`/users/customer/${passenger.customerId}`, '_blank')}
                    >
                      <ExternalLink className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Дополнительные услуги */}
      {order.services && order.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Дополнительные услуги</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {order.services.map((service, index) => {
                const serviceData = findServiceByName(service.name);
                const actualPrice = serviceData?.price || 0;

                return (
                  <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <div>
                        <div className='font-medium flex items-center gap-2'>
                          {service.name}
                          {serviceData && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-4 w-4 p-0'
                              onClick={() => window.open(`/services/${serviceData.id}`, '_blank')}
                            >
                              <ExternalLink className='h-3 w-3' />
                            </Button>
                          )}
                        </div>
                        {service.notes && (
                          <div className='text-sm text-muted-foreground'>{service.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-medium'>
                        {servicesLoading ? (
                          <Skeleton className='h-4 w-16' />
                        ) : (
                          `${new Intl.NumberFormat('ru-RU').format(actualPrice)} сом`
                        )}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Кол-во: {service.quantity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Поездки */}
      {order.rides && order.rides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Car className='h-5 w-5' />
              Поездки ({order.rides.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {order.rides.map((ride, index) => (
                <RideDetailCard key={ride.id} rideId={ride.id} rideIndex={index} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Дополнительная информация */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Info className='h-5 w-5' />
            Дополнительная информация
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <div className='text-sm text-muted-foreground'>Создатель</div>
            <div className='font-medium flex items-center gap-2'>
              {creatorLoading ? (
                <Skeleton className='h-4 w-32' />
              ) : (
                <>
                  {creator?.fullName || 'Не указан'}
                  {creator && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-4 w-4 p-0'
                      onClick={() => {
                        const roleUrl = creator.role.toLowerCase();
                        window.open(`/users/${roleUrl}/${creator.id}`, '_blank');
                      }}
                    >
                      <ExternalLink className='h-3 w-3' />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            <div className='text-sm text-muted-foreground'>Создан</div>
            <div className='font-medium'>{formatDate(order.createdAt)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Ценообразование */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Стоимость
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Начальная цена:</span>
            <span>{formatPrice(order.initialPrice)}</span>
          </div>
          <div className='flex justify-between font-medium text-lg border-t pt-2'>
            <span>Итоговая цена:</span>
            <span className={
              order.status === 'Expired' || order.subStatus === 'CancelledBySystem'
                ? 'text-gray-500'
                : !order.finalPrice || order.finalPrice === 0
                ? 'text-orange-600'
                : 'text-green-600'
            }>
              {formatFinalPrice(order.finalPrice)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Driver Sheet */}
      <DriverSheet
        driver={null}
        isOpen={isDriverSheetOpen}
        onClose={() => {
          setIsDriverSheetOpen(false);
        }}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeOrderType={activeOrderType}
        setActiveOrderType={setActiveOrderType}
      />
    </div>
  );
}
