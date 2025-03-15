import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDecimal(value: string | number | null | undefined, decimals = 8): string {
  if (!value) return '0.00'
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  })
  
  return formatted
}

export function formatCurrency(value: string | number | null | undefined, options?: { decimals?: number, currency?: string }): string {
  const { decimals = 2, currency = 'USD' } = options || {}
  if (!value) return `$0.00`
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  const formatted = num.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  
  return formatted
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
