"use client"

import * as React from "react"
import { MainNav } from "@/components/navigation/MainNav"
import { ModeToggle } from "@/components/theme/ModeToggle"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

/**
 * Application header component
 * Contains navigation and theme toggle
 */
export function Header(): React.ReactElement {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Button 
            variant="link" 
            className="font-bold text-xl"
            onClick={() => router.push("/dashboard")}
          >
            PaperTrader
          </Button>
        </div>
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
