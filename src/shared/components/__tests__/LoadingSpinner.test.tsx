import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('renders with custom size', () => {
    const { container } = render(<LoadingSpinner size="lg" />)

    const spinner = container.querySelector('svg.h-8.w-8')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(<LoadingSpinner className="custom-class" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('custom-class')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<LoadingSpinner />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('renders all size variants correctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const

    sizes.forEach((size) => {
      const { container } = render(<LoadingSpinner size={size} />)
      const spinner = container.querySelector('[role="status"] svg')

      if (size === 'sm') {
        expect(spinner).toHaveClass('h-3', 'w-3')
      } else if (size === 'md') {
        expect(spinner).toHaveClass('h-4', 'w-4')
      } else {
        expect(spinner).toHaveClass('h-8', 'w-8')
      }
    })
  })
})
