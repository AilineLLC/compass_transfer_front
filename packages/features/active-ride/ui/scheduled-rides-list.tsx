'use client';

import { Clock, MapPin, Plane, RefreshCw } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ridesApi } from '@shared/api/rides/rides-api';
import { Card } from '@shared/ui/layout/card';
import { Button } from '@shared/ui/forms/button';
import { CheckCircle, Square } from 'lucide-react';
import { toast } from '@shared/lib/conditional-toast';
import type { ScheduledRidesResponse } from '@entities/rides/interface';

export function ScheduledRidesList() {
  const [scheduledRides, setScheduledRides] = useState<ScheduledRidesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingOrderId, setOpeningOrderId] = useState<string | null>(null);

  const router = useRouter();

  // Функция для получения запланированных поездок
  const fetchScheduledRides = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allRidesResponse = await ridesApi.getMyAssignedRides();

      // Показываем все поездки без фильтрации
      setScheduledRides(allRidesResponse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledRides();
  }, []);

  const [isUpdating, setIsUpdating] = useState(false);

  // При нажатии на поездку — переходим на главный экран,
  // где DriverDashboardPage сам подхватит активный заказ
  // (через driverActiveOrdersApi.getMyActiveOrders),
  // как это делает IncomingOrderModal после acceptOrder.
  const handleRideClick = (orderId: string | null, rideStatus: string, orderStatus: string) => {
    if (!orderId) return;

    // Не позволяем переходить на завершенные, отмененные или просроченные
    if (['Completed', 'Cancelled', 'Expired'].includes(orderStatus) ||
      ['Completed', 'Cancelled'].includes(rideStatus)) {
      return;
    }

    setOpeningOrderId(orderId);

    // Сигнализируем DriverDashboardPage обновить данные — точно так же,
    // как это делает IncomingOrderModal после принятия заказа.
    window.dispatchEvent(new CustomEvent('orderAccepted'));

    // Переходим на главный экран, где отобразится ActiveOrderCard
    router.push('/?orderId=' + orderId);
  };

  const handleAcceptRide = async (e: React.MouseEvent, rideId: string) => {
    e.stopPropagation(); // Не переходим в заказ при клике на кнопку
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await ridesApi.acceptScheduledRide(rideId);
      toast.success('Запланированная поездка принята');
      // Уведомляем дашборд, чтобы он подхватил принятый заказ в ActiveOrderCard
      window.dispatchEvent(new CustomEvent('orderAccepted'));
      await fetchScheduledRides();
    } catch {
      toast.error('Ошибка при принятии запланированной поездки');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelRide = async (e: React.MouseEvent, rideId: string) => {
    e.stopPropagation(); // Не переходим в заказ при клике на кнопку
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await ridesApi.rideCancelled(rideId);
      toast.success('Запланированная поездка отменена');
      await fetchScheduledRides();
    } catch {
      toast.error('Ошибка при отмене поездки');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-300 rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-3" />
          <div>
            <p className="text-sm font-medium text-red-800">Ошибка загрузки поездок</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!scheduledRides?.data?.length) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Нет запланированных поездок
        </h3>
        <p className="text-gray-500">
          Когда вам назначат поездки, они появятся здесь
        </p>
      </Card>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'Принята';
      case 'Requested':
        return 'Запланирован';
      case 'Searching':
        return 'Поиск водителя';
      case 'InProgress':
        return 'В процессе выполнения';
      case 'Completed':
        return 'Завершенный';
      case 'Cancelled':
        return 'Отменен';
      case 'Expired':
        return 'Истек';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAirportLocation = (address: string) => {
    return address?.toLowerCase().includes('аэропорт') ||
      address?.toLowerCase().includes('airport') ||
      address?.toLowerCase().includes('манас') ||
      address?.toLowerCase().includes('manas');
  };

  return (
    <div className="space-y-4">
      {scheduledRides.data.map((ride) => {
        const isOpening = openingOrderId === ride.orderId;
        const isPastOrder = ['Completed', 'Cancelled', 'Expired'].includes(ride.orderStatus) ||
          ['Completed', 'Cancelled'].includes(ride.status);
        const isRequested = ride.status === 'Requested';

        return (
          <Card
            key={ride.id}
            className={`p-4 bg-white rounded-2xl shadow-sm border-0 transition-all ${isPastOrder ? 'opacity-50 grayscale cursor-not-allowed' :
              ride.orderId
                ? 'cursor-pointer hover:shadow-md active:scale-[0.98]'
                : 'opacity-80'
              } ${isOpening ? 'opacity-60 pointer-events-none' : ''}`}
            onClick={() => handleRideClick(ride.orderId, ride.status, ride.orderStatus)}
          >
            {/* Дата, время, рейс и статус */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-6 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {ride.scheduledTime ? formatDate(ride.scheduledTime) : '12.01.25'}
                  </div>
                  <div className="text-sm text-gray-500">Дата</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {ride.scheduledTime ? formatTime(ride.scheduledTime) : '13:55'}
                  </div>
                  <div className="text-sm text-gray-500">Время</div>
                </div>
              </div>
              <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span className={`text-sm font-medium ${isPastOrder ? 'text-gray-600' : 'text-green-800'}`}>
                  {isOpening ? 'Открытие...' : getStatusText(ride.status)}
                </span>
              </div>
            </div>

            {/* Маршрут */}
            <div className="space-y-2">
              <div className="flex items-center">
                {isAirportLocation(ride.fromAddress || '') ? (
                  <Plane className="w-5 h-5 mr-3 text-blue-600" />
                ) : (
                  <MapPin className="w-5 h-5 mr-3 text-gray-900" />
                )}
                <span className={`text-base ${isAirportLocation(ride.fromAddress || '') ? 'text-blue-600' : 'text-gray-900'}`}>
                  {ride.fromAddress || 'Не указано"'}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-gray-900" />
                <span className="text-base text-gray-900">
                  {ride.toAddress || 'Не указано'}
                </span>
              </div>
            </div>

            {/* Кнопки Принять / Отменить для статуса Requested */}
            {isRequested && !isPastOrder && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                <Button
                  onClick={(e) => handleAcceptRide(e, ride.id)}
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isUpdating}
                >
                  <CheckCircle className="w-4 h-4" />
                  Принять
                </Button>
                <Button
                  onClick={(e) => handleCancelRide(e, ride.id)}
                  variant="destructive"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isUpdating}
                >
                  <Square className="w-4 h-4" />
                  Отменить
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
