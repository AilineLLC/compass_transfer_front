import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@shared/api/users';
import type { GetUserSelfProfileDTO } from '../interface';

/**
 * Хук для получения профиля текущего пользователя
 */
export function useSelfProfile(options: { enabled?: boolean } = {}) {
    const { enabled = true } = options;

    return useQuery<GetUserSelfProfileDTO>({
        queryKey: ['user-self-profile'],
        queryFn: () => usersApi.getSelfProfile(),
        enabled,
        staleTime: 15 * 60 * 1000, // 15 минут
    });
}
