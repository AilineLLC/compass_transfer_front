'use client';

import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useUserRole } from '@shared/contexts';
import { ConversationList, MessageThread, useChatRealtime } from '@features/chat';
import { useSelfUser } from '@entities/users/hooks/useSelfUser';
import { Role } from '@entities/users/enums';
import type { ChatInboxItemDTO } from '@entities/chat/interface';

export function ChatView() {
  const { userRole, userId } = useUserRole();
  const isOperator = userRole === Role.Operator;

  const { data: selfUser, isLoading } = useSelfUser({ enabled: isOperator });
  const isMainSupportOperator = isOperator && selfUser?.isMainSupportOperator === true;

  const [selectedConversation, setSelectedConversation] = useState<ChatInboxItemDTO | null>(null);

  useChatRealtime(isMainSupportOperator);

  if (!isOperator || (!isLoading && !isMainSupportOperator)) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-3 rounded-2xl border bg-white text-center'>
        <ShieldAlert className='h-10 w-10 text-muted-foreground' />
        <h1 className='text-xl font-semibold'>Доступ ограничен</h1>
        <p className='max-w-md text-sm text-muted-foreground'>
          Раздел «Чат с водителями» доступен только оператору, назначенному главным оператором поддержки.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center rounded-2xl border bg-white text-sm text-muted-foreground'>
        Проверка доступа...
      </div>
    );
  }

  return (
    <div className='flex h-full overflow-hidden rounded-2xl border bg-white'>
      <ConversationList
        selectedCounterpartyId={selectedConversation?.counterpartyId ?? null}
        onSelect={setSelectedConversation}
      />
      <MessageThread currentUserId={userId ?? ''} conversation={selectedConversation} />
    </div>
  );
}
