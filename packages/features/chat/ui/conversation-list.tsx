'use client';

import { MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/data-display/avatar';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { getInitials, getRoleDisplayName } from '@entities/users/utils';
import type { ChatInboxItemDTO } from '@entities/chat/interface';
import { useChatInbox } from '../hooks/use-chat-inbox';
import { formatChatTime } from '../utils/format-chat-time';
import { getChatAvatarUrl } from '../utils/get-chat-avatar-url';

interface ConversationListProps {
  selectedCounterpartyId: string | null;
  onSelect: (item: ChatInboxItemDTO) => void;
}

export function ConversationList({ selectedCounterpartyId, onSelect }: ConversationListProps) {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useChatInbox();

  const items = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <div className='flex h-full w-80 flex-shrink-0 flex-col border-r bg-white'>
      <div className='flex items-center gap-2 border-b px-4 py-4'>
        <MessageCircle className='h-5 w-5 text-[#0047FF]' />
        <h2 className='text-lg font-semibold'>Чат с водителями</h2>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {isLoading && (
          <div className='p-4 text-sm text-muted-foreground'>Загрузка диалогов...</div>
        )}

        {isError && (
          <div className='p-4 text-sm text-red-500'>Не удалось загрузить диалоги</div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className='p-4 text-sm text-muted-foreground'>Пока нет диалогов с водителями</div>
        )}

        {items.map(item => {
          const isActive = item.counterpartyId === selectedCounterpartyId;
          const avatarUrl = getChatAvatarUrl(item.counterparty);
          const preview = item.lastDeleted
            ? 'Сообщение удалено'
            : item.lastContent || 'Нет сообщений';

          return (
            <button
              key={item.counterpartyId}
              type='button'
              onClick={() => onSelect(item)}
              className={`flex w-full items-start gap-3 border-b border-l-4 px-4 py-3 text-left transition-colors hover:bg-[#0047FF]/5 ${
                isActive ? 'border-l-[#0047FF] bg-[#0047FF]/5' : 'border-l-transparent'
              }`}
            >
              <div className='relative flex-shrink-0'>
                <Avatar className='h-10 w-10'>
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={item.counterparty.fullName} />}
                  <AvatarFallback>{getInitials(item.counterparty.fullName)}</AvatarFallback>
                </Avatar>
                {item.counterparty.online != null && (
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      item.counterparty.online ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>

              <div className='min-w-0 flex-1'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='truncate text-sm font-medium'>{item.counterparty.fullName}</span>
                  <span className='flex-shrink-0 text-xs text-muted-foreground'>
                    {formatChatTime(item.lastMessageAt)}
                  </span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span
                    className={`truncate text-xs ${
                      item.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {preview}
                  </span>
                  {item.unreadCount > 0 && (
                    <Badge className='h-5 min-w-[1.25rem] flex-shrink-0 rounded-full border-transparent bg-[#0047FF] px-1.5 text-center text-xs text-white'>
                      {item.unreadCount}
                    </Badge>
                  )}
                </div>
                <span className='text-xs text-muted-foreground'>
                  {getRoleDisplayName(item.counterparty.role)}
                </span>
              </div>
            </button>
          );
        })}

        {hasNextPage && (
          <div className='p-3'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='w-full'
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {isFetchingNextPage ? 'Загрузка...' : 'Показать ещё'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
