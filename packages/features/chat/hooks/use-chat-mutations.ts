'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@shared/api/chat';
import type { SendChatMessageDTO, EditChatMessageDTO } from '@entities/chat/interface';
import { CHAT_INBOX_QUERY_KEY } from './use-chat-inbox';
import { CHAT_CONVERSATION_QUERY_KEY } from './use-chat-conversation';

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendChatMessageDTO) => chatApi.sendMessage(data),
    onSuccess: (_message, variables) => {
      queryClient.invalidateQueries({ queryKey: CHAT_INBOX_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CHAT_CONVERSATION_QUERY_KEY, variables.recipientId],
        exact: false,
      });
    },
  });
}

export function useEditChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditChatMessageDTO }) => chatApi.editMessage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATION_QUERY_KEY, exact: false });
      queryClient.invalidateQueries({ queryKey: CHAT_INBOX_QUERY_KEY });
    },
  });
}

export function useDeleteChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatApi.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATION_QUERY_KEY, exact: false });
      queryClient.invalidateQueries({ queryKey: CHAT_INBOX_QUERY_KEY });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => chatApi.markConversationRead(userId),
    onSuccess: (_count, userId) => {
      queryClient.invalidateQueries({ queryKey: CHAT_INBOX_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CHAT_CONVERSATION_QUERY_KEY, userId],
        exact: false,
      });
    },
  });
}
