import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme'
import { ErrorBoundary } from '@/components/layout'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ThemeProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
