'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'

export function ModeToggle(): React.ReactElement {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" /> // Prevents layout shift
  }

  // Toggle between light and dark mode while preserving the current theme family
  const toggleColorMode = (): void => {
    // Get the current theme
    const currentTheme = theme || 'system'
    
    // Determine if we're in dark mode
    const isDark = resolvedTheme === 'dark'
    
    // If we're using a special theme (not just 'light' or 'dark')
    if (currentTheme !== 'light' && currentTheme !== 'dark' && currentTheme !== 'system') {
      // Toggle between light and dark mode in settings
      const newColorMode = isDark ? 'light' : 'dark'
      
      // Update the color mode in localStorage
      localStorage.setItem('theme-mode', newColorMode)
      
      // Trigger a storage event for the theme provider to pick up
      window.dispatchEvent(new Event('storage'))
    } else {
      // For standard themes, just toggle between light and dark
      setTheme(isDark ? 'light' : 'dark')
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9 rounded-lg"
      onClick={toggleColorMode}
    >
      <Sun className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.5rem] w-[1.5rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
