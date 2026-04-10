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

  const connect = useCallback(async (): Promise<void> => {
    try {
      setIsConnecting(true);
      setError(null);

      if (!accessToken) {
        throw new Error('JWT токен не найден');
      }

      const wsBaseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL!;
      const wsUrl = `${wsBaseUrl}?access_token=${accessToken}`;
      const newConnection = new WebSocket(wsUrl);

      newConnection.onopen = () => {
        // Handshake SignalR
        newConnection.send('{"protocol":"json","version":1}\x1e');
        setConnection(newConnection);
        setIsConnected(true);
        setIsConnecting(false);

        // Регистрируем единственный обработчик для нового API
        const handleNew = (data: SignalREventData) => {
          notificationManager.handleNotification('New', data);
        };
        const existing = eventHandlers.current.get('New') || [];
        existing.push(handleNew);
        eventHandlers.current.set('New', existing);
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
          logger.info('WS message:', event.data);
          const cleanData = event.data.replace(/\x1e$/, '');

          if (!cleanData || cleanData === '{}') return;

          if (cleanData.includes('"error"')) {
            const errorMessage = JSON.parse(cleanData);
            logger.error('WS server error:', errorMessage);
            setError(errorMessage.error || 'Ошибка сервера');
            setIsConnected(false);
            setConnection(null);
            return;
          }

          const message = JSON.parse(cleanData);

          if (message.type === 1 && message.target && message.arguments) {
            const eventType = message.target;
            const eventData = message.arguments[0];

            logger.info(`WS event [${eventType}]:`, eventData);

            const handlers = eventHandlers.current.get(eventType) || [];
            handlers.forEach(handler => handler(eventData));
          }
        } catch (err) {
          logger.error('WS parse error:', err, event.data);
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения');
      setIsConnecting(false);
    }
  }, [accessToken]);

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
    const filtered = handlers.filter(h => h !== callback);
    if (filtered.length > 0) {
      eventHandlers.current.set(event, filtered);
    } else {
      eventHandlers.current.delete(event);
    }
  }, []);

  // Автоподключение при монтировании
  useEffect(() => {
    if (accessToken && !isConnected && !isConnecting) {
      connect().catch(() => {});
    }
  }, [accessToken, isConnected, isConnecting, connect]);

  // Сплэш-экран показывается минимум 3 секунды
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

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

  // Показываем сплэш только в первые 3 секунды
  if (showWelcome) {
    return (
      <SignalRContext.Provider value={value}>
        <div className='flex items-center justify-center h-screen bg-white'>
          <div className='text-center'>
            <div className='mb-6'>
              <WelcomeIcon className='w-full h-full h-auto mx-auto animate-pulse' />
            </div>
            <div className='text-lg font-medium text-gray-700'>
              {isConnecting ? 'Подключение к серверу...' : 'Инициализация...'}
            </div>
          </div>
        </div>
      </SignalRContext.Provider>
    );
  }

  // После сплэша всегда рендерим children — без WS уведомления работают через REST
  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
};
