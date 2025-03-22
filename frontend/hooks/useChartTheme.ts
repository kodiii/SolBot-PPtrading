'use client'

import React from 'react'
import { Chart as ChartJS } from 'chart.js'

export function useChartTheme() {
  // Get theme colors using CSS variables for HSL values
  const getThemeColor = React.useCallback((index: number): string => {
    const root = document.documentElement
    const hslValues = getComputedStyle(root).getPropertyValue(`--chart-${index + 1}`).trim()
    const [h, s, l] = hslValues.split(' ')
    return `hsl(${h} ${s} ${l})`
  }, [])

  // Get theme color with opacity using CSS variables for HSL values
  const getThemeColorWithOpacity = React.useCallback((index: number, opacity: number): string => {
    const root = document.documentElement
    const hslValues = getComputedStyle(root).getPropertyValue(`--chart-${index + 1}`).trim()
    const [h, s, l] = hslValues.split(' ')
    return `hsl(${h} ${s} ${l} / ${opacity})`
  }, [])

  // Update chart colors when theme changes
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      // Get all canvas elements and update their charts
      document.querySelectorAll('canvas').forEach((canvas) => {
        const chart = ChartJS.getChart(canvas)
        if (chart) {
          chart.update()
        }
      })
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  return {
    getThemeColor,
    getThemeColorWithOpacity,
  }
}
