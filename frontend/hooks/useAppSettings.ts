"use client"

import * as React from "react"
import { useSettings } from "@/contexts/settings"

interface UseDataPollingOptions<T> {
  onError?: (error: unknown) => void;
  enabled?: boolean;
  transform?: (data: T) => T;
  initialData?: T;
}

interface UseDataPollingResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing auto-refresh settings
 */
export function useAutoRefresh() {
  const { autoRefresh, refreshInterval, setAutoRefresh, setRefreshInterval } = useSettings()

  return {
    enabled: autoRefresh,
    interval: refreshInterval,
    setEnabled: setAutoRefresh,
    setInterval: setRefreshInterval,
  }
}

/**
 * Hook for managing monitoring settings
 */
export function useMonitoring() {
  const { monitoring, setMonitoring } = useSettings()

  return {
    enabled: monitoring,
    setEnabled: setMonitoring,
  }
}

/**
 * Hook for managing theme settings
 */
export function useThemeSettings() {
  const { darkMode, setDarkMode } = useSettings()

  return {
    isDark: darkMode,
    setDarkMode,
    toggleTheme: () => setDarkMode(!darkMode),
  }
}

/**
 * Hook for polling data based on settings
 */
export function useDataPolling<T>(
  fetchFn: () => Promise<T>,
  options?: UseDataPollingOptions<T>
): UseDataPollingResult<T> {
  const { autoRefresh, refreshInterval } = useSettings()
  const [data, setData] = React.useState<T | null>(options?.initialData ?? null)
  const [error, setError] = React.useState<Error | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const fetch = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await fetchFn()
      const transformedData = options?.transform ? options.transform(result) : result
      setData(transformedData)
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options?.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn, options])

  React.useEffect(() => {
    const shouldPoll = autoRefresh && (options?.enabled ?? true)
    if (!shouldPoll) return

    fetch() // Initial fetch
    const interval = setInterval(fetch, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetch, options?.enabled])

  return {
    data,
    error,
    isLoading,
    refetch: fetch,
  }
}

/**
 * Hook for managing settings persistence
 */
export function useSettingsPersistence<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error)
    }
  }, [key, value])

  return [value, setValue]
}