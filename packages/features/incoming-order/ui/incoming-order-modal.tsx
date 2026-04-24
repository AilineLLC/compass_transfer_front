'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@shared/lib/conditional-toast';
import { driverQueueApi } from '@shared/api/driver-queue';
import { driverOrderApi } from '@shared/api/orders';
import { ridesApi } from '@shared/api/rides/rides-api';
import type { SignalREventData } from '@shared/hooks/signal/types';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import { OrderStatus, PaymentMethodType } from '@entities/orders/enums';
import type { GetOrderDTO } from '@entities/orders/interface/GetOrderDTO';
import { useNotificationSound } from '@features/notifications';
import { useOrderStack } from '@features/order-stack';

interface IncomingOrderModalProps {
  onOrderAccepted?: () => void; // Callback для обновления dashboard
}

export function IncomingOrderModal({ onOrderAccepted }: IncomingOrderModalProps) {
  // Простое состояние модального окна
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<GetOrderDTO | null>(null);
  const [currentDriverPrice, setCurrentDriverPrice] = useState<number | null>(null);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethodType>(PaymentMethodType.Cash);
  const [currentTripPrice, setCurrentTripPrice] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(10); // Таймер на 10 секунд

  // Хуки
  const { on, off } = useSignalR();
  const { playSound, stopSound } = useNotificationSound();
  const { addToStack } = useOrderStack();

  const dateformat = (date: string) => {
    const newDate = new Date(date)
    return newDate.toLocaleString('ru-RU', {
      timeZone: 'Asia/Bishkek',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) ;
  }

  // SignalR слушатель входящих заказов
  useEffect(() => {
    const handleRideRequest = (notification: SignalREventData) => {
      if (notification && typeof notification === 'object' && 'data' in notification && notification.data && 'orderId' in notification && notification.orderId) {
        type WsLocation = { Address?: string; Name?: string };
        type WsWaypoint = { Location?: WsLocation; DepartureTime?: string | null };
        type WsPassenger = { FirstName?: string; LastName?: string; IsMainPassenger?: boolean; Phone?: string | null };
        type WsRideRequestData = {
          Waypoints?: WsWaypoint[];
          Passengers?: WsPassenger[];
          InitialPrice?: number;
          DriverPrice?: number | null;
          PaymentMethodType?: string | null;
          ScheduledTime: string;
        };

        const notifData = notification.data as WsRideRequestData;
        const orderId = notification.orderId as string;
        const rideId = (notification as { rideId?: string }).rideId as string;
        const orderTypeValue = (notification as { orderType?: string }).orderType as string;

        const waypoints = notifData.Waypoints || [];
        const startLocation = waypoints[0]?.Location;
        const endLocation = waypoints[waypoints.length - 1]?.Location;
        const passengers = notifData.Passengers || [];
        const content = dateformat(notifData.ScheduledTime)

        const tripPrice = notifData.InitialPrice || 0;
        const driverPriceValue = notifData.DriverPrice ?? null;
        const paymentMethod = (notifData.PaymentMethodType as PaymentMethodType) || PaymentMethodType.Cash;

        const mappedOrderData = {
          id: orderId,
          orderNumber: orderId.slice(-8),
          startLocationId: startLocation?.Address || startLocation?.Name || 'Не указано',
          endLocationId: endLocation?.Address || endLocation?.Name || 'Не указано',
          startLocationAddress: startLocation?.Address || '',
          endLocationAddress: endLocation?.Address || '',
          type: orderTypeValue === 'Instant' ? 'Instant' : 'Scheduled',
          status: OrderStatus.Pending,
          additionalStops: waypoints.slice(1, -1).map((wp) =>
            wp.Location?.Address || wp.Location?.Name || 'Дополнительная остановка',
          ),
          customerId: '',
          driverId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          scheduledTime: null,
          description: null,
          airFlight: null,
          flyReis: null,
          notes: null,
          totalPrice: 0,
          currency: 'KGS',
          creatorId: '',
          initialPrice: tripPrice,
          driverPrice: driverPriceValue,
          paymentMethodType: paymentMethod,
          services: [],
          content: content,
          passengers: passengers.map((p) => ({
            firstName: p.FirstName || '',
            lastName: p.LastName || null,
            isMainPassenger: p.IsMainPassenger || false,
            phone: p.Phone || null,
          })),
        } as unknown as GetOrderDTO;
        
        setCurrentOrder(mappedOrderData);
        setCurrentOrderId(orderId);
        setCurrentRideId(rideId);
        setOrderType(orderTypeValue);
        setCurrentDriverPrice(driverPriceValue);
        setCurrentPaymentMethod(paymentMethod);
        setCurrentTripPrice(tripPrice);
        setIsModalOpen(true);
        setTimeLeft(10); // Сбрасываем таймер на 10 секунд
        playSound();
      } else {
        // Неправильная структура уведомления - игнорируем
      }
    };

    on('RideRequest', handleRideRequest);

    return () => {
      off('RideRequest', handleRideRequest);
      stopSound();
    };
  }, [on, off, playSound, stopSound]);

  // Принятие заказа
  const handleAccept = async () => {
    if (!currentOrderId) return;

    try {
      setIsAccepting(true);

      stopSound();

      // Выбираем правильный API в зависимости от типа заказа
      if (orderType === 'Scheduled' && currentRideId) {
        // Для запланированных поездок используем Ride API
        await ridesApi.acceptScheduledRide(currentRideId);
      } else {
        // Для мгновенных заказов используем Order API
        await driverOrderApi.acceptInstantOrder(currentOrderId);
      }

      await driverQueueApi.leaveQueue();

      toast.success('✅ Заказ принят!');

      // Закрываем модальное окно
      setIsModalOpen(false);
      setCurrentOrderId(null);
      setCurrentRideId(null);
      setOrderType(null);
      setCurrentOrder(null);
      setCurrentDriverPrice(null);
      setCurrentPaymentMethod(PaymentMethodType.Cash);
      setCurrentTripPrice(0);

      // Отправляем событие для обновления dashboard
      window.dispatchEvent(new CustomEvent('orderAccepted'));

      // Также вызываем callback если он передан
      if (onOrderAccepted) {
        onOrderAccepted();
      }

    } catch {
      toast.error('Ошибка принятия заказа');
    } finally {
      setIsAccepting(false);
    }
  };

  // Закрытие модального окна
  const handleClose = useCallback(async () => {
    // Если есть текущий заказ и это мгновенный заказ, добавляем его в стакан
    if (currentOrder && orderType === 'Instant') {
      addToStack(currentOrder);
    }

    setIsModalOpen(false);
    setCurrentOrderId(null);
    setCurrentRideId(null);
    setOrderType(null);
    setCurrentOrder(null);
    setCurrentDriverPrice(null);
    setCurrentPaymentMethod(PaymentMethodType.Cash);
    setCurrentTripPrice(0);
    stopSound();

    // Автоматически выходим из очереди при закрытии модального окна
    try {
      await driverQueueApi.leaveQueue();
    } catch {
      // Игнорируем ошибки выхода из очереди
    }
  }, [stopSound, currentOrder, orderType, addToStack]);

  // Таймер автоматического закрытия через 10 секунд
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isModalOpen && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleClose();

            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isModalOpen, timeLeft, handleClose]);

  // Не показываем модальное окно если оно закрыто или нет данных заказа
  if (!isModalOpen || !currentOrderId || !currentOrder) {
    return null;
  }

  // Вычисляем процент для анимации кнопки - теперь считаем оставшееся время
  const progressPercent = (timeLeft / 10) * 100;

  const passenger = currentOrder.passengers.find(item => item?.IsMainPassenger) 
  ?? currentOrder.passengers[0]

  const passengerFullname = `${passenger?.firstName || '-'} ${passenger?.lastName || ''}`

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300'>
        {/*  информация о пользователе */}
        <div className='px-6 pt-8 pb-4 text-left'>
          <h3 className='text-lg font-semibold text-gray-900 mb-1'>
            {passengerFullname}
          </h3>
          <p className='text-sm font-semibold mt-1'>Запланированное время: {currentOrder.content}</p>
        </div>
        <div className='mb-[30px] flex justify-center px-[10px]'>
          <hr className='border-gray-200 border-gray-200 w-full' />
        </div>

        {/* Маршруты */}
        <div className='px-6 pt-3 pb-6 space-y-3'>
          {/* Откуда */}
          <div className='flex items-center space-x-3'>
            <div className='flex items-center justify-center w-6 h-6'>
              <svg className='w-4 h-4 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z' clipRule='evenodd' />
              </svg>
            </div>
            <div className='flex-1'>
              <div className='flex items-center space-x-2'>
                <span className='text-blue-600 text-sm font-medium'>{currentOrder.startLocationId || 'Не указано'}</span>
              </div>
            </div>
          </div>

          {/* Разделитель */}
          <div className='flex items-center space-x-3'>
            <div className='w-6 flex justify-center'>
              <div className='w-px h-4 bg-gray-300' />
            </div>
          </div>

          {/* Куда */}
          <div className='flex items-center space-x-3'>
            <div className='flex items-center justify-center w-6 h-6'>
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z' clipRule='evenodd' />
              </svg>
            </div>
            <div className='flex-1'>
              <div className='flex items-center space-x-2'>
                <span className='text-sm font-medium'>{currentOrder.endLocationId || 'Не указано'}</span>
              </div>
            </div>
          </div>

          {/* Дополнительные остановки */}
          {currentOrder.additionalStops && currentOrder.additionalStops.length > 0 && (
            <div className='space-y-3'>
              {currentOrder.additionalStops.map((stop, index) => (
                <div key={index} className='flex items-center space-x-3'>
                  <div className='flex items-center justify-center w-6 h-6'>
                    <svg className='w-4 h-4 text-orange-500' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-sm font-medium'>{stop}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка принять с анимацией */}
        <div className='px-6 pb-6'>
          <div className='relative'>
            <button
              onClick={handleAccept}
              disabled={isAccepting || timeLeft <= 0}
              className='relative w-full bg-gray-400 hover:bg-gray-500 disabled:bg-gray-400 text-white font-medium py-4 rounded-2xl transition-all duration-200 overflow-hidden'
            >
              {/* Синяя полоска, которая уменьшается справа налево */}
              <div
                className='absolute left-0 top-0 h-full bg-blue-600 hover:bg-blue-700 transition-all duration-1000 ease-linear'
                style={{ width: `${progressPercent}%` }}
              />

              {/* Текст кнопки */}
              <span className='relative z-10'>
                {isAccepting ? 'Принимаю...' : `Принять заказ`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}