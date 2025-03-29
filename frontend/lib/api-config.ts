/**
 * API configuration
 */

// Backend API URL for server-side requests
export const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// Frontend API endpoints for client-side requests
export const API_ENDPOINTS = {
  dashboard: '/api/dashboard',
  positions: '/api/dashboard/positions',
  closePosition: '/api/dashboard/positions/close',
  trades: '/api/dashboard/trades',
  stats: '/api/dashboard/stats',
  settings: '/api/settings',
  candles: '/api/dashboard/candles',
} as const;

// Backend API endpoints for server-side requests
export const BACKEND_API_ENDPOINTS = {
  dashboard: `${BACKEND_API_URL}/api/dashboard`,
  positions: `${BACKEND_API_URL}/api/dashboard/positions`,
  closePosition: `${BACKEND_API_URL}/api/dashboard/positions/close`,
  trades: `${BACKEND_API_URL}/api/dashboard/trades`,
  stats: `${BACKEND_API_URL}/api/dashboard/stats`,
  settings: `${BACKEND_API_URL}/api/settings`,
  candles: `${BACKEND_API_URL}/api/dashboard/candles`,
} as const;
