import { useState, useEffect, ImgHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { useInView } from 'react-intersection-observer'

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallbackSrc?: string
  placeholderSrc?: string
  sizes?: string
  srcSet?: string
  loading?: 'lazy' | 'eager'
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  aspectRatio?: number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  placeholderSrc,
  sizes,
  srcSet,
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
  aspectRatio,
  objectFit = 'cover',
  className,
  style,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || '')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Use intersection observer for lazy loading
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    rootMargin: '50px',
    skip: priority || loading === 'eager'
  })

  // Load image when in view or priority
  useEffect(() => {
    if (priority || loading === 'eager' || inView) {
      const img = new Image()
      
      img.onload = () => {
        setImageSrc(src)
        setImageLoaded(true)
        onLoad?.()
      }
      
      img.onerror = () => {
        setHasError(true)
        setImageSrc(fallbackSrc)
        onError?.()
      }
      
      img.src = src
      
      // Set srcset if provided
      if (srcSet) {
        img.srcset = srcSet
      }
    }
  }, [src, srcSet, fallbackSrc, inView, priority, loading, onLoad, onError])

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (srcSet) return srcSet
    
    // If src contains size indicators, generate srcset
    const match = src.match(/(.+)(\.\w+)$/)
    if (!match) return undefined
    
    const [, basePath, extension] = match
    const widths = [320, 640, 768, 1024, 1280, 1536]
    
    return widths
      .map(w => `${basePath}-${w}w${extension} ${w}w`)
      .join(', ')
  }

  // Generate sizes attribute for responsive images
  const generateSizes = () => {
    if (sizes) return sizes
    
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
  }

  const containerStyle = aspectRatio
    ? { paddingBottom: `${(1 / aspectRatio) * 100}%`, ...style }
    : style

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatio && 'h-0',
        className
      )}
      style={containerStyle}
    >
      <img
        ref={inViewRef}
        src={imageSrc || fallbackSrc}
        alt={alt}
        loading={priority ? 'eager' : loading}
        srcSet={generateSrcSet()}
        sizes={generateSizes()}
        className={cn(
          'transition-opacity duration-300',
          aspectRatio && 'absolute inset-0 h-full w-full',
          !imageLoaded && 'opacity-0',
          imageLoaded && 'opacity-100',
          `object-${objectFit}`
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setHasError(true)
          setImageSrc(fallbackSrc)
        }}
        {...props}
      />
      
      {/* Loading skeleton */}
      {!imageLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Picture component for art direction
interface PictureSource {
  media: string
  srcSet: string
  type?: string
}

interface OptimizedPictureProps extends OptimizedImageProps {
  sources?: PictureSource[]
}

export function OptimizedPicture({
  sources = [],
  ...imageProps
}: OptimizedPictureProps) {
  return (
    <picture>
      {sources.map((source, index) => (
        <source
          key={index}
          media={source.media}
          srcSet={source.srcSet}
          type={source.type}
        />
      ))}
      <OptimizedImage {...imageProps} />
    </picture>
  )
}

// Hook for progressive image loading
export function useProgressiveImage(src: string, placeholderSrc?: string) {
  const [sourceLoaded, setSourceLoaded] = useState<string | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => setSourceLoaded(src)
  }, [src])

  return sourceLoaded || placeholderSrc || src
}

// Utility to generate image URLs with transformations
export function getImageUrl(
  src: string,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
  }
) {
  // If using a CDN or image service, construct URL with parameters
  // This is a placeholder - implement based on your image service
  const params = new URLSearchParams()
  
  if (options?.width) params.append('w', options.width.toString())
  if (options?.height) params.append('h', options.height.toString())
  if (options?.quality) params.append('q', options.quality.toString())
  if (options?.format) params.append('fm', options.format)
  
  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}${params.toString()}`
}