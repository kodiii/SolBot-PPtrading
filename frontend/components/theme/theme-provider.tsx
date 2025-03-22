'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

// Define available themes
export const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'bluish-purple-cricket', label: 'Bluish Purple' },
  { value: 'exquisite-turquoise-giraffe', label: 'Turquoise' }
]

export default function ThemeProvider({ children, ...props }: ThemeProviderProps): React.JSX.Element {
  React.useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme-mode') || 'system'
    const root = document.documentElement
    
    // Apply the theme
    if (savedTheme === 'dark') {
      root.classList.add('dark')
    } else if (savedTheme === 'light') {
      root.classList.add('light')
    }
    
    // Listen for theme changes from ModeToggle
    const handleStorage = (): void => {
      const newTheme = localStorage.getItem('theme-mode')
      if (newTheme === 'dark') {
        root.classList.remove('light')
        root.classList.add('dark')
      } else if (newTheme === 'light') {
        root.classList.remove('dark')
        root.classList.add('light')
      }
    }
    
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])
  
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
