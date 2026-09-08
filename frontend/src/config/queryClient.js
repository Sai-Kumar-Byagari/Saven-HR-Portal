import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 30 seconds — navigating back uses cache instantly
      staleTime: 30 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect for stable data
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0,
    },
  },
});
