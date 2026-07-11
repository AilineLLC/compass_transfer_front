'use client';

import { MessageCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/data-display/avatar';
import { Button } from '@shared/ui/forms/button';
import { toast } from '@shared/lib/conditional-toast';
import WelcomeIcon from '@shared/icons/WelcomeIcon';
import { getInitials, getRoleDisplayName } from '@entities/users/utils';
import type { ChatInboxItemDTO } from '@entities/chat/interface';
import { flattenConversationMessages, useChatConversation } from '../hooks/use-chat-conversation';
import {
  useDeleteChatMessage,
  useEditChatMessage,
  useMarkConversationRead,
  useSendChatMessage,
} from '../hooks/use-chat-mutations';
import { getChatAvatarUrl } from '../utils/get-chat-avatar-url';
import { MessageBubble } from './message-bubble';
import { MessageInput } from './message-input';

interface MessageThreadProps {
  currentUserId: string;
  conversation: ChatInboxItemDTO | null;
}

export function MessageThread({ currentUserId, conversation }: MessageThreadProps) {
  const counterpartyId = conversation?.counterpartyId ?? null;
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useChatConversation(counterpartyId);

  const sendMessage = useSendChatMessage();
  const editMessage = useEditChatMessage();
  const deleteMessage = useDeleteChatMessage();
  const markRead = useMarkConversationRead();

  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = flattenConversationMessages(data?.pages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [counterpartyId, messages.length]);

  useEffect(() => {
    if (counterpartyId && conversation && conversation.unreadCount > 0) {
      markRead.mutate(counterpartyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counterpartyId]);

  if (!conversation || !counterpartyId) {
    return (
      <div className='relative flex h-full flex-1 flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-b from-[#EEF2FA] to-[#E3E8F5] text-muted-foreground'>
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
          <WelcomeIcon className='h-auto w-[380px] opacity-[0.12]' />
        </div>
        <div className='relative z-10 flex flex-col items-center gap-2'>
          <MessageCircle className='h-10 w-10' />
          <p>Выберите диалог, чтобы начать переписку</p>
        </div>
      </div>
    );
  }

  const avatarUrl = getChatAvatarUrl(conversation.counterparty);

  return (
    <div className='flex h-full flex-1 flex-col'>
      <div className='flex items-center gap-3 border-b bg-white px-4 py-3'>
        <div className='relative flex-shrink-0'>
          <Avatar className='h-9 w-9'>
            {avatarUrl && <AvatarImage src={avatarUrl} alt={conversation.counterparty.fullName} />}
            <AvatarFallback>{getInitials(conversation.counterparty.fullName)}</AvatarFallback>
          </Avatar>
          {conversation.counterparty.online != null && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                conversation.counterparty.online ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
        <div>
          <div className='text-sm font-semibold'>{conversation.counterparty.fullName}</div>
          <div className='text-xs text-muted-foreground'>
            {getRoleDisplayName(conversation.counterparty.role)}
            {conversation.counterparty.online != null &&
              (conversation.counterparty.online ? ' · онлайн' : ' · офлайн')}
          </div>
        </div>
      </div>

      <div className='relative flex-1 overflow-hidden bg-gradient-to-b from-[#EEF2FA] to-[#E3E8F5]'>
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
          <WelcomeIcon className='h-auto w-[440px] opacity-[0.1]' />
        </div>

        <div className='relative z-10 h-full overflow-y-auto p-4'>
          {hasNextPage && (
            <div className='mb-3 flex justify-center'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage ? 'Загрузка...' : 'Загрузить более ранние сообщения'}
              </Button>
            </div>
          )}

          {isLoading && <div className='text-sm text-muted-foreground'>Загрузка сообщений...</div>}

          {!isLoading && messages.length === 0 && (
            <div className='text-sm text-muted-foreground'>Сообщений пока нет. Напишите первым!</div>
          )}

          <div className='flex flex-col gap-2'>
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                onEdit={async (id, content) => {
                  try {
                    await editMessage.mutateAsync({ id, data: { content } });
                  } catch {
                    toast.error('Не удалось отредактировать сообщение');
                  }
                }}
                onDelete={async id => {
                  try {
                    await deleteMessage.mutateAsync(id);
                  } catch {
                    toast.error('Не удалось удалить сообщение');
                  }
                }}
              />
            ))}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      <MessageInput
        disabled={sendMessage.isPending}
        onSend={async content => {
          try {
            await sendMessage.mutateAsync({ recipientId: counterpartyId, content });
          } catch {
            toast.error('Не удалось отправить сообщение');
          }
        }}
      />
    </div>
  );
}
