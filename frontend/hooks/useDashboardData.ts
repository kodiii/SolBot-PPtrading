import useSWR from 'swr';
import { DashboardData, ApiError } from '@/lib/types';

const REFRESH_INTERVAL = 2000; // 2 seconds

/**
 * Custom fetcher with error handling for dashboard data
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const errorData = await res.json() as ApiError;
    throw new Error(errorData.details || errorData.error || 'Failed to fetch data');
  }

  const data = await res.json();
  return data as DashboardData;
};

/**
 * Hook for fetching and managing dashboard data
 * Includes:
 * - Real-time updates
 * - Loading states
 * - Error handling
 * - Manual refresh
 */
export function useDashboardData() {
  const {
    data,
    error,
    isValidating,
    mutate
  } = useSWR<DashboardData, Error>(
    '/api/dashboard',
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      dedupingInterval: 1000,
      errorRetryCount: 3,
      onError: (err) => {
        console.error('Dashboard data fetch error:', err);
      },
    }
  );

  return {
    data,
    isLoading: !error && !data,
    isRefreshing: isValidating,
    error: error?.message,
    refresh: () => mutate(),
  };
}

/**
 * Hook for trading position data only
 */
export function usePositions() {
  const { data, ...rest } = useDashboardData();
  return {
    positions: data?.positions || [],
    ...rest,
  };
}

/**
 * Hook for trading stats only
 */
export function useStats() {
  const { data, ...rest } = useDashboardData();
  return {
    stats: data?.stats,
    ...rest,
  };
}