"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SkeletonCard } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

interface LoadingStateProps {
  title?: string
  fullPage?: boolean
}

/**
 * Loading state component
 * Can be used as a full page loader or within components
 */
export function LoadingState({ title, fullPage }: LoadingStateProps): React.ReactElement {
  if (fullPage) {
    return (
      <div className="h-[50vh] w-full flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          {title && (
            <p className="text-muted-foreground">{title}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Loading..."}</CardTitle>
      </CardHeader>
      <CardContent>
        <SkeletonCard />
      </CardContent>
    </Card>
  )
}

/**
 * HOC to add loading state to components
 */
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent: React.ComponentType = LoadingState
) {
  return function WithLoading({
    isLoading,
    ...props
  }: P & { isLoading: boolean }): React.ReactElement {
    if (isLoading) {
      return <LoadingComponent />
    }

    return <Component {...(props as P)} />
  }
}

/**
 * Loading overlay for async operations
 */
export function LoadingOverlay({ message }: { message?: string }): React.ReactElement {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          {message && (
            <p className="text-muted-foreground">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading button state
 */
export function LoadingSpinner({ 
  className, 
  size = "h-4 w-4" 
}: { 
  className?: string
  size?: string
}): React.ReactElement {
  return (
    <Loader2 
      className={`animate-spin ${size} ${className || ""}`}
    />
  )
}
