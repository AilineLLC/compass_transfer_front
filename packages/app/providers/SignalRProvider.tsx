'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { SignalREventHandler, SignalREventData, SignalRCallback } from '@shared/hooks/signal/types';
import { SignalRContext, type SignalRContextType } from '@shared/hooks/signal/useSignalR';
import WelcomeIcon from '@shared/icons/WelcomeIcon';
import { logger } from '@shared/lib/logger';
import { notificationManager } from '@entities/notifications/services/NotificationManager';


export interface SignalRProviderProps {
  children: ReactNode;
  accessToken?: string;
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({ children, accessToken }) => {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const eventHandlers = useRef<Map<string, SignalRCallback[]>>(new Map());

  const setupNotificationHandlers = useCallback(() => {
    const notificationTypes = [
      'RideAcceptedNotification',
      'RideAssignedNotification',
      'RideCancelledNotification',
      'RideCompletedNotification',
      'DriverActivityUpdated',
      'DriverArrivedNotification',
      'DriverHeadingNotification',
      'DriverCancelledNotification',
      'OrderCreatedNotification',
      'OrderConfirmedNotification',
      'OrderCancelledNotification',
      'OrderCompletedNotification',
      'RideRejectedNotification',
      'RideStartedNotification',
      'PaymentNotification',
      'PaymentReceivedNotification',
      'PaymentFailedNotification'
    ];

    notificationTypes.forEach(type => {
      const handleNotification = (data: SignalREventData) => {
        notificationManager.handleNotification(type, data);
      };
      const handlers = eventHandlers.current.get(type) || [];

      handlers.push(handleNotification);
      eventHandlers.current.set(type, handlers);
    });
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    try {
      setIsConnecting(true);
      setError(null);
      if (!accessToken) {
        throw new Error('JWT токен не найден');
      }
      setupNotificationHandlers();
      const wsBaseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL!;
      const wsUrl = `${wsBaseUrl}?access_token=${accessToken}`;
      const newConnection = new WebSocket(wsUrl);

      newConnection.onopen = () => {
        newConnection.send('{"protocol":"json","version":1}\x1e');
        setConnection(newConnection);
        setIsConnected(true);
        setIsConnecting(false);
      };
      newConnection.onclose = () => {
        setIsConnected(false);
        setConnection(null);
      };
      newConnection.onerror = () => {
        setError('Ошибка подключения к WebSocket');
        setIsConnecting(false);
      };
      newConnection.onmessage = (event) => {
        try {
          logger.info('Получено сообщение WebSocket:', event.data);
          // Удаляем разделитель SignalR (\x1e) в конце сообщения
          const cleanData = event.data.replace(/\x1e$/, '');

          // Пропускаем пустые сообщения и handshake
          if (!cleanData || cleanData === '{}') {

            return;
          }
          if (cleanData.includes('"error"')) {
            const errorMessage = JSON.parse(cleanData);

            logger.error('Ошибка от сервера:', errorMessage);
            setError(errorMessage.error || 'Ошибка сервера');
            setIsConnected(false);
            setConnection(null);

            return;
          }
          const message = JSON.parse(cleanData);

          if (message.type === 1 && message.target && message.arguments) {
            const eventType = message.target;
            const eventData = message.arguments[0];

            logger.info(`Обработка события [${eventType}]:`, eventData);
            if (eventHandlers.current.has(eventType)) {
              const handlers = eventHandlers.current.get(eventType) || [];

              logger.info(`ВЫЗЫВАЮ ${handlers.length} обработчиков для ${eventType}`);
              handlers.forEach((handler) => {
                handler(eventData);
              });
            } else {
              logger.info(`НЕТ ОБРАБОТЧИКОВ для события ${eventType}`);
            }
          }
        } catch (err) {
          logger.error('Ошибка парсинга сообщения WebSocket:', err, 'Данные:', event.data);
        }
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения');
      setIsConnecting(false);
    }
  }, [accessToken, setupNotificationHandlers]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (connection) {
      connection.close();
      setConnection(null);
      setIsConnected(false);
      eventHandlers.current.clear();
    }
  }, [connection]);

  const on = useCallback<SignalREventHandler>((event: string, callback: SignalRCallback): void => {
    const handlers = eventHandlers.current.get(event) || [];
    handlers.push(callback);
    eventHandlers.current.set(event, handlers);
  }, []);

  const off = useCallback<SignalREventHandler>((event: string, callback: SignalRCallback): void => {
    const handlers = eventHandlers.current.get(event) || [];
    const filteredHandlers = handlers.filter(handler => handler !== callback);

    if (filteredHandlers.length > 0) {
      eventHandlers.current.set(event, filteredHandlers);
    } else {
      eventHandlers.current.delete(event);
    }
  }, []);

  // Автоматическое подключение при монтировании
  useEffect(() => {
    if (accessToken && !isConnected && !isConnecting) {
      connect().catch(() => {
      });
    }
  }, [accessToken, isConnected, isConnecting, connect]);

  // Минимальное время показа WelcomeIcon (2 секунды)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Логирование состояния подключения
  useEffect(() => {
    if (isConnected) {
    } else if (error) {
    }
  }, [isConnected, error]);

  const value: SignalRContextType = {
    connection,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    on,
    off,
  };

  // Показываем загрузку пока не подключились или пока не прошло минимальное время
  if ((!isConnected && !error) || showWelcome) {
    return (
      <SignalRContext.Provider value={value}>
        <div className="flex items-center justify-center h-screen bg-white">
          <div className="text-center">
            <div className="mb-6">
              <WelcomeIcon className="w-full h-full h-auto mx-auto animate-pulse" />
            </div>
            <div className="text-lg font-medium text-gray-700">
              {isConnecting ? 'Подключение к серверу...' : 'Инициализация...'}
            </div>
          </div>
        </div>
      </SignalRContext.Provider>
    );
  }

  // Показываем ошибку если не удалось подключиться
  if (error) {
    return (
      <SignalRContext.Provider value={value}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">Ошибка подключения</div>
            <div >{error}</div>
          </div>
        </div>
      </SignalRContext.Provider>
    );
  }

  // Рендерим children только после успешного подключения
  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
}; 