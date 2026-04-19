import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from '@shared/lib/conditional-toast';
import { orderService } from '@shared/api/orders';
import { usePaymentContext } from '@shared/contexts/PaymentContext';
import type { WSNotificationDTO } from '@shared/hooks/signal/interface/WSNotificationDTO';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import { useFiscalReceipt } from '@entities/fiscal';
import type { GetLocationDTO } from '@entities/locations/interface';
import type { PaymentMethod } from '@entities/orders/constants/paymentMethods';
import { useTerminalReceipt } from '@entities/orders/context';
import type { CreateInstantOrderDTOType } from '@entities/orders/schemas/CreateInstantOrderDTO.schema';
import type { GetTariffDTO } from '@entities/tariffs/interface';
import type { GetTerminalDTO } from '@entities/users/interface';

interface UseOrderSubmitProps {
  economyTariff: GetTariffDTO | null;
  terminal: GetTerminalDTO | null;
  selectedLocations: GetLocationDTO[];
  calculatedPrice: number;
}

export const useOrderSubmit = ({
  economyTariff,
  terminal,
  selectedLocations,
  calculatedPrice,
}: UseOrderSubmitProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, _setOrderId] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const router = useRouter();
  const signalR = useSignalR();
  const t = useTranslations('Payment');
  const { setReceiptData, setOrderData } = useTerminalReceipt();
  const { createTaxiReceipt: _createTaxiReceipt, isCreating: isFiscalCreating } = useFiscalReceipt();
  const { setPaymentSuccessHandler: _setPaymentSuccessHandler, setCardPaymentHandler: _setCardPaymentHandler } = usePaymentContext();

  // Обработчик WebSocket уведомлений о заказе (типизированный)
  useEffect(() => {
    if (!signalR.isConnected || !orderId) return;

    const handleRideAccepted = (data: WSNotificationDTO) => {

      // ✅ ИСПРАВЛЕНИЕ: Сохраняем данные в контекст вместо localStorage
      try {
        // Сохраняем данные чека
        setReceiptData(data);

        // Сохраняем данные заказа
        setOrderData({
          locations: selectedLocations.map(loc => ({
            id: loc.id,
            name: loc.name,
            address: loc.address,
            latitude: loc.latitude,
            longitude: loc.longitude,
          })),
          startLocation: terminal?.locationId
            ? {
                id: terminal.locationId,
                name: 'Терминал',
                address: 'Адрес терминала',
                latitude: 0,
                longitude: 0,
              }
            : undefined,
          tariff: economyTariff
            ? {
                id: economyTariff.id,
                name: economyTariff.name,
                basePrice: economyTariff.basePrice,
                minutePrice: economyTariff.minutePrice || 0,
                minimumPrice: economyTariff.minimumPrice || 0,
                perKmPrice: economyTariff.perKmPrice || 0,
                occupancy: 1, // Значение по умолчанию для occupancy
              }
            : null,
          finalPrice: calculatedPrice,
        });
      } catch {
      }

      setIsLoading(false);
      router.push('/receipt');
    };

    const handleDriverNotFound = () => {
      setIsLoading(false);
      toast.error(t('errors.driverNotFound'));
    };

    const handleDriverCancelled = (_data: WSNotificationDTO) => {
      setIsLoading(false);
      toast.error(t('errors.driverCancelled'));
    };

    signalR.on('RideAccepted', handleRideAccepted);
    signalR.on('RideCancelled', handleDriverNotFound);
    signalR.on('OrderCancelled', handleDriverCancelled);

    return () => {
      signalR.off('RideAccepted', handleRideAccepted);
      signalR.off('RideCancelled', handleDriverNotFound);
      signalR.off('OrderCancelled', handleDriverCancelled);
    };
  }, [
    signalR,
    signalR.isConnected,
    orderId,
    router,
    t,
    setReceiptData,
    setOrderData,
    selectedLocations,
    calculatedPrice,
    economyTariff,
    terminal,
  ]);

  // Функция для создания заказа с поддержкой paymentId
  const createOrder = useCallback(
    async (paymentId?: string) => {
      if (!economyTariff?.id) {
        toast.error(t('errors.noTariff'));

        return false;
      }

      if (!terminal?.locationId) {
        toast.error(t('errors.startLocationMissing'));

        return false;
      }

      if (selectedLocations.length === 0) {
        toast.error(t('errors.noDestination'));

        return false;
      }

      setIsLoading(true);
      try {
        // Получаем конечную локацию (последняя в списке)
        const endLocation = selectedLocations[selectedLocations.length - 1];

        // Дополнительные остановки (все локации между первой и последней)
        const additionalStops =
          selectedLocations.length > 1
            ? selectedLocations
                .slice(0, selectedLocations.length - 1)
                .map((loc: GetLocationDTO) => loc.id)
            : [];

        // Создаем тело запроса согласно схеме CreateInstantOrderDTO
        const _requestBody: CreateInstantOrderDTOType = {
          tariffId: economyTariff.id,
          startLocationId: terminal.locationId,
          endLocationId: endLocation.id,
          additionalStops: additionalStops,
          initialPrice: Math.round(calculatedPrice),
          routeId: null,
          services: [],
          passengers: [
            {
              customerId: null,
              firstName: 'Пассажир',
              lastName: null,
              isMainPassenger: true,
            },
          ],
          // Добавляем paymentId если он передан (для QR-платежей)
          ...(paymentId && { paymentId }),
        };

        const response = await orderService.createInstantOrderByTerminal(_requestBody);

        // ✅ НОВОЕ: Создаем фискальный чек после успешного создания заказа
        if (response.id) {
          console.log('🧾 Создаем фискальный чек для заказа:', response.id);

          const route = `Терминал → ${selectedLocations.map(loc => loc.name).join(' → ')}`;

          const fiscalSuccess = await _createTaxiReceipt({
            price: calculatedPrice,
            route,
            paymentMethod: paymentId ? 'QR' : 'CARD', // Используем короткие идентификаторы
            orderId: response.id,
          });

          if (!fiscalSuccess) {
            // Если фискальный чек не создался, логируем ошибку но не отменяем заказ
            console.error('⚠️ Заказ создан, но фискальный чек не создался');
            toast.error('⚠️ Заказ создан, но возникла проблема с фискальным чеком');
          }
        }

        // Сохраняем ID заказа для WebSocket подписки
        _setOrderId(response.id || null);

        return true;
      } catch (error: unknown) {
        setIsLoading(false);

        // Проверяем тип ошибки
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = (error as { code?: string })?.code;

        // Проверяем на специфичные ошибки валидации
        if (
          errorMessage.includes('StartLocationNotFound') ||
          errorMessage.includes('Начальная точка не найдена')
        ) {
          toast.error('Начальная точка терминала не найдена. Обратитесь к администратору.');
        } else if (errorMessage.includes('DriversNotFound') || errorCode === 'DRIVERS_NOT_FOUND') {
          toast.error(t('errors.driverNotFound'));
        } else {
          toast.error(t('errors.createOrderFailed'));
        }

        return false;
      }
    },
    [economyTariff, terminal, selectedLocations, calculatedPrice, t, _createTaxiReceipt],
  );

  // УДАЛЕНО: Автоматическая установка обработчиков платежей
  // Это вызывало автоматическое создание заказа при загрузке страницы

  // Обработчик выбора метода оплаты
  const handleMethodSelect = useCallback(
    async (selectedMethod: PaymentMethod) => {
      if (selectedMethod === 'card') {
        // Для карточных платежей - показываем модалку оплаты
        setShowCardModal(true);
        
        return;
      }

      if (selectedMethod === 'qrcode') {
        // Для QR платежей - показываем QR модалку
        setShowQRModal(true);

        return;
      }

      // Для других методов оплаты - пока не поддерживаются
      toast.warning('Unsupported payment method:', selectedMethod);
    },
    [],
  );

  // Функция для создания заказа после успешной оплаты (для QR)
  const createOrderWithPayment = useCallback(
    async (paymentId: string) => {
      return await createOrder(paymentId);
    },
    [createOrder],
  );

  // Функции для управления модалками
  const closeCardModal = useCallback(() => {
    setShowCardModal(false);
  }, []);

  const closeQRModal = useCallback(() => {
    setShowQRModal(false);
  }, []);

  // Обработчик успешной карточной оплаты
  const handleCardPaymentSuccess = useCallback(async () => {
    closeCardModal(); // Закрываем модалку сразу
    await createOrder(); // Создаем заказ и показываем анимацию поиска водителя
  }, [createOrder, closeCardModal]);

  // Обработчик отмены карточной оплаты
  const handleCardPaymentCancel = useCallback(() => {
    closeCardModal(); // Закрываем модалку
    // Показываем уведомление об отмене платежа (разрешено в терминале)
    toast.info('Платеж отменен. Чек аннулирован через POS терминал.', { type: 'payment_cancelled' });
  }, [closeCardModal]);

  // Обработчик успешной QR оплаты
  const handleQRPaymentSuccess = useCallback(async (paymentId: string) => {
    closeQRModal(); // Закрываем модалку сразу
    await createOrder(paymentId); // Создаем заказ и показываем анимацию поиска водителя
  }, [createOrder, closeQRModal]);

  return {
    isLoading: isLoading || isFiscalCreating,
    handleMethodSelect,
    createOrderWithPayment,
    showCardModal,
    showQRModal,
    closeCardModal,
    closeQRModal,
    handleCardPaymentSuccess,
    handleCardPaymentCancel,
    handleQRPaymentSuccess,
    calculatedPrice,
  };
};
