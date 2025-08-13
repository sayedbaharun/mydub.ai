// Core Web Vitals monitoring
export interface WebVitalsMetrics {
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift
  TTFB: number | null; // Time to First Byte
  FCP: number | null; // First Contentful Paint
  INP: number | null; // Interaction to Next Paint
}

export interface PerformanceMetrics extends WebVitalsMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    FCP: null,
    INP: null,
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    timestamp: Date.now(),
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor page load performance
    this.monitorPageLoad();

    // Monitor Core Web Vitals
    this.monitorWebVitals();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor bundle size (approximate)
    this.monitorBundleSize();
  }

  private monitorPageLoad() {
    if ('performance' in window && window.performance.timing) {
      window.addEventListener('load', () => {
        const timing = window.performance.timing;
        this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
        this.metrics.renderTime = timing.domComplete - timing.domLoading;
        this.metrics.TTFB = timing.responseStart - timing.navigationStart;
      });
    }
  }

  private monitorWebVitals() {
    try {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // FCP (First Contentful Paint)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.FCP = fcpEntry.startTime;
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only count layout shifts without recent user input
          if (!(entry as any).hadRecentInput) {
            clsEntries.push(entry);
            clsValue += (entry as any).value;
          }
        }
        this.metrics.CLS = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // FID (First Input Delay) - simplified version
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0 && this.metrics.FID === null) {
          const firstEntry = entries[0];
          this.metrics.FID = (firstEntry as any).processingStart - firstEntry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

    } catch (error) {
      // Performance Observer API not supported
    }
  }

  private monitorMemoryUsage() {
    if ('memory' in performance && (performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
      }, 5000);
    }
  }

  private monitorBundleSize() {
    // Estimate bundle size from loaded resources
    if ('getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.endsWith('.js'));
      const totalSize = jsResources.reduce((sum, r) => sum + (r as any).transferSize || 0, 0);
      this.metrics.bundleSize = totalSize;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics, timestamp: Date.now() };
  }

  public reportMetrics() {
    const metrics = this.getMetrics();
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('🚀 Performance Metrics');
                                                            console.groupEnd();
    }

    // Send to analytics if configured
    this.sendToAnalytics(metrics);
  }

  private sendToAnalytics(metrics: PerformanceMetrics) {
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      
      // Send Web Vitals
      if (metrics.LCP !== null) {
        gtag('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: 'LCP',
          value: Math.round(metrics.LCP),
          metric_value: metrics.LCP,
        });
      }

      if (metrics.FID !== null) {
        gtag('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: 'FID',
          value: Math.round(metrics.FID),
          metric_value: metrics.FID,
        });
      }

      if (metrics.CLS !== null) {
        gtag('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: 'CLS',
          value: Math.round(metrics.CLS * 1000), // Convert to milliseconds for GA
          metric_value: metrics.CLS,
        });
      }
    }

    // You can also send to other analytics services here
  }

  public checkPerformanceThresholds(): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check Core Web Vitals thresholds (Good values)
    if (this.metrics.LCP !== null && this.metrics.LCP > 2500) {
      issues.push(`LCP is ${this.metrics.LCP}ms (should be < 2500ms)`);
    }
    
    if (this.metrics.FID !== null && this.metrics.FID > 100) {
      issues.push(`FID is ${this.metrics.FID}ms (should be < 100ms)`);
    }
    
    if (this.metrics.CLS !== null && this.metrics.CLS > 0.1) {
      issues.push(`CLS is ${this.metrics.CLS} (should be < 0.1)`);
    }
    
    if (this.metrics.TTFB !== null && this.metrics.TTFB > 800) {
      issues.push(`TTFB is ${this.metrics.TTFB}ms (should be < 800ms)`);
    }
    
    if (this.metrics.loadTime > 3000) {
      issues.push(`Page load time is ${this.metrics.loadTime}ms (should be < 3000ms)`);
    }
    
    return {
      passed: issues.length === 0,
      issues,
    };
  }

  public destroy() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

// Helper to track component render performance
export function measureComponentPerformance(componentName: string, callback: () => void) {
  const startTime = performance.now();
  callback();
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  if (import.meta.env.DEV && renderTime > 16) { // 16ms = 60fps threshold
      }
  
  return renderTime;
}

// Export Web Vitals helper
export async function reportWebVitals() {
  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');
    
    onCLS((metric) => console.debug('CLS:', metric));
    onFID((metric) => console.debug('FID:', metric));
    onFCP((metric) => console.debug('FCP:', metric));
    onLCP((metric) => console.debug('LCP:', metric));
    onTTFB((metric) => console.debug('TTFB:', metric));
  } catch (error) {
    // Web vitals not supported
  }
}