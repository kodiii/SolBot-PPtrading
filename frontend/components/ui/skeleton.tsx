import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  )
}

export function SkeletonButton({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-9 w-24", className)}
      {...props}
    />
  )
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-40 w-full", className)}
      {...props}
    />
  )
}

export function SkeletonText({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-4 w-full", className)}
      {...props}
    />
  )
}

export function SkeletonCircle({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("h-8 w-8 rounded-full", className)}
      {...props}
    />
  )
}

export function SkeletonStats() {
  return (
    <div className="space-y-3">
      <SkeletonText className="h-6 w-1/3" />
      <div className="grid gap-2 grid-cols-3">
        <SkeletonText className="h-10" />
        <SkeletonText className="h-10" />
        <SkeletonText className="h-10" />
      </div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <SkeletonText className="h-8 w-[250px]" />
        <SkeletonButton />
      </div>
      <div className="border rounded-lg p-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <SkeletonText className="h-4 w-[200px]" />
              <SkeletonText className="h-4 w-[100px]" />
              <SkeletonText className="h-4 w-[100px]" />
              <SkeletonText className="h-4 w-[100px]" />
              <SkeletonText className="h-4 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}