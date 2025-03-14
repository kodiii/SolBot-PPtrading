"use client"

import * as React from "react"
import { ApiError, getErrorMessage } from "@/lib/api-error"
import { AlertCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ErrorDisplayProps {
  error: Error | ApiError | unknown;
  reset?: () => void;
  fullPage?: boolean;
  title?: string;
  showDetails?: boolean;
}

/**
 * Error display component
 * Handles different types of errors with consistent styling
 */
export function ErrorDisplay({
  error,
  reset,
  fullPage = false,
  title = "An error occurred",
  showDetails = false,
}: ErrorDisplayProps) {
  const message = getErrorMessage(error)
  const isApiError = error instanceof ApiError
  
  // For full page errors
  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <CardTitle>{title}</CardTitle>
            </div>
            {isApiError && (
              <CardDescription>
                Error {(error as ApiError).status}: {(error as ApiError).code}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{message}</p>
            {showDetails && error instanceof Error && (
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </CardContent>
          {reset && (
            <CardFooter>
              <Button onClick={reset}>Try Again</Button>
            </CardFooter>
          )}
        </Card>
      </div>
    )
  }

  // For inline errors
  return (
    <div className="rounded-lg border-destructive border p-4 space-y-2">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <p className="font-medium text-destructive">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {showDetails && error instanceof Error && (
        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
          {error.stack}
        </pre>
      )}
      {reset && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={reset}
          className="mt-2"
        >
          Try Again
        </Button>
      )}
    </div>
  )
}

/**
 * HOC to add error handling to components
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  ErrorComponent: React.ComponentType<ErrorDisplayProps> = ErrorDisplay
) {
  return function WithErrorHandling({
    error,
    ...props
  }: P & { error?: unknown }) {
    if (error) {
      return <ErrorComponent error={error} />
    }

    return <Component {...(props as P)} />
  }
}