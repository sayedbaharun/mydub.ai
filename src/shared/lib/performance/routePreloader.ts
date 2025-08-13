import { lazy } from 'react';

// Route preloading strategies
export const PRELOAD_STRATEGIES = {
  CRITICAL: 'critical',     // Preload immediately
  HOVER: 'hover',           // Preload on hover
  VISIBLE: 'visible',       // Preload when link is visible
  IDLE: 'idle',            // Preload when browser is idle
  PREFETCH: 'prefetch'     // Use browser prefetch hints
} as const;

type PreloadStrategy = typeof PRELOAD_STRATEGIES[keyof typeof PRELOAD_STRATEGIES];

interface RouteConfig {
  path: string;
  component: () => Promise<any>;
  strategy: PreloadStrategy;
  priority?: number;
}

// Critical routes to preload immediately
const criticalRoutes: RouteConfig[] = [
  {
    path: '/news',
    component: () => import('@/features/news/pages/NewsPage'),
    strategy: PRELOAD_STRATEGIES.CRITICAL,
    priority: 1
  },
  {
    path: '/government',
    component: () => import('@/features/government/pages/GovernmentPage'),
    strategy: PRELOAD_STRATEGIES.CRITICAL,
    priority: 2
  },
  {
    path: '/chat',
    component: () => import('@/features/chatbot/pages/ChatbotPage'),
    strategy: PRELOAD_STRATEGIES.CRITICAL,
    priority: 3
  }
];

// Secondary routes to preload on interaction
const secondaryRoutes: RouteConfig[] = [
  {
    path: '/tourism',
    component: () => import('@/features/tourism/pages/TourismPage'),
    strategy: PRELOAD_STRATEGIES.HOVER
  },
  {
    path: '/search',
    component: () => import('@/features/search/pages/SearchPage'),
    strategy: PRELOAD_STRATEGIES.HOVER
  },
  {
    path: '/auth/signin',
    component: () => import('@/pages/auth/SignInPage.tsx'),
    strategy: PRELOAD_STRATEGIES.VISIBLE
  }
];

// Heavy routes to preload when idle
const heavyRoutes: RouteConfig[] = [
  {
    path: '/dashboard',
    component: () => import('@/features/dashboard/pages/DashboardPage'),
    strategy: PRELOAD_STRATEGIES.IDLE
  },
  {
    path: '/arabic-learning',
    component: () => import('@/pages/ArabicLearningPage'),
    strategy: PRELOAD_STRATEGIES.IDLE
  }
];

class RoutePreloader {
  private preloadedRoutes = new Set<string>();
  private intersectionObserver: IntersectionObserver | null = null;
  private idleCallbackId: number | null = null;

  constructor() {
    this.setupIntersectionObserver();
    this.preloadCriticalRoutes();
    this.setupIdlePreloading();
  }

  private setupIntersectionObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            if (href) {
              this.preloadRoute(href);
            }
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );
  }

  private async preloadCriticalRoutes() {
    const sortedRoutes = criticalRoutes.sort((a, b) => 
      (a.priority || 999) - (b.priority || 999)
    );

    for (const route of sortedRoutes) {
      await this.preloadComponent(route);
      // Small delay between critical preloads to avoid blocking
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private setupIdlePreloading() {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      return;
    }

    this.idleCallbackId = window.requestIdleCallback(() => {
      heavyRoutes.forEach(route => {
        this.preloadComponent(route);
      });
    }, { timeout: 2000 });
  }

  private async preloadComponent(route: RouteConfig) {
    if (this.preloadedRoutes.has(route.path)) {
      return;
    }

    try {
      await route.component();
      this.preloadedRoutes.add(route.path);
          } catch (error) {
      console.error(`Failed to preload route ${route.path}:`, error);
    }
  }

  public preloadRoute(path: string) {
    const allRoutes = [...criticalRoutes, ...secondaryRoutes, ...heavyRoutes];
    const route = allRoutes.find(r => r.path === path);
    
    if (route && !this.preloadedRoutes.has(path)) {
      this.preloadComponent(route);
    }
  }

  public observeLink(element: HTMLAnchorElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }

    // Preload on hover
    element.addEventListener('mouseenter', () => {
      const href = element.getAttribute('href');
      if (href) {
        this.preloadRoute(href);
      }
    }, { once: true });
  }

  public unobserveLink(element: HTMLAnchorElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  public destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.idleCallbackId !== null) {
      window.cancelIdleCallback(this.idleCallbackId);
    }
  }
}

// Singleton instance
let preloaderInstance: RoutePreloader | null = null;

export function getRoutePreloader(): RoutePreloader {
  if (!preloaderInstance) {
    preloaderInstance = new RoutePreloader();
  }
  return preloaderInstance;
}

// React hook for route preloading
export function useRoutePreloader() {
  const preloader = getRoutePreloader();

  return {
    preloadRoute: (path: string) => preloader.preloadRoute(path),
    observeLink: (element: HTMLAnchorElement) => preloader.observeLink(element),
    unobserveLink: (element: HTMLAnchorElement) => preloader.unobserveLink(element)
  };
}

// Prefetch link resources
export function prefetchResources(urls: string[]) {
  if (typeof window === 'undefined') return;

  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = url.endsWith('.js') ? 'script' : 
              url.endsWith('.css') ? 'style' : 
              'fetch';
    document.head.appendChild(link);
  });
}

// DNS prefetch for external domains
export function dnsPrefetch(domains: string[]) {
  if (typeof window === 'undefined') return;

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

// Preconnect to external origins
export function preconnect(origins: string[]) {
  if (typeof window === 'undefined') return;

  origins.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Initialize performance optimizations
export function initializePerformanceOptimizations() {
  // DNS prefetch for external services
  dnsPrefetch([
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.openai.com',
    'https://api.anthropic.com',
    'https://www.googletagmanager.com'
  ]);

  // Preconnect to critical origins
  preconnect([
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    `https://${import.meta.env.VITE_SUPABASE_URL}`
  ]);

  // Initialize route preloader
  getRoutePreloader();
}