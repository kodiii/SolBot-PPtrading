import "@/styles/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/Header"
import { MobileNav } from "@/components/navigation/MainNav"
import { SettingsProvider } from "@/contexts/settings"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Paper Trading Dashboard",
  description: "Track and monitor your paper trading performance in real-time",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps): React.ReactNode {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <SettingsProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <div className="relative flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 container mx-auto py-6">
              {children}
            </main>
            <MobileNav />
          </div>
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
