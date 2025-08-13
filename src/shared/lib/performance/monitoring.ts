// Performance monitoring utilities
interface PerformanceMetrics {
  FCP: number | null;  // First Contentful Paint
  LCP: number | null;  // Largest Contentful Paint
  FID: number | null;  // First Input Delay
  CLS: number | null;  // Cumulative Layout Shift
  TTFB: number | null; // Time to First Byte
  TTI: number | null;  // Time to Interactive
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    FCP: null,
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    TTI: null
  };

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
      this.measureNavigationTiming();
    }
  }

  private initializeObservers() {
    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP observer not supported in this browser
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.FID = entry.processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.FID);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID observer not supported in this browser
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.metrics.CLS = clsValue;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS observer not supported in this browser
    }

    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = entry.startTime;
            this.reportMetric('FCP', entry.startTime);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // FCP observer not supported in this browser
    }
  }

  private measureNavigationTiming() {
    if (!window.performance || !window.performance.timing) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const navigationStart = timing.navigationStart;

        // Time to First Byte
        this.metrics.TTFB = timing.responseStart - navigationStart;
        this.reportMetric('TTFB', this.metrics.TTFB);

        // Time to Interactive (approximation)
        this.metrics.TTI = timing.loadEventEnd - navigationStart;
        this.reportMetric('TTI', this.metrics.TTI);
      }, 0);
    });
  }

  private reportMetric(name: string, value: number) {
    // Report to analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(value),
        event_category: 'Web Vitals'
      });
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.debug(`[Performance] ${metricName}: ${value}ms`);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public reportAllMetrics() {
    Object.entries(this.metrics).forEach(([key, value]) => {
      if (value !== null) {
        this.reportMetric(key, value);
      }
    });
  }
}

// Resource timing utilities
export function measureResourceTiming() {
  if (!window.performance || !window.performance.getEntriesByType) return;

  const resources = window.performance.getEntriesByType('resource');
  const resourceMetrics = {
    scripts: [] as any[],
    stylesheets: [] as any[],
    images: [] as any[],
    fonts: [] as any[],
    total: 0,
    totalSize: 0
  };

  resources.forEach((resource: any) => {
    const metric = {
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      cached: resource.transferSize === 0 && resource.duration > 0
    };

    if (resource.initiatorType === 'script') {
      resourceMetrics.scripts.push(metric);
    } else if (resource.initiatorType === 'css' || resource.initiatorType === 'link') {
      resourceMetrics.stylesheets.push(metric);
    } else if (resource.initiatorType === 'img') {
      resourceMetrics.images.push(metric);
    } else if (resource.name.includes('font')) {
      resourceMetrics.fonts.push(metric);
    }

    resourceMetrics.total++;
    resourceMetrics.totalSize += metric.size;
  });

  return resourceMetrics;
}

// Bundle size tracking
export function trackBundleSize() {
  if (!window.performance || !window.performance.getEntriesByType) return;

  const resources = window.performance.getEntriesByType('resource');
  const bundles = resources.filter((r: any) => 
    r.name.includes('.js') && r.name.includes('/assets/')
  );

  const bundleMetrics = bundles.map((bundle: any) => ({
    name: bundle.name.split('/').pop(),
    size: bundle.transferSize || bundle.encodedBodySize || 0,
    duration: bundle.duration,
    cached: bundle.transferSize === 0 && bundle.duration > 0
  }));

  const totalBundleSize = bundleMetrics.reduce((sum, b) => sum + b.size, 0);

  if (import.meta.env.DEV) {
    console.table(bundleMetrics);
      }

  return { bundles: bundleMetrics, totalSize: totalBundleSize };
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (!window.performance || !(window.performance as any).memory) return null;

  const memory = (window.performance as any).memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
  };
}

// Long task monitoring
export function monitorLongTasks(callback?: (task: any) => void) {
  if (!window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (import.meta.env.DEV) {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
        
        if (callback) {
          callback(entry);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    return observer;
  } catch (e) {
    // Long task observer not supported
    return null;
  }
}

// Network information
export function getNetworkInfo() {
  const nav = navigator as any;
  if (!nav.connection) return null;

  return {
    effectiveType: nav.connection.effectiveType,
    downlink: nav.connection.downlink,
    rtt: nav.connection.rtt,
    saveData: nav.connection.saveData
  };
}

// Performance budget checker
export interface PerformanceBudget {
  FCP?: number;
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
  bundleSize?: number;
}

export function checkPerformanceBudget(
  metrics: PerformanceMetrics,
  budget: PerformanceBudget
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (budget.FCP && metrics.FCP && metrics.FCP > budget.FCP) {
    violations.push(`FCP exceeded budget: ${metrics.FCP}ms > ${budget.FCP}ms`);
  }

  if (budget.LCP && metrics.LCP && metrics.LCP > budget.LCP) {
    violations.push(`LCP exceeded budget: ${metrics.LCP}ms > ${budget.LCP}ms`);
  }

  if (budget.FID && metrics.FID && metrics.FID > budget.FID) {
    violations.push(`FID exceeded budget: ${metrics.FID}ms > ${budget.FID}ms`);
  }

  if (budget.CLS && metrics.CLS && metrics.CLS > budget.CLS) {
    violations.push(`CLS exceeded budget: ${metrics.CLS} > ${budget.CLS}`);
  }

  if (budget.TTFB && metrics.TTFB && metrics.TTFB > budget.TTFB) {
    violations.push(`TTFB exceeded budget: ${metrics.TTFB}ms > ${budget.TTFB}ms`);
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

// Export singleton instance
let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor();
  
  return {
    getMetrics: () => monitor.getMetrics(),
    reportAllMetrics: () => monitor.reportAllMetrics(),
    measureResourceTiming,
    trackBundleSize,
    monitorMemoryUsage,
    getNetworkInfo
  };
}