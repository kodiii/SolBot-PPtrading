import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonStats, SkeletonCard, SkeletonTable } from '@/components/ui/skeleton'

describe('Skeleton Components', () => {
  describe('Base Skeleton', () => {
    it('renders with default classes', () => {
      render(<Skeleton />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted')
    })

    it('accepts additional classes', () => {
      render(<Skeleton className="w-10 h-10" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('w-10', 'h-10')
    })
  })

  describe('SkeletonStats', () => {
    it('renders multiple skeleton items in a grid', () => {
      render(<SkeletonStats />)
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBe(8) // 4 items with 2 skeletons each
    })
  })

  describe('SkeletonCard', () => {
    it('renders two skeleton lines', () => {
      render(<SkeletonCard />)
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBe(2)
    })
  })

  describe('SkeletonTable', () => {
    it('renders header and rows of skeleton items', () => {
      render(<SkeletonTable />)
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBe(30) // 5 header + (5 rows * 5 columns)
    })
  })
})
