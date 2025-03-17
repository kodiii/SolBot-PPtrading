import { NextResponse } from 'next/server';
import { BACKEND_API_ENDPOINTS } from '@/lib/api-config';

/**
 * POST handler for restarting the server
 */
export async function POST() {
  try {
    // Get the base URL from the BACKEND_API_ENDPOINTS
    const baseUrl = BACKEND_API_ENDPOINTS.dashboard.split('/api/dashboard')[0];
    const restartUrl = `${baseUrl}/api/restart`;
    
    console.log('Sending restart request to:', restartUrl);
    
    // Forward the request to the backend
    const response = await fetch(restartUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to restart server: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error restarting server:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
