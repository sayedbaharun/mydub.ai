import { forwardRef, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Sparkles, TrendingUp, Clock, Eye } from 'lucide-react'
import { Badge } from './badge'

export interface IntelligenceCardProps {
  variant?: 'default' | 'featured' | 'minimal' | 'luxury'
  title: string
  description?: string
  image?: string
  imageAlt?: string
  category?: string
  date?: string
  author?: string
  href?: string
  onClick?: () => void
  className?: string
  children?: ReactNode

  // Intelligence metadata
  aiGenerated?: boolean
  confidenceScore?: number
  sourcesAnalyzed?: number
  viewCount?: number
  readTime?: number
  sentiment?: 'positive' | 'neutral' | 'negative'
  trending?: boolean
}

/**
 * IntelligenceCard - mydub.ai's signature card component
 *
 * Inspired by Jony Ive's minimalist design philosophy with Dubai Gold accents.
 * Features:
 * - Generous white space
 * - Subtle animations
 * - AI confidence indicators
 * - Asymmetric layouts
 * - Dubai Gold accent highlights
 *
 * @example
 * ```tsx
 * <IntelligenceCard
 *   variant="featured"
 *   title="Dubai Announces New AI Strategy"
 *   description="The emirate unveils comprehensive plan for 2026"
 *   image="/news/ai-strategy.jpg"
 *   category="Technology"
 *   aiGenerated={true}
 *   confidenceScore={94}
 *   sourcesAnalyzed={47}
 *   onClick={() => navigate('/news/123')}
 * />
 * ```
 */
export const IntelligenceCard = forwardRef<HTMLDivElement, IntelligenceCardProps>(
  (
    {
      variant = 'default',
      title,
      description,
      image,
      imageAlt,
      category,
      date,
      author,
      href,
      onClick,
      className,
      children,
      aiGenerated = false,
      confidenceScore,
      sourcesAnalyzed,
      viewCount,
      readTime,
      sentiment,
      trending = false,
    },
    ref
  ) => {
    const isLuxury = variant === 'luxury'
    const isFeatured = variant === 'featured'
    const isMinimal = variant === 'minimal'

    const cardContent = (
      <>
        {/* Image Section */}
        {image && (
          <div className={cn(
            'relative overflow-hidden',
            isMinimal ? 'rounded-lg' : 'rounded-t-2xl',
            isFeatured && 'aspect-[16/10]',
            !isFeatured && 'aspect-[16/9]'
          )}>
            <img
              src={image}
              alt={imageAlt || title}
              className={cn(
                'w-full h-full object-cover transition-all duration-700',
                'group-hover:scale-105'
              )}
            />

            {/* Gradient overlay for better text readability */}
            <div className={cn(
              'absolute inset-0',
              isLuxury
                ? 'bg-gradient-to-t from-black/60 via-black/20 to-transparent'
                : 'bg-gradient-to-t from-black/40 via-transparent to-transparent'
            )} />

            {/* Top badges */}
            {(category || trending || aiGenerated) && (
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                <div className="flex gap-2">
                  {category && (
                    <Badge className={cn(
                      'backdrop-blur-md',
                      isLuxury
                        ? 'bg-dubai-gold-500/90 text-white border-0'
                        : 'bg-white/90 text-gray-900 border-0'
                    )}>
                      {category}
                    </Badge>
                  )}
                  {trending && (
                    <Badge className="bg-red-500/90 text-white border-0 backdrop-blur-md">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>

                {aiGenerated && confidenceScore && (
                  <Badge className="bg-purple-600/90 text-white border-0 backdrop-blur-md">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {confidenceScore}%
                  </Badge>
                )}
              </div>
            )}

            {/* Bottom image overlay for luxury variant */}
            {isLuxury && (
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2 leading-tight">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-white/90 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        {!isLuxury && (
          <div className={cn(
            'p-6 space-y-4',
            isMinimal && 'p-4'
          )}>
            {/* Category and metadata bar */}
            {(category || date || readTime) && !image && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {category && (
                  <span className="font-medium text-dubai-gold-600">
                    {category}
                  </span>
                )}
                {date && (
                  <>
                    <span>•</span>
                    <span>{date}</span>
                  </>
                )}
                {readTime && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{readTime} min</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Title */}
            <h3 className={cn(
              'font-semibold leading-tight tracking-tight',
              'text-gray-900 transition-colors',
              'group-hover:text-dubai-gold-700',
              isFeatured && 'text-2xl md:text-3xl',
              !isFeatured && !isMinimal && 'text-xl',
              isMinimal && 'text-lg'
            )}>
              {title}
            </h3>

            {/* Description */}
            {description && (
              <p className={cn(
                'text-gray-600 leading-relaxed',
                isFeatured && 'text-base line-clamp-3',
                !isFeatured && !isMinimal && 'text-sm line-clamp-2',
                isMinimal && 'text-sm line-clamp-1'
              )}>
                {description}
              </p>
            )}

            {/* Author */}
            {author && (
              <div className="text-sm text-gray-500">
                By <span className="font-medium text-gray-700">{author}</span>
              </div>
            )}

            {/* Intelligence metadata */}
            {(aiGenerated || sourcesAnalyzed || viewCount) && !isMinimal && (
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                {aiGenerated && sourcesAnalyzed && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3 text-purple-600" />
                    <span>{sourcesAnalyzed} sources</span>
                  </div>
                )}
                {viewCount && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye className="h-3 w-3" />
                    <span>{viewCount.toLocaleString()}</span>
                  </div>
                )}
                {confidenceScore && confidenceScore >= 90 && (
                  <div className="ml-auto">
                    <Badge variant="outline" className="border-green-200 text-green-700 text-xs">
                      High Confidence
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Custom children content */}
            {children}
          </div>
        )}

        {/* Dubai Gold accent line */}
        <div className={cn(
          'absolute left-0 bottom-0 h-1 w-0',
          'bg-gradient-to-r from-dubai-gold-500 to-dubai-gold-300',
          'transition-all duration-500 ease-out',
          'group-hover:w-full'
        )} />
      </>
    )

    const Component = href ? 'a' : 'article'

    return (
      <Component
        ref={ref}
        href={href}
        onClick={onClick}
        className={cn(
          'group relative block',
          'bg-white rounded-2xl',
          'border border-gray-200',
          'transition-all duration-300 ease-out',
          'hover:shadow-2xl hover:shadow-dubai-gold-200/20',
          'hover:border-dubai-gold-300',
          'hover:-translate-y-1',
          'overflow-hidden',
          onClick && 'cursor-pointer',
          isLuxury && 'border-2 border-dubai-gold-200',
          isMinimal && 'shadow-sm',
          className
        )}
      >
        {cardContent}
      </Component>
    )
  }
)

IntelligenceCard.displayName = 'IntelligenceCard'
