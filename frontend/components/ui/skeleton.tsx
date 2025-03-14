import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Base skeleton component props
 */
interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Base skeleton component for loading states
 */
export function Skeleton({ className, children }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-primary/10', className)}
      role="status"
      aria-label="Loading..."
    >
      {children}
    </div>
  )
}

/**
 * Skeleton for card content
 */
export function SkeletonCard(): React.ReactElement {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-2/3" />
    </div>
  )
}

/**
 * Skeleton for statistics grid
 */
export function SkeletonStats(): React.ReactElement {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-grid">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

/**
 * Props for table skeleton
 */
interface SkeletonTableProps {
  rowCount?: number
  columnCount?: number
}

/**
 * Skeleton for data tables
 */
export function SkeletonTable({
  rowCount = 5,
  columnCount = 4,
}: SkeletonTableProps): React.ReactElement {
  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b">
        {[...Array(columnCount)].map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6 w-24" />
        ))}
      </div>

      {/* Rows */}
      {[...Array(rowCount)].map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b"
          data-testid="table-row"
        >
          {[...Array(columnCount)].map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-6 w-full max-w-[200px]"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
