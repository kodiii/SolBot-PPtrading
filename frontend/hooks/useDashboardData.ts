import useSWR, { mutate } from 'swr';
import { DashboardData, ApiError } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/api-config';

// Clear all SWR cache on load
mutate(() => true, undefined, { revalidate: false });

const REFRESH_INTERVAL = 2000; // 2 seconds

/**
 * Custom fetcher with error handling for dashboard data
 */
const fetcher = async (url: string): Promise<DashboardData> => {
  console.log('Fetching dashboard data with cache busting...'); // Provisional debug log
  
  // Add cache busting parameter
  const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
  
  const res = await fetch(cacheBustUrl, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    cache: 'no-store'
  });
  
  if (!res.ok) {
    console.error('Dashboard data fetch failed:', res.status, res.statusText); // Provisional debug log
    const errorData = await res.json() as ApiError;
    throw new Error(errorData.details || errorData.error || 'Failed to fetch data');
  }

  try {
    const data = await res.json();
    console.log('Received dashboard data:', data);
    return data as DashboardData;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Failed to parse dashboard data');
  }
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
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      keepPreviousData: false,
      dedupingInterval: 0,
      errorRetryCount: 3,
      isPaused: () => false,
      revalidateIfStale: true,
      revalidateOnMount: true,
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
  closePosition: (tokenMint: string) => Promise<boolean>;
} {
  const { data, ...rest } = useDashboardData();
  
  const closePosition = async (tokenMint: string): Promise<boolean> => {
    try {
      console.log('Closing position for token:', tokenMint);
      console.log('Using endpoint:', API_ENDPOINTS.closePosition);
      
      const response = await fetch(API_ENDPOINTS.closePosition, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenMint }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json() as ApiError;
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        console.error('Failed to close position:', errorMessage);
        return false;
      }
      
      const data = await response.json();
      console.log('Close position response:', data);
      
      // Refresh the data after closing the position
      await rest.refresh();
      return true;
    } catch (error) {
      console.error('Error closing position:', error);
      return false;
    }
  };
  
  return {
    positions: data?.positions || [],
    closePosition,
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
