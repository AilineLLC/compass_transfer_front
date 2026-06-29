'use client';

import { useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react';
import type { SignalREventHandler, SignalREventData, SignalRCallback } from '@shared/hooks/signal/types';
import { SignalRContext, type SignalRContextType } from '@shared/hooks/signal/useSignalR';
import WelcomeIcon from '@shared/icons/WelcomeIcon';
import { logger } from '@shared/lib/logger';
import { notificationManager } from '@entities/notifications/services/NotificationManager';


export interface SignalRProviderProps {
  children: ReactNode;
  accessToken?: string;
}

// Bug fix #4: use typeof instead of falsy check — exp:0 means "expired in 1970"
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const paddedPayload = parts[1] + '='.repeat((4 - (parts[1].length % 4)) % 4);
    const payload = JSON.parse(atob(paddedPayload));
    if (typeof payload.exp !== 'number') return false;
    return Math.floor(Date.now() / 1000) > payload.exp;
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
  // Bug fix #1: guard against duplicate handler registration
  const handlersSetup = useRef<boolean>(false);
  // Bug fix #8: ref-guard prevents parallel connect() calls (React StrictMode double-invoke)
  const connectingRef = useRef<boolean>(false);
  // Prevents the 3-second fallback from showing the app during an auth redirect
  const isRedirectingRef = useRef<boolean>(false);

  // Bug fix #1: idempotent — skip if already registered
  const setupNotificationHandlers = useCallback(() => {
    if (handlersSetup.current) return;
    handlersSetup.current = true;

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

    await Promise.race([
      Promise.allSettled([
        apiUrl
          ? fetch(`${apiUrl}/Auth/logout`, { method: 'POST', credentials: 'include' })
          : Promise.resolve(),
        fetch(`${basePath}/api/auth/logout`, { method: 'POST', credentials: 'include' }),
      ]),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);

    window.location.replace(`${basePath}/login`);
  }, []);

  const checkTokenValidity = useCallback(async (): Promise<boolean> => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${apiUrl}/User/self`, {
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.status !== 401;
    } catch {
      clearTimeout(timeoutId);
      return true;
    }
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    // Bug fix #8: prevent parallel invocations (React StrictMode double-invoke)
    if (connectingRef.current) return;
    connectingRef.current = true;

    try {
      hasFailed.current = false;
      setIsConnecting(true);
      setError(null);

      if (!accessToken || isTokenExpired(accessToken)) {
        hasFailed.current = true;
        isRedirectingRef.current = true;
        setIsConnecting(false);
        await performLogoutAndRedirect();
        return;
      }

      const isValid = await checkTokenValidity();
      if (!isValid) {
        hasFailed.current = true;
        isRedirectingRef.current = true;
        setIsConnecting(false);
        await performLogoutAndRedirect();
        return;
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
        hasFailed.current = true;
        setError('Ошибка подключения к WebSocket');
        setIsConnecting(false);
        setShowWelcome(false);
      };
      newConnection.onmessage = (event) => {
        try {
          logger.info('Получено сообщение WebSocket:', event.data);
          const cleanData = event.data.replace(/\x1e$/, '');

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
            setShowWelcome(false);

            const isAuthError =
              errText.toLowerCase().includes('unauthorized') ||
              errText.toLowerCase().includes('401') ||
              errText.toLowerCase().includes('auth') ||
              errText.toLowerCase().includes('token');
            if (isAuthError) {
              isRedirectingRef.current = true;
              setShowWelcome(true);
              performLogoutAndRedirect();
            }

            return;
          }
          const message = JSON.parse(cleanData);

          if (message.type === 1 && message.target && message.arguments) {
            const eventType = message.target;
            const eventData = message.arguments[0];

            logger.info(`Обработка события [${eventType}]:`, eventData);

            const newHandlers = eventHandlers.current.get(eventType) || [];

            newHandlers.forEach((handler) => handler(eventData));

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
      setShowWelcome(false);
    } finally {
      connectingRef.current = false;
    }
  }, [accessToken, setupNotificationHandlers, performLogoutAndRedirect, checkTokenValidity]);

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

  useEffect(() => {
    if (accessToken && !isConnected && !isConnecting && !hasFailed.current) {
      connect().catch(() => {
        setShowWelcome(false);
      });
    }
  }, [accessToken, isConnected, isConnecting, connect]);

  // Bug fix #2: close WebSocket on unmount to prevent memory leak and setState on unmounted component
  useEffect(() => {
    return () => {
      if (connection) {
        connection.onclose = null;
        connection.onerror = null;
        connection.onmessage = null;
        connection.close();
      }
    };
  }, [connection]);

  // Fallback: exit splash after 3 seconds, but not if auth failed and a redirect is in progress
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isRedirectingRef.current) {
        setShowWelcome(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isConnected) {
    } else if (error) {
    }
  }, [isConnected, error]);

  // Bug fix #3: memoize context value to prevent unnecessary re-renders in consumers
  const value: SignalRContextType = useMemo(() => ({
    connection,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    on,
    off,
  }), [connection, isConnected, isConnecting, error, connect, disconnect, on, off]);

  if (showWelcome) {
    const splashText = isRedirectingRef.current
      ? 'Перенаправление на страницу входа...'
      : isConnecting
        ? 'Подключение к серверу...'
        : 'Инициализация...';

    return (
      <SignalRContext.Provider value={value}>
        <div className="flex items-center justify-center h-screen bg-white">
          <div className="text-center">
            <div className="mb-6">
              <WelcomeIcon className="w-full h-full h-auto mx-auto animate-pulse" />
            </div>
            <div className="text-lg font-medium text-gray-700">
              {splashText}
            </div>
          </div>
        </div>
      </SignalRContext.Provider>
    );
  }

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
};
