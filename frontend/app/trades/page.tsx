'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { TradesTable } from '@/components/dashboard/TradesTable'

export default function TradesPage() {
  const { data, isLoading, error, refresh } = useDashboardData()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-destructive">Error: {error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Trading History</h1>
      <TradesTable trades={data?.trades || []} isLoading={isLoading} />
    </div>
  )
}
