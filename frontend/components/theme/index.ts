'use client'

export * from './ModeToggle'
import dynamic from 'next/dynamic'

// Import theme options
import { themeOptions as options } from './theme-provider'

// Export theme options
export const themeOptions = options

const DynamicThemeProvider = dynamic(() => import('./theme-provider'), {
  ssr: false,
})

export const ThemeProvider = DynamicThemeProvider
