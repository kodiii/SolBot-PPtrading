"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { subHours } from "date-fns"

interface DateRangeOption {
  label: string
  value: number // hours
  description: string
}

const DATE_RANGES: DateRangeOption[] = [
  { label: "1H", value: 1, description: "Last hour" },
  { label: "4H", value: 4, description: "Last 4 hours" },
  { label: "12H", value: 12, description: "Last 12 hours" },
  { label: "1D", value: 24, description: "Last 24 hours" },
  { label: "3D", value: 72, description: "Last 3 days" },
  { label: "7D", value: 168, description: "Last 7 days" },
]

interface DateRangeSelectorProps {
  onRangeChange: (startTime: number) => void
  selectedRange?: number
}

/**
 * Date range selector component for filtering chart data
 */
export function DateRangeSelector({
  onRangeChange,
  selectedRange = 24
}: DateRangeSelectorProps) {
  const handleRangeSelect = React.useCallback((hours: number) => {
    const now = new Date()
    const startTime = subHours(now, hours).getTime()
    onRangeChange(startTime)
  }, [onRangeChange])

  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-2">
        {DATE_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={selectedRange === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleRangeSelect(range.value)}
            title={range.description}
          >
            {range.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Hook for managing date range state
 */
export function useDateRange(initialRange = 24) {
  const [range, setRange] = React.useState(initialRange)
  const [startTime, setStartTime] = React.useState(() => {
    const now = new Date()
    return subHours(now, initialRange).getTime()
  })

  const handleRangeChange = React.useCallback((hours: number) => {
    setRange(hours)
    const now = new Date()
    setStartTime(subHours(now, hours).getTime())
  }, [])

  return {
    range,
    startTime,
    onRangeChange: handleRangeChange
  }
}

/**
 * Filter data by date range
 */
export function filterByDateRange<T extends { timestamp: number }>(
  data: T[],
  startTime: number
): T[] {
  return data.filter(item => item.timestamp >= startTime)
}
