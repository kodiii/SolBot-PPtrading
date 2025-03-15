'use client'

export * from './ModeToggle'
import dynamic from 'next/dynamic'

const DynamicThemeProvider = dynamic(() => import('./theme-provider'), {
  ssr: false,
})

export const ThemeProvider = DynamicThemeProvider
