'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSignalR } from '@shared/hooks/signal/useSignalR';
import type { SignalREventData } from '@shared/hooks/signal/types';
import { CHAT_INBOX_QUERY_KEY } from './use-chat-inbox';
import { CHAT_CONVERSATION_QUERY_KEY } from './use-chat-conversation';

const CHAT_EVENT_TYPES = ['ChatMessageNew', 'ChatMessageUpdated', 'ChatMessageDeleted'];

/**
 * Подписывается на события хаба ChatMessageNew/ChatMessageUpdated/ChatMessageDeleted
 * и инвалидирует связанные запросы (inbox + открытый диалог), чтобы новые/изменённые/
 * удалённые сообщения появлялись без перезагрузки страницы.
 *
 * Инвалидируем широко (весь inbox + все открытые диалоги), не пытаясь точечно
 * вычислить counterpartyId — так надёжнее, если формат payload от бэка отличается
 * от ожидаемого, и не требует точного совпадения currentUserId с id из сообщения.
 */
export function useChatRealtime(enabled: boolean = true) {
  const { on, off } = useSignalR();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: CHAT_INBOX_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATION_QUERY_KEY, exact: false });
    };

    const handleTypedEvent = () => invalidateAll();

    // На случай расхождения точного имени события с сервера — подстраховка через общий 'New'
    const handleGenericEvent = (data: SignalREventData) => {
      const type = (data as { type?: string })?.type;

      if (type && CHAT_EVENT_TYPES.includes(type)) {
        invalidateAll();
      }
    };

    CHAT_EVENT_TYPES.forEach(type => on(type, handleTypedEvent));
    on('New', handleGenericEvent);

    return () => {
      CHAT_EVENT_TYPES.forEach(type => off(type, handleTypedEvent));
      off('New', handleGenericEvent);
    };
  }, [on, off, queryClient, enabled]);
}
