/**
 * Structured Data Service for SEO
 * Generates JSON-LD structured data for better search engine understanding
 */

export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  alternateName?: string
  url: string
  logo: string
  description: string
  sameAs: string[]
  contactPoint?: {
    '@type': 'ContactPoint'
    contactType: string
    availableLanguage: string[]
    areaServed: string
  }
}

export interface WebSiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  description: string
  potentialAction?: {
    '@type': 'SearchAction'
    target: {
      '@type': 'EntryPoint'
      urlTemplate: string
    }
    'query-input': string
  }
  inLanguage: string[]
  isAccessibleForFree: boolean
}

export interface ArticleSchema {
  '@context': 'https://schema.org'
  '@type': 'NewsArticle' | 'Article' | 'BlogPosting'
  headline: string
  description: string
  image?: string[]
  datePublished: string
  dateModified?: string
  author: {
    '@type': 'Person' | 'Organization'
    name: string
    url?: string
  }
  publisher: {
    '@type': 'Organization'
    name: string
    logo: {
      '@type': 'ImageObject'
      url: string
    }
  }
  mainEntityOfPage?: {
    '@type': 'WebPage'
    '@id': string
  }
  keywords?: string[]
  articleSection?: string
  inLanguage?: string
}

export interface EventSchema {
  '@context': 'https://schema.org'
  '@type': 'Event'
  name: string
  description: string
  startDate: string
  endDate?: string
  location: {
    '@type': 'Place'
    name: string
    address?: {
      '@type': 'PostalAddress'
      streetAddress?: string
      addressLocality: string
      addressRegion?: string
      addressCountry: string
    }
  }
  image?: string[]
  offers?: {
    '@type': 'Offer'
    price?: string
    priceCurrency?: string
    availability?: string
    url?: string
  }
  performer?: {
    '@type': 'Person' | 'Organization'
    name: string
  }
  organizer?: {
    '@type': 'Organization'
    name: string
    url?: string
  }
}

export interface LocalBusinessSchema {
  '@context': 'https://schema.org'
  '@type': 'Restaurant' | 'CafeOrCoffeeShop' | 'NightClub' | 'TouristAttraction'
  name: string
  description: string
  image?: string[]
  address: {
    '@type': 'PostalAddress'
    streetAddress?: string
    addressLocality: string
    addressRegion?: string
    addressCountry: string
  }
  geo?: {
    '@type': 'GeoCoordinates'
    latitude: number
    longitude: number
  }
  url?: string
  telephone?: string
  openingHoursSpecification?: Array<{
    '@type': 'OpeningHoursSpecification'
    dayOfWeek: string[]
    opens: string
    closes: string
  }>
  priceRange?: string
  servesCuisine?: string[]
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: number
    reviewCount: number
  }
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item?: string
  }>
}

export interface FAQSchema {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
}

export class StructuredDataService {
  private static readonly siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://mydub.ai'
  private static readonly siteName = 'MyDub.AI'
  private static readonly siteDescription = 'Your AI-powered Dubai companion - Get real-time information about Dubai news, events, restaurants, and government services'

  /**
   * Generate organization schema (used on all pages)
   */
  static getOrganizationSchema(): OrganizationSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteName,
      alternateName: 'MyDub AI',
      url: this.siteUrl,
      logo: `${this.siteUrl}/icon-512x512.png`,
      description: this.siteDescription,
      sameAs: [
        'https://twitter.com/mydubai',
        'https://www.facebook.com/mydubai',
        'https://www.instagram.com/mydubai',
        'https://www.linkedin.com/company/mydubai'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['English', 'Arabic', 'Hindi', 'Urdu'],
        areaServed: 'AE'
      }
    }
  }

  /**
   * Generate website schema with search action
   */
  static getWebSiteSchema(): WebSiteSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url: this.siteUrl,
      description: this.siteDescription,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.siteUrl}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      inLanguage: ['en', 'ar', 'hi', 'ur'],
      isAccessibleForFree: true
    }
  }

  /**
   * Generate article schema for news/blog posts
   */
  static getArticleSchema(article: {
    title: string
    description: string
    imageUrl?: string
    publishedDate: string
    modifiedDate?: string
    author?: string
    section?: string
    keywords?: string[]
    url: string
  }): ArticleSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.description,
      image: article.imageUrl ? [article.imageUrl] : undefined,
      datePublished: article.publishedDate,
      dateModified: article.modifiedDate || article.publishedDate,
      author: {
        '@type': 'Organization',
        name: article.author || this.siteName
      },
      publisher: {
        '@type': 'Organization',
        name: this.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${this.siteUrl}/icon-512x512.png`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': article.url
      },
      keywords: article.keywords,
      articleSection: article.section,
      inLanguage: 'en'
    }
  }

  /**
   * Generate event schema
   */
  static getEventSchema(event: {
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
    url?: string
  }): EventSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: {
        '@type': 'Place',
        name: event.location,
        address: {
          '@type': 'PostalAddress',
          addressLocality: event.city || 'Dubai',
          addressCountry: 'AE'
        }
      },
      image: event.image ? [event.image] : undefined,
      offers: event.price ? {
        '@type': 'Offer',
        price: event.price,
        priceCurrency: event.currency || 'AED',
        availability: 'https://schema.org/InStock',
        url: event.url
      } : undefined,
      organizer: event.organizer ? {
        '@type': 'Organization',
        name: event.organizer,
        url: event.url
      } : undefined
    }
  }

  /**
   * Generate restaurant/business schema
   */
  static getRestaurantSchema(restaurant: {
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
  }): LocalBusinessSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: restaurant.name,
      description: restaurant.description,
      image: restaurant.image ? [restaurant.image] : undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: restaurant.address,
        addressLocality: restaurant.area,
        addressRegion: 'Dubai',
        addressCountry: 'AE'
      },
      geo: restaurant.coordinates ? {
        '@type': 'GeoCoordinates',
        latitude: restaurant.coordinates.lat,
        longitude: restaurant.coordinates.lng
      } : undefined,
      telephone: restaurant.phone,
      openingHoursSpecification: restaurant.hours?.map(h => ({
        '@type': 'OpeningHoursSpecification' as const,
        dayOfWeek: h.days,
        opens: h.open,
        closes: h.close
      })),
      priceRange: restaurant.priceRange,
      servesCuisine: restaurant.cuisine,
      aggregateRating: restaurant.rating ? {
        '@type': 'AggregateRating',
        ratingValue: restaurant.rating,
        reviewCount: restaurant.reviewCount || 0
      } : undefined
    }
  }

  /**
   * Generate breadcrumb schema
   */
  static getBreadcrumbSchema(breadcrumbs: Array<{ name: string; url?: string }>): BreadcrumbSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem' as const,
        position: index + 1,
        name: crumb.name,
        item: crumb.url ? `${this.siteUrl}${crumb.url}` : undefined
      }))
    }
  }

  /**
   * Generate FAQ schema
   */
  static getFAQSchema(faqs: Array<{ question: string; answer: string }>): FAQSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question' as const,
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer' as const,
          text: faq.answer
        }
      }))
    }
  }

  /**
   * Generate all relevant schemas for a page
   */
  static generatePageSchemas(pageType: string, data?: any): string {
    const schemas: any[] = []

    // Always include organization and website schemas
    schemas.push(this.getOrganizationSchema())
    
    // Add page-specific schemas
    switch (pageType) {
      case 'home':
        schemas.push(this.getWebSiteSchema())
        break
        
      case 'article':
        if (data) {
          schemas.push(this.getArticleSchema(data))
        }
        break
        
      case 'event':
        if (data) {
          schemas.push(this.getEventSchema(data))
        }
        break
        
      case 'restaurant':
        if (data) {
          schemas.push(this.getRestaurantSchema(data))
        }
        break
        
      case 'faq':
        if (data?.faqs) {
          schemas.push(this.getFAQSchema(data.faqs))
        }
        break
    }

    // Add breadcrumbs if provided
    if (data?.breadcrumbs) {
      schemas.push(this.getBreadcrumbSchema(data.breadcrumbs))
    }

    // Return as script tags
    return schemas
      .map(schema => `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`)
      .join('\n')
  }

  /**
   * Inject structured data into document head
   */
  static injectStructuredData(pageType: string, data?: any): void {
    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]')
    existingScripts.forEach(script => script.remove())

    // Generate and inject new structured data
    const schemas = this.generatePageSchemas(pageType, data)
    const container = document.createElement('div')
    container.innerHTML = schemas
    
    container.querySelectorAll('script').forEach(script => {
      document.head.appendChild(script)
    })
  }
}