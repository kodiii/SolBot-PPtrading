import React from 'react'
import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonCard, SkeletonStats, SkeletonTable } from '../skeleton'

describe('Skeleton Components', () => {
  describe('Base Skeleton', () => {
    it('renders with default styling', () => {
      render(<Skeleton />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-primary/10')
    })

    it('merges custom className', () => {
      render(<Skeleton className="custom-class" />)
      const skeleton = screen.getByRole('status')
      expect(skeleton).toHaveClass('custom-class')
    })

    it('renders children content', () => {
      render(<Skeleton>Test Content</Skeleton>)
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('SkeletonCard', () => {
    it('renders single skeleton element', () => {
      render(<SkeletonCard />)
      const elements = screen.getAllByRole('status')
      expect(elements).toHaveLength(1)
      expect(elements[0]).toHaveClass('h-12', 'w-2/3')
    })
  })

  describe('SkeletonStats', () => {
    it('renders four stat items', () => {
      render(<SkeletonStats />)
      const elements = screen.getAllByRole('status')
      expect(elements).toHaveLength(8) // 2 skeletons per stat item
    })

    it('applies grid layout', () => {
      render(<SkeletonStats />)
      const grid = screen.getByTestId('stats-grid')
      expect(grid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4')
    })
  })

  describe('SkeletonTable', () => {
    it('renders with default row and column count', () => {
      render(<SkeletonTable />)
      const elements = screen.getAllByRole('status')
      // Default: 5 rows × 4 columns + 4 header cells = 24 cells
      expect(elements).toHaveLength(24)
    })

    it('respects custom row and column counts', () => {
      render(<SkeletonTable rowCount={3} columnCount={2} />)
      const elements = screen.getAllByRole('status')
      // 3 rows × 2 columns + 2 header cells = 8 cells
      expect(elements).toHaveLength(8)
    })

    it('applies responsive grid layout', () => {
      render(<SkeletonTable />)
      const rows = screen.getAllByTestId('table-row')
      expect(rows[0]).toHaveClass('grid-cols-1', 'md:grid-cols-4')
    })
  })
})
