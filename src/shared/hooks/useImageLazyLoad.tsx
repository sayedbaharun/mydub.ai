import { useEffect, useRef, useState } from 'react'

interface UseImageLazyLoadOptions {
  threshold?: number
  rootMargin?: string
  placeholder?: string
}

export function useImageLazyLoad(
  src: string,
  options: UseImageLazyLoadOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    placeholder = '/placeholder.svg'
  } = options

  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start loading the image
            const img = new Image()
            img.src = src
            
            img.onload = () => {
              setImageSrc(src)
              setIsLoaded(true)
            }
            
            img.onerror = () => {
              console.error(`Failed to load image: ${src}`)
              setImageSrc(placeholder)
            }
            
            // Disconnect observer after loading
            if (imageRef.current) {
              observer.unobserve(imageRef.current)
            }
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    if (imageRef.current) {
      observer.observe(imageRef.current)
    }

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current)
      }
    }
  }, [src, threshold, rootMargin, placeholder])

  return {
    imageRef,
    imageSrc,
    isLoaded
  }
}

// Component for lazy loaded images
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  placeholder?: string
  className?: string
  alt: string
}

export function LazyImage({ 
  src, 
  placeholder = '/placeholder.svg',
  className = '',
  alt,
  ...props 
}: LazyImageProps) {
  const { imageRef, imageSrc, isLoaded } = useImageLazyLoad(src, { placeholder })

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      loading="lazy"
      {...props}
    />
  )
}