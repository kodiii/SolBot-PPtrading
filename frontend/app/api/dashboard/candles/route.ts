import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { BACKEND_API_URL } from '@/lib/api-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tokenMint = searchParams.get('tokenMint')
  const interval = searchParams.get('interval') || '5m'

  if (!tokenMint) {
    return NextResponse.json({ error: 'Token mint is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/dashboard/candles?tokenMint=${tokenMint}&interval=${interval}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch candle data')
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching candle data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candle data' },
      { status: 500 }
    )
  }
}
