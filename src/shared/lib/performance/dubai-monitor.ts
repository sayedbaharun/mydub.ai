/**
 * Performance monitoring for Dubai/UAE users
 * Tracks key metrics and reports to analytics
 */

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  apiLatency?: Record<string, number>;
  cacheHitRate?: number;
  country?: string;
  city?: string;
}

class DubaiPerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private apiTimings: Map<string, number[]> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor Core Web Vitals
    this.monitorWebVitals();
    
    // Monitor API calls
    this.monitorAPIPerformance();
    
    // Get user location from CloudFlare headers
    this.detectUserLocation();
    
    // Send metrics every 30 seconds
    setInterval(() => this.reportMetrics(), 30000);
  }

  private monitorWebVitals() {
    // Using web-vitals library pattern
    if ('PerformanceObserver' in window) {
      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.error('LCP monitoring failed:', e);
      }

      // FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.error('FID monitoring failed:', e);
      }

      // CLS
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsEntries.push(entry);
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cls = clsValue;
      });
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.error('CLS monitoring failed:', e);
      }
    }

    // TTFB and FCP from Navigation Timing API
    if ('performance' in window && window.performance.timing) {
      const navTiming = window.performance.timing;
      this.metrics.ttfb = navTiming.responseStart - navTiming.fetchStart;
      
      // Get FCP from paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
      }
    }
  }

  private monitorAPIPerformance() {
    // Intercept fetch to measure API latency
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0] as string;
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Track API timings
        if (url.includes('/api/')) {
          const endpoint = new URL(url, window.location.origin).pathname;
          this.recordAPITiming(endpoint, duration);
        }
        
        // Check cache status
        const cacheStatus = response.headers.get('cf-cache-status');
        if (cacheStatus === 'HIT') {
          this.incrementCacheHit();
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.recordAPITiming(url, duration);
        throw error;
      }
    };
  }

  private recordAPITiming(endpoint: string, duration: number) {
    if (!this.apiTimings.has(endpoint)) {
      this.apiTimings.set(endpoint, []);
    }
    this.apiTimings.get(endpoint)!.push(duration);
    
    // Keep only last 100 timings per endpoint
    const timings = this.apiTimings.get(endpoint)!;
    if (timings.length > 100) {
      timings.shift();
    }
  }

  private incrementCacheHit() {
    // Simple cache hit rate tracking
    if (!this.metrics.cacheHitRate) {
      this.metrics.cacheHitRate = 0;
    }
    // This is simplified - in production, track hits vs misses
    this.metrics.cacheHitRate = Math.min(this.metrics.cacheHitRate + 0.01, 1);
  }

  private detectUserLocation() {
    // Get location from CloudFlare headers via API
    fetch('/api/location')
      .then(res => res.json())
      .then(data => {
        this.metrics.country = data.country;
        this.metrics.city = data.city;
      })
      .catch(() => {
        // Fallback to timezone detection
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Dubai') || timezone.includes('Abu_Dhabi')) {
          this.metrics.country = 'AE';
          this.metrics.city = 'Dubai';
        }
      });
  }

  private reportMetrics() {
    // Calculate average API latencies
    const apiLatency: Record<string, number> = {};
    this.apiTimings.forEach((timings, endpoint) => {
      if (timings.length > 0) {
        apiLatency[endpoint] = timings.reduce((a, b) => a + b, 0) / timings.length;
      }
    });
    this.metrics.apiLatency = apiLatency;

    // Send to analytics endpoint
    this.sendToAnalytics({
      ...this.metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
          }
  }

  private sendToAnalytics(data: any) {
    // Send to your analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(error => {
      console.error('Failed to send performance metrics:', error);
    });

    // Also send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metrics', {
        event_category: 'Performance',
        event_label: data.country || 'unknown',
        value: Math.round(data.lcp || 0),
        custom_map: {
          dimension1: data.city,
          metric1: data.lcp,
          metric2: data.fid,
          metric3: data.cls,
          metric4: data.ttfb,
        },
      });
    }
  }

  // Public methods for manual tracking
  public trackCustomMetric(name: string, value: number) {
    (this.metrics as any)[name] = value;
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

// Create singleton instance
let monitorInstance: DubaiPerformanceMonitor | null = null;

export function initPerformanceMonitoring() {
  if (!monitorInstance && typeof window !== 'undefined') {
    monitorInstance = new DubaiPerformanceMonitor();
  }
  return monitorInstance;
}

export function getPerformanceMonitor() {
  return monitorInstance;
}