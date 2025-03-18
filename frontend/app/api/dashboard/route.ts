import { NextResponse } from 'next/server';
import { BACKEND_API_ENDPOINTS } from '@/lib/api-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET handler for dashboard data
 */
export async function GET() {
  try {
    console.log('Proxying dashboard request to backend:', BACKEND_API_ENDPOINTS.dashboard);
    
    // Forward the request to the backend
    const response = await fetch(BACKEND_API_ENDPOINTS.dashboard, {
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
      throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
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
    console.error('Error fetching dashboard data:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to fetch dashboard data from backend'
      },
      { status: 500 }
    );
  }
}
