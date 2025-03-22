'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'
import { SettingsContext } from '@/contexts/settings'

// Define available themes
export const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'bluish-purple-cricket', label: 'Bluish Purple' },
  { value: 'exquisite-turquoise-giraffe', label: 'Turquoise' }
]

export default function ThemeProvider({ children, ...props }: ThemeProviderProps): React.JSX.Element {
  const context = React.useContext(SettingsContext)
  if (!context) {
    throw new Error("ThemeProvider must be used within a SettingsProvider")
  }
  const { settings } = context

  // Track mounted state to avoid hydration mismatches
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Apply theme and color mode
  React.useEffect(() => {
    if (!mounted || !settings?.appearance) return

    // Get saved color mode from localStorage
    const savedColorMode = localStorage.getItem('theme-mode') || 'system'
    const root = document.documentElement
    
    // First remove all theme classes
    root.classList.remove('dark', 'light', 'bluish-purple-cricket', 'exquisite-turquoise-giraffe')
    
    // Apply the appearance theme from settings
    root.classList.add(settings.appearance.theme)
    
    // Apply the color mode (dark/light)
    if (savedColorMode === 'dark') {
      root.classList.add('dark')
    } else if (savedColorMode === 'light') {
      root.classList.add('light')
    }
    
    // Listen for color mode changes from ModeToggle
    const handleStorage = (): void => {
      const newColorMode = localStorage.getItem('theme-mode')
      if (newColorMode === 'dark') {
        root.classList.remove('light')
        root.classList.add('dark')
      } else if (newColorMode === 'light') {
        root.classList.remove('dark')
        root.classList.add('light')
      }
    }
    
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [mounted, settings])
  
  // During hydration, render an empty div to prevent layout shift
  if (!mounted) {
    return (
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        forcedTheme={undefined}
        storageKey="theme-mode"
        {...props}
      >
        {children}
      </NextThemesProvider>
    )
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      forcedTheme={undefined}
      storageKey="theme-mode"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
