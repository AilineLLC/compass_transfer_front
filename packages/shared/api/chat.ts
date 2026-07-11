import type {
  ChatInboxApiResponse,
  ChatConversationApiResponse,
  ChatMessageDTO,
  SendChatMessageDTO,
  EditChatMessageDTO,
} from '@entities/chat/interface';
import { apiGet, apiPost, apiPut, apiDelete, ApiRequestError } from './client';

type SearchOperator =
  | 'Equals'
  | 'NotEquals'
  | 'Contains'
  | 'NotContains'
  | 'StartsWith'
  | 'EndsWith'
  | 'IsEmpty'
  | 'IsNotEmpty';

type DateOperator = 'GreaterThan' | 'GreaterThanOrEqual' | 'Equal' | 'LessThanOrEqual' | 'LessThan';

type SortOrder = 'Asc' | 'Desc';

// Курсор для /Chat/inbox — CounterpartyId граничного диалога
export interface ChatInboxFilters {
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;

  isRead?: boolean;
  isDeleted?: boolean;
  content?: string;
  contentOp?: SearchOperator;
  createdAt?: string;
  createdAtOp?: DateOperator;
}

// Курсор для /Chat/conversation/{userId} — Id сообщения граничного элемента
export interface ChatConversationFilters {
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;

  isRead?: boolean;
  isDeleted?: boolean;
  content?: string;
  contentOp?: SearchOperator;
  createdAt?: string;
  createdAtOp?: DateOperator;

  sortBy?: string;
  sortOrder?: SortOrder;
}

export const chatApi = {
  // GET /Chat/inbox — список диалогов текущего пользователя
  getInbox: async (params?: ChatInboxFilters): Promise<ChatInboxApiResponse> => {
    const result = await apiGet<ChatInboxApiResponse>('/Chat/inbox', { params });

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // GET /Chat/conversation/{userId} — сообщения между текущим пользователем и userId
  getConversation: async (
    userId: string,
    params?: ChatConversationFilters,
  ): Promise<ChatConversationApiResponse> => {
    const result = await apiGet<ChatConversationApiResponse>(`/Chat/conversation/${userId}`, {
      params,
    });

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // POST /Chat — отправить сообщение
  sendMessage: async (data: SendChatMessageDTO): Promise<ChatMessageDTO> => {
    const result = await apiPost<ChatMessageDTO, SendChatMessageDTO>('/Chat', data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // PUT /Chat/{id} — редактировать своё сообщение
  editMessage: async (id: string, data: EditChatMessageDTO): Promise<ChatMessageDTO> => {
    const result = await apiPut<ChatMessageDTO, EditChatMessageDTO>(`/Chat/${id}`, data);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },

  // DELETE /Chat/{id} — удалить своё сообщение (soft-delete)
  deleteMessage: async (id: string): Promise<void> => {
    const result = await apiDelete(`/Chat/${id}`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }
  },

  // POST /Chat/conversation/{userId}/read — отметить сообщения от userId прочитанными
  markConversationRead: async (userId: string): Promise<number> => {
    const result = await apiPost<number>(`/Chat/conversation/${userId}/read`);

    if (result.error) {
      throw new ApiRequestError(result.error);
    }

    return result.data!;
  },
};
