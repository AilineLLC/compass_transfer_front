import type { Role } from '@entities/users/enums';

/**
 * Файл аватара собеседника чата
 */
export interface ChatAvatarDTO {
  id: string;
  name?: string | null;
  extension?: string | null;
  size?: number;
  createdAt?: string;
  path: string;
}

/**
 * Собеседник в чате (оператор/водитель)
 */
export interface ChatCounterpartyDTO {
  id: string;
  email: string;
  emailConfirmed?: boolean;
  role: Role;
  phoneNumber?: string | null;
  fullName: string;
  avatar?: ChatAvatarDTO | null;
  online?: boolean | null;
  rating?: number | null;
}

/**
 * Сообщение чата (GET /Chat/conversation/{userId}, POST /Chat, PUT /Chat/{id})
 */
export interface ChatMessageDTO {
  id: string;
  senderId: string;
  recipientId: string;
  content: string | null;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Элемент списка диалогов (GET /Chat/inbox)
 */
export interface ChatInboxItemDTO {
  counterpartyId: string;
  counterparty: ChatCounterpartyDTO;
  lastMessageId?: string | null;
  lastContent?: string | null;
  lastMessageAt?: string | null;
  lastSenderId?: string | null;
  lastSender?: ChatCounterpartyDTO | null;
  lastDeleted?: boolean;
  unreadCount: number;
}

export interface ChatInboxApiResponse {
  data: ChatInboxItemDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ChatConversationApiResponse {
  data: ChatMessageDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** POST /Chat */
export interface SendChatMessageDTO {
  recipientId: string;
  content: string;
}

/** PUT /Chat/{id} */
export interface EditChatMessageDTO {
  content: string;
}
