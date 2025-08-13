/**
 * Source Integration Service
 * Unified interface for fetching data from different source types
 */

import { supabase } from '@/shared/lib/supabase';
import { RSS_FEEDS, RSS_PARSER_CONFIG } from '@/shared/config/rss-feeds.config';
import { API_SOURCES, APISource, APIEndpoint, API_REQUEST_DEFAULTS } from '@/shared/config/api-sources.config';
import type { SourceType } from '@/features/reporter-agents/types/reporter.types';

// Types
export interface FetchResult {
  success: boolean;
  data?: any[];
  error?: string;
  metadata?: {
    source: string;
    fetchedAt: string;
    itemCount: number;
    responseTime: number;
  };
}

export interface SourceCredentials {
  apiKey?: string;
  bearer?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

// Rate limiting implementation
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async checkLimit(sourceId: string, limits: {
    requestsPerMinute: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  }): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(sourceId) || [];
    
    // Clean old requests
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const validRequests = requests.filter(time => time > oneDayAgo);
    
    // Check limits
    const lastMinute = validRequests.filter(time => time > oneMinuteAgo).length;
    if (lastMinute >= limits.requestsPerMinute) return false;
    
    if (limits.requestsPerHour) {
      const lastHour = validRequests.filter(time => time > oneHourAgo).length;
      if (lastHour >= limits.requestsPerHour) return false;
    }
    
    if (limits.requestsPerDay) {
      if (validRequests.length >= limits.requestsPerDay) return false;
    }
    
    // Add new request
    validRequests.push(now);
    this.requests.set(sourceId, validRequests);
    
    return true;
  }
}

// Cache implementation
class SourceCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  
  get(key: string, ttl: number = this.DEFAULT_TTL): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export class SourceIntegrationService {
  private rateLimiter = new RateLimiter();
  private cache = new SourceCache();
  
  /**
   * Fetch data from any configured source
   */
  async fetchFromSource(
    sourceUrl: string,
    sourceType: SourceType,
    credentials?: SourceCredentials,
    config?: any
  ): Promise<FetchResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `${sourceType}:${sourceUrl}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          metadata: {
            source: sourceUrl,
            fetchedAt: new Date().toISOString(),
            itemCount: Array.isArray(cached) ? cached.length : 1,
            responseTime: 0,
          },
        };
      }
      
      let result: FetchResult;
      
      switch (sourceType) {
        case 'rss':
          result = await this.fetchRSSFeed(sourceUrl, config);
          break;
        case 'api':
          result = await this.fetchAPIData(sourceUrl, credentials, config);
          break;
        case 'scraper':
          result = await this.fetchScraperData(sourceUrl, config);
          break;
        default:
          throw new Error(`Unsupported source type: ${sourceType}`);
      }
      
      // Cache successful results
      if (result.success && result.data) {
        this.cache.set(cacheKey, result.data);
      }
      
      // Update response time
      if (result.metadata) {
        result.metadata.responseTime = Date.now() - startTime;
      }
      
      return result;
    } catch (error) {
      console.error('Source fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: sourceUrl,
          fetchedAt: new Date().toISOString(),
          itemCount: 0,
          responseTime: Date.now() - startTime,
        },
      };
    }
  }
  
  /**
   * Fetch RSS feed data
   */
  private async fetchRSSFeed(url: string, config?: any): Promise<FetchResult> {
    try {
      const response = await fetch(url, {
        headers: RSS_PARSER_CONFIG.headers,
        signal: AbortSignal.timeout(RSS_PARSER_CONFIG.timeout),
      });
      
      if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      const items = this.parseRSSFeed(text);
      
      return {
        success: true,
        data: items,
        metadata: {
          source: url,
          fetchedAt: new Date().toISOString(),
          itemCount: items.length,
          responseTime: 0,
        },
      };
    } catch (error) {
      console.error('RSS fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'RSS fetch failed',
      };
    }
  }
  
  /**
   * Parse RSS feed XML
   */
  private parseRSSFeed(xml: string): any[] {
    const items: any[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid RSS feed XML');
    }
    
    // Extract items
    const itemElements = doc.querySelectorAll('item, entry');
    
    itemElements.forEach(item => {
      const getTextContent = (selector: string): string => {
        const element = item.querySelector(selector);
        return element?.textContent?.trim() || '';
      };
      
      const parsedItem = {
        title: getTextContent('title'),
        description: getTextContent('description, summary'),
        link: getTextContent('link') || item.querySelector('link')?.getAttribute('href') || '',
        pubDate: getTextContent('pubDate, published, updated'),
        author: getTextContent('author, dc\\:creator'),
        category: getTextContent('category'),
        guid: getTextContent('guid, id'),
        content: getTextContent('content\\:encoded, content'),
        image: this.extractImageFromItem(item),
      };
      
      // Only add items with at least title and link
      if (parsedItem.title && parsedItem.link) {
        items.push(parsedItem);
      }
    });
    
    return items;
  }
  
  /**
   * Extract image URL from RSS item
   */
  private extractImageFromItem(item: Element): string | null {
    // Try various image selectors
    const imageSelectors = [
      'enclosure[type^="image"]',
      'media\\:content[medium="image"]',
      'media\\:thumbnail',
      'image',
      'img',
    ];
    
    for (const selector of imageSelectors) {
      const element = item.querySelector(selector);
      if (element) {
        return element.getAttribute('url') || 
               element.getAttribute('src') || 
               element.textContent || 
               null;
      }
    }
    
    // Try to extract from description
    const description = item.querySelector('description')?.textContent || '';
    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : null;
  }
  
  /**
   * Fetch data from API endpoint
   */
  private async fetchAPIData(
    url: string,
    credentials?: SourceCredentials,
    config?: any
  ): Promise<FetchResult> {
    try {
      // Find API source configuration
      const apiSource = this.findAPISourceByUrl(url);
      if (!apiSource) {
        throw new Error('API source not configured');
      }
      
      // Check rate limits
      const canProceed = await this.rateLimiter.checkLimit(
        apiSource.name,
        apiSource.rateLimit
      );
      
      if (!canProceed) {
        throw new Error('Rate limit exceeded');
      }
      
      // Build request
      const headers = { ...API_REQUEST_DEFAULTS.headers };
      
      // Add authentication
      if (apiSource.authentication.type !== 'none') {
        this.addAuthentication(headers, apiSource.authentication, credentials);
      }
      
      // Make request with retry
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(apiSource.timeout),
      }, apiSource.retryConfig);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract data using configured path
      const endpoint = this.findEndpointByUrl(apiSource, url);
      const extractedData = endpoint?.dataPath 
        ? this.extractDataByPath(data, endpoint.dataPath)
        : data;
      
      return {
        success: true,
        data: Array.isArray(extractedData) ? extractedData : [extractedData],
        metadata: {
          source: url,
          fetchedAt: new Date().toISOString(),
          itemCount: Array.isArray(extractedData) ? extractedData.length : 1,
          responseTime: 0,
        },
      };
    } catch (error) {
      console.error('API fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API fetch failed',
      };
    }
  }
  
  /**
   * Fetch data using web scraper (placeholder)
   */
  private async fetchScraperData(url: string, config?: any): Promise<FetchResult> {
    // This would integrate with a scraping service or edge function
    return {
      success: false,
      error: 'Web scraping not yet implemented',
    };
  }
  
  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryConfig: any
  ): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (!retryConfig.retryableStatuses.includes(response.status)) {
          return response;
        }
        
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error as Error;
      }
      
      // Calculate delay
      const delay = Math.min(
        Math.pow(retryConfig.backoffMultiplier, attempt) * 1000,
        retryConfig.maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw lastError || new Error('Fetch failed after retries');
  }
  
  /**
   * Add authentication to request headers
   */
  private addAuthentication(
    headers: Record<string, string>,
    authConfig: any,
    credentials?: SourceCredentials
  ): void {
    switch (authConfig.type) {
      case 'apiKey':
        if (authConfig.location === 'header' && credentials?.apiKey) {
          headers[authConfig.parameterName] = credentials.apiKey;
        }
        break;
      case 'bearer':
        if (credentials?.bearer) {
          headers['Authorization'] = `Bearer ${credentials.bearer}`;
        }
        break;
      case 'basic':
        if (credentials?.username && credentials?.password) {
          const encoded = btoa(`${credentials.username}:${credentials.password}`);
          headers['Authorization'] = `Basic ${encoded}`;
        }
        break;
    }
  }
  
  /**
   * Find API source by URL
   */
  private findAPISourceByUrl(url: string): APISource | undefined {
    return API_SOURCES.find(source => url.startsWith(source.baseUrl));
  }
  
  /**
   * Find endpoint configuration by URL
   */
  private findEndpointByUrl(source: APISource, url: string): APIEndpoint | undefined {
    const path = url.replace(source.baseUrl, '');
    return source.endpoints.find(endpoint => path.includes(endpoint.path));
  }
  
  /**
   * Extract data using JSON path
   */
  private extractDataByPath(data: any, path: string): any {
    const parts = path.split('.');
    let result = data;
    
    for (const part of parts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part];
      } else {
        return null;
      }
    }
    
    return result;
  }
  
  /**
   * Test source connectivity
   */
  async testSource(
    sourceUrl: string,
    sourceType: SourceType,
    credentials?: SourceCredentials
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const result = await this.fetchFromSource(sourceUrl, sourceType, credentials);
      
      if (result.success) {
        return {
          success: true,
          message: 'Source is working correctly',
          details: {
            itemCount: result.metadata?.itemCount || 0,
            responseTime: result.metadata?.responseTime || 0,
          },
        };
      } else {
        return {
          success: false,
          message: result.error || 'Source test failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }
  
  /**
   * Get source health status
   */
  async getSourceHealth(sourceId: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: string;
    errorRate: number;
    avgResponseTime: number;
  }> {
    // Query recent fetch attempts from database
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('status, created_at, completed_at, error_details')
      .eq('source_url', sourceId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error || !data || data.length === 0) {
      return {
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        errorRate: 1,
        avgResponseTime: 0,
      };
    }
    
    // Calculate metrics
    const failed = data.filter(task => task.status === 'failed').length;
    const errorRate = failed / data.length;
    
    const responseTimes = data
      .filter(task => task.completed_at)
      .map(task => {
        const start = new Date(task.created_at).getTime();
        const end = new Date(task.completed_at).getTime();
        return end - start;
      });
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (errorRate > 0.5) {
      status = 'unhealthy';
    } else if (errorRate > 0.1 || avgResponseTime > 10000) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      lastCheck: data[0]?.created_at || new Date().toISOString(),
      errorRate,
      avgResponseTime,
    };
  }
}

// Export singleton instance
export const sourceIntegrationService = new SourceIntegrationService();