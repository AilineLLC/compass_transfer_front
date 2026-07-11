import { apiGet, apiPost } from './client';

export interface TagDTO {
  id: string;
  name: string;
}

interface TagListResponse {
  data: TagDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const tagsApi = {
  getTags: async (): Promise<TagDTO[]> => {
    const result = await apiGet<TagListResponse>('/LocationTag');
    if (result.error) throw new Error(result.error.message);
    return result.data!.data;
  },

  createTag: async (name: string): Promise<TagDTO> => {
    const result = await apiPost<TagDTO, { name: string }>('/LocationTag', { name });
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },
};
