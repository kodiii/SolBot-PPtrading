"use client"

import * as React from 'react';
import { DashboardData, ApiError, Position } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/api-config';
import { useSettings } from '@/contexts/settings';

/**
 * Simple fetcher function with error handling
 */
const fetchDashboardData = async (signal?: AbortSignal): Promise<DashboardData> => {
  // Add cache busting parameter
  const url = `${API_ENDPOINTS.dashboard}${API_ENDPOINTS.dashboard.includes('?') ? '&' : '?'}_=${Date.now()}`;
  
  const res = await fetch(url, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    cache: 'no-store',
    signal
  });
  
  if (!res.ok) {
    const errorData = await res.json() as ApiError;
    throw new Error(errorData.details || errorData.error || 'Failed to fetch data');
  }

  return res.json();
};

/**
 * Hook for fetching and managing dashboard data
 * Simplified version without SWR to prevent infinite loops
 */
export function useDashboardData() {
  const { settings } = useSettings();
  const [data, setData] = React.useState<DashboardData | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  
  // Store the refresh interval in a ref to prevent it from causing re-renders
  const refreshIntervalRef = React.useRef<number>(settings.paperTrading.dashboardRefresh);
  
  // Update the ref when settings change
  React.useEffect(() => {
    refreshIntervalRef.current = settings.paperTrading.dashboardRefresh;
  }, [settings.paperTrading.dashboardRefresh]);
  
  // Create a ref to track if the component is mounted
  const isMountedRef = React.useRef<boolean>(true);
  
  // Create a ref to store the AbortController
  const abortControllerRef = React.useRef<AbortController | null>(null);
  
  // Function to fetch data
  const fetchData = React.useCallback(async (isRefresh = false) => {
    // Don't fetch if the component is unmounted
    if (!isMountedRef.current) {
      return;
    }
    
    // Abort any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(undefined);
      
      const result = await fetchDashboardData(abortControllerRef.current.signal);
      
      // Only update state if the component is still mounted
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      // Only update error state if the component is still mounted and it's not an abort error
      if (isMountedRef.current && err instanceof Error && err.name !== 'AbortError') {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      }
    } finally {
      // Only update loading state if the component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);
  
  // Function to manually refresh data
  const refresh = React.useCallback(async () => {
    await fetchData(true);
    return data;
  }, [fetchData, data]);
  
  // Fetch data on mount and set up refresh interval
  React.useEffect(() => {
    // Set mounted flag to true
    isMountedRef.current = true;
    
    // Initial fetch
    fetchData();
    
    // Set up refresh interval using the dashboardRefresh setting from the settings context
    // This ensures that the refresh interval is consistent with the user's settings
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        fetchData(true);
      }
    }, refreshIntervalRef.current);
    
    // Cleanup on unmount
    return () => {
      // Set mounted flag to false to prevent state updates after unmount
      isMountedRef.current = false;
      
      // Clear interval
      clearInterval(intervalId);
      
      // Abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchData]);
  
  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}

/**
 * Hook for trading position data only
 */
export function usePositions() {
  const { data, isLoading, isRefreshing, error, refresh } = useDashboardData();
  
  // Create a ref to track if the component is mounted
  const isMountedRef = React.useRef<boolean>(true);
  
  // Create a ref to store the AbortController
  const positionAbortControllerRef = React.useRef<AbortController | null>(null);
  
  // Set mounted flag to true on mount and false on unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Abort any in-flight requests
      if (positionAbortControllerRef.current) {
        positionAbortControllerRef.current.abort();
        positionAbortControllerRef.current = null;
      }
    };
  }, []);
  
  const closePosition = async (tokenMint: string): Promise<boolean> => {
    // Don't close position if the component is unmounted
    if (!isMountedRef.current) {
      return false;
    }
    
    // Abort any previous requests
    if (positionAbortControllerRef.current) {
      positionAbortControllerRef.current.abort();
    }
    
    // Create a new AbortController
    positionAbortControllerRef.current = new AbortController();
    const signal = positionAbortControllerRef.current.signal;
    
    try {
      console.log('Closing position for token:', tokenMint);
      
      const response = await fetch(API_ENDPOINTS.closePosition, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({ tokenMint }),
        signal, // Pass the abort signal to the fetch request
      });
      
      // Check if the request was aborted
      if (signal.aborted) {
        return false;
      }
      
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
      
      // Check again if the component is still mounted
      if (!isMountedRef.current) {
        return false;
      }
      
      // Refresh the data after closing the position
      await refresh();
      return true;
    } catch (error) {
      // Only log non-abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error closing position:', error);
      }
      return false;
    } finally {
      // Clean up the controller
      if (positionAbortControllerRef.current) {
        positionAbortControllerRef.current.abort();
        positionAbortControllerRef.current = null;
      }
    }
  };
  
  return {
    positions: data?.positions || [],
    isLoading,
    isRefreshing,
    error,
    refresh,
    closePosition,
  };
}

/**
 * Hook for trading stats only
 */
export function useStats() {
  const { data, isLoading, isRefreshing, error, refresh } = useDashboardData();
  
  return {
    stats: data?.stats,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Hook for fetching candle data for all positions
 */
export function useCandleData(positions: Position[], interval: string = '5m') {
  const [data, setData] = React.useState<Map<string, CandleData[]>>(new Map());
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const fetchAllCandles = React.useCallback(async () => {
    if (!positions.length) return;

    try {
      setIsLoading(true);
      setError(undefined);

      const promises = positions.map(position => 
        fetch(`${API_ENDPOINTS.candles}?tokenMint=${position.token_mint}&interval=${interval}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }).then(res => res.json())
      );

      const results = await Promise.all(promises);
      
      const newData = new Map();
      positions.forEach((position, index) => {
        newData.set(position.token_mint, results[index]);
      });

      setData(newData);
    } catch (err) {
      console.error('Error fetching candle data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch candle data');
    } finally {
      setIsLoading(false);
    }
  }, [positions, interval]);

  // Fetch data on mount and when positions or interval change
  React.useEffect(() => {
    fetchAllCandles();
  }, [fetchAllCandles]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchAllCandles
  };
}
