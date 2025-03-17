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

  // Get the response text and fix the malformed JSON by adding missing commas
  const text = await res.text();
  const fixedJson = text
    .replace(/"([^"]+)":/g, '"$1":') // Fix property names
    .replace(/}([^,{}\[\]])"([^"]+)":/g, '},"$2":') // Add commas between objects
    .replace(/]([^,{}\[\]])"([^"]+)":/g, '],"$2":') // Add commas after arrays
    .replace(/"([^"]+)"([^:,{}\[\]])"([^"]+)":/g, '"$1","$3":') // Add commas between properties
    .replace(/"([^"]+)":([^,{}\[\]])"([^"]+)":/g, '"$1":$2,"$3":'); // Add commas after values

  try {
    const data = JSON.parse(fixedJson);
    return data as DashboardData;
  } catch (error) {
    console.error('Error parsing JSON:', error, 'Original text:', text, 'Fixed JSON:', fixedJson);
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
  closePosition: (tokenMint: string) => Promise<boolean>;
} {
  const { data, ...rest } = useDashboardData();
  
  const closePosition = async (tokenMint: string): Promise<boolean> => {
    try {
      const response = await fetch(API_ENDPOINTS.closePosition, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenMint }),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        console.error('Failed to close position:', errorData.error || errorData.details);
        return false;
      }
      
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
