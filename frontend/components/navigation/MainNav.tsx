"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigationLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trades", label: "Trades" },
  { href: "/positions", label: "Positions" },
  { href: "/settings", label: "Settings" },
]

/**
 * Main navigation component
 * Handles active state and responsive design
 */
export function MainNav(): React.ReactElement {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navigationLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === link.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

/**
 * Mobile navigation component
 * Only shows on smaller screens
 */
export function MobileNav(): React.ReactElement {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navigationLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center space-y-1 p-2",
              pathname === link.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <span className="text-xs">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
