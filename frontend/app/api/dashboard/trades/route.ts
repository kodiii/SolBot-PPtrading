import { NextResponse } from 'next/server';
import { BACKEND_API_ENDPOINTS } from '@/lib/api-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET handler for trades data
 */
export async function GET(request: Request) {
  try {
    // Get the limit parameter from the query string
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    
    // Construct the backend URL with the limit parameter
    let backendUrl = BACKEND_API_ENDPOINTS.trades;
    if (limit) {
      backendUrl += `?limit=${limit}`;
    }
    
    console.log('Proxying trades request to backend:', backendUrl);
    
    // Forward the request to the backend
    const response = await fetch(backendUrl, {
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
      throw new Error(`Failed to fetch trades data: ${response.status} ${response.statusText}`);
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
    console.error('Error fetching trades data:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to fetch trades data from backend'
      },
      { status: 500 }
    );
  }
}
