import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and merges Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a decimal number for display
 */
export function formatDecimal(value: string | number, decimals: number = 6): string {
  try {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  } catch {
    return "0";
  }
}

/**
 * Formats a timestamp to local date/time
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Formats percentage values
 */
export function formatPercent(value: number): string {
  return `${(value).toFixed(2)}%`;
}

/**
 * Formats currency values
 */
export function formatCurrency(value: number | string, decimals: number = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}