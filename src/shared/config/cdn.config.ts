/**
 * CDN Configuration for MyDub.AI
 * Optimized for Dubai and Middle East region
 */

export const CDN_CONFIG = {
  // Primary CDN endpoints with Dubai edge locations
  primary: {
    domain: 'https://cdn.mydub.ai',
    region: 'me-central-1', // Middle East (UAE) region
    features: {
      http2: true,
      http3: true, // QUIC protocol for better mobile performance
      brotli: true,
      gzip: true,
      webp: true,
      avif: true
    }
  },

  // Fallback CDNs for redundancy
  fallbacks: [
    {
      domain: 'https://cdn-me.mydub.ai',
      region: 'me-south-1', // Bahrain
      priority: 1
    },
    {
      domain: 'https://cdn-as.mydub.ai', 
      region: 'ap-south-1', // Mumbai
      priority: 2
    },
    {
      domain: 'https://cdn-eu.mydub.ai',
      region: 'eu-south-2', // Frankfurt
      priority: 3
    }
  ],

  // Asset optimization settings
  optimization: {
    images: {
      formats: ['avif', 'webp', 'jpg'],
      quality: {
        default: 85,
        mobile: 75,
        thumbnail: 60
      },
      sizes: {
        thumbnail: { width: 150, height: 150 },
        small: { width: 320, height: 240 },
        medium: { width: 640, height: 480 },
        large: { width: 1024, height: 768 },
        hero: { width: 1920, height: 1080 }
      },
      lazy: {
        enabled: true,
        offset: '50px',
        placeholder: 'blur'
      }
    },
    
    scripts: {
      minify: true,
      compress: ['gzip', 'brotli'],
      cache: {
        maxAge: 31536000, // 1 year for versioned assets
        immutable: true
      }
    },
    
    styles: {
      minify: true,
      compress: ['gzip', 'brotli'],
      cache: {
        maxAge: 31536000, // 1 year for versioned assets
        immutable: true
      }
    },
    
    fonts: {
      preload: true,
      display: 'swap',
      cache: {
        maxAge: 31536000, // 1 year
        immutable: true
      }
    }
  },

  // Cache headers configuration
  cacheHeaders: {
    // Static assets (versioned)
    'js,css,woff2,woff,ttf,eot': {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'max-age=31536000'
    },
    
    // Images
    'jpg,jpeg,png,gif,webp,avif,svg,ico': {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control': 'max-age=2592000'
    },
    
    // HTML
    'html': {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'CDN-Cache-Control': 'no-cache'
    },
    
    // API responses
    'json': {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'max-age=300'
    }
  },

  // Security headers
  securityHeaders: {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Content-Security-Policy': "default-src 'self' https://cdn.mydub.ai https://*.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com;"
  },

  // Performance settings
  performance: {
    // Enable HTTP/3 (QUIC) for better mobile performance
    http3: true,
    
    // Early hints for critical resources
    earlyHints: [
      '/assets/css/main.css',
      '/assets/js/react-core.js',
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ],
    
    // Server push for critical resources
    serverPush: [
      '/assets/css/main.css',
      '/assets/js/react-core.js'
    ],
    
    // Preload critical resources
    preload: [
      { href: '/assets/fonts/Inter-Regular.woff2', as: 'font', type: 'font/woff2', crossorigin: true },
      { href: '/assets/fonts/Inter-Medium.woff2', as: 'font', type: 'font/woff2', crossorigin: true }
    ],
    
    // DNS prefetch for external domains
    dnsPrefetch: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.googletagmanager.com'
    ],
    
    // Preconnect to external origins
    preconnect: [
      { href: 'https://fonts.googleapis.com', crossorigin: false },
      { href: 'https://fonts.gstatic.com', crossorigin: true }
    ]
  },

  // Regional routing rules
  routing: {
    // Geo-based routing
    geoRouting: {
      'AE': 'me-central-1', // UAE to Dubai
      'SA': 'me-central-1', // Saudi Arabia to Dubai
      'KW': 'me-central-1', // Kuwait to Dubai  
      'QA': 'me-central-1', // Qatar to Dubai
      'OM': 'me-central-1', // Oman to Dubai
      'BH': 'me-south-1',   // Bahrain to Bahrain
      'IN': 'ap-south-1',   // India to Mumbai
      'PK': 'ap-south-1',   // Pakistan to Mumbai
      'DEFAULT': 'me-central-1' // Default to Dubai
    },
    
    // Device-based optimizations
    deviceOptimization: {
      mobile: {
        imageQuality: 75,
        enableWebP: true,
        enableAVIF: false, // Disable AVIF on mobile for compatibility
        enableLazyLoad: true
      },
      tablet: {
        imageQuality: 85,
        enableWebP: true,
        enableAVIF: true,
        enableLazyLoad: true
      },
      desktop: {
        imageQuality: 90,
        enableWebP: true,
        enableAVIF: true,
        enableLazyLoad: false
      }
    }
  },

  // Monitoring and analytics
  monitoring: {
    realUserMetrics: true,
    syntheticMonitoring: {
      enabled: true,
      locations: ['Dubai', 'Riyadh', 'Mumbai', 'London'],
      frequency: 300 // 5 minutes
    },
    alerting: {
      latencyThreshold: 1000, // 1 second
      errorRateThreshold: 0.01, // 1%
      availabilityThreshold: 0.999 // 99.9%
    }
  }
};

// Helper function to get CDN URL
export function getCDNUrl(path: string, options?: {
  format?: string;
  quality?: number;
  width?: number;
  height?: number;
}): string {
  const baseUrl = CDN_CONFIG.primary.domain;
  
  if (!options) {
    return `${baseUrl}${path}`;
  }

  // Build transformation parameters for images
  const transforms = [];
  if (options.format) transforms.push(`f_${options.format}`);
  if (options.quality) transforms.push(`q_${options.quality}`);
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);

  if (transforms.length > 0) {
    return `${baseUrl}/t_${transforms.join(',')}${path}`;
  }

  return `${baseUrl}${path}`;
}

// Get optimal CDN endpoint based on user location
export function getOptimalCDN(): string {
  // In production, this would use geo-location detection
  // For now, return primary CDN
  return CDN_CONFIG.primary.domain;
}

// Check if CDN is healthy
export async function checkCDNHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${CDN_CONFIG.primary.domain}/health`, {
      method: 'HEAD',
      mode: 'no-cors'
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Get fallback CDN if primary fails
export async function getFallbackCDN(): Promise<string> {
  for (const fallback of CDN_CONFIG.fallbacks) {
    try {
      const response = await fetch(`${fallback.domain}/health`, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      if (response.ok) {
        return fallback.domain;
      }
    } catch {
      continue;
    }
  }
  
  // If all fail, return primary
  return CDN_CONFIG.primary.domain;
}