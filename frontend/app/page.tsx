import { redirect } from "next/navigation"

/**
 * Root page component
 * Automatically redirects to the dashboard
 */
export default function HomePage() {
  redirect("/dashboard")
}

/**
 * Static metadata for SEO
 */
export const metadata = {
  title: "Paper Trading Dashboard",
  description: "Track and monitor your paper trading performance in real-time",
}