// Image optimization utilities for performance

interface ImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
  className?: string;
}

interface ImageSource {
  srcset: string;
  type: string;
  sizes?: string;
}

// Cloudinary optimization (if using Cloudinary)
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number | 'auto';
    format?: string;
    dpr?: number | 'auto';
    crop?: string;
  } = {}
): string {
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.dpr) transformations.push(`dpr_${options.dpr}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  
  const transformation = transformations.join(',');
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'mydubai';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

// Generate responsive image sources
export function generateImageSources(config: ImageConfig): ImageSource[] {
  const sources: ImageSource[] = [];
  const widths = [320, 640, 768, 1024, 1280, 1536, 1920];
  const formats = ['avif', 'webp'];
  
  // Generate sources for modern formats
  formats.forEach(format => {
    const srcsetParts = widths.map(width => {
      const url = getOptimizedImageUrl(config.src, { width, format });
      return `${url} ${width}w`;
    });
    
    sources.push({
      srcset: srcsetParts.join(', '),
      type: `image/${format}`,
      sizes: config.sizes || generateSizes()
    });
  });
  
  return sources;
}

// Generate sizes attribute based on common breakpoints
function generateSizes(): string {
  return [
    '(max-width: 640px) 100vw',
    '(max-width: 768px) 90vw',
    '(max-width: 1024px) 80vw',
    '(max-width: 1280px) 70vw',
    '60vw'
  ].join(', ');
}

// Get optimized image URL (works with various CDNs)
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    format?: string;
    quality?: number;
  } = {}
): string {
  // If it's already a data URL or blob, return as is
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  
  // If using Supabase Storage
  if (src.includes('supabase')) {
    const url = new URL(src);
    if (options.width) url.searchParams.set('width', options.width.toString());
    if (options.height) url.searchParams.set('height', options.height.toString());
    if (options.quality) url.searchParams.set('quality', options.quality.toString());
    return url.toString();
  }
  
  // If using Cloudinary
  if (src.includes('cloudinary')) {
    const publicId = src.split('/upload/')[1];
    return getCloudinaryUrl(publicId, options);
  }
  
  // Default: return original URL
  return src;
}

// Lazy loading configuration
export function getLazyLoadingConfig(priority?: boolean) {
  if (priority) {
    return {
      loading: 'eager' as const,
      fetchpriority: 'high' as any,
      decoding: 'sync' as const
    };
  }
  
  return {
    loading: 'lazy' as const,
    fetchpriority: 'low' as any,
    decoding: 'async' as const
  };
}

// Generate blur placeholder
export function generateBlurPlaceholder(src: string): string {
  // For demo, return a simple gradient placeholder
  // In production, you'd generate actual blur hashes
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIj48c3RvcCBzdG9wLWNvbG9yPSIjZjBmMGYwIiBvZmZzZXQ9IjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iI2U4ZThlOCIgb2Zmc2V0PSIxMDAlIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';
}

// Preload critical images
export function preloadImage(src: string, options?: {
  as?: 'image';
  type?: string;
  sizes?: string;
  srcset?: string;
}) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  
  if (options?.type) link.type = options.type;
  if (options?.sizes) link.sizes = options.sizes;
  if (options?.srcset) (link as any).srcset = options.srcset;
  
  document.head.appendChild(link);
}

// Intersection Observer for lazy loading
let imageObserver: IntersectionObserver | null = null;

export function getImageObserver(
  onIntersect: (entry: IntersectionObserverEntry) => void
): IntersectionObserver {
  if (!imageObserver) {
    imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onIntersect(entry);
            imageObserver?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }
  
  return imageObserver;
}

// React hook for optimized images
export function useOptimizedImage(config: ImageConfig) {
  const sources = generateImageSources(config);
  const lazyConfig = getLazyLoadingConfig(config.priority);
  const placeholder = generateBlurPlaceholder(config.src);
  
  // Preload critical images
  if (config.priority && typeof window !== 'undefined') {
    preloadImage(config.src, {
      srcset: sources[0]?.srcset,
      sizes: config.sizes
    });
  }
  
  return {
    sources,
    placeholder,
    ...lazyConfig,
    sizes: config.sizes || generateSizes()
  };
}

// Image format detection
export function supportsModernFormats(): {
  avif: boolean;
  webp: boolean;
} {
  if (typeof window === 'undefined') {
    return { avif: false, webp: false };
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return {
    avif: canvas.toDataURL('image/avif').indexOf('image/avif') > -1,
    webp: canvas.toDataURL('image/webp').indexOf('image/webp') > -1
  };
}

// Responsive image component props generator
export function generateResponsiveImageProps(config: ImageConfig) {
  const { src, alt, width, height, sizes, className } = config;
  const sources = generateImageSources(config);
  const { loading, fetchpriority, decoding } = getLazyLoadingConfig(config.priority);
  
  return {
    picture: {
      className,
      sources,
      img: {
        src,
        alt,
        width,
        height,
        loading,
        fetchpriority,
        decoding,
        sizes: sizes || generateSizes(),
        className: 'w-full h-auto'
      }
    }
  };
}

// Dubai-specific CDN configuration
export const DUBAI_CDN_CONFIG = {
  // Primary CDN with Dubai edge location
  primary: 'https://cdn.mydub.ai',
  
  // Fallback CDNs
  fallbacks: [
    'https://cdn-me.mydub.ai',  // Middle East region
    'https://cdn-as.mydub.ai'   // Asia region
  ],
  
  // Image optimization params for Dubai's typical network conditions
  defaultQuality: 85,
  mobileQuality: 75,
  
  // Aggressive lazy loading for mobile networks
  lazyLoadOffset: '100px',
  
  // Format preferences
  preferredFormats: ['avif', 'webp', 'jpg']
};

// Get optimal CDN URL based on user location
export function getOptimalCDNUrl(path: string): string {
  // In production, this would use geo-location detection
  const cdn = DUBAI_CDN_CONFIG.primary;
  return `${cdn}${path}`;
}