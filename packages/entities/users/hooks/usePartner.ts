import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@shared/api/users';
import type { GetPartnerDTO } from '../interface';

/**
 * Хук для получения данных партнера по ID
 */
export function usePartner(id: string | null) {
    return useQuery<GetPartnerDTO>({
        queryKey: ['partner', id],
        queryFn: () => {
            if (!id) {
                throw new Error('Partner ID is required');
            }

            return usersApi.getPartner(id);
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 минут
    });
}
