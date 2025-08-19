// External API integrations for Dubai government and news data

interface NewsAPIResponse {
  articles: Array<{
    title: string;
    description: string;
    content: string;
    publishedAt: string;
    source: { name: string };
    urlToImage?: string;
    url: string;
  }>;
}

interface DubaiDataPortalResponse {
  result: {
    records: Array<{
      [key: string]: any;
    }>;
  };
}

export class ExternalAPIsService {
  private static newsApiKey = import.meta.env.VITE_NEWS_API_KEY;
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static cacheTimeout = 15 * 60 * 1000; // 15 minutes

  // Cache helper methods
  private static getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Fetch UAE/Dubai news from our API endpoint
  static async fetchDubaiNews(): Promise<NewsAPIResponse | null> {
    try {
      const response = await fetch('/api/news?pageSize=20');

      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Dubai news:', error);
      return null;
    }
  }

  // Fetch business news specifically
  static async fetchBusinessNews(): Promise<NewsAPIResponse | null> {
    try {
      const response = await fetch('/api/news?category=business&pageSize=10');

      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch business news:', error);
      return null;
    }
  }

  // Placeholder for Dubai Data Portal API
  // Note: Dubai Data Portal provides various datasets but requires specific dataset IDs
  static async fetchGovernmentData(datasetId: string): Promise<DubaiDataPortalResponse | null> {
    try {
      // This is a placeholder - actual implementation would need:
      // 1. Proper dataset IDs from Dubai Data Portal
      // 2. API authentication if required
      // 3. Specific endpoint URLs for each dataset
      
      const response = await fetch(
        `https://www.dubaipulse.gov.ae/api/action/datastore_search?resource_id=${datasetId}&limit=50`
      );

      if (!response.ok) {
        throw new Error(`Dubai Data Portal error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch government data:', error);
      return null;
    }
  }

  // RTA (Roads and Transport Authority) API placeholder
  static async fetchRTAData(): Promise<any> {
    // TODO: Implement RTA API integration
    // This would connect to RTA's APIs for:
    // - Metro schedules and delays
    // - Bus routes and timings
    // - Traffic updates
    // - Parking availability
    
    // For now, return mock data structure
    return {
      metro_status: 'operational',
      bus_routes: [],
      traffic_alerts: [],
      parking_availability: {}
    };
  }

  // Enhanced Dubai Tourism API integration
  static async fetchTourismEvents(): Promise<any> {
    const cacheKey = 'tourism-events';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Real tourism events from multiple sources
      const [
        dubaiCalendarEvents,
        visitDubaiEvents,
        timeOutEvents
      ] = await Promise.all([
        this.fetchDubaiCalendarEvents(),
        this.fetchVisitDubaiEvents(),
        this.fetchTimeOutDubaiEvents()
      ]);

      const allEvents = [
        ...dubaiCalendarEvents,
        ...visitDubaiEvents,
        ...timeOutEvents
      ];

      this.setCachedData(cacheKey, allEvents);
      return allEvents;
    } catch (error) {
      console.error('Failed to fetch tourism events:', error);
      return this.getMockTourismEvents();
    }
  }

  // Fetch from Dubai Calendar (official events)
  private static async fetchDubaiCalendarEvents(): Promise<any[]> {
    try {
      // Dubai Calendar RSS feed
      const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + 
        encodeURIComponent('https://www.dubaicalendar.ae/rss/events.xml'));
      
      if (!response.ok) throw new Error('Dubai Calendar API failed');
      
      const data = await response.json();
      
      return (data.items || []).map((item: any) => ({
        id: this.generateEventId(item.title, item.pubDate),
        title: item.title,
        description: item.description?.replace(/<[^>]*>/g, '') || '',
        category: this.categorizeEvent(item.title + ' ' + item.description),
        startDate: item.pubDate,
        endDate: item.pubDate,
        venue: this.extractVenue(item.description),
        price: this.extractPrice(item.description),
        imageUrl: item.thumbnail,
        bookingUrl: item.link,
        source: 'Dubai Calendar',
        sourceId: 'dubai-calendar',
        tags: this.extractEventTags(item.title + ' ' + item.description)
      }));
    } catch (error) {
      // Failed to fetch Dubai Calendar events
      return [];
    }
  }

  // Fetch from Visit Dubai (tourism board)
  private static async fetchVisitDubaiEvents(): Promise<any[]> {
    try {
      // Note: This would ideally use Visit Dubai's API, but we'll simulate with structured data
      const mockVisitDubaiEvents = [
        {
          id: 'visit-dubai-1',
          title: 'Dubai Shopping Festival 2024',
          description: 'Annual shopping festival with discounts, entertainment, and cultural events',
          category: 'festival',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Multiple venues across Dubai',
          price: { min: 0, max: 0, currency: 'AED', isFree: true },
          imageUrl: 'https://picsum.photos/800/600?random=100',
          bookingUrl: 'https://www.visitdubai.com/dsf',
          source: 'Visit Dubai',
          sourceId: 'visit-dubai',
          tags: ['shopping', 'festival', 'entertainment', 'culture']
        }
      ];
      
      return mockVisitDubaiEvents;
    } catch (error) {
      // Failed to fetch Visit Dubai events
      return [];
    }
  }

  // Fetch from TimeOut Dubai (events and activities)
  private static async fetchTimeOutDubaiEvents(): Promise<any[]> {
    try {
      // TimeOut Dubai RSS feed for events
      const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + 
        encodeURIComponent('https://www.timeoutdubai.com/rss/things-to-do'));
      
      if (!response.ok) throw new Error('TimeOut Dubai API failed');
      
      const data = await response.json();
      
      return (data.items || []).slice(0, 10).map((item: any) => ({
        id: this.generateEventId(item.title, item.pubDate),
        title: item.title,
        description: item.description?.replace(/<[^>]*>/g, '') || '',
        category: this.categorizeEvent(item.title + ' ' + item.description),
        startDate: item.pubDate,
        endDate: item.pubDate,
        venue: this.extractVenue(item.description),
        price: this.extractPrice(item.description),
        imageUrl: item.thumbnail,
        bookingUrl: item.link,
        source: 'TimeOut Dubai',
        sourceId: 'timeout-dubai',
        tags: this.extractEventTags(item.title + ' ' + item.description)
      }));
    } catch (error) {
      // Failed to fetch TimeOut Dubai events
      return [];
    }
  }

  // Fetch attractions data
  static async fetchAttractions(): Promise<any[]> {
    const cacheKey = 'dubai-attractions';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [
        googlePlacesAttractions,
        tripAdvisorAttractions,
        localAttractions
      ] = await Promise.all([
        this.fetchGooglePlacesAttractions(),
        this.fetchTripAdvisorAttractions(),
        this.fetchLocalAttractions()
      ]);

      const allAttractions = [
        ...googlePlacesAttractions,
        ...tripAdvisorAttractions,
        ...localAttractions
      ];

      // Remove duplicates based on name similarity
      const uniqueAttractions = this.removeDuplicateAttractions(allAttractions);

      this.setCachedData(cacheKey, uniqueAttractions);
      return uniqueAttractions;
    } catch (error) {
      console.error('Failed to fetch attractions:', error);
      return [];
    }
  }

  // Fetch from Google Places API (if available)
  private static async fetchGooglePlacesAttractions(): Promise<any[]> {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return [];
      }

      // Search for tourist attractions in Dubai
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=tourist+attractions+Dubai&key=${apiKey}`
      );

      if (!response.ok) throw new Error('Google Places API failed');

      const data = await response.json();
      
      return (data.results || []).map((place: any) => ({
        id: place.place_id,
        name: place.name,
        description: place.formatted_address,
        category: this.mapGooglePlaceType(place.types),
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0,
        priceLevel: place.price_level || 1,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          address: place.formatted_address
        },
        images: place.photos ? place.photos.map((photo: any) => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`
        ) : [],
        isOpen: place.opening_hours?.open_now,
        source: 'Google Places',
        sourceId: 'google-places'
      }));
    } catch (error) {
      // Failed to fetch Google Places attractions
      return [];
    }
  }

  // Fetch from TripAdvisor (simulated - would need actual API)
  private static async fetchTripAdvisorAttractions(): Promise<any[]> {
    try {
      // This would use TripAdvisor's API if available
      // For now, return curated list of popular Dubai attractions
      const popularAttractions = [
        {
          id: 'burj-khalifa-ta',
          name: 'Burj Khalifa',
          description: "World's tallest building with observation decks",
          category: 'landmark',
          rating: 4.7,
          reviewCount: 125000,
          priceLevel: 4,
          location: {
            lat: 25.1972,
            lng: 55.2744,
            address: 'Downtown Dubai'
          },
          images: ['https://picsum.photos/800/600?random=10'],
          source: 'TripAdvisor',
          sourceId: 'tripadvisor'
        },
        {
          id: 'dubai-mall-ta',
          name: 'The Dubai Mall',
          description: "One of the world's largest shopping malls",
          category: 'shopping',
          rating: 4.6,
          reviewCount: 89000,
          priceLevel: 3,
          location: {
            lat: 25.1972,
            lng: 55.2796,
            address: 'Downtown Dubai'
          },
          images: ['https://picsum.photos/800/600?random=11'],
          source: 'TripAdvisor',
          sourceId: 'tripadvisor'
        }
      ];
      
      return popularAttractions;
    } catch (error) {
      // Failed to fetch TripAdvisor attractions
      return [];
    }
  }

  // Fetch local attractions data
  private static async fetchLocalAttractions(): Promise<any[]> {
    // TODO: This could fetch from local databases or curated lists
    return [];
  }

  // Helper methods for tourism data processing
  private static generateEventId(title: string, date: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + new Date(date).getTime();
  }

  private static categorizeEvent(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('festival') || lowerText.includes('carnival')) return 'festival';
    if (lowerText.includes('concert') || lowerText.includes('music')) return 'music';
    if (lowerText.includes('art') || lowerText.includes('exhibition')) return 'art';
    if (lowerText.includes('food') || lowerText.includes('dining')) return 'food';
    if (lowerText.includes('sport') || lowerText.includes('race')) return 'sports';
    if (lowerText.includes('shopping') || lowerText.includes('sale')) return 'shopping';
    if (lowerText.includes('culture') || lowerText.includes('heritage')) return 'culture';
    if (lowerText.includes('family') || lowerText.includes('kids')) return 'family';
    
    return 'general';
  }

  private static extractVenue(description: string): string {
    // Simple venue extraction logic
    const venuePatterns = [
      /at ([^,\\.]+)/i,
      /venue: ([^,\\.]+)/i,
      /location: ([^,\\.]+)/i
    ];
    
    for (const pattern of venuePatterns) {
      const match = description.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'Dubai';
  }

  private static extractPrice(description: string): any {
    // Simple price extraction logic
    const pricePatterns = [
      /AED (\\d+)/i,
      /\\$(\\d+)/i,
      /free/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = description.match(pattern);
      if (match) {
        if (match[0].toLowerCase().includes('free')) {
          return { min: 0, max: 0, currency: 'AED', isFree: true };
        }
        const price = parseInt(match[1]);
        return { min: price, max: price, currency: 'AED', isFree: false };
      }
    }
    
    return { min: 0, max: 0, currency: 'AED', isFree: true };
  }

  private static extractEventTags(text: string): string[] {
    const tags = ['dubai'];
    const lowerText = text.toLowerCase();
    
    const tagKeywords = {
      'festival': ['festival', 'celebration', 'carnival'],
      'music': ['concert', 'music', 'performance'],
      'art': ['art', 'exhibition', 'gallery'],
      'food': ['food', 'dining', 'restaurant'],
      'shopping': ['shopping', 'sale', 'discount'],
      'culture': ['culture', 'heritage', 'traditional'],
      'family': ['family', 'kids', 'children'],
      'luxury': ['luxury', 'premium', 'exclusive']
    };
    
    Object.entries(tagKeywords).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.push(tag);
      }
    });
    
    return tags;
  }

  private static mapGooglePlaceType(types: string[]): string {
    const typeMap: Record<string, string> = {
      'tourist_attraction': 'attraction',
      'museum': 'culture',
      'shopping_mall': 'shopping',
      'restaurant': 'dining',
      'lodging': 'accommodation',
      'amusement_park': 'entertainment',
      'zoo': 'family',
      'aquarium': 'family'
    };
    
    for (const type of types) {
      if (typeMap[type]) return typeMap[type];
    }
    
    return 'general';
  }

  private static removeDuplicateAttractions(attractions: any[]): any[] {
    const seen = new Set<string>();
    return attractions.filter(attraction => {
      const key = attraction.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private static getMockTourismEvents(): any[] {
    return [
      {
        id: 'mock-tourism-1',
        title: 'Dubai Food Festival',
        description: 'A celebration of culinary excellence',
        category: 'festival',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Multiple venues',
        price: { min: 0, max: 0, currency: 'AED', isFree: true },
        imageUrl: 'https://picsum.photos/800/600?random=50',
        bookingUrl: '#',
        source: 'Mock Data',
        sourceId: 'mock',
        tags: ['food', 'festival']
      }
    ];
  }

  // Weather data for Dubai
  static async fetchWeatherData(): Promise<any> {
    const cacheKey = 'weather-dubai';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // In development, check for API key
      if (import.meta.env.DEV) {
        const weatherApiKey = import.meta.env.VITE_WEATHERAPI_KEY;
        const openWeatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (!weatherApiKey && !openWeatherKey) {
          // Using realistic Dubai weather fallback
          const currentMonth = new Date().getMonth();
          const isSummer = currentMonth >= 5 && currentMonth <= 8;
          const fallbackWeather = {
            coord: { lon: 55.2708, lat: 25.2048 },
            weather: [{ id: 800, main: isSummer ? 'Sunny' : 'Clear', description: 'clear sky', icon: '01d' }],
            main: {
              temp: isSummer ? 40 : 28,
              feels_like: isSummer ? 45 : 31,
              temp_min: isSummer ? 36 : 24,
              temp_max: isSummer ? 43 : 32,
              pressure: 1013,
              humidity: isSummer ? 65 : 50
            },
            wind: { speed: 3.5, deg: 270 },
            name: 'Dubai',
            fallback: true
          };
          this.setCachedData(cacheKey, fallbackWeather);
          return fallbackWeather;
        }
      }

      // Use our API proxy to avoid CORS issues
      const response = await fetch('/api/weather?city=Dubai');

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const weatherData = await response.json();
      
      if (!weatherData.error) {
        this.setCachedData(cacheKey, weatherData);
      }
      
      return weatherData;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      // Return realistic fallback weather data
      const currentMonth = new Date().getMonth();
      const isSummer = currentMonth >= 5 && currentMonth <= 8;
      const fallbackWeather = {
        coord: { lon: 55.2708, lat: 25.2048 },
        weather: [{ id: 800, main: isSummer ? 'Sunny' : 'Clear', description: 'clear sky', icon: '01d' }],
        main: {
          temp: isSummer ? 40 : 28,
          feels_like: isSummer ? 45 : 31,
          temp_min: isSummer ? 36 : 24,
          temp_max: isSummer ? 43 : 32,
          pressure: 1013,
          humidity: isSummer ? 65 : 50
        },
        wind: { speed: 3.5, deg: 270 },
        name: 'Dubai',
        fallback: true,
        error: true
      };
      this.setCachedData(cacheKey, fallbackWeather);
      return fallbackWeather;
    }
  }

  // Currency Exchange Rates
  static async fetchExchangeRates(): Promise<any> {
    const cacheKey = 'exchange-rates-aed';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // In development, use fallback rates immediately
      // In production, the API proxy will work
      if (import.meta.env.DEV) {
        console.log('Development mode: Using fallback exchange rates');
        const fallbackRates = {
          EUR: 4.20,
          GBP: 4.86,
          INR: 0.0419,
          USD: 3.67,
          loading: false,
          fallback: true
        };
        this.setCachedData(cacheKey, fallbackRates);
        return fallbackRates;
      }

      // Production: Use our API proxy to avoid CORS issues
      const response = await fetch('/api/exchange-rates');

      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const rates = await response.json();
      
      if (!rates.error) {
        this.setCachedData(cacheKey, rates);
      }
      
      return rates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Return fallback rates
      const fallbackRates = {
        EUR: 4.20,
        GBP: 4.86,
        INR: 0.0419,
        USD: 3.67,
        loading: false,
        error: true
      };
      this.setCachedData(cacheKey, fallbackRates);
      return fallbackRates;
    }
  }

  // Dubai Stock Exchange data (placeholder)
  static async fetchDFMData(): Promise<any> {
    // TODO: Connect to Dubai Financial Market APIs for:
    // - Stock prices
    // - Market indices
    // - Trading volumes
    // - Economic indicators
    
    return {
      market_status: 'closed',
      indices: {},
      top_stocks: []
    };
  }

  // Helper method to sync external news with local database
  static async syncNewsToDatabase(supabase: any): Promise<void> {
    try {
      const newsData = await this.fetchDubaiNews();
      
      if (!newsData || !newsData.articles) {
        return;
      }

      // Transform and insert news articles
      const articlesToInsert = newsData.articles.map(article => ({
        title: article.title,
        summary: article.description || '',
        content: article.content || article.description || '',
        published_at: article.publishedAt,
        url: article.url,
        image_url: article.urlToImage,
        category: 'general',
        tags: ['news', 'Dubai', 'UAE'],
        is_breaking: false,
        sentiment: 'neutral'
      }));

      const { error } = await supabase
        .from('news_articles')
        .insert(articlesToInsert);

      if (error) {
        console.error('Failed to insert news articles:', error);
      } else {
        // News articles successfully synced
      }
    } catch (error) {
      console.error('News sync error:', error);
    }
  }

  // Helper method to validate API configurations
  static validateAPIConfiguration(): {
    newsAPI: boolean;
    weatherAPI: boolean;
    mapsAPI: boolean;
  } {
    return {
      newsAPI: !!import.meta.env.VITE_NEWS_API_KEY,
      weatherAPI: !!(import.meta.env.VITE_WEATHERAPI_KEY || import.meta.env.VITE_OPENWEATHER_API_KEY),
      mapsAPI: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    };
  }

  // Real-time news monitoring (WebSocket simulation)
  static subscribeToNewsUpdates(callback: (article: any) => void): () => void {
    const checkForUpdates = async () => {
      try {
        const latestNews = await this.fetchDubaiNews();
        if (!latestNews || !latestNews.articles) return;
        
        const recentNews = latestNews.articles.filter(article => {
          const publishedTime = new Date(article.publishedAt).getTime();
          const now = Date.now();
          return now - publishedTime < 60000; // Articles from last minute
        });

        recentNews.forEach(article => callback(article));
      } catch (error) {
        console.error('News update check failed:', error);
      }
    };

    // Check for updates every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    
    // Initial check
    checkForUpdates();

    return () => clearInterval(interval);
  }

  // Background sync job for automated news updates
  static async startBackgroundSync(supabase: any): Promise<void> {
    const syncInterval = 30 * 60 * 1000; // 30 minutes
    
    const performSync = async () => {
      try {
        const result = await this.syncNewsToDatabase(supabase);
        // Update last sync timestamp
        await supabase
          .from('system_settings')
          .upsert({
            key: 'last_news_sync',
            value: new Date().toISOString()
          });
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    };

    // Perform initial sync
    await performSync();
    
    // Schedule regular syncs
    setInterval(performSync, syncInterval);
  }
}

export default ExternalAPIsService;