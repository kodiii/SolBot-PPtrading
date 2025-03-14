"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAutoRefresh, useMonitoring, useThemeSettings } from "@/hooks/useAppSettings"
import { withErrorBoundary } from "@/components/layout/ErrorBoundary"
import { monitoring } from "@/lib/monitoring"

const REFRESH_INTERVALS = [
  { value: "1000", label: "1 second" },
  { value: "2000", label: "2 seconds" },
  { value: "5000", label: "5 seconds" },
  { value: "10000", label: "10 seconds" },
] as const

/**
 * Settings page component
 */
function SettingsPage(): React.ReactElement {
  const { enabled: autoRefresh, interval, setEnabled: setAutoRefresh, setInterval } = useAutoRefresh()
  const { enabled: monitoringEnabled, setEnabled: setMonitoring } = useMonitoring()
  const { isDark, toggleTheme } = useThemeSettings()

  const handleIntervalChange = React.useCallback((value: string) => {
    setInterval(parseInt(value, 10))
  }, [setInterval])

  // Track settings changes
  React.useEffect(() => {
    monitoring.trackPerformance("settings_update", 0, {
      autoRefresh,
      interval,
      monitoringEnabled,
      isDark,
    })
  }, [autoRefresh, interval, monitoringEnabled, isDark])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="grid gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">Dark Mode</Label>
              <Switch
                id="theme"
                checked={isDark}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Refresh */}
        <Card>
          <CardHeader>
            <CardTitle>Data Updates</CardTitle>
            <CardDescription>
              Configure how often data is refreshed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="refresh-interval">Refresh Interval</Label>
              <Select
                value={interval.toString()}
                onValueChange={handleIntervalChange}
                disabled={!autoRefresh}
              >
                <SelectTrigger id="refresh-interval" className="w-40">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {REFRESH_INTERVALS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader>
            <CardTitle>System</CardTitle>
            <CardDescription>
              System-level settings and monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="monitoring">Error Monitoring</Label>
              <Switch
                id="monitoring"
                checked={monitoringEnabled}
                onCheckedChange={setMonitoring}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default withErrorBoundary(SettingsPage)
