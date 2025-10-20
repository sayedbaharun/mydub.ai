import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IntelligenceCard } from './intelligence-card'
import userEvent from '@testing-library/user-event'

describe('IntelligenceCard', () => {
  const defaultProps = {
    title: 'Dubai Announces New AI Strategy',
    description: 'The emirate unveils comprehensive plan for 2026',
    image: 'https://example.com/image.jpg',
    category: 'Technology',
    date: '2 hours ago',
    author: 'Sarah Al Mazrouei',
    readTime: 5,
  }

  describe('Basic rendering', () => {
    it('renders title correctly', () => {
      render(<IntelligenceCard {...defaultProps} />)
      expect(screen.getByText('Dubai Announces New AI Strategy')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(<IntelligenceCard {...defaultProps} />)
      expect(
        screen.getByText('The emirate unveils comprehensive plan for 2026')
      ).toBeInTheDocument()
    })

    it('renders image with correct src and alt', () => {
      render(<IntelligenceCard {...defaultProps} />)
      const image = screen.getByAltText('Dubai Announces New AI Strategy')
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('renders category badge', () => {
      render(<IntelligenceCard {...defaultProps} />)
      expect(screen.getByText('Technology')).toBeInTheDocument()
    })

    it('renders without image', () => {
      const props = { ...defaultProps, image: undefined }
      render(<IntelligenceCard {...props} />)
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      const { container } = render(<IntelligenceCard {...defaultProps} variant="default" />)
      expect(container.querySelector('article')).toBeInTheDocument()
    })

    it('renders featured variant with larger text', () => {
      render(<IntelligenceCard {...defaultProps} variant="featured" />)
      const title = screen.getByText(defaultProps.title)
      expect(title).toHaveClass('text-2xl', 'md:text-3xl')
    })

    it('renders minimal variant with compact layout', () => {
      render(<IntelligenceCard {...defaultProps} variant="minimal" />)
      const title = screen.getByText(defaultProps.title)
      expect(title).toHaveClass('text-lg')
    })

    it('renders luxury variant with special styling', () => {
      const { container } = render(<IntelligenceCard {...defaultProps} variant="luxury" />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('border-2', 'border-dubai-gold-200')
    })
  })

  describe('AI Intelligence Metadata', () => {
    it('displays AI generated badge when aiGenerated is true', () => {
      render(
        <IntelligenceCard
          {...defaultProps}
          aiGenerated={true}
          confidenceScore={94}
        />
      )
      expect(screen.getByText('94%')).toBeInTheDocument()
    })

    it('displays sources analyzed count', () => {
      render(
        <IntelligenceCard
          {...defaultProps}
          aiGenerated={true}
          sourcesAnalyzed={47}
        />
      )
      expect(screen.getByText('47 sources')).toBeInTheDocument()
    })

    it('displays high confidence badge for scores >= 90', () => {
      render(
        <IntelligenceCard
          {...defaultProps}
          aiGenerated={true}
          confidenceScore={92}
          sourcesAnalyzed={30}
        />
      )
      expect(screen.getByText('High Confidence')).toBeInTheDocument()
    })

    it('does not display high confidence badge for scores < 90', () => {
      render(
        <IntelligenceCard
          {...defaultProps}
          aiGenerated={true}
          confidenceScore={85}
          sourcesAnalyzed={30}
        />
      )
      expect(screen.queryByText('High Confidence')).not.toBeInTheDocument()
    })

    it('displays view count', () => {
      render(<IntelligenceCard {...defaultProps} viewCount={12453} />)
      expect(screen.getByText('12,453')).toBeInTheDocument()
    })
  })

  describe('Interactive features', () => {
    it('renders as link when href is provided', () => {
      const { container } = render(<IntelligenceCard {...defaultProps} href="/news/123" />)
      const link = container.querySelector('a')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/news/123')
    })

    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(<IntelligenceCard {...defaultProps} onClick={handleClick} />)

      const card = screen.getByText(defaultProps.title).closest('article')
      await user.click(card!)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('has cursor-pointer class when onClick is provided', () => {
      const { container } = render(<IntelligenceCard {...defaultProps} onClick={() => {}} />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('cursor-pointer')
    })
  })

  describe('Content metadata', () => {
    it('displays author information', () => {
      render(<IntelligenceCard {...defaultProps} />)
      expect(screen.getByText('Sarah Al Mazrouei')).toBeInTheDocument()
      expect(screen.getByText(/By/)).toBeInTheDocument()
    })

    it('displays read time when no image', () => {
      const props = { ...defaultProps, image: undefined }
      render(<IntelligenceCard {...props} />)
      expect(screen.getByText('5 min')).toBeInTheDocument()
    })

    it('displays date when no image', () => {
      const props = { ...defaultProps, image: undefined }
      render(<IntelligenceCard {...props} />)
      expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    })
  })

  describe('Trending indicator', () => {
    it('shows trending badge when trending is true', () => {
      render(<IntelligenceCard {...defaultProps} trending={true} />)
      expect(screen.getByText('Trending')).toBeInTheDocument()
    })

    it('does not show trending badge when trending is false', () => {
      render(<IntelligenceCard {...defaultProps} trending={false} />)
      expect(screen.queryByText('Trending')).not.toBeInTheDocument()
    })
  })

  describe('Custom children', () => {
    it('renders custom children content', () => {
      render(
        <IntelligenceCard {...defaultProps}>
          <div data-testid="custom-content">Custom Content</div>
        </IntelligenceCard>
      )
      expect(screen.getByTestId('custom-content')).toBeInTheDocument()
      expect(screen.getByText('Custom Content')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('renders as article element by default', () => {
      const { container } = render(<IntelligenceCard {...defaultProps} />)
      expect(container.querySelector('article')).toBeInTheDocument()
    })

    it('renders as link element when href is provided', () => {
      const { container } = render(<IntelligenceCard {...defaultProps} href="#" />)
      expect(container.querySelector('a')).toBeInTheDocument()
    })

    it('has proper image alt text', () => {
      render(<IntelligenceCard {...defaultProps} imageAlt="Custom alt text" />)
      expect(screen.getByAltText('Custom alt text')).toBeInTheDocument()
    })

    it('uses title as fallback alt text', () => {
      render(<IntelligenceCard {...defaultProps} />)
      expect(screen.getByAltText(defaultProps.title)).toBeInTheDocument()
    })
  })

  describe('Style variants and Dubai Gold theming', () => {
    it('applies Dubai Gold hover effects', () => {
      const { container } = render(<IntelligenceCard {...defaultProps} />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('hover:border-dubai-gold-300')
    })

    it('applies Dubai Gold category badge in luxury variant', () => {
      render(<IntelligenceCard {...defaultProps} variant="luxury" />)
      const badge = screen.getByText('Technology')
      expect(badge).toHaveClass('bg-dubai-gold-500/90')
    })

    it('does not display metadata bar in minimal variant', () => {
      const { container } = render(
        <IntelligenceCard
          {...defaultProps}
          variant="minimal"
          aiGenerated={true}
          sourcesAnalyzed={30}
        />
      )
      expect(screen.queryByText('30 sources')).not.toBeInTheDocument()
    })
  })
})
