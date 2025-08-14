/**
 * Google Analytics 4 Integration
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

/**
 * Initialize Google Analytics
 */
export const initGoogleAnalytics = () => {
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
  
  if (!GA_MEASUREMENT_ID) {
    if (import.meta.env.PROD) {
      console.warn('Google Analytics ID not configured')
    }
    return
  }

  // Load GA script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  window.gtag = function() {
    window.dataLayer.push(arguments)
  }
  
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure',
  })
}

/**
 * Track page views
 */
export const trackPageView = (url: string, title?: string) => {
  if (!window.gtag) return
  
  window.gtag('event', 'page_view', {
    page_location: url,
    page_title: title || document.title,
    page_path: url,
  })
}

/**
 * Track custom events
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!window.gtag) return
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

/**
 * Track user interactions
 */
export const trackInteraction = (
  element: string,
  action: string,
  label?: string
) => {
  trackEvent(`${element}_${action}`, 'UI Interaction', label)
}

/**
 * Track search queries
 */
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  if (!window.gtag) return
  
  window.gtag('event', 'search', {
    search_term: searchTerm,
    results_count: resultsCount,
  })
}

/**
 * Track user timing
 */
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string
) => {
  if (!window.gtag) return
  
  window.gtag('event', 'timing_complete', {
    event_category: category,
    name: variable,
    value: Math.round(value),
    event_label: label,
  })
}

/**
 * Track exceptions
 */
export const trackException = (description: string, fatal: boolean = false) => {
  if (!window.gtag) return
  
  window.gtag('event', 'exception', {
    description: description,
    fatal: fatal,
  })
}

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!window.gtag) return
  
  window.gtag('set', 'user_properties', properties)
}

/**
 * Track e-commerce events
 */
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'AED',
  items?: any[]
) => {
  if (!window.gtag) return
  
  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items,
  })
}

/**
 * Track content engagement
 */
export const trackEngagement = (
  contentType: string,
  contentId: string,
  engagementType: 'view' | 'like' | 'share' | 'comment' | 'bookmark'
) => {
  if (!window.gtag) return
  
  window.gtag('event', `content_${engagementType}`, {
    content_type: contentType,
    content_id: contentId,
  })
}

/**
 * Track video interactions
 */
export const trackVideo = (
  videoTitle: string,
  action: 'play' | 'pause' | 'complete',
  currentTime?: number
) => {
  if (!window.gtag) return
  
  window.gtag('event', `video_${action}`, {
    video_title: videoTitle,
    video_current_time: currentTime,
  })
}

/**
 * Track file downloads
 */
export const trackDownload = (
  fileName: string,
  fileType: string
) => {
  if (!window.gtag) return
  
  window.gtag('event', 'file_download', {
    file_name: fileName,
    file_extension: fileType,
  })
}

/**
 * Track scroll depth
 */
export const trackScrollDepth = (percentage: number) => {
  if (!window.gtag) return
  
  window.gtag('event', 'scroll', {
    percent_scrolled: percentage,
  })
}

/**
 * Track form submissions
 */
export const trackFormSubmission = (
  formName: string,
  success: boolean
) => {
  if (!window.gtag) return
  
  window.gtag('event', 'form_submit', {
    form_name: formName,
    success: success,
  })
}

/**
 * Enhanced Ecommerce: Track product views
 */
export const trackProductView = (product: {
  id: string
  name: string
  category?: string
  price?: number
}) => {
  if (!window.gtag) return
  
  window.gtag('event', 'view_item', {
    currency: 'AED',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: 1,
    }]
  })
}

/**
 * Track social interactions
 */
export const trackSocial = (
  network: string,
  action: string,
  target?: string
) => {
  if (!window.gtag) return
  
  window.gtag('event', 'social', {
    social_network: network,
    social_action: action,
    social_target: target,
  })
}