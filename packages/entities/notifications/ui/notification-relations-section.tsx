'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Search, User, Car, CheckCircle2, X } from 'lucide-react';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { Button } from '@shared/ui/forms/button';
import { Badge } from '@shared/ui/data-display/badge';
import { ordersApi, orderService } from '@shared/api/orders';
import { useDebounce } from '@shared/hooks/use-debounce';
import { orderTypeLabels, orderStatusLabels } from '@entities/orders/constants/order-status-labels';
import type { NotificationCreateFormData } from '../schemas/notificationCreateSchema';

interface OrderSearchResult {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  passengers: Array<{
    id: string;
    firstName: string;
    isMainPassenger: boolean;
  }>;
  rides: Array<{
    id: string;
    driverId: string;
  }>;
}

interface NotificationRelationsSectionProps {
  labels?: {
    orderId?: string;
    rideId?: string;
    userId?: string;
    isRead?: string;
  };
  placeholders?: {
    orderId?: string;
    rideId?: string;
    userId?: string;
  };
  showIsRead?: boolean;
}

export function NotificationRelationsSection({
  labels = {},
  placeholders = {},
  showIsRead = false,
}: NotificationRelationsSectionProps) {
  const {
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<NotificationCreateFormData>();

  const [orderNumber, setOrderNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundOrder, setFoundOrder] = useState<OrderSearchResult | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [initialOrderData, setInitialOrderData] = useState<{
    orderId: string;
    rideId: string;
    userId: string;
    orderType: string;
  } | null>(null);

  const orderId = watch('orderId');
  const userId = watch('userId');
  const rideId = watch('rideId');
  const orderType = watch('orderType');
  const debouncedOrderNumber = useDebounce(orderNumber, 500);

  // При первой загрузке (режим редактирования) - загружаем заказ по orderId
  useEffect(() => {
    // Если это первая загрузка и есть orderId - загружаем заказ
    if (isInitialLoad && orderId && !foundOrder) {
      const loadOrderById = async () => {
        try {
          setIsSearching(true);
          
          // Сохраняем исходные данные
          setInitialOrderData({
            orderId: orderId,
            rideId: rideId || '',
            userId: userId || '',
            orderType: orderType || '',
          });
          
          const order = await orderService.getOrderById(orderId) as unknown as OrderSearchResult;
          
          if (order) {
            setFoundOrder(order);
            setOrderNumber(order.orderNumber);
            
            // Если есть userId, добавляем его в выбранные
            if (userId) {
              setSelectedUserIds([userId]);
            }
          }
        } catch (err) {
          console.error('Ошибка загрузки заказа:', err);
        } finally {
          setIsSearching(false);
          setIsInitialLoad(false);
        }
      };

      loadOrderById();
    }
  }, [orderId, userId, rideId, orderType, foundOrder, isInitialLoad]);

  // Автоматический поиск при вводе
  useEffect(() => {
    const searchOrder = async () => {
      if (!debouncedOrderNumber.trim()) {
        setFoundOrder(null);
        setSearchError(null);
        setSelectedUserIds([]); // Очищаем выбранных пользователей
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setSelectedUserIds([]); // Очищаем выбранных пользователей при новом поиске

      try {
        const response = await ordersApi.getOrders({
          orderNumber: debouncedOrderNumber.trim(),
          orderNumberOp: 'Equal',
          size: 1,
        });

        if (response.data && response.data.length > 0) {
          const order = response.data[0] as unknown as OrderSearchResult;
          setFoundOrder(order);
        } else {
          setSearchError('Заказ не найден');
          setFoundOrder(null);
        }
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Ошибка поиска заказа');
        setFoundOrder(null);
      } finally {
        setIsSearching(false);
      }
    };

    searchOrder();
  }, [debouncedOrderNumber]);

  // Заполняем форму когда найден заказ
  useEffect(() => {
    if (foundOrder) {
      setValue('orderId', foundOrder.id);
      
      // Автоматически заполняем тип заказа
      if (foundOrder.type) {
        setValue('orderType', foundOrder.type as any);
      }
      
      if (foundOrder.rides && foundOrder.rides.length > 0) {
        setValue('rideId', foundOrder.rides[0].id);
      }
    }
  }, [foundOrder, setValue]);

  // Выбор/отмена выбора получателя
  const handleToggleUser = (id: string) => {
    setSelectedUserIds((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((userId) => userId !== id)
        : [...prev, id];
      
      // Обновляем userId в форме (первый выбранный или пустая строка)
      setValue('userId', newSelection[0] || '');
      
      return newSelection;
    });
  };

  // Очистка выбранного заказа
  const handleClearOrder = () => {
    setFoundOrder(null);
    setOrderNumber('');
    setSelectedUserIds([]);
    setValue('orderId', '');
    setValue('rideId', '');
    setValue('userId', '');
  };

  // Восстановление исходного заказа
  const handleRestoreInitialOrder = async () => {
    if (!initialOrderData) return;

    try {
      setIsSearching(true);
      setSearchError(null);

      const order = await orderService.getOrderById(initialOrderData.orderId) as unknown as OrderSearchResult;

      if (order) {
        setFoundOrder(order);
        setOrderNumber(order.orderNumber);
        setValue('orderId', initialOrderData.orderId);
        setValue('rideId', initialOrderData.rideId);
        setValue('orderType', initialOrderData.orderType as any);
        
        if (initialOrderData.userId) {
          setValue('userId', initialOrderData.userId);
          setSelectedUserIds([initialOrderData.userId]);
        } else {
          setSelectedUserIds([]);
        }
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Ошибка восстановления заказа');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Связанные данные</h3>
      
      {/* Поиск заказа */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Поиск заказа</Label>
          {initialOrderData && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestoreInitialOrder}
              disabled={isSearching}
              className="h-8 text-xs"
            >
              Вернуть исходный
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Начните вводить номер заказа (например, 1003C)..."
            className="pl-10 pr-10"
          />
          {orderNumber && (
            <button
              type="button"
              onClick={handleClearOrder}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {isSearching && (
          <p className="text-sm text-blue-600">Поиск...</p>
        )}
        {searchError && (
          <p className="text-sm text-red-600">{searchError}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Начните вводить номер заказа - поиск выполнится автоматически
        </p>
      </div>

      {/* Информация о найденном заказе */}
      {foundOrder && (
        <div className="rounded-lg border bg-green-50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">Заказ найден</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Номер:</span>
              <span className="ml-2 font-medium">{foundOrder.orderNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Тип:</span>
              <Badge variant="outline" className="ml-2">{orderTypeLabels[foundOrder.type as keyof typeof orderTypeLabels] || foundOrder.type}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Статус:</span>
              <Badge variant="outline" className="ml-2">{orderStatusLabels[foundOrder.status as keyof typeof orderStatusLabels] || foundOrder.status}</Badge>
            </div>
          </div>

          {/* Выбор получателей */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Выберите получателей уведомления</Label>
              {selectedUserIds.length > 0 && (
                <Badge variant="secondary">{selectedUserIds.length} выбрано</Badge>
              )}
            </div>
            
            {/* Пассажиры */}
            {foundOrder.passengers && foundOrder.passengers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Пассажиры:</p>
                {foundOrder.passengers.map((passenger) => (
                  <button
                    key={passenger.id}
                    type="button"
                    onClick={() => handleToggleUser(passenger.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedUserIds.includes(passenger.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <User className="h-4 w-4 text-gray-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">
                        {passenger.firstName || 'Пассажир'}
                        {passenger.isMainPassenger && (
                          <Badge variant="outline" className="ml-2 text-xs">Основной</Badge>
                        )}
                      </div>
                    </div>
                    {selectedUserIds.includes(passenger.id) && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Водители */}
            {foundOrder.rides && foundOrder.rides.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Водители:</p>
                {foundOrder.rides.map((ride, index) => (
                  <button
                    key={ride.id}
                    type="button"
                    onClick={() => handleToggleUser(ride.driverId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedUserIds.includes(ride.driverId)
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Car className="h-4 w-4 text-gray-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">Водитель {index + 1}</div>
                    </div>
                    {selectedUserIds.includes(ride.driverId) && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Информация
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Найдите заказ по номеру, и система автоматически заполнит все связанные данные. Выберите получателя из списка пассажиров или водителей.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
