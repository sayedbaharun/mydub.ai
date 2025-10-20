import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AIDisclosureBadge } from './AIDisclosureBadge'

describe('AIDisclosureBadge', () => {
  const defaultProps = {
    sourcesAnalyzed: 47,
    confidenceScore: 94,
    humanReviewed: true,
    generatedAt: new Date('2026-01-15T10:00:00Z'),
  }

  describe('Compact variant', () => {
    it('renders compact badge with AI-Generated label', () => {
      render(<AIDisclosureBadge {...defaultProps} variant="compact" />)
      expect(screen.getByText('AI-Generated')).toBeInTheDocument()
    })

    it('shows checkmark when human reviewed', () => {
      const { container } = render(<AIDisclosureBadge {...defaultProps} variant="compact" />)
      const checkIcon = container.querySelector('[data-lucide="check-circle-2"]')
      expect(checkIcon).toBeInTheDocument()
    })

    it('does not show checkmark when not human reviewed', () => {
      const { container } = render(
        <AIDisclosureBadge {...defaultProps} humanReviewed={false} variant="compact" />
      )
      const checkIcon = container.querySelector('[data-lucide="check-circle-2"]')
      expect(checkIcon).not.toBeInTheDocument()
    })
  })

  describe('Expanded variant', () => {
    it('renders all metadata fields', () => {
      render(<AIDisclosureBadge {...defaultProps} variant="expanded" />)

      expect(screen.getByText('AI-Generated Content')).toBeInTheDocument()
      expect(screen.getByText('47 sources')).toBeInTheDocument()
      expect(screen.getByText(/94%/)).toBeInTheDocument()
      expect(screen.getByText('Verified ✓')).toBeInTheDocument()
    })

    it('shows pending status when not human reviewed', () => {
      render(
        <AIDisclosureBadge {...defaultProps} humanReviewed={false} variant="expanded" />
      )

      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('displays correct confidence level labels', () => {
      const { rerender } = render(
        <AIDisclosureBadge {...defaultProps} confidenceScore={95} variant="expanded" />
      )
      expect(screen.getByText(/Very High/)).toBeInTheDocument()

      rerender(<AIDisclosureBadge {...defaultProps} confidenceScore={85} variant="expanded" />)
      expect(screen.getByText(/High/)).toBeInTheDocument()

      rerender(<AIDisclosureBadge {...defaultProps} confidenceScore={75} variant="expanded" />)
      expect(screen.getByText(/Medium/)).toBeInTheDocument()

      rerender(<AIDisclosureBadge {...defaultProps} confidenceScore={65} variant="expanded" />)
      expect(screen.getByText(/Low/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for compact variant', () => {
      render(<AIDisclosureBadge {...defaultProps} variant="compact" />)
      const badge = screen.getByText('AI-Generated').closest('div')
      expect(badge).toHaveClass('cursor-help')
    })

    it('displays readable text in expanded variant', () => {
      render(<AIDisclosureBadge {...defaultProps} variant="expanded" />)
      expect(
        screen.getByText(/Created using artificial intelligence/)
      ).toBeInTheDocument()
    })
  })
})
