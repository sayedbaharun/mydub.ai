// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Measure component render time
  measureRender(componentName: string, callback: () => void): void {
    const startTime = performance.now()
    callback()
    const endTime = performance.now()
    const renderTime = endTime - startTime

    this.recordMetric(`${componentName}_render`, renderTime)
  }

  // Record a metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)

    // Keep only last 100 measurements
    const metrics = this.metrics.get(name)!
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  // Get average metric value
  getAverageMetric(name: string): number {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return 0

    const sum = metrics.reduce((acc, val) => acc + val, 0)
    return sum / metrics.length
  }

  // Get all metrics
  getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {}

    this.metrics.forEach((values, name) => {
      result[name] = {
        average: this.getAverageMetric(name),
        count: values.length
      }
    })

    return result
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear()
  }

  // Log performance metrics to console
  logMetrics(): void {
    console.group('Performance Metrics')
    const metrics = this.getAllMetrics()
    Object.entries(metrics).forEach(([name, data]) => {
      console.log(`${name}: avg=${data.average.toFixed(2)}ms, count=${data.count}`)
    })
    console.groupEnd()
  }
}

// Web Vitals monitoring
export function initWebVitals() {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      PerformanceMonitor.getInstance().recordMetric('lcp', lastEntry.startTime)
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        const delay = entry.processingStart - entry.startTime
        PerformanceMonitor.getInstance().recordMetric('fid', delay)
      })
    })
    fidObserver.observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          PerformanceMonitor.getInstance().recordMetric('cls', clsValue)
        }
      })
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  }
}

// Resource loading performance
export function measureResourceLoading() {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (perfData) {
      const metrics = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        request: perfData.responseStart - perfData.requestStart,
        response: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domComplete - perfData.domInteractive,
        load: perfData.loadEventEnd - perfData.loadEventStart,
        total: perfData.loadEventEnd - perfData.fetchStart
      }

      console.group('Resource Loading Metrics')
      Object.entries(metrics).forEach(([name, value]) => {
        console.log(`${name}: ${value.toFixed(2)}ms`)
        PerformanceMonitor.getInstance().recordMetric(`resource_${name}`, value)
      })
      console.groupEnd()
    }
  })
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory
      const usedMemoryMB = memory.usedJSHeapSize / 1048576
      const totalMemoryMB = memory.totalJSHeapSize / 1048576
      const limitMemoryMB = memory.jsHeapSizeLimit / 1048576

      console.log(`Memory Usage: ${usedMemoryMB.toFixed(2)}MB / ${totalMemoryMB.toFixed(2)}MB (limit: ${limitMemoryMB.toFixed(2)}MB)`)
      
      PerformanceMonitor.getInstance().recordMetric('memory_used', usedMemoryMB)
      PerformanceMonitor.getInstance().recordMetric('memory_total', totalMemoryMB)
    }, 30000) // Check every 30 seconds
  }
}

// Initialize all performance monitoring
export function initPerformanceMonitoring() {
  initWebVitals()
  measureResourceLoading()
  monitorMemoryUsage()

  // Log metrics every 5 minutes in development
  if (import.meta.env.DEV) {
    setInterval(() => {
      PerformanceMonitor.getInstance().logMetrics()
    }, 300000)
  }
}