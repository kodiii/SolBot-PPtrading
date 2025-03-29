import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      data-testid="skeleton"
    />
  )
}

export function SkeletonStats(): React.ReactElement {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-6 w-[60px]" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard(): React.ReactElement {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-[250px]" />
      <Skeleton className="h-5 w-[200px]" />
    </div>
  )
}

export function SkeletonTable(): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex space-x-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-[100px]" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          {[...Array(5)].map((_, j) => (
            <Skeleton key={j} className="h-6 w-[100px]" />
          ))}
        </div>
      ))}
    </div>
  )
}
