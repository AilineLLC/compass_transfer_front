'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { chatApi } from '@shared/api/chat';
import type { ChatConversationApiResponse } from '@entities/chat/interface';

export const CHAT_CONVERSATION_QUERY_KEY = ['chat-conversation'] as const;

/**
 * Сообщения диалога с собеседником counterpartyId.
 * API отдаёт страницы отсортированными по CreatedAt DESC (новые сначала).
 * Для отображения используем flattenConversationMessages(), который разворачивает в хронологический порядок.
 */
export function useChatConversation(counterpartyId: string | null, pageSize: number = 30) {
  return useInfiniteQuery<ChatConversationApiResponse>({
    queryKey: [...CHAT_CONVERSATION_QUERY_KEY, counterpartyId, pageSize],
    enabled: !!counterpartyId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      chatApi.getConversation(
        counterpartyId!,
        pageParam ? { after: pageParam as string, size: pageSize } : { first: true, size: pageSize },
      ),
    getNextPageParam: lastPage => {
      if (!lastPage.hasNext || lastPage.data.length === 0) return undefined;

      return lastPage.data[lastPage.data.length - 1].id;
    },
    staleTime: 10_000,
    // Резервный механизм на случай пропущенного/незамеченного WS-события
    refetchInterval: 4_000,
  });
}

/** Разворачивает DESC-страницы в хронологический порядок (старые сверху, новые снизу) */
export function flattenConversationMessages(
  pages: ChatConversationApiResponse[] | undefined,
) {
  if (!pages) return [];

  return pages.flatMap(page => page.data).reverse();
}
