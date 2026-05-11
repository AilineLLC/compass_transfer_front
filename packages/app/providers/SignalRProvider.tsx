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

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const paddedPayload = parts[1] + '='.repeat((4 - (parts[1].length % 4)) % 4);
    const payload = JSON.parse(atob(paddedPayload));
    return payload.exp ? Math.floor(Date.now() / 1000) > payload.exp : false;
  } catch {
    return false;
  }
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({ children, accessToken }) => {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const eventHandlers = useRef<Map<string, SignalRCallback[]>>(new Map());
  const hasFailed = useRef<boolean>(false);

  const setupNotificationHandlers = useCallback(() => {
    const handleNewNotification = (data: SignalREventData) => {
      const notifData = data as { type?: string };
      const type = notifData.type || 'Unknown';

      notificationManager.handleNotification(type, data);
    };

    const handlers = eventHandlers.current.get('New') || [];

    handlers.push(handleNewNotification);
    eventHandlers.current.set('New', handlers);
  }, []);

  const performLogoutAndRedirect = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    await Promise.allSettled([
      apiUrl
        ? fetch(`${apiUrl}/Auth/logout`, { method: 'POST', credentials: 'include' })
        : Promise.resolve(),
      fetch(`${basePath}/api/auth/logout`, { method: 'POST', credentials: 'include' }),
    ]);

    window.location.replace(`${basePath}/login`);
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    try {
      hasFailed.current = false;
      setIsConnecting(true);
      setError(null);
      if (!accessToken || isTokenExpired(accessToken)) {
        hasFailed.current = true;
        await performLogoutAndRedirect();
        return;
      }
      setupNotificationHandlers();
      const wsBaseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL!;
      const wsUrl = `${wsBaseUrl}?access_token=${accessToken}`;
      // console.log(wsUrl)
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
        hasFailed.current = true;
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
            const errText: string = errorMessage.error || 'Ошибка сервера';

            hasFailed.current = true;
            newConnection.close();
            setError(errText);
            setIsConnected(false);
            setConnection(null);

            // Если сервер отклонил соединение из-за авторизации — выходим и перенаправляем на логин
            const isAuthError =
              errText.toLowerCase().includes('unauthorized') ||
              errText.toLowerCase().includes('401') ||
              errText.toLowerCase().includes('auth') ||
              errText.toLowerCase().includes('token');
            if (isAuthError) {
              performLogoutAndRedirect();
            }

            return;
          }
          const message = JSON.parse(cleanData);

          if (message.type === 1 && message.target && message.arguments) {
            const eventType = message.target;
            const eventData = message.arguments[0];

            logger.info(`Обработка события [${eventType}]:`, eventData);

            // Диспатч в обработчики 'New' (catch-all)
            const newHandlers = eventHandlers.current.get(eventType) || [];

            newHandlers.forEach((handler) => handler(eventData));

            // Дополнительный диспатч по типу уведомления (для точечных подписчиков)
            const notifType = (eventData as { type?: string })?.type;

            if (notifType) {
              const typeHandlers = eventHandlers.current.get(notifType) || [];

              typeHandlers.forEach((handler) => handler(eventData));
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
  }, [accessToken, setupNotificationHandlers, performLogoutAndRedirect]);

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

  // Автоматическое подключение при монтировании (только один раз, без ретраев при ошибке)
  useEffect(() => {
    if (accessToken && !isConnected && !isConnecting && !hasFailed.current) {
      connect().catch(() => {});
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

  // Сплэш-экран показывается минимум 3 секунды
  if (showWelcome) {
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

  // После сплэша всегда рендерим children — без WS уведомления работают через REST
  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
}; 