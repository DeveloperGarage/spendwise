import { useQuery } from '@tanstack/react-query';

import { ApiError, getMe, type Me } from '@/lib/api';

export function useMe() {
  return useQuery<Me | null>({
    queryKey: ['me'],
    retry: false,
    queryFn: async () => {
      try {
        return await getMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        if (error instanceof TypeError) {
          return null;
        }
        throw error;
      }
    },
  });
}
