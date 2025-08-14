/**
 * Performance Optimization Utilities
 * Provides tools for optimizing app performance
 */

/**
 * Preload critical components
 */
export const preloadCriticalComponents = () => {
  // Preload commonly used pages
  const criticalImports = [
    () => import('@/pages/HomePage'),
    () => import('@/features/news/pages/NewsPage'),
    () => import('@/pages/auth/SignInPage'),
  ]

  // Start preloading after initial render
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      criticalImports.forEach(importFn => importFn())
    })
  } else {
    setTimeout(() => {
      criticalImports.forEach(importFn => importFn())
    }, 2000)
  }
}

/**
 * Optimize images with lazy loading
 */
export const optimizeImage = (src: string, options?: {
  width?: number
  quality?: number
  format?: 'webp' | 'auto'
}) => {
  // If using a CDN like Cloudinary or Vercel Image Optimization
  const baseUrl = import.meta.env.VITE_CDN_URL || ''
  
  if (!baseUrl) return src
  
  const params = new URLSearchParams()
  if (options?.width) params.set('w', options.width.toString())
  if (options?.quality) params.set('q', options.quality.toString())
  if (options?.format) params.set('f', options.format)
  
  return `${baseUrl}/${src}?${params.toString()}`
}

/**
 * Debounce function for performance
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for performance
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Virtual scrolling helper
 */
export const calculateVisibleItems = <T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  buffer = 5
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
  )
  
  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    totalHeight: items.length * itemHeight
  }
}

/**
 * Intersection Observer for lazy loading
 */
export const createLazyLoadObserver = (
  onIntersect: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) => {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          onIntersect(entry)
        }
      })
    },
    {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    }
  )
}

/**
 * Performance metrics collection
 */
export const collectPerformanceMetrics = () => {
  if (!('performance' in window)) return null
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const paint = performance.getEntriesByType('paint')
  
  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.requestStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domInteractive: navigation?.domInteractive,
    domComplete: navigation?.domComplete,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
    
    // Paint timing
    fp: paint.find(p => p.name === 'first-paint')?.startTime,
    fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
    
    // Custom metrics
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent
  }
}

/**
 * Report performance metrics to analytics
 */
export const reportPerformanceMetrics = async () => {
  const metrics = collectPerformanceMetrics()
  if (!metrics) return
  
  // Send to Google Analytics if available
  if ('gtag' in window) {
    (window as any).gtag('event', 'performance', {
      event_category: 'Web Vitals',
      event_label: 'Page Load',
      value: Math.round(metrics.fcp || 0),
      ttfb: Math.round(metrics.ttfb || 0),
      dom_complete: Math.round(metrics.domComplete || 0)
    })
  }
  
  // Could also send to custom analytics endpoint
  // await fetch('/api/analytics/performance', {
  //   method: 'POST',
  //   body: JSON.stringify(metrics)
  // })
}

/**
 * Web Vitals monitoring
 */
export const initWebVitals = async () => {
  if (!('PerformanceObserver' in window)) return
  
  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals')
    
    onCLS(metric => console.debug('CLS:', metric.value))
    onFID(metric => console.debug('FID:', metric.value))
    onFCP(metric => console.debug('FCP:', metric.value))
    onLCP(metric => console.debug('LCP:', metric.value))
    onTTFB(metric => console.debug('TTFB:', metric.value))
  } catch (error) {
    // Web vitals not available
  }
}