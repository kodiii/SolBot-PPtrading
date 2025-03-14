"use client"

import * as React from "react"
import { monitoring } from "@/lib/monitoring"

interface SettingsState {
  autoRefresh: boolean
  refreshInterval: number
  monitoring: boolean
  darkMode: boolean
}

interface SettingsContextType extends SettingsState {
  setAutoRefresh: (enabled: boolean) => void
  setRefreshInterval: (interval: number) => void
  setMonitoring: (enabled: boolean) => void
  setDarkMode: (enabled: boolean) => void
}

const defaultSettings: SettingsState = {
  autoRefresh: true,
  refreshInterval: 2000,
  monitoring: true,
  darkMode: false,
}

const SettingsContext = React.createContext<SettingsContextType | null>(null)

/**
 * Hook for accessing settings
 */
export function useSettings() {
  const context = React.useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

/**
 * Settings provider component
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Load saved settings or use defaults
  const [settings, setSettings] = React.useState<SettingsState>(() => {
    if (typeof window === "undefined") return defaultSettings

    const saved = localStorage.getItem("settings")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (error) {
        console.error("Failed to parse saved settings:", error)
      }
    }
    return defaultSettings
  })

  // Save settings changes
  const saveSettings = React.useCallback((newSettings: SettingsState) => {
    setSettings(newSettings)
    localStorage.setItem("settings", JSON.stringify(newSettings))
  }, [])

  // Setting updaters
  const setAutoRefresh = React.useCallback((enabled: boolean) => {
    saveSettings({ ...settings, autoRefresh: enabled })
  }, [settings, saveSettings])

  const setRefreshInterval = React.useCallback((interval: number) => {
    saveSettings({ ...settings, refreshInterval: interval })
  }, [settings, saveSettings])

  const setMonitoring = React.useCallback((enabled: boolean) => {
    monitoring.setEnabled(enabled)
    saveSettings({ ...settings, monitoring: enabled })
  }, [settings, saveSettings])

  const setDarkMode = React.useCallback((enabled: boolean) => {
    saveSettings({ ...settings, darkMode: enabled })
    document.documentElement.classList.toggle("dark", enabled)
  }, [settings, saveSettings])

  // Initialize monitoring
  React.useEffect(() => {
    monitoring.setEnabled(settings.monitoring)
  }, [settings.monitoring])

  const value = React.useMemo(
    () => ({
      ...settings,
      setAutoRefresh,
      setRefreshInterval,
      setMonitoring,
      setDarkMode,
    }),
    [settings, setAutoRefresh, setRefreshInterval, setMonitoring, setDarkMode]
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}