import { useState, useEffect, useCallback } from 'react';
import { CDN_CONFIG, getCDNUrl, getOptimalCDN, checkCDNHealth, getFallbackCDN } from '@/shared/config/cdn.config';

interface UseCDNOptions {
  fallbackEnabled?: boolean;
  healthCheckInterval?: number;
}

export function useCDN(options: UseCDNOptions = {}) {
  const { fallbackEnabled = true, healthCheckInterval = 300000 } = options; // 5 minutes
  
  const [cdnDomain, setCdnDomain] = useState<string>(CDN_CONFIG.primary.domain);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Health check
  const checkHealth = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const healthy = await checkCDNHealth();
      setIsHealthy(healthy);
      
      if (!healthy && fallbackEnabled) {
        const fallback = await getFallbackCDN();
        setCdnDomain(fallback);
      } else if (healthy && cdnDomain !== CDN_CONFIG.primary.domain) {
        // Switch back to primary if it's healthy again
        setCdnDomain(CDN_CONFIG.primary.domain);
      }
    } catch (error) {
      console.error('CDN health check failed:', error);
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  }, [cdnDomain, fallbackEnabled, isChecking]);

  // Set up health check interval
  useEffect(() => {
    if (!fallbackEnabled) return;

    const interval = setInterval(checkHealth, healthCheckInterval);
    
    // Initial check
    checkHealth();

    return () => clearInterval(interval);
  }, [checkHealth, fallbackEnabled, healthCheckInterval]);

  // Get asset URL with CDN
  const getAssetUrl = useCallback((path: string, options?: {
    format?: string;
    quality?: number;
    width?: number;
    height?: number;
  }) => {
    return getCDNUrl(path, options).replace(CDN_CONFIG.primary.domain, cdnDomain);
  }, [cdnDomain]);

  // Get image URL with responsive options
  const getImageUrl = useCallback((path: string, options?: {
    size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'hero';
    format?: string;
    quality?: number;
    custom?: { width: number; height: number };
  }) => {
    const imageOptions = { ...options };
    
    if (options?.size && CDN_CONFIG.optimization.images.sizes[options.size]) {
      const size = CDN_CONFIG.optimization.images.sizes[options.size];
      imageOptions.width = size.width;
      imageOptions.height = size.height;
    } else if (options?.custom) {
      imageOptions.width = options.custom.width;
      imageOptions.height = options.custom.height;
    }

    return getAssetUrl(path, imageOptions);
  }, [getAssetUrl]);

  // Generate srcset for responsive images
  const generateSrcSet = useCallback((path: string, options?: {
    sizes?: number[];
    format?: string;
  }) => {
    const sizes = options?.sizes || [320, 640, 768, 1024, 1280, 1920];
    const format = options?.format;
    
    return sizes
      .map(width => {
        const url = getAssetUrl(path, { width, format });
        return `${url} ${width}w`;
      })
      .join(', ');
  }, [getAssetUrl]);

  // Preload critical asset
  const preloadAsset = useCallback((path: string, as: 'script' | 'style' | 'image' | 'font' = 'image') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = getAssetUrl(path);
    
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
      link.type = 'font/woff2';
    }
    
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, [getAssetUrl]);

  // Prefetch asset for future navigation
  const prefetchAsset = useCallback((path: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = getAssetUrl(path);
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, [getAssetUrl]);

  return {
    cdnDomain,
    isHealthy,
    isChecking,
    getAssetUrl,
    getImageUrl,
    generateSrcSet,
    preloadAsset,
    prefetchAsset,
    checkHealth
  };
}

// Hook for responsive images with CDN
export function useCDNImage(src: string, options?: {
  sizes?: string;
  priority?: boolean;
  format?: 'webp' | 'avif' | 'auto';
  quality?: number;
}) {
  const { getImageUrl, generateSrcSet } = useCDN();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Generate sources for picture element
  const sources = CDN_CONFIG.optimization.images.formats.map(format => ({
    type: `image/${format}`,
    srcSet: generateSrcSet(src, { format })
  }));

  // Default image URL
  const defaultSrc = getImageUrl(src, {
    format: options?.format,
    quality: options?.quality
  });

  // Sizes attribute
  const sizes = options?.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // Loading attribute
  const loading = options?.priority ? 'eager' : 'lazy';

  return {
    sources,
    src: defaultSrc,
    sizes,
    loading,
    isLoaded,
    error,
    onLoad: () => setIsLoaded(true),
    onError: (e: Error) => setError(e)
  };
}

// Hook for CDN performance monitoring
export function useCDNPerformance() {
  const [metrics, setMetrics] = useState({
    avgLoadTime: 0,
    totalRequests: 0,
    failedRequests: 0,
    cacheHitRate: 0
  });

  useEffect(() => {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (entry.name.includes(CDN_CONFIG.primary.domain) || 
            CDN_CONFIG.fallbacks.some(f => entry.name.includes(f.domain))) {
          
          setMetrics(prev => ({
            avgLoadTime: (prev.avgLoadTime * prev.totalRequests + entry.duration) / (prev.totalRequests + 1),
            totalRequests: prev.totalRequests + 1,
            failedRequests: entry.responseStatus >= 400 ? prev.failedRequests + 1 : prev.failedRequests,
            cacheHitRate: entry.transferSize === 0 ? (prev.cacheHitRate * prev.totalRequests + 1) / (prev.totalRequests + 1) : prev.cacheHitRate
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  return metrics;
}