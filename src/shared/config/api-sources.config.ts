/**
 * API Sources Configuration for AI Reporter System
 * Defines all external APIs that AI agents can fetch data from
 */

export interface APISource {
  name: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  authentication: AuthConfig;
  rateLimit: RateLimitConfig;
  timeout: number; // in milliseconds
  retryConfig: RetryConfig;
  agentTypes: Array<'news' | 'lifestyle' | 'business' | 'tourism' | 'weather'>;
  priority: 'high' | 'medium' | 'low';
}

export interface APIEndpoint {
  name: string;
  path: string;
  method: 'GET' | 'POST';
  description: string;
  parameters?: Record<string, any>;
  headers?: Record<string, string>;
  responseFormat: 'json' | 'xml' | 'text';
  dataPath?: string; // JSON path to extract data
}

export interface AuthConfig {
  type: 'apiKey' | 'bearer' | 'basic' | 'oauth2' | 'none';
  location?: 'header' | 'query' | 'body';
  parameterName?: string;
  credentials?: {
    key?: string;
    secret?: string;
    token?: string;
  };
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  concurrentRequests: number;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  maxDelay: number;
  retryableStatuses: number[];
}

// Get API keys from environment variables
const getApiKey = (key: string): string => {
  return import.meta.env[key] || '';
};

export const API_SOURCES: APISource[] = [
  // NewsAPI
  {
    name: 'NewsAPI',
    baseUrl: 'https://newsapi.org/v2',
    endpoints: [
      {
        name: 'topHeadlines',
        path: '/top-headlines',
        method: 'GET',
        description: 'Get top headlines for UAE/Dubai',
        parameters: {
          country: 'ae',
          pageSize: 100,
        },
        responseFormat: 'json',
        dataPath: 'articles',
      },
      {
        name: 'everything',
        path: '/everything',
        method: 'GET',
        description: 'Search all news articles',
        parameters: {
          q: 'Dubai OR UAE',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 100,
        },
        responseFormat: 'json',
        dataPath: 'articles',
      },
      {
        name: 'businessNews',
        path: '/everything',
        method: 'GET',
        description: 'Business news for Dubai',
        parameters: {
          q: 'Dubai business OR UAE economy',
          language: 'en',
          sortBy: 'relevancy',
          pageSize: 50,
        },
        responseFormat: 'json',
        dataPath: 'articles',
      },
    ],
    authentication: {
      type: 'apiKey',
      location: 'header',
      parameterName: 'X-Api-Key',
      credentials: {
        key: getApiKey('VITE_NEWS_API_KEY'),
      },
    },
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      concurrentRequests: 2,
    },
    timeout: 15000,
    retryConfig: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      maxDelay: 10000,
      retryableStatuses: [429, 500, 502, 503, 504],
    },
    agentTypes: ['news', 'business'],
    priority: 'high',
  },

  // OpenWeather API
  {
    name: 'OpenWeatherMap',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    endpoints: [
      {
        name: 'currentWeather',
        path: '/weather',
        method: 'GET',
        description: 'Current weather in Dubai',
        parameters: {
          q: 'Dubai,AE',
          units: 'metric',
        },
        responseFormat: 'json',
      },
      {
        name: 'forecast',
        path: '/forecast',
        method: 'GET',
        description: '5-day weather forecast',
        parameters: {
          q: 'Dubai,AE',
          units: 'metric',
          cnt: 40,
        },
        responseFormat: 'json',
      },
      {
        name: 'airQuality',
        path: '/air_pollution',
        method: 'GET',
        description: 'Air quality data',
        parameters: {
          lat: 25.2048,
          lon: 55.2708,
        },
        responseFormat: 'json',
      },
    ],
    authentication: {
      type: 'apiKey',
      location: 'query',
      parameterName: 'appid',
      credentials: {
        key: getApiKey('VITE_OPENWEATHER_API_KEY'),
      },
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      concurrentRequests: 5,
    },
    timeout: 10000,
    retryConfig: {
      maxAttempts: 3,
      backoffMultiplier: 1.5,
      maxDelay: 5000,
      retryableStatuses: [429, 500, 502, 503, 504],
    },
    agentTypes: ['weather'],
    priority: 'high',
  },

  // Government Open Data APIs
  {
    name: 'Dubai Data',
    baseUrl: 'https://www.dubaipulse.gov.ae/api',
    endpoints: [
      {
        name: 'datasets',
        path: '/datasets',
        method: 'GET',
        description: 'List of available datasets',
        responseFormat: 'json',
      },
      {
        name: 'trafficData',
        path: '/traffic/realtime',
        method: 'GET',
        description: 'Real-time traffic data',
        responseFormat: 'json',
      },
      {
        name: 'publicTransport',
        path: '/transport/schedules',
        method: 'GET',
        description: 'Public transport schedules',
        responseFormat: 'json',
      },
    ],
    authentication: {
      type: 'apiKey',
      location: 'header',
      parameterName: 'X-API-Key',
      credentials: {
        key: '', // To be configured when available
      },
    },
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      concurrentRequests: 3,
    },
    timeout: 20000,
    retryConfig: {
      maxAttempts: 2,
      backoffMultiplier: 2,
      maxDelay: 10000,
      retryableStatuses: [429, 500, 502, 503, 504],
    },
    agentTypes: ['news', 'weather'],
    priority: 'medium',
  },

  // Social Media APIs (Twitter/X Alternative - using proxy)
  {
    name: 'Social Media Trends',
    baseUrl: 'https://api.mydub.ai/social', // Proxy endpoint
    endpoints: [
      {
        name: 'dubaiTrends',
        path: '/trends/dubai',
        method: 'GET',
        description: 'Trending topics in Dubai',
        responseFormat: 'json',
        dataPath: 'trends',
      },
      {
        name: 'governmentUpdates',
        path: '/accounts/government',
        method: 'GET',
        description: 'Latest updates from government accounts',
        responseFormat: 'json',
        dataPath: 'posts',
      },
    ],
    authentication: {
      type: 'bearer',
      location: 'header',
      credentials: {
        token: '', // Internal API token
      },
    },
    rateLimit: {
      requestsPerMinute: 20,
      requestsPerHour: 200,
      concurrentRequests: 2,
    },
    timeout: 15000,
    retryConfig: {
      maxAttempts: 2,
      backoffMultiplier: 2,
      maxDelay: 5000,
      retryableStatuses: [429, 500, 502, 503, 504],
    },
    agentTypes: ['news', 'lifestyle'],
    priority: 'medium',
  },

  // Event APIs
  {
    name: 'Eventbrite Dubai',
    baseUrl: 'https://www.eventbriteapi.com/v3',
    endpoints: [
      {
        name: 'searchEvents',
        path: '/events/search',
        method: 'GET',
        description: 'Search for events in Dubai',
        parameters: {
          'location.address': 'Dubai',
          'location.within': '50km',
          'expand': 'venue,category',
          'sort_by': 'date',
        },
        responseFormat: 'json',
        dataPath: 'events',
      },
      {
        name: 'categories',
        path: '/categories',
        method: 'GET',
        description: 'Event categories',
        responseFormat: 'json',
        dataPath: 'categories',
      },
    ],
    authentication: {
      type: 'bearer',
      location: 'header',
      credentials: {
        token: '', // To be configured
      },
    },
    rateLimit: {
      requestsPerMinute: 20,
      requestsPerHour: 1000,
      concurrentRequests: 3,
    },
    timeout: 15000,
    retryConfig: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      maxDelay: 10000,
      retryableStatuses: [429, 500, 502, 503, 504],
    },
    agentTypes: ['lifestyle', 'tourism'],
    priority: 'medium',
  },

  // Google Places API (for business and tourism data)
  {
    name: 'Google Places',
    baseUrl: 'https://maps.googleapis.com/maps/api/place',
    endpoints: [
      {
        name: 'nearbySearch',
        path: '/nearbysearch/json',
        method: 'GET',
        description: 'Find places near Dubai',
        parameters: {
          location: '25.2048,55.2708', // Dubai coordinates
          radius: 50000,
          type: 'tourist_attraction',
        },
        responseFormat: 'json',
        dataPath: 'results',
      },
      {
        name: 'placeDetails',
        path: '/details/json',
        method: 'GET',
        description: 'Get detailed place information',
        responseFormat: 'json',
        dataPath: 'result',
      },
    ],
    authentication: {
      type: 'apiKey',
      location: 'query',
      parameterName: 'key',
      credentials: {
        key: getApiKey('VITE_GOOGLE_MAPS_API_KEY'),
      },
    },
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      concurrentRequests: 5,
    },
    timeout: 10000,
    retryConfig: {
      maxAttempts: 2,
      backoffMultiplier: 2,
      maxDelay: 5000,
      retryableStatuses: [429, 500, 502, 503, 504],
    },
    agentTypes: ['tourism', 'business'],
    priority: 'medium',
  },

  // Currency Exchange Rates
  {
    name: 'Exchange Rates',
    baseUrl: 'https://api.exchangerate-api.com/v4',
    endpoints: [
      {
        name: 'latest',
        path: '/latest/AED',
        method: 'GET',
        description: 'Latest AED exchange rates',
        responseFormat: 'json',
        dataPath: 'rates',
      },
    ],
    authentication: {
      type: 'none',
    },
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      concurrentRequests: 1,
    },
    timeout: 10000,
    retryConfig: {
      maxAttempts: 2,
      backoffMultiplier: 2,
      maxDelay: 5000,
      retryableStatuses: [429, 500, 502, 503, 504],
    },
    agentTypes: ['business', 'tourism'],
    priority: 'low',
  },
];

// Helper functions
export function getAPISourceByName(name: string): APISource | undefined {
  return API_SOURCES.find(source => source.name === name);
}

export function getAPISourcesByAgentType(agentType: string): APISource[] {
  return API_SOURCES.filter(source => 
    source.agentTypes.includes(agentType as any)
  );
}

export function getActiveAPISources(): APISource[] {
  return API_SOURCES.filter(source => {
    // Check if the source has valid authentication
    if (source.authentication.type !== 'none') {
      const creds = source.authentication.credentials;
      if (!creds?.key && !creds?.token) {
        return false;
      }
    }
    return true;
  });
}

// API request configuration defaults
export const API_REQUEST_DEFAULTS = {
  headers: {
    'User-Agent': 'MyDub.ai/1.0 (AI News Reporter)',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
  },
  timeout: 15000,
  maxRedirects: 3,
};