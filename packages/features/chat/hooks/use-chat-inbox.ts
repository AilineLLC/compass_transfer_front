'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ChatInboxFilters } from '@shared/api/chat';
import type { ChatInboxApiResponse } from '@entities/chat/interface';

export const CHAT_INBOX_QUERY_KEY = ['chat-inbox'] as const;

export function useChatInbox(pageSize: number = 30, filters?: Omit<ChatInboxFilters, 'first' | 'after' | 'size'>) {
  return useInfiniteQuery<ChatInboxApiResponse>({
    queryKey: [...CHAT_INBOX_QUERY_KEY, pageSize, filters],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      chatApi.getInbox(
        pageParam
          ? { ...filters, after: pageParam as string, size: pageSize }
          : { ...filters, first: true, size: pageSize },
      ),
    getNextPageParam: lastPage => {
      if (!lastPage.hasNext || lastPage.data.length === 0) return undefined;

      return lastPage.data[lastPage.data.length - 1].counterpartyId;
    },
    staleTime: 10_000,
    // Резервный механизм на случай пропущенного/незамеченного WS-события
    refetchInterval: 15_000,
  });
}

export function useInvalidateChatInbox() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: CHAT_INBOX_QUERY_KEY });
}
