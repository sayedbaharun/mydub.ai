import { newsArticles } from '@/data/news-articles';

export interface Article {
  headline: string;
  content: string;
  image_path: string;
  image_alt: string;
  image_credit: string;
  category: string;
  publish_date: string;
  author: string;
  slug?: string;
}

export interface CategoryMapping {
  [key: string]: string[];
}

// Content distribution strategy based on actual article headlines
export const categoryMappings: CategoryMapping = {
  news: [
    // Hard news and policy changes
    'Dubai Embraces Revolutionary Four-Day Workweek for Public Sector',
    'Maximizing Daylight: Creative Ways to Enjoy Dubai\'s Longest Day of the Year'
  ],
  
  beaches: [
    // Beach-related activities and coastal experiences
    'Maximizing Daylight: Creative Ways to Enjoy Dubai\'s Longest Day of the Year'
  ],
  
  eatanddrink: [
    // Food and dining content
    'Summer Savor: Eight Luxurious Dining Deals to Elevate Your Dubai Season'
  ],
  
  nightlife: [
    // Entertainment and nightlife
    'Countdown Spectacular: Soho Garden Unveils Extraordinary New Year\'s Eve Celebrations'
  ],
  
  luxurylife: [
    // Premium lifestyle and luxury experiences
    'Sound Spectacular: 23 Must-See Concerts Hitting Dubai\'s Stages in 2025'
  ],
  
  dubaireels: [
    // Social content and experiences perfect for sharing
    'Sound Spectacular: 23 Must-See Concerts Hitting Dubai\'s Stages in 2025',
    'Countdown Spectacular: Soho Garden Unveils Extraordinary New Year\'s Eve Celebrations'
  ]
};

export class ContentDistributionService {
  private articles: Article[] = [];

  constructor() {
    this.loadArticles();
  }

  private loadArticles() {
    // Load articles from the news_articles data
    this.articles = newsArticles.articles.map(article => ({
      ...article,
      slug: this.generateSlug(article.headline)
    }));
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  getArticlesByCategory(category: string): Article[] {
    const categoryHeadlines = categoryMappings[category] || [];
    return this.articles.filter(article => 
      categoryHeadlines.includes(article.headline)
    );
  }

  getFeaturedArticlesForCategory(category: string, limit: number = 3): Article[] {
    return this.getArticlesByCategory(category).slice(0, limit);
  }

  getArticleBySlug(slug: string): Article | undefined {
    return this.articles.find(article => article.slug === slug);
  }

  getAllArticles(): Article[] {
    return this.articles;
  }

  getRecentArticles(limit: number = 6): Article[] {
    return this.articles
      .sort((a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime())
      .slice(0, limit);
  }

  searchArticles(query: string): Article[] {
    const searchTerm = query.toLowerCase();
    return this.articles.filter(article =>
      article.headline.toLowerCase().includes(searchTerm) ||
      article.content.toLowerCase().includes(searchTerm) ||
      article.category.toLowerCase().includes(searchTerm)
    );
  }
}

export const contentDistributionService = new ContentDistributionService(); 