import React from 'react'
import { render, screen } from '@testing-library/react'
import { BalanceChart } from '../BalanceChart'
import { format } from 'date-fns'

// Mock ResizeObserver
global.ResizeObserver = require('resize-observer-polyfill')

// Mock data
const mockBalanceData = [
  {
    balance_sol: '1.5',
    updated_at: 1671062400000, // 2022-12-15 00:00:00
  },
  {
    balance_sol: '2.0',
    updated_at: 1671066000000, // 2022-12-15 01:00:00
  },
]

describe('BalanceChart', () => {
  it('renders loading state correctly', () => {
    render(<BalanceChart data={[]} isLoading={true} />)
    
    expect(screen.getByText('Balance History')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders chart with data correctly', () => {
    render(<BalanceChart data={mockBalanceData} isLoading={false} />)
    
    expect(screen.getByText('Balance History')).toBeInTheDocument()
    
    // Verify time formatting
    const time1 = format(mockBalanceData[0].updated_at, 'HH:mm')
    const time2 = format(mockBalanceData[1].updated_at, 'HH:mm')
    expect(screen.getByText(time1)).toBeInTheDocument()
    expect(screen.getByText(time2)).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    render(<BalanceChart data={[]} isLoading={false} />)
    
    expect(screen.getByText('Balance History')).toBeInTheDocument()
    // Should still render the chart container
    expect(screen.getByRole('presentation')).toBeInTheDocument()
  })

  it('renders with proper aria attributes for accessibility', () => {
    render(<BalanceChart data={mockBalanceData} isLoading={false} />)
    
    // Chart container should have proper ARIA attributes
    const chart = screen.getByRole('presentation')
    expect(chart).toHaveAttribute('aria-busy', 'false')
  })

  it('formats balance values correctly', () => {
    render(<BalanceChart data={mockBalanceData} isLoading={false} />)
    
    // Check if the balance values are formatted
    const formattedValue1 = '1.50'
    const formattedValue2 = '2.00'
    expect(screen.getByText(formattedValue1)).toBeInTheDocument()
    expect(screen.getByText(formattedValue2)).toBeInTheDocument()
  })
})