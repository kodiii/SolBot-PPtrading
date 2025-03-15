/**
 * API configuration
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  dashboard: `${API_BASE_URL}/api/dashboard`,
  positions: `${API_BASE_URL}/api/dashboard/positions`,
  trades: `${API_BASE_URL}/api/dashboard/trades`,
  stats: `${API_BASE_URL}/api/dashboard/stats`,
} as const;
