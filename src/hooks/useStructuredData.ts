import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { StructuredDataService } from '@/services/seo/structured-data.service'

/**
 * Hook to manage structured data (JSON-LD) for SEO
 * Automatically updates structured data when route changes
 */
export function useStructuredData(pageType: string, data?: any) {
  const location = useLocation()

  useEffect(() => {
    // Add breadcrumbs based on current path
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      ...pathSegments.map((segment, index) => ({
        name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        url: index === pathSegments.length - 1 ? undefined : `/${pathSegments.slice(0, index + 1).join('/')}`
      }))
    ]

    // Merge breadcrumbs with provided data
    const enrichedData = {
      ...data,
      breadcrumbs,
      url: `${import.meta.env.VITE_PUBLIC_SITE_URL || 'https://mydub.ai'}${location.pathname}`
    }

    // Inject structured data
    StructuredDataService.injectStructuredData(pageType, enrichedData)

    // Cleanup on unmount
    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      scripts.forEach(script => {
        if (script.textContent?.includes('MyDub.AI')) {
          script.remove()
        }
      })
    }
  }, [pageType, data, location.pathname])
}

/**
 * Hook for article pages
 */
export function useArticleStructuredData(article: {
  title: string
  description: string
  imageUrl?: string
  publishedDate: string
  modifiedDate?: string
  author?: string
  section?: string
  keywords?: string[]
}) {
  const location = useLocation()
  
  useStructuredData('article', {
    ...article,
    url: `${import.meta.env.VITE_PUBLIC_SITE_URL || 'https://mydub.ai'}${location.pathname}`
  })
}

/**
 * Hook for event pages
 */
export function useEventStructuredData(event: {
  name: string
  description: string
  startDate: string
  endDate?: string
  location: string
  city?: string
  image?: string
  price?: string
  currency?: string
  organizer?: string
}) {
  const location = useLocation()
  
  useStructuredData('event', {
    ...event,
    url: `${import.meta.env.VITE_PUBLIC_SITE_URL || 'https://mydub.ai'}${location.pathname}`
  })
}

/**
 * Hook for restaurant/business pages
 */
export function useRestaurantStructuredData(restaurant: {
  name: string
  description: string
  cuisine?: string[]
  priceRange?: string
  image?: string
  address?: string
  area: string
  phone?: string
  rating?: number
  reviewCount?: number
  hours?: Array<{
    days: string[]
    open: string
    close: string
  }>
  coordinates?: { lat: number; lng: number }
}) {
  useStructuredData('restaurant', restaurant)
}