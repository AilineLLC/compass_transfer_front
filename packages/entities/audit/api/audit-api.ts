import { apiGet } from '@shared/api/client';
import type { AuditEventDTO, AuditFilters, AuditListResponseDTO } from '../interface';

export const auditApi = {
  getAuditEvents: async (filters: AuditFilters = {}): Promise<AuditListResponseDTO> => {
    const result = await apiGet<AuditListResponseDTO>('/Audit', { params: filters });
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },

  getAuditEventById: async (id: string): Promise<AuditEventDTO> => {
    const result = await apiGet<AuditEventDTO>(`/Audit/${id}`);
    if (result.error) throw new Error(result.error.message);
    return result.data!;
  },
};
