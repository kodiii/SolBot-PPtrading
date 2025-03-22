import '@/styles/globals.css'
import '@/styles/Bluish_Purple_Cricket.css'
import '@/styles/Exquisite_Turquoise_Giraffe.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme'
import { ErrorBoundary } from '@/components/layout'
import { SettingsProvider } from '@/contexts/settings'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Paper Trading Dashboard',
  description: 'A paper trading dashboard for simulating trades',
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <SettingsProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
