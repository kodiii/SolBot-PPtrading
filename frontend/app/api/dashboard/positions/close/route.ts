import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_ENDPOINTS } from '@/lib/api-config';

/**
 * POST handler for closing a position
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenMint } = body;
    
    if (!tokenMint) {
      return NextResponse.json(
        { error: 'Token mint address is required' },
        { status: 400 }
      );
    }
    
    console.log('Proxying close position request to backend:', BACKEND_API_ENDPOINTS.positions);
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_API_ENDPOINTS.positions}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenMint }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to close position: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error closing position:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to close position'
      },
      { status: 500 }
    );
  }
}
