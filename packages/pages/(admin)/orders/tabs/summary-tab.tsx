'use client';

import { AlertTriangle, UserCheck, Info, Banknote, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { PaymentMethodType } from '@entities/orders/enums';
import type { RoutePoint } from '@shared/components/map/types';
import { Button } from '@shared/ui/forms/button';
import { Textarea } from '@shared/ui/forms/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import type { GetLocationDTO } from '@entities/locations/interface';
import type { GetOrderServiceDTO } from '@entities/orders/interface';
import type { GetServiceDTO } from '@entities/services/interface';
import type { GetTariffDTO } from '@entities/tariffs/interface';
import type { GetDriverDTO } from '@entities/users/interface';
import type { UISelectedService, UIPassenger } from '@features/orders/summary/interfaces';
import { PassengersInfoCard } from '@features/orders/summary/ui/PassengersInfoCard';
import { PriceInfoCard } from '@features/orders/summary/ui/PriceInfoCard';
import { RouteInfoCard } from '@features/orders/summary/ui/RouteInfoCard';
import { TariffInfoCard } from '@features/orders/summary/ui/TariffInfoCard';
import { DriverSheet } from '@widgets/sidebar/ui/driver-sheet';

/**
 * Интерфейс для основного компонента сводки заказа
 */
interface SummaryTabProps {
  // Основные данные по заказу
  selectedTariff: GetTariffDTO | null;
  selectedServices: (UISelectedService | GetOrderServiceDTO)[];
  currentPrice: number;
  passengers: UIPassenger[];
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';

  sale?: number | null;

  // Данные для построения маршрута
  routeState: {
    startLocation?: GetLocationDTO | null;
    endLocation?: GetLocationDTO | null;
    intermediatePoints?: GetLocationDTO[];
    routePoints?: RoutePoint[];
  };
  routeDistance?: number;

  // Методы формы
  methods: {
    setValue: (name: string, value: unknown) => void;
    getValues: (name?: string) => unknown;
    [key: string]: unknown;
  };

  // Режим работы компонента
  _mode: 'create' | 'edit'; // Префикс _ для неиспользуемого параметра

  // Управление ценой
  useCustomPrice?: boolean;
  setUseCustomPrice?: (value: boolean) => void;
  _customPrice?: string;
  setCustomPrice?: (value: string) => void;
  _handleCustomPriceChange?: (value: string) => void;
  _toggleCustomPrice?: () => void;

  // Поля для водителя и метода оплаты (только Admin/Operator)
  driverPrice?: string;
  setDriverPrice?: (value: string) => void;
  paymentMethodType?: PaymentMethodType;
  setPaymentMethodType?: (value: PaymentMethodType) => void;

  // Управление включением доп.точек в стоимость
  includeIntermediateInPrice?: boolean;
  onIncludeIntermediateChange?: (include: boolean) => void;

  // Информация о водителе (только для режима редактирования)
  _selectedDriver?:
    | (GetDriverDTO & {
        firstName?: string;
        lastName?: string;
        middleName?: string;
        phoneNumber?: string;
        avatarUrl?: string;
        car?: {
          brand: string;
          model: string;
          color: string;
          plateNumber: string;
        };
        tariff?: {
          name: string;
        };
        rating?: number | null;
      })
    | null;
  _onTabChange?: (tab: string) => void;
  _getDriverById?: (id: string) => GetDriverDTO | null;
  _updateDriverCache?: (id: string, data: GetDriverDTO) => void;
  _orderStatus?: string;
  _setOrderStatus?: (status: string) => void;

  // Для обратной совместимости с потребителями компонента
  _tariffs?: GetTariffDTO[];
  _services?: GetServiceDTO[];
  _users?: unknown[];
  _routeLocations?: GetLocationDTO[];
  _orderId?: string;
  _isInstantOrder?: boolean;
  _pricing?: {
    basePrice?: number;
    distancePrice?: number;
    totalPrice?: number;
  };
}

/**
 * Компонент сводки заказа по FSD-архитектуре
 */
export function SummaryTab({
  // Основные данные
  selectedTariff,
  selectedServices,
  currentPrice,
  passengers,
  userRole,
  sale,

  // Данные маршрута
  routeState,
  routeDistance,

  // Форма и режим
  methods,
  _mode,

  // Управление ценой
  useCustomPrice = false,
  setUseCustomPrice,
  _customPrice = '',
  setCustomPrice,
  _handleCustomPriceChange,
  _toggleCustomPrice,

  // Поля для водителя и метода оплаты
  driverPrice = '',
  setDriverPrice,
  paymentMethodType = PaymentMethodType.Cash,
  setPaymentMethodType,

  // Управление доп.точками
  includeIntermediateInPrice = true,
  onIncludeIntermediateChange,

  // Информация о водителе
  _selectedDriver,
  _onTabChange,
  _getDriverById,
  _updateDriverCache,
  _orderStatus,
  _setOrderStatus,

  // Параметры с префиксом _ не используются в компоненте
  _tariffs,
  _services,
  _users,
  _routeLocations,
  _orderId,
  _isInstantOrder,
  _pricing,
}: SummaryTabProps) {
  const [notes, setNotes] = useState('');
  const [showRouteWarningModal, setShowRouteWarningModal] = useState(false);
  const [isDriverSheetOpen, setIsDriverSheetOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('main');
  const [activeOrderType, setActiveOrderType] = useState('all');

  // Локальное состояние для включения доп.точек в стоимость (если не передано извне)
  const [localIncludeIntermediate, setLocalIncludeIntermediate] = useState(true);

  // Используем переданное состояние или локальное
  const currentIncludeIntermediate = includeIntermediateInPrice ?? localIncludeIntermediate;
  const handleIncludeIntermediateChange =
    onIncludeIntermediateChange ?? setLocalIncludeIntermediate;

  // Функция для открытия sheet с информацией о водителе
  const handleDriverDetailsClick = () => {
    setIsDriverSheetOpen(true);
  };

  // Функция для закрытия sheet
  const handleDriverSheetClose = () => {
    setIsDriverSheetOpen(false);
  };

  // Инициализация заметок
  useEffect(() => {
    const savedNotes = methods.getValues('notes') as string;

    if (savedNotes && savedNotes !== notes) {
      setNotes(savedNotes);
    }
  }, [methods, notes]);

  // Предупреждение о невыбранном маршруте
  useEffect(() => {
    if (!routeDistance || routeDistance === 0) {
      setShowRouteWarningModal(true);
    }
  }, [routeDistance]);

  // Форматирование цены
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Обработчик изменения заметок
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    setNotes(value);
    methods.setValue('notes', value);
  };

  // Обработчик изменения кастомной цены
  const handleCustomPriceToggle = () => {
    if (setUseCustomPrice) {
      setUseCustomPrice(!useCustomPrice);
    }

    // Сброс кастомной цены, если она больше не используется

    if (useCustomPrice && setCustomPrice) {
      setCustomPrice('');
    }
  };

  return (
    <div className='p-4'>
      {/* Предупреждение о невыбранном маршруте */}
      {showRouteWarningModal && (
        <Card className='mb-4 bg-yellow-50 border-yellow-100'>
          <CardContent className='p-4 flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-yellow-500' />
            <div className='flex-1'>
              <p className='text-yellow-800'>
                Расстояние маршрута не определено. Пожалуйста, выберите корректные начальную и
                конечную точки в разделе &quot;Маршрут&quot;.
              </p>
            </div>
            <Button variant='outline' onClick={() => setShowRouteWarningModal(false)}>
              Закрыть
            </Button>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Левая колонка */}
        <div>
          <RouteInfoCard
            startLocation={routeState.startLocation?.name || 'Не выбрано'}
            endLocation={routeState.endLocation?.name || 'Не выбрано'}
            intermediatePoints={routeState.intermediatePoints?.map(p => p.name) || []}
            distance={routeDistance ? `${Math.round(routeDistance / 1000)} км` : 'Не определено'}
            includeIntermediateInPrice={currentIncludeIntermediate}
            onIncludeIntermediateChange={handleIncludeIntermediateChange}
          />

          <PriceInfoCard
            basePrice={formatPrice(
              selectedTariff?.basePrice
                ? Math.round(
                    userRole === 'partner' && sale
                      ? Number(selectedTariff?.basePrice) * (1 - sale)
                      : Number(selectedTariff?.basePrice),
                  )
                : 0,
            )}
            distancePrice={formatPrice(
              selectedTariff?.perKmPrice
                ? Math.round(
                    selectedTariff
                      ? ((routeDistance || 0) / 1000) *
                          (selectedTariff.perKmPrice *
                            (userRole === 'partner' && sale ? 1 - sale : 1))
                      : 0,
                  )
                : 0,
            )}
            totalPrice={formatPrice(Math.round(currentPrice))}
            formattedPrice={_customPrice || ''}
            userRole={userRole}
            sale={sale}
            isCustomPrice={useCustomPrice || false}
            handleCustomPriceChange={
              _handleCustomPriceChange || (value => setCustomPrice && setCustomPrice(value))
            }
            toggleCustomPrice={_toggleCustomPrice || handleCustomPriceToggle}
            showCustomPrice /* Показываем для всех режимов */
            calculatedPrice={currentPrice} /* Передаем рассчитанную цену */
            customPriceValue={
              _customPrice ? parseFloat(_customPrice.replace(/[^0-9.-]+/g, '')) : 0
            } /* Передаем значение кастомной цены */
            totalPriceValue={
              useCustomPrice && _customPrice
                ? parseFloat(_customPrice.replace(/[^0-9.-]+/g, ''))
                : currentPrice
            } /* Передаем числовое значение итоговой цены */
            selectedServices={selectedServices.map(service => {
              // Ищем услугу в справочнике services по serviceId (для GetOrderServiceDTO) или id (для UISelectedService)
              const serviceId = 'serviceId' in service ? service.serviceId : (service as any).id;
              const serviceInfo =
                _services && Array.isArray(_services)
                  ? _services.find(s => s.id === serviceId)
                  : null;
              const originalPrice =
                'price' in service
                  ? Number((service as any).price || 0)
                  : Number(serviceInfo?.price || 0);

              return {
                serviceId: serviceId,
                quantity: service.quantity || 1,
                name:
                  serviceInfo?.name ||
                  ('name' in service ? (service as any).name : '') ||
                  `Услуга ${serviceId}`,
                price:
                  userRole === 'partner' && sale
                    ? Math.round(originalPrice * (1 - sale))
                    : originalPrice,
              };
            })}
            servicesPrice={selectedServices.reduce((total, service) => {
              const quantity = service.quantity || 1;
              // Берем цену из справочника услуг (services) или устанавливаем в 0
              const serviceId = 'serviceId' in service ? service.serviceId : (service as any).id;
              const serviceInfo =
                _services && Array.isArray(_services)
                  ? _services.find(s => s.id === serviceId)
                  : null;
              const originalPrice =
                'price' in service
                  ? Number((service as any).price || 0)
                  : Number(serviceInfo?.price || 0);
              const price =
                userRole === 'partner' && sale
                  ? Math.round(originalPrice * (1 - sale))
                  : originalPrice;

              return total + price * quantity;
            }, 0)}
            fullPriceValue={Math.round(
              (selectedTariff?.basePrice || 0) +
                (selectedTariff?.perKmPrice
                  ? ((routeDistance || 0) / 1000) * selectedTariff.perKmPrice
                  : 0) +
                selectedServices.reduce((total, service) => {
                  const serviceId =
                    'serviceId' in service ? service.serviceId : (service as any).id;
                  const serviceInfo =
                    _services && Array.isArray(_services)
                      ? _services.find(s => s.id === serviceId)
                      : null;
                  const originalPrice =
                    'price' in service
                      ? Number((service as any).price || 0)
                      : Number(serviceInfo?.price || 0);
                  return total + originalPrice * (service.quantity || 1);
                }, 0),
            )}
          />

          {/* Метод оплаты и сумма водителя (только Admin и Operator) */}
          {(userRole === 'admin' || userRole === 'operator') && (
            <Card className='mb-4'>
              <CardContent className='p-4 space-y-4'>
                {/* Метод оплаты */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Метод оплаты
                  </label>
                  <div className='flex gap-2'>
                    <button
                      type='button'
                      onClick={() => setPaymentMethodType?.(PaymentMethodType.Cash)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        paymentMethodType === PaymentMethodType.Cash
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Banknote className='h-4 w-4' />
                      Наличные
                    </button>
                    <button
                      type='button'
                      onClick={() => setPaymentMethodType?.(PaymentMethodType.Card)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        paymentMethodType === PaymentMethodType.Card
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className='h-4 w-4' />
                      Безналичный
                    </button>
                  </div>
                </div>

                {/* Сумма водителя */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Сумма водителя (сом)
                    <span className='text-red-500 ml-1'>*</span>
                  </label>
                  <input
                    type='number'
                    min='0'
                    max={
                      useCustomPrice && _customPrice
                        ? parseFloat(_customPrice.replace(/[^0-9.-]+/g, '')) || currentPrice
                        : currentPrice
                    }
                    placeholder='Введите сумму водителя'
                    value={driverPrice}
                    onChange={e => setDriverPrice?.(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !driverPrice
                        ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-300'
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {!driverPrice && (
                    <p className='mt-1 text-xs text-red-600 font-medium'>
                      ⚠ Укажите сумму водителя перед созданием заказа
                    </p>
                  )}
                  {driverPrice && parseFloat(driverPrice) > currentPrice && (
                    <p className='mt-1 text-xs text-red-600'>
                      Сумма водителя не может превышать стоимость поездки ({currentPrice} сом)
                    </p>
                  )}
                  <p className='mt-1 text-xs text-gray-400'>
                    Максимум: {currentPrice} сом (стоимость поездки)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Метод оплаты для партнеров (только информация — всегда Безналичный) */}
          {userRole === 'partner' && (
            <Card className='mb-4'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 text-blue-700'>
                  <CreditCard className='h-4 w-4' />
                  <span className='text-sm font-medium'>Метод оплаты: Безналичный</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Заметки */}
          <Card className='mb-4'>
            <CardContent className='p-4'>
              <Textarea
                placeholder='Заметки к заказу'
                value={notes}
                onChange={handleNotesChange}
                className='min-h-[100px]'
              />
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка */}
        <div>
          <TariffInfoCard
            tariff={selectedTariff}
            userRole={userRole as 'admin' | 'operator' | 'partner' | 'driver'}
            sale={sale || 0}
          />

          {/* Информация о водителе (перенесено выше пассажиров) */}
          <Card className='mb-4'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <UserCheck className='h-5 w-5' />
                Водитель
              </CardTitle>
              {_onTabChange && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => _onTabChange('driver')}
                  className='text-sm text-blue-600 hover:text-blue-800'
                >
                  {_selectedDriver ? 'Изменить' : 'Выбрать'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {_selectedDriver ? (
                <div className='space-y-3'>
                  {/* Основная информация о водителе */}
                  <div className='flex items-center gap-3'>
                    {_selectedDriver.avatarUrl ? (
                      <div className='w-12 h-12 rounded-full overflow-hidden'>
                        <Image
                          src={_selectedDriver.avatarUrl}
                          alt={_selectedDriver.fullName || 'Водитель'}
                          width={48}
                          height={48}
                          className='w-full h-full object-cover'
                        />
                      </div>
                    ) : (
                      <div className='w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium'>
                        {_selectedDriver.fullName
                          ? _selectedDriver.fullName
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)
                          : 'В'}
                      </div>
                    )}
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900'>
                        {_selectedDriver.fullName || 'Неизвестный водитель'}
                      </p>
                      <p className='text-sm text-gray-600'>{_selectedDriver.phoneNumber}</p>

                      {/* Тариф водителя */}
                      {(_selectedDriver as any).tariff && (
                        <p className='text-xs text-blue-600 font-medium'>
                          {(_selectedDriver as any).tariff.name}
                        </p>
                      )}
                    </div>

                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-blue-600 hover:text-blue-800'
                      onClick={handleDriverDetailsClick}
                    >
                      <Info className='h-4 w-4' />
                    </Button>
                  </div>

                  {/* Информация о машине */}
                  {(_selectedDriver as any).car && (
                    <div className='pt-2 border-t border-gray-100'>
                      <div className='flex justify-between items-start'>
                        <div>
                          <p className='font-medium text-gray-800'>
                            {(_selectedDriver as any).car.brand}{' '}
                            {(_selectedDriver as any).car.model}
                          </p>
                          <p className='text-sm text-gray-600'>
                            {(_selectedDriver as any).car.color}
                          </p>
                          <p className='text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block'>
                            {(_selectedDriver as any).car.plateNumber}
                          </p>
                        </div>

                        {(_selectedDriver as any).rating !== undefined &&
                          (_selectedDriver as any).rating !== null && (
                            <div className='flex items-center gap-1 text-sm bg-yellow-50 px-2 py-1 rounded'>
                              <span className='text-yellow-500'>★</span>
                              <span className='font-medium'>
                                {(_selectedDriver as any).rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='text-center py-4'>
                  <p className='text-gray-500'>Водитель не выбран</p>
                  <p className='text-xs text-gray-400 mt-1'>Выберите водителя на вкладке "Карта"</p>
                </div>
              )}
            </CardContent>
          </Card>

          <PassengersInfoCard passengers={passengers} />
        </div>
      </div>

      {/* DriverSheet с информацией о водителе */}
      <DriverSheet
        isOpen={isDriverSheetOpen}
        onClose={handleDriverSheetClose}
        driver={_selectedDriver as GetDriverDTO | null}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeOrderType={activeOrderType}
        setActiveOrderType={setActiveOrderType}
      />
    </div>
  );
}
