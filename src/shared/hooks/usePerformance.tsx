import { useEffect, useRef } from 'react'
import { PerformanceMonitor } from '@/shared/lib/performance'

interface UsePerformanceOptions {
  componentName: string
  trackRender?: boolean
  trackMount?: boolean
  trackUpdate?: boolean
}

export function usePerformance({
  componentName,
  trackRender = true,
  trackMount = true,
  trackUpdate = true
}: UsePerformanceOptions) {
  const renderCount = useRef(0)
  const mountTime = useRef<number>(0)
  const monitor = PerformanceMonitor.getInstance()

  // Track component mount
  useEffect(() => {
    if (trackMount) {
      mountTime.current = performance.now()
      
      return () => {
        const unmountTime = performance.now()
        const lifetimeMs = unmountTime - mountTime.current
        monitor.recordMetric(`${componentName}_lifetime`, lifetimeMs)
      }
    }
  }, [componentName, trackMount, monitor])

  // Track renders
  useEffect(() => {
    if (trackRender) {
      renderCount.current++
      monitor.recordMetric(`${componentName}_render_count`, renderCount.current)
    }
  })

  // Track updates
  useEffect(() => {
    if (trackUpdate && renderCount.current > 1) {
      monitor.recordMetric(`${componentName}_update`, 1)
    }
  })

  // Measure function execution time
  const measureFunction = <T extends (...args: any[]) => any>(
    functionName: string,
    fn: T
  ): T => {
    return ((...args: Parameters<T>) => {
      const startTime = performance.now()
      const result = fn(...args)
      const endTime = performance.now()
      const executionTime = endTime - startTime

      monitor.recordMetric(`${componentName}_${functionName}`, executionTime)

      return result
    }) as T
  }

  // Measure async function execution time
  const measureAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
    functionName: string,
    fn: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      const startTime = performance.now()
      try {
        const result = await fn(...args)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        monitor.recordMetric(`${componentName}_${functionName}`, executionTime)

        return result
      } catch (error) {
        const endTime = performance.now()
        const executionTime = endTime - startTime

        monitor.recordMetric(`${componentName}_${functionName}_error`, executionTime)
        throw error
      }
    }) as T
  }

  return {
    measureFunction,
    measureAsyncFunction,
    getRenderCount: () => renderCount.current,
    getLifetime: () => performance.now() - mountTime.current
  }
}

// Hook to track user interactions
export function useInteractionTracking(interactionName: string) {
  const monitor = PerformanceMonitor.getInstance()
  const startTime = useRef<number | null>(null)

  const startInteraction = () => {
    startTime.current = performance.now()
  }

  const endInteraction = (success: boolean = true) => {
    if (startTime.current !== null) {
      const duration = performance.now() - startTime.current
      const metricName = success 
        ? `interaction_${interactionName}_success`
        : `interaction_${interactionName}_failure`
      
      monitor.recordMetric(metricName, duration)
      startTime.current = null
    }
  }

  return {
    startInteraction,
    endInteraction
  }
}

// Hook to track API call performance
export function useApiPerformance() {
  const monitor = PerformanceMonitor.getInstance()

  const trackApiCall = async <T,>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const duration = performance.now() - startTime
      
      monitor.recordMetric(`api_${endpoint}_success`, duration)
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      monitor.recordMetric(`api_${endpoint}_error`, duration)
      throw error
    }
  }

  return { trackApiCall }
}