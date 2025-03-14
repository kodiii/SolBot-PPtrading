import { redirect } from "next/navigation"

/**
 * Root page component
 * Automatically redirects to the dashboard
 */
export default function HomePage(): never {
  redirect("/dashboard")
}

/**
 * Static metadata for SEO
 */
import type { Metadata } from "next"

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "Paper Trading Dashboard",
  description: "Track and monitor your paper trading performance in real-time",
}
