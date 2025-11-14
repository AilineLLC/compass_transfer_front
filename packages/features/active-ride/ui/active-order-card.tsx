'use client';

import { Clock, User, Car, CheckCircle, Play, Square, Navigation, ChevronDown, ChevronUp, Users, Settings } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { toast } from '@shared/lib/conditional-toast';
import type { GetOrderDTO } from '@shared/api/orders';
import { ridesApi } from '@shared/api/rides/rides-api';
import { Button } from '@shared/ui/forms/button';
import { Card } from '@shared/ui/layout/card';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import { RideStatus, OrderSubStatus } from '@entities/orders/enums';
import { useLocation } from '@features/locations/hooks/useLocation';

interface ActiveOrderCardProps {
  order: GetOrderDTO;
  onStatusUpdate?: () => void;
}

function getStatusText(status: string): { text: string; color: string } {
  switch (status) {
    case 'InProgress':
      return { text: 'В процессе', color: 'text-blue-600' };
    case 'Expired':
      return { text: 'Просрочен', color: 'text-red-600' };
    case 'Scheduled':
      return { text: 'Запланирован', color: 'text-green-600' };
    default:
      return { text: status, color: 'text-gray-600' };
  }
}

export function ActiveOrderCard({ order, onStatusUpdate }: ActiveOrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassengers, setShowPassengers] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const statusInfo = getStatusText(order.status);

  // Получаем активную поездку из заказа
  // Если заказ назначен водителю (DriverAssigned), то берем первую поездку
  const activeRide = order.rides && order.rides.length > 0 ? order.rides[0] : null;

  // Загружаем данные локаций
  const startLocation = useLocation(order.startLocationId);
  const endLocation = useLocation(order.endLocationId);

  // Для дополнительных остановок используем отдельные хуки
  const additionalStop1 = useLocation(order.additionalStops[0] || null);
  const additionalStop2 = useLocation(order.additionalStops[1] || null);
  const additionalStop3 = useLocation(order.additionalStops[2] || null);

  const additionalStopsLocations = [
    additionalStop1,
    additionalStop2,
    additionalStop3
  ].slice(0, order.additionalStops.length);

  // Функции для открытия карт с маршрутом
  const openInMaps = (mapType: '2gis' | 'yandex' | 'google') => {
    if (!startLocation.location || !endLocation.location) return;

    const startLat = startLocation.location.latitude;
    const startLng = startLocation.location.longitude;
    const endLat = endLocation.location.latitude;
    const endLng = endLocation.location.longitude;

    let url = '';

    switch (mapType) {
      case '2gis':
        url = `https://2gis.kg/bishkek/directions/points/${startLng},${startLat}|${endLng},${endLat}`;
        break;
      case 'yandex':
        url = `https://yandex.ru/maps/?rtext=${startLat},${startLng}~${endLat},${endLng}&rtt=auto`;
        break;
      case 'google':
        url = `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
        break;
    }

    window.open(url, '_blank');
  };

  // Обработчики действий с поездкой (оптимизированы с useCallback)
  const handleHeadingToClient = useCallback(async () => {
    if (!activeRide?.id || isUpdating) return;

    setIsUpdating(true);
    try {
      await ridesApi.driverHeadingToClient(activeRide.id);
      onStatusUpdate?.();
    } catch {
      // Ошибка при обновлении статуса "Еду к клиенту"
      toast.error('Ошибка при обновлении статуса "Еду к клиенту"');
    } finally {
      setIsUpdating(false);
    }
  }, [activeRide?.id, isUpdating, onStatusUpdate]);

  const handleDriverArrived = useCallback(async () => {
    if (!activeRide?.id || isUpdating) return;

    setIsUpdating(true);
    try {
      await ridesApi.driverArrived(activeRide.id);
      onStatusUpdate?.();
    } catch {
      toast.error('Ошибка при обновлении статуса "Прибыл"');
    } finally {
      setIsUpdating(false);
    }
  }, [activeRide?.id, isUpdating, onStatusUpdate]);

  const handleRideStarted = useCallback(async () => {
    if (!activeRide?.id || isUpdating) return;

    setIsUpdating(true);
    try {
      await ridesApi.rideStarted(activeRide.id);
      onStatusUpdate?.();
    } catch {
      toast.error('Ошибка при обновлении статуса "Начал поездку"');
    } finally {
      setIsUpdating(false);
    }
  }, [activeRide?.id, isUpdating, onStatusUpdate]);

  const handleRideFinished = useCallback(async () => {
    if (!activeRide?.id || isUpdating) return;

    setIsUpdating(true);
    try {
      await ridesApi.rideFinished(activeRide.id);
      onStatusUpdate?.();
    } catch {
      toast.error('Ошибка при обновлении статуса "Завершил поездку"');
    } finally {
      setIsUpdating(false);
    }
  }, [activeRide?.id, isUpdating, onStatusUpdate]);

  const handleRideCancelled = useCallback(async () => {
    if (!activeRide?.id || isUpdating) return;

    setIsUpdating(true);
    try {
      await ridesApi.rideCancelled(activeRide.id);
      onStatusUpdate?.();
    } catch {
      toast.error('Ошибка при отмене поездки');
    } finally {
      setIsUpdating(false);
    }
  }, [activeRide?.id, isUpdating, onStatusUpdate]);

  // Определяем доступные действия в зависимости от статуса заказа и поездки
  const getAvailableActions = () => {
    if (!activeRide) return [];

    // Сначала проверяем статус поездки (если есть)
    if (activeRide.status) {
      switch (activeRide.status) {
        case RideStatus.Accepted:
          return [
            { label: 'Еду к клиенту', action: handleHeadingToClient, icon: Car, variant: 'default' as const },
            { label: 'Отменить', action: handleRideCancelled, icon: Square, variant: 'destructive' as const }
          ];
        case RideStatus.Arrived:
          return [
            { label: 'Начать поездку', action: handleRideStarted, icon: Play, variant: 'default' as const },
            { label: 'Отменить', action: handleRideCancelled, icon: Square, variant: 'destructive' as const }
          ];
        case RideStatus.InProgress:
          return [
            { label: 'Завершить поездку', action: handleRideFinished, icon: CheckCircle, variant: 'default' as const }
          ];
        default:
          // Если статус неизвестный, но поездка есть - показываем базовые кнопки
          break;
      }
    }

    // Проверяем статус заказа для определения состояния
    // Сначала проверяем подстатусы для более точного определения
    if (order.subStatus === OrderSubStatus.DriverAssigned) {
      // Водитель только что принял заказ
      return [
        { label: 'Еду к клиенту', action: handleHeadingToClient, icon: Car, variant: 'default' as const },
        { label: 'Отменить', action: handleRideCancelled, icon: Square, variant: 'destructive' as const }
      ];
    } else if (order.subStatus === OrderSubStatus.DriverHeading) {
      // Водитель едет к клиенту - показываем кнопку "Прибыл"
      return [
        { label: 'Прибыл', action: handleDriverArrived, icon: Car, variant: 'default' as const },
        { label: 'Отменить', action: handleRideCancelled, icon: Square, variant: 'destructive' as const }
      ];
    } else if (order.subStatus === OrderSubStatus.DriverArrived) {
      // Водитель прибыл к клиенту - показываем кнопку "Начать поездку"
      return [
        { label: 'Начать поездку', action: handleRideStarted, icon: Play, variant: 'default' as const },
        { label: 'Отменить', action: handleRideCancelled, icon: Square, variant: 'destructive' as const }
      ];
    } else if (order.subStatus === OrderSubStatus.RideStarted) {
      // Поездка началась - показываем кнопку "Завершить поездку"
      return [
        { label: 'Завершить поездку', action: handleRideFinished, icon: CheckCircle, variant: 'default' as const }
      ];
    }

    // Если статус InProgress без подстатуса - водитель в пути с клиентом
    if (order.status === 'InProgress') {
      return [
        { label: 'Завершить поездку', action: handleRideFinished, icon: CheckCircle, variant: 'default' as const }
      ];
    }

    return [];
  };

  const availableActions = getAvailableActions();

  return (
    <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50">
      <div className="space-y-4">
        {/* Заголовок с номером заказа и статусом */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              Заказ #{order.orderNumber ? orderNumberToString(order.orderNumber) : order.id.slice(-8)}
            </h3>
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>

        {/* Маршрут */}
        <div className="space-y-3">
          {/* Начальная точка */}
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0" />
            <div className="flex-1">
              {startLocation.isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                </div>
              ) : startLocation.location ? (
                <div>
                  <p className="font-medium text-gray-900">{startLocation.location.name}</p>
                  <p className="text-sm text-gray-600">{startLocation.location.address}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Не удалось загрузить адрес</p>
              )}
            </div>
          </div>

          {/* Дополнительные остановки */}
          {order.additionalStops.length > 0 && additionalStopsLocations.map((stopLocation, index) => (
            <div key={order.additionalStops[index]} className="flex items-start gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1 flex-shrink-0" />
              <div className="flex-1">
                {stopLocation.isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-48" />
                  </div>
                ) : stopLocation.location ? (
                  <div>
                    <p className="font-medium text-gray-900">{stopLocation.location.name}</p>
                    <p className="text-sm text-gray-600">{stopLocation.location.address}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Не удалось загрузить адрес</p>
                )}
              </div>
            </div>
          ))}

          {/* Конечная точка */}
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0" />
            <div className="flex-1">
              {endLocation.isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                </div>
              ) : endLocation.location ? (
                <div>
                  <p className="font-medium text-gray-900">{endLocation.location.name}</p>
                  <p className="text-sm text-gray-600">{endLocation.location.address}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Не удалось загрузить адрес</p>
              )}
            </div>
          </div>

          {/* Кнопки карт */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openInMaps('2gis')}
              disabled={!startLocation.location || !endLocation.location}
              className="flex items-center gap-1 text-xs"
            >
              <Navigation className="w-3 h-3" />
              2ГИС
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openInMaps('yandex')}
              disabled={!startLocation.location || !endLocation.location}
              className="flex items-center gap-1 text-xs"
            >
              <Navigation className="w-3 h-3" />
              Яндекс
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openInMaps('google')}
              disabled={!startLocation.location || !endLocation.location}
              className="flex items-center gap-1 text-xs"
            >
              <Navigation className="w-3 h-3" />
              Google
            </Button>
          </div>
        </div>

        {/* Информация о пассажирах */}
        {order.passengers && order.passengers.length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowPassengers(!showPassengers)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Пассажиры ({order.passengers.length})
                </span>
              </div>
              {showPassengers ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showPassengers && (
              <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                {order.passengers.map((passenger) => (
                  <div key={passenger.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {passenger.firstName || 'Без имени'}
                          {passenger.lastName && ` ${passenger.lastName}`}
                        </span>
                        {passenger.isMainPassenger && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Главный
                          </span>
                        )}
                      </div>
                      {passenger.customerId && (
                        <p className="text-xs text-gray-500">ID: {passenger.customerId}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Информация об услугах */}
        {order.services && order.services.length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowServices(!showServices)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Услуги ({order.services.length})
                </span>
              </div>
              {showServices ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showServices && (
              <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                {order.services.map((service) => (
                  <div key={service.serviceId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Settings className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {service.name || 'Услуга'}
                        </span>
                        {service.quantity > 1 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            x{service.quantity}
                          </span>
                        )}
                      </div>
                      {service.notes && (
                        <p className="text-xs text-gray-500 mt-1">{service.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Дополнительная информация о заказе */}
        {(order.description || order.airFlight || order.flyReis || order.notes || order.scheduledTime) && (
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Дополнительная информация
            </h4>

            {order.scheduledTime && (
              <div className="bg-blue-50 p-2 rounded border-l-4 border-l-blue-500">
                <span className="text-xs text-blue-600 uppercase tracking-wide font-medium">Запланированное время:</span>
                <p className="text-sm text-blue-800 mt-1 font-medium">
                  {new Date(order.scheduledTime).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            {order.description && (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Описание:</span>
                <p className="text-sm text-gray-700 mt-1">{order.description}</p>
              </div>
            )}

            {(order.airFlight || order.flyReis) && (
              <div className="bg-yellow-50 p-2 rounded border-l-4 border-l-yellow-500">
                <span className="text-xs text-yellow-600 uppercase tracking-wide font-medium">Информация о рейсах:</span>
                <div className="mt-1 space-y-1">
                  {order.airFlight && (
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">Прилет:</span> <span className="font-mono">{order.airFlight}</span>
                    </p>
                  )}
                  {order.flyReis && (
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">Вылет:</span> <span className="font-mono">{order.flyReis}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {order.notes && (
              <div className="bg-gray-50 p-2 rounded border-l-4 border-l-gray-400">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Комментарии:</span>
                <p className="text-sm text-gray-700 mt-1">{order.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Время создания */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>
            Создан: {new Date(order.createdAt).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Стоимость */}
        {order.finalPrice && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Стоимость: {order.finalPrice} сом</span>
          </div>
        )}

        {/* Кнопки управления статусом поездки */}
        {availableActions.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {availableActions.map((action, index) => {
                const IconComponent = action.icon;

                return (
                  <Button
                    key={index}
                    variant={action.variant}
                    size="sm"
                    onClick={() => {
                      action.action()
                    }}
                    disabled={isUpdating}
                    className="flex items-center gap-2"
                  >
                    <IconComponent className="w-4 h-4" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
