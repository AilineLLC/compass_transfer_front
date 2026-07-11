import { apiGet, apiPost } from './client';

export type PartnerContactFormStatus = 'Pending' | 'Verified' | 'Rejected';

export interface PartnerContactFormUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  role: string;
  phoneNumber: string | null;
  fullName: string;
  avatar: {
    id: string;
    name: string | null;
    extension: string;
    size: number;
    createdAt: string;
    path: string;
  } | null;
  online: boolean | null;
  rating: number | null;
}

export interface PartnerContactFormDTO {
  type: string;
  name: string;
  phone: string;
  carsCount: number | null;
  id: string;
  status: PartnerContactFormStatus;
  user: PartnerContactFormUser;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerContactFormListResponse {
  data: PartnerContactFormDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PartnerContactFormFilters {
  page?: number;
  size?: number;
  status?: PartnerContactFormStatus;
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
}

export const partnerContactFormsApi = {
  getForms: async (filters: PartnerContactFormFilters = {}): Promise<PartnerContactFormListResponse> => {
    const result = await apiGet<PartnerContactFormListResponse>('/ContactForm', { params: filters });
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },

  updateStatus: async (id: string, status: PartnerContactFormStatus): Promise<void> => {
    const result = await apiPost<void, PartnerContactFormStatus>(
      `/ContactForm/${id}/status`,
      status,
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (result.error) throw new Error(result.error.message);
  },
};
