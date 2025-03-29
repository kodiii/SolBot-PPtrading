'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'

export function ModeToggle(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" /> // Prevents layout shift
  }

  // Toggle between light and dark mode
  const toggleColorMode = (): void => {
    const isDark = resolvedTheme === 'dark'
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    
    // Also update in localStorage for our theme provider
    localStorage.setItem('theme-mode', newTheme)
    window.dispatchEvent(new Event('storage'))
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
