'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { PositionsTable } from '@/components/dashboard/PositionsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDecimal } from '@/lib/utils'

export default function PositionsPage() {
  const { data, isLoading, error, refresh } = useDashboardData()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-destructive">Error: {error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    )
  }

  const totalPositionValue = data?.positions.reduce((acc, pos) => {
    const posValue = parseFloat(pos.position_size_sol) || 0
    return acc + posValue
  }, 0) || 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Active Positions</h1>
      
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Positions Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Positions</p>
              <p className="text-2xl font-semibold">{data?.positions.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-semibold">{formatDecimal(totalPositionValue.toString())} SOL</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <PositionsTable positions={data?.positions || []} isLoading={isLoading} />
    </div>
  )
}
