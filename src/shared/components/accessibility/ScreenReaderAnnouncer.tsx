/**
 * Screen Reader Announcer for MyDub.ai
 * Provides live region announcements for dynamic content changes
 */

import React, { useEffect, useRef, createContext, useContext, ReactNode } from 'react'

interface AnnouncementMessage {
  id: string
  message: string
  priority: 'polite' | 'assertive'
  timestamp: number
}

interface ScreenReaderContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  announceRoute: (routeName: string, description?: string) => void
  announceError: (error: string) => void
  announceSuccess: (message: string) => void
  announceLoading: (action: string) => void
  announceLoadingComplete: (result: string) => void
}

const ScreenReaderContext = createContext<ScreenReaderContextType | null>(null)

interface ScreenReaderProviderProps {
  children: ReactNode
}

export function ScreenReaderProvider({ children }: ScreenReaderProviderProps) {
  const politeRef = useRef<HTMLDivElement>(null)
  const assertiveRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<AnnouncementMessage[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!message.trim()) return

    // Create unique ID for this announcement
    const id = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const announcement: AnnouncementMessage = {
      id,
      message: message.trim(),
      priority,
      timestamp: Date.now()
    }

    // Add to messages queue
    messagesRef.current.push(announcement)

    // Get the appropriate live region
    const liveRegion = priority === 'assertive' ? assertiveRef.current : politeRef.current
    
    if (liveRegion) {
      // Clear existing content
      liveRegion.textContent = ''
      
      // Small delay to ensure screen readers pick up the change
      setTimeout(() => {
        liveRegion.textContent = message
      }, 50)

      // Clean up after announcement
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        if (liveRegion.textContent === message) {
          liveRegion.textContent = ''
        }
        // Remove old messages from queue
        messagesRef.current = messagesRef.current.filter(
          msg => Date.now() - msg.timestamp < 5000
        )
      }, 2000)
    }
  }

  const announceRoute = (routeName: string, description?: string) => {
    const message = description 
      ? `Navigated to ${routeName}. ${description}`
      : `Navigated to ${routeName}`
    announce(message, 'polite')
  }

  const announceError = (error: string) => {
    announce(`Error: ${error}`, 'assertive')
  }

  const announceSuccess = (message: string) => {
    announce(`Success: ${message}`, 'polite')
  }

  const announceLoading = (action: string) => {
    announce(`Loading ${action}...`, 'polite')
  }

  const announceLoadingComplete = (result: string) => {
    announce(`Finished loading. ${result}`, 'polite')
  }

  const contextValue: ScreenReaderContextType = {
    announce,
    announceRoute,
    announceError,
    announceSuccess,
    announceLoading,
    announceLoadingComplete
  }

  return (
    <ScreenReaderContext.Provider value={contextValue}>
      {children}
      {/* Live regions for screen reader announcements */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      />
    </ScreenReaderContext.Provider>
  )
}

export function useScreenReader() {
  const context = useContext(ScreenReaderContext)
  if (!context) {
    // Return a no-op implementation if used outside provider
    console.warn('useScreenReader used outside of ScreenReaderProvider')
    return {
      announce: () => {},
      announceRoute: () => {},
      announceError: () => {},
      announceSuccess: () => {},
      announceLoading: () => {},
      announceLoadingComplete: () => {}
    }
  }
  return context
}

/**
 * Component for dynamic content updates
 */
interface DynamicContentAnnouncerProps {
  /** Content that changed */
  content: string
  /** Whether to announce the change */
  shouldAnnounce?: boolean
  /** Priority of the announcement */
  priority?: 'polite' | 'assertive'
  /** Prefix for the announcement */
  prefix?: string
  /** Suffix for the announcement */
  suffix?: string
}

export function DynamicContentAnnouncer({
  content,
  shouldAnnounce = true,
  priority = 'polite',
  prefix = '',
  suffix = ''
}: DynamicContentAnnouncerProps) {
  const { announce } = useScreenReader()
  const previousContent = useRef<string>('')

  useEffect(() => {
    if (shouldAnnounce && content !== previousContent.current && content.trim()) {
      const message = `${prefix}${content}${suffix}`.trim()
      announce(message, priority)
      previousContent.current = content
    }
  }, [content, shouldAnnounce, priority, prefix, suffix, announce])

  return null
}

/**
 * Hook for announcing data loading states
 */
export function useLoadingAnnouncer() {
  const { announceLoading, announceLoadingComplete, announceError } = useScreenReader()

  const announceDataLoading = (dataType: string) => {
    announceLoading(`${dataType} data`)
  }

  const announceDataLoaded = (dataType: string, count?: number) => {
    const countMessage = count !== undefined ? ` Found ${count} items.` : ''
    announceLoadingComplete(`${dataType} data loaded.${countMessage}`)
  }

  const announceDataError = (dataType: string, error?: string) => {
    const errorMessage = error ? ` ${error}` : ''
    announceError(`Failed to load ${dataType} data.${errorMessage}`)
  }

  return {
    announceDataLoading,
    announceDataLoaded,
    announceDataError
  }
}

/**
 * Hook for announcing form states
 */
export function useFormAnnouncer() {
  const { announce, announceError, announceSuccess } = useScreenReader()

  const announceFieldError = (fieldName: string, error: string) => {
    announceError(`${fieldName}: ${error}`)
  }

  const announceFormSubmission = () => {
    announce('Submitting form...', 'polite')
  }

  const announceFormSuccess = (message: string = 'Form submitted successfully') => {
    announceSuccess(message)
  }

  const announceFormError = (message: string = 'Form submission failed') => {
    announceError(message)
  }

  const announceValidation = (isValid: boolean, fieldName?: string) => {
    if (fieldName) {
      announce(
        isValid 
          ? `${fieldName} is valid` 
          : `${fieldName} has validation errors`,
        'polite'
      )
    }
  }

  return {
    announceFieldError,
    announceFormSubmission,
    announceFormSuccess,
    announceFormError,
    announceValidation
  }
}

/**
 * Hook for announcing search results
 */
export function useSearchAnnouncer() {
  const { announce, announceError } = useScreenReader()

  const announceSearchStart = (query: string) => {
    announce(`Searching for "${query}"...`, 'polite')
  }

  const announceSearchResults = (query: string, count: number) => {
    const message = count === 0 
      ? `No results found for "${query}"` 
      : `Found ${count} result${count === 1 ? '' : 's'} for "${query}"`
    announce(message, 'polite')
  }

  const announceSearchError = (query: string) => {
    announceError(`Search failed for "${query}". Please try again.`)
  }

  const announceFilterApplied = (filterType: string, filterValue: string) => {
    announce(`Applied ${filterType} filter: ${filterValue}`, 'polite')
  }

  const announceFilterCleared = (filterType?: string) => {
    const message = filterType 
      ? `Cleared ${filterType} filter` 
      : 'Cleared all filters'
    announce(message, 'polite')
  }

  return {
    announceSearchStart,
    announceSearchResults,
    announceSearchError,
    announceFilterApplied,
    announceFilterCleared
  }
}

/**
 * Component that announces route changes
 */
export function RouteAnnouncer() {
  const { announceRoute } = useScreenReader()
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => {
      const newPath = window.location.pathname
      if (newPath !== currentPath) {
        setCurrentPath(newPath)
        
        // Extract page name from path
        const pageName = newPath
          .split('/')
          .filter(Boolean)
          .pop() || 'home'
        
        // Convert kebab-case to readable format
        const readableName = pageName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        announceRoute(readableName)
      }
    }

    // Listen for both popstate and pushstate events
    window.addEventListener('popstate', handleLocationChange)
    
    // Override pushState and replaceState to catch programmatic navigation
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args)
      handleLocationChange()
    }
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args)
      handleLocationChange()
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [currentPath, announceRoute])

  return null
}

export default ScreenReaderProvider