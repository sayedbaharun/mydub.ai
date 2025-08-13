import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP } from 'web-vitals'

interface PerformanceMetrics {
  CLS?: number
  FCP?: number
  FID?: number
  LCP?: number
  TTFB?: number
  INP?: number
  navigationTiming?: PerformanceNavigationTiming
  resourceTiming?: PerformanceResourceTiming[]
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: Map<string, PerformanceObserver> = new Map()
  private analyticsEndpoint: string
  
  constructor(analyticsEndpoint = '/api/analytics/performance') {
    this.analyticsEndpoint = analyticsEndpoint
  }

  init() {
    // Core Web Vitals
    this.measureWebVitals()
    
    // Navigation timing
    this.measureNavigationTiming()
    
    // Resource timing
    this.observeResources()
    
    // Long tasks
    this.observeLongTasks()
    
    // Layout shifts
    this.observeLayoutShifts()
    
    // First input delay
    this.observeFirstInput()
    
    // Send metrics on page unload
    this.setupUnloadHandler()
  }

  private measureWebVitals() {
    onCLS((metric) => {
      this.metrics.CLS = metric.value
      this.logMetric('CLS', metric.value)
    })

    onFCP((metric) => {
      this.metrics.FCP = metric.value
      this.logMetric('FCP', metric.value)
    })

    onFID((metric) => {
      this.metrics.FID = metric.value
      this.logMetric('FID', metric.value)
    })

    onLCP((metric) => {
      this.metrics.LCP = metric.value
      this.logMetric('LCP', metric.value)
    })

    onTTFB((metric) => {
      this.metrics.TTFB = metric.value
      this.logMetric('TTFB', metric.value)
    })

    onINP((metric) => {
      this.metrics.INP = metric.value
      this.logMetric('INP', metric.value)
    })
  }

  private measureNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navigationEntries.length > 0) {
        this.metrics.navigationTiming = navigationEntries[0]
        
        // Calculate key metrics
        const timing = navigationEntries[0]
        const metrics = {
          dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
          tcpConnection: timing.connectEnd - timing.connectStart,
          request: timing.responseStart - timing.requestStart,
          response: timing.responseEnd - timing.responseStart,
          domProcessing: timing.domComplete - timing.domInteractive,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
          loadComplete: timing.loadEventEnd - timing.loadEventStart,
        }
        
        Object.entries(metrics).forEach(([key, value]) => {
          this.logMetric(`navigation.${key}`, value)
        })
      }
    }
  }

  private observeResources() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[]
        
        entries.forEach((entry) => {
          // Track slow resources
          if (entry.duration > 1000) {
            this.logMetric('slowResource', {
              name: entry.name,
              duration: entry.duration,
              type: entry.initiatorType,
              size: entry.transferSize || 0,
            })
          }
        })
        
        // Store resource timing
        this.metrics.resourceTiming = [
          ...(this.metrics.resourceTiming || []),
          ...entries,
        ]
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.set('resource', resourceObserver)
      } catch (e) {
        console.warn('Resource timing not supported')
      }
    }
  }

  private observeLongTasks() {
    if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          this.logMetric('longTask', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          })
        })
      })

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', longTaskObserver)
      } catch (e) {
        console.warn('Long task timing not supported')
      }
    }
  }

  private observeLayoutShifts() {
    if ('PerformanceObserver' in window) {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            this.logMetric('layoutShift', {
              value: entry.value,
              startTime: entry.startTime,
              sources: entry.sources?.map((source: any) => ({
                node: source.node?.tagName,
                previousRect: source.previousRect,
                currentRect: source.currentRect,
              })),
            })
          }
        })
      })

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.set('layout-shift', layoutShiftObserver)
      } catch (e) {
        console.warn('Layout shift timing not supported')
      }
    }
  }

  private observeFirstInput() {
    if ('PerformanceObserver' in window) {
      const firstInputObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstInput = entries[0] as any
        
        if (firstInput) {
          const delay = firstInput.processingStart - firstInput.startTime
          this.logMetric('firstInputDelay', {
            delay,
            target: firstInput.target?.tagName,
            type: firstInput.name,
          })
        }
      })

      try {
        firstInputObserver.observe({ entryTypes: ['first-input'] })
        this.observers.set('first-input', firstInputObserver)
      } catch (e) {
        console.warn('First input timing not supported')
      }
    }
  }

  private setupUnloadHandler() {
    const sendMetrics = () => {
      this.sendMetrics()
    }

    // Use both for better coverage
    window.addEventListener('beforeunload', sendMetrics)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendMetrics()
      }
    })
  }

  private logMetric(name: string, value: any) {
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}:`, value)
    }
  }

  private sendMetrics() {
    const data = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
      } : null,
    }

    // Send using beacon API for reliability
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(this.analyticsEndpoint, JSON.stringify(data))
    } else {
      // Fallback to fetch
      fetch(this.analyticsEndpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignore errors on unload
      })
    }
  }

  destroy() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export utility functions
export function trackPerformanceMark(markName: string) {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(markName)
  }
}

export function trackPerformanceMeasure(
  measureName: string,
  startMark: string,
  endMark?: string
) {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(measureName, startMark, endMark)
    } catch (e) {
      console.warn('Performance measure failed:', e)
    }
  }
}

// React-specific performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return (props: P) => {
    React.useEffect(() => {
      trackPerformanceMark(`${componentName}-mount-start`)
      
      return () => {
        trackPerformanceMark(`${componentName}-mount-end`)
        trackPerformanceMeasure(
          `${componentName}-mount`,
          `${componentName}-mount-start`,
          `${componentName}-mount-end`
        )
      }
    }, [])

    return <Component {...props} />
  }
}