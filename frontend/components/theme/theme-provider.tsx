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
  // Apply theme-specific class to root element
  React.useEffect(() => {
    const handleThemeChange = () => {
      // Get theme and color mode from localStorage
      const theme = localStorage.getItem('theme') || 'system'
      const colorMode = localStorage.getItem('theme-mode') || 'system'
      
      // Remove all theme classes
      document.documentElement.classList.remove(
        'cyberpunk',
        'bluish-purple-cricket',
        'exquisite-turquoise-giraffe'
      )
      
      // Add the appropriate theme class
      if (theme === 'bluish-purple-cricket') {
        document.documentElement.classList.add('bluish-purple-cricket')
      } else if (theme === 'exquisite-turquoise-giraffe') {
        document.documentElement.classList.add('exquisite-turquoise-giraffe')
      }
      
      // Apply color mode if it's explicitly set
      if (colorMode !== 'system') {
        // Remove existing color mode classes
        document.documentElement.classList.remove('light', 'dark')
        
        // Add the selected color mode
        document.documentElement.classList.add(colorMode)
      }
    }
    
    // Initial setup
    handleThemeChange()
    
    // Listen for theme changes
    window.addEventListener('storage', handleThemeChange)
    
    // Check for settings changes every second
    const intervalId = setInterval(() => {
      // Fetch settings from API
      fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
          if (data.appearance) {
            const { theme, colorMode } = data.appearance
            
            // Update localStorage if different
            if (theme && localStorage.getItem('theme') !== theme) {
              localStorage.setItem('theme', theme)
              handleThemeChange()
            }
            
            if (colorMode && localStorage.getItem('theme-mode') !== colorMode) {
              localStorage.setItem('theme-mode', colorMode)
              handleThemeChange()
            }
          }
        })
        .catch(err => console.error('Error fetching settings:', err))
    }, 5000) // Check every 5 seconds
    
    return () => {
      window.removeEventListener('storage', handleThemeChange)
      clearInterval(intervalId)
    }
  }, [])
  
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      forcedTheme={undefined}
      storageKey="theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
