import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@shared/api/users';
import type { GetUserSelfDTO } from '../interface';

/**
 * Хук для получения базовых данных текущего пользователя (GET /User/self).
 * Используется, например, для проверки флага isMainSupportOperator у оператора.
 */
export function useSelfUser(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery<GetUserSelfDTO>({
    queryKey: ['user-self'],
    queryFn: () => usersApi.getSelf(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
