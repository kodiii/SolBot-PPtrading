"use client"

import * as React from "react"
import { ErrorDisplay } from "@/components/ui/error-display"
import { ApiError } from "@/lib/api-error"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  error: Error | ApiError | null
}

/**
 * Error boundary component to catch and handle runtime errors
 * Uses ErrorDisplay by default but can accept custom fallback
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error("Frontend error:", {
      error,
      componentStack: errorInfo.componentStack
    })
  }

  handleReset() {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    const { children, fallback: Fallback } = this.props

    if (error) {
      if (Fallback) {
        return <Fallback error={error} reset={this.handleReset} />
      }

      return (
        <ErrorDisplay
          error={error}
          reset={this.handleReset}
          fullPage
          showDetails={process.env.NODE_ENV === "development"}
        />
      )
    }

    return children
  }
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  ErrorComponent?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={ErrorComponent}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Create an async error boundary for handling promise rejections
 */
export function AsyncBoundary({
  children,
  fallback,
  loading
}: {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  loading?: React.ReactNode
}) {
  return (
    <React.Suspense fallback={loading || null}>
      <ErrorBoundary fallback={fallback}>
        {children}
      </ErrorBoundary>
    </React.Suspense>
  )
}