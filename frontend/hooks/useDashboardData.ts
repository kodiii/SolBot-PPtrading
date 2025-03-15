import useSWR from 'swr';
import { DashboardData, ApiError } from '@/lib/types';

const REFRESH_INTERVAL = 2000; // 2 seconds

/**
 * Custom fetcher with error handling for dashboard data
 */
import { API_ENDPOINTS } from '@/lib/api-config';

const fetcher = async (url: string): Promise<DashboardData> => {
  console.log('Fetching dashboard data...'); // Provisional debug log
  const res = await fetch(url);
  
  if (!res.ok) {
    console.error('Dashboard data fetch failed:', res.status, res.statusText); // Provisional debug log
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
export function useDashboardData(): {
  data: DashboardData | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | undefined;
  refresh: () => Promise<DashboardData | undefined>;
} {
  const {
    data,
    error,
    isValidating,
    mutate
  } = useSWR<DashboardData, Error>(
    API_ENDPOINTS.dashboard,
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      dedupingInterval: REFRESH_INTERVAL,
      errorRetryCount: 3,
      isPaused: () => false,
      onError: (err) => {
        console.error('SWR onError callback:', err); // Provisional debug log
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
export function usePositions(): {
  positions: DashboardData['positions'];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | undefined;
  refresh: () => Promise<DashboardData | undefined>;
} {
  const { data, ...rest } = useDashboardData();
  return {
    positions: data?.positions || [],
    ...rest,
  };
}

/**
 * Hook for trading stats only
 */
export function useStats(): {
  stats: DashboardData['stats'] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | undefined;
  refresh: () => Promise<DashboardData | undefined>;
} {
  const { data, ...rest } = useDashboardData();
  return {
    stats: data?.stats,
    ...rest,
  };
}
