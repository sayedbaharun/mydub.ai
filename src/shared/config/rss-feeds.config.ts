/**
 * RSS Feed Configuration for AI Reporter System
 * Defines all RSS feeds that AI agents can fetch content from
 */

export interface RSSFeed {
  name: string;
  url: string;
  category: 'government' | 'news' | 'events' | 'business' | 'lifestyle' | 'tourism';
  language: 'en' | 'ar';
  priority: 'high' | 'medium' | 'low';
  fetchInterval: number; // in minutes
  agentTypes: Array<'news' | 'lifestyle' | 'business' | 'tourism' | 'weather'>;
  parseConfig?: {
    customFields?: Record<string, string>;
    dateFormat?: string;
    contentSelector?: string;
  };
}

export const RSS_FEEDS: RSSFeed[] = [
  // Government Feeds
  {
    name: 'Dubai Media Office',
    url: 'https://www.mediaoffice.ae/en/rss',
    category: 'government',
    language: 'en',
    priority: 'high',
    fetchInterval: 30,
    agentTypes: ['news', 'business'],
  },
  {
    name: 'Dubai Media Office Arabic',
    url: 'https://www.mediaoffice.ae/ar/rss',
    category: 'government',
    language: 'ar',
    priority: 'high',
    fetchInterval: 30,
    agentTypes: ['news', 'business'],
  },
  {
    name: 'RTA Dubai',
    url: 'https://www.rta.ae/wps/portal/rta/ae/home/rss',
    category: 'government',
    language: 'en',
    priority: 'high',
    fetchInterval: 60,
    agentTypes: ['news', 'weather'],
  },
  {
    name: 'DEWA Updates',
    url: 'https://www.dewa.gov.ae/en/about-us/media-publications/latest-news/rss',
    category: 'government',
    language: 'en',
    priority: 'medium',
    fetchInterval: 120,
    agentTypes: ['news'],
  },
  {
    name: 'Dubai Municipality',
    url: 'https://www.dm.gov.ae/en/rss',
    category: 'government',
    language: 'en',
    priority: 'medium',
    fetchInterval: 120,
    agentTypes: ['news', 'lifestyle'],
  },
  {
    name: 'Dubai Health Authority',
    url: 'https://www.dha.gov.ae/en/rss',
    category: 'government',
    language: 'en',
    priority: 'medium',
    fetchInterval: 120,
    agentTypes: ['news', 'lifestyle'],
  },

  // News Outlets
  {
    name: 'Gulf News UAE',
    url: 'https://gulfnews.com/rss/uae',
    category: 'news',
    language: 'en',
    priority: 'high',
    fetchInterval: 15,
    agentTypes: ['news'],
  },
  {
    name: 'Gulf News Business',
    url: 'https://gulfnews.com/rss/business',
    category: 'business',
    language: 'en',
    priority: 'high',
    fetchInterval: 30,
    agentTypes: ['business'],
  },
  {
    name: 'Gulf News Entertainment',
    url: 'https://gulfnews.com/rss/entertainment',
    category: 'lifestyle',
    language: 'en',
    priority: 'medium',
    fetchInterval: 60,
    agentTypes: ['lifestyle'],
  },
  {
    name: 'Khaleej Times UAE',
    url: 'https://www.khaleejtimes.com/rss/uae',
    category: 'news',
    language: 'en',
    priority: 'high',
    fetchInterval: 15,
    agentTypes: ['news'],
  },
  {
    name: 'Khaleej Times Business',
    url: 'https://www.khaleejtimes.com/rss/business',
    category: 'business',
    language: 'en',
    priority: 'high',
    fetchInterval: 30,
    agentTypes: ['business'],
  },
  {
    name: 'Khaleej Times Lifestyle',
    url: 'https://www.khaleejtimes.com/rss/lifestyle',
    category: 'lifestyle',
    language: 'en',
    priority: 'medium',
    fetchInterval: 60,
    agentTypes: ['lifestyle'],
  },
  {
    name: 'The National UAE',
    url: 'https://www.thenationalnews.com/feed/rss/uae/',
    category: 'news',
    language: 'en',
    priority: 'high',
    fetchInterval: 15,
    agentTypes: ['news'],
  },
  {
    name: 'The National Business',
    url: 'https://www.thenationalnews.com/feed/rss/business/',
    category: 'business',
    language: 'en',
    priority: 'high',
    fetchInterval: 30,
    agentTypes: ['business'],
  },
  {
    name: 'The National Travel',
    url: 'https://www.thenationalnews.com/feed/rss/travel/',
    category: 'tourism',
    language: 'en',
    priority: 'medium',
    fetchInterval: 60,
    agentTypes: ['tourism'],
  },
  {
    name: 'Arabian Business',
    url: 'https://www.arabianbusiness.com/rss.xml',
    category: 'business',
    language: 'en',
    priority: 'high',
    fetchInterval: 30,
    agentTypes: ['business'],
  },

  // Event Feeds
  {
    name: 'Dubai Calendar',
    url: 'https://dubai.ae/en/rss/events',
    category: 'events',
    language: 'en',
    priority: 'high',
    fetchInterval: 60,
    agentTypes: ['lifestyle', 'tourism'],
  },
  {
    name: 'Time Out Dubai',
    url: 'https://www.timeoutdubai.com/feed',
    category: 'events',
    language: 'en',
    priority: 'medium',
    fetchInterval: 60,
    agentTypes: ['lifestyle', 'tourism'],
  },
  {
    name: 'What\'s On Dubai',
    url: 'https://whatson.ae/feed/',
    category: 'events',
    language: 'en',
    priority: 'medium',
    fetchInterval: 60,
    agentTypes: ['lifestyle', 'tourism'],
  },
  {
    name: 'Dubai Opera',
    url: 'https://www.dubaiopera.com/en/rss/events',
    category: 'events',
    language: 'en',
    priority: 'low',
    fetchInterval: 120,
    agentTypes: ['lifestyle'],
  },

  // Business Feeds
  {
    name: 'Dubai Chamber',
    url: 'https://www.dubaichamber.com/en/rss',
    category: 'business',
    language: 'en',
    priority: 'high',
    fetchInterval: 120,
    agentTypes: ['business'],
  },
  {
    name: 'DIFC News',
    url: 'https://www.difc.ae/newsroom/rss',
    category: 'business',
    language: 'en',
    priority: 'high',
    fetchInterval: 60,
    agentTypes: ['business'],
  },
  {
    name: 'Dubai Airport Freezone',
    url: 'https://www.dafza.ae/en/media-centre/rss',
    category: 'business',
    language: 'en',
    priority: 'medium',
    fetchInterval: 120,
    agentTypes: ['business'],
  },
  {
    name: 'Dubai South',
    url: 'https://www.dubaisouth.ae/en/media/rss',
    category: 'business',
    language: 'en',
    priority: 'medium',
    fetchInterval: 120,
    agentTypes: ['business'],
  },

  // Tourism & Lifestyle
  {
    name: 'Visit Dubai News',
    url: 'https://www.visitdubai.com/en/rss/news',
    category: 'tourism',
    language: 'en',
    priority: 'high',
    fetchInterval: 60,
    agentTypes: ['tourism', 'lifestyle'],
  },
  {
    name: 'Dubai Parks and Resorts',
    url: 'https://www.dubaiparksandresorts.com/en/rss',
    category: 'tourism',
    language: 'en',
    priority: 'low',
    fetchInterval: 120,
    agentTypes: ['tourism'],
  },
  {
    name: 'Atlantis Dubai',
    url: 'https://www.atlantis.com/dubai/rss',
    category: 'tourism',
    language: 'en',
    priority: 'low',
    fetchInterval: 240,
    agentTypes: ['tourism'],
  },
];

// Helper function to get feeds by category
export function getFeedsByCategory(category: RSSFeed['category']): RSSFeed[] {
  return RSS_FEEDS.filter(feed => feed.category === category);
}

// Helper function to get feeds by agent type
export function getFeedsByAgentType(agentType: RSSFeed['agentTypes'][number]): RSSFeed[] {
  return RSS_FEEDS.filter(feed => feed.agentTypes.includes(agentType));
}

// Helper function to get high priority feeds
export function getHighPriorityFeeds(): RSSFeed[] {
  return RSS_FEEDS.filter(feed => feed.priority === 'high');
}

// Configuration for RSS parser
export const RSS_PARSER_CONFIG = {
  timeout: 10000, // 10 seconds
  maxRedirects: 5,
  headers: {
    'User-Agent': 'MyDub.ai News Aggregator/1.0',
    'Accept': 'application/rss+xml, application/xml, text/xml',
  },
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};