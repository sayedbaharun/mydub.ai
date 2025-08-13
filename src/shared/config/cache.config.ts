/**
 * Cache configuration for MyDub.AI
 * Optimized for Dubai/UAE users with CloudFlare CDN
 */

export const cacheConfig = {
  // Browser cache settings
  browser: {
    // Static assets (images, fonts, etc)
    static: {
      maxAge: 31536000, // 1 year
      immutable: true,
    },
    // API responses
    api: {
      public: {
        maxAge: 300, // 5 minutes
        sMaxAge: 3600, // 1 hour on CDN
        staleWhileRevalidate: 86400, // 1 day
      },
      private: {
        maxAge: 0,
        noCache: true,
        noStore: true,
      },
    },
    // HTML pages
    html: {
      maxAge: 0,
      sMaxAge: 300, // 5 minutes on CDN
      staleWhileRevalidate: 3600, // 1 hour
    },
  },

  // Supabase Storage URLs to cache aggressively
  storage: {
    patterns: [
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/',
    ],
    maxAge: 31536000, // 1 year
  },

  // API endpoints cache configuration
  endpoints: {
    // Public data - cache aggressively
    '/api/news': {
      cache: 'public',
      maxAge: 300, // 5 minutes
      sMaxAge: 600, // 10 minutes on CDN
      tags: ['news'],
    },
    '/api/government/services': {
      cache: 'public',
      maxAge: 3600, // 1 hour
      sMaxAge: 7200, // 2 hours on CDN
      tags: ['government'],
    },
    '/api/tourism/attractions': {
      cache: 'public',
      maxAge: 86400, // 1 day
      sMaxAge: 172800, // 2 days on CDN
      tags: ['tourism'],
    },
    '/api/weather': {
      cache: 'public',
      maxAge: 300, // 5 minutes
      sMaxAge: 300, // 5 minutes on CDN
      tags: ['weather'],
    },
    '/api/traffic': {
      cache: 'public',
      maxAge: 60, // 1 minute
      sMaxAge: 120, // 2 minutes on CDN
      tags: ['traffic'],
    },
    // User-specific data - no caching
    '/api/user/*': {
      cache: 'private',
      maxAge: 0,
      noStore: true,
    },
    '/api/auth/*': {
      cache: 'no-store',
      maxAge: 0,
    },
  },

  // CloudFlare cache tags for purging
  tags: {
    news: ['news', 'content'],
    government: ['government', 'services'],
    tourism: ['tourism', 'attractions', 'events'],
    weather: ['weather', 'realtime'],
    traffic: ['traffic', 'realtime'],
  },

  // Cache key variations
  vary: {
    headers: ['Accept-Language', 'Accept'],
    cookies: ['lang', 'theme'],
  },
};

/**
 * Generate cache headers for a given path
 */
export function getCacheHeaders(path: string): HeadersInit {
  const headers: HeadersInit = {};

  // Check if path matches any configured endpoint
  for (const [pattern, config] of Object.entries(cacheConfig.endpoints)) {
    if (matchPath(path, pattern)) {
      if (config.cache === 'public') {
        headers['Cache-Control'] = `public, max-age=${config.maxAge}, s-maxage=${config.sMaxAge}, stale-while-revalidate=86400`;
      } else if (config.cache === 'private') {
        headers['Cache-Control'] = 'private, no-cache, no-store, must-revalidate';
      } else if (config.cache === 'no-store') {
        headers['Cache-Control'] = 'no-store';
      }

      // Add cache tags for CloudFlare
      if (config.tags) {
        headers['Cache-Tag'] = config.tags.join(',');
      }

      break;
    }
  }

  // Add Vary headers
  headers['Vary'] = cacheConfig.vary.headers.join(', ');

  return headers;
}

/**
 * Check if a path matches a pattern
 */
function matchPath(path: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return regex.test(path);
  }
  return path === pattern;
}

/**
 * Get cache control header for static assets
 */
export function getStaticCacheControl(): string {
  return `public, max-age=${cacheConfig.browser.static.maxAge}, immutable`;
}

/**
 * Get cache control header for HTML pages
 */
export function getHTMLCacheControl(): string {
  const { maxAge, sMaxAge, staleWhileRevalidate } = cacheConfig.browser.html;
  return `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
}

/**
 * CloudFlare cache purge utility
 */
export async function purgeCache(tags: string[]): Promise<void> {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ZONE_ID) {
        return;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Cache purge failed: ${response.statusText}`);
    }

      } catch (error) {
    console.error('Cache purge error:', error);
  }
}