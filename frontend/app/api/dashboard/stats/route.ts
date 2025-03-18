import { NextResponse } from 'next/server';
import { BACKEND_API_ENDPOINTS } from '@/lib/api-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET handler for stats data
 */
export async function GET() {
  try {
    console.log('Proxying stats request to backend:', BACKEND_API_ENDPOINTS.stats);
    
    // Forward the request to the backend
    const response = await fetch(BACKEND_API_ENDPOINTS.stats, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stats data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching stats data:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to fetch stats data from backend'
      },
      { status: 500 }
    );
  }
}
