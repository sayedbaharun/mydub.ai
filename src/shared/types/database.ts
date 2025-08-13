// Database types for MyDub.AI

export interface NewsSource {
  id: string;
  name: string;
  name_ar: string;
  logo?: string;
  website?: string;
  is_active: boolean;
  credibility_score: number;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  title_ar?: string;
  summary: string;
  summary_ar?: string;
  content: string;
  content_ar?: string;
  source_id?: string;
  source?: NewsSource;
  category: string;
  author?: string;
  published_at: string;
  url?: string;
  image_url?: string;
  video_url?: string;
  tags?: string[];
  view_count: number;
  read_time?: number;
  ai_summary?: string;
  ai_summary_ar?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  is_breaking: boolean;
  is_featured: boolean;
  has_video: boolean;
  created_at: string;
  updated_at: string;
}

export interface GovernmentDepartment {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_ar?: string;
  is_active: boolean;
  created_at: string;
}

export interface GovernmentService {
  id: string;
  department_id?: string;
  department?: GovernmentDepartment;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  category: string;
  url?: string;
  requirements?: string[];
  requirements_ar?: string[];
  documents?: string[];
  documents_ar?: string[];
  fees?: number;
  processing_time?: string;
  processing_time_ar?: string;
  is_online: boolean;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TourismAttraction {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  category: string;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  address_ar?: string;
  opening_hours?: Record<string, any>;
  admission_fee?: number;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  images?: string[];
  rating?: number;
  review_count: number;
  is_featured: boolean;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TourismEvent {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  category: string;
  start_date: string;
  end_date: string;
  location: string;
  location_ar: string;
  venue?: string;
  venue_ar?: string;
  organizer?: string;
  organizer_ar?: string;
  ticket_price?: number;
  ticket_url?: string;
  image_url?: string;
  is_featured: boolean;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  language: string;
  categories?: string[];
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
  theme: string;
  font_size: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  title_ar?: string;
  message: string;
  message_ar?: string;
  type: string;
  action_url?: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SearchHistory {
  id: string;
  user_id?: string;
  query: string;
  results_count?: number;
  clicked_result?: string;
  session_id?: string;
  created_at: string;
}

export interface PageView {
  id: string;
  user_id?: string;
  page_path: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  session_id?: string;
  duration?: number;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id?: string;
  type: 'bug' | 'feature' | 'content' | 'other';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  user_id?: string;
  to_email: string;
  subject: string;
  template?: string;
  status: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface EmailSubscription {
  id: string;
  email: string;
  user_id?: string;
  is_active: boolean;
  daily_digest: boolean;
  weekly_digest: boolean;
  news_alerts: boolean;
  event_alerts: boolean;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
}

// Search types
export type SearchableContent = NewsArticle | GovernmentService | TourismAttraction | TourismEvent;

export interface SearchFilters {
  query: string;
  type?: 'all' | 'news' | 'government' | 'tourism' | 'events';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  language?: 'en' | 'ar';
  sortBy?: 'relevance' | 'date' | 'popularity';
}

export interface SearchResult {
  id: string;
  type: 'news' | 'government' | 'tourism' | 'event';
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  url?: string;
  image_url?: string;
  date?: string;
  category?: string;
  score?: number;
  highlights?: {
    title?: string[];
    description?: string[];
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  filters: SearchFilters;
  suggestions?: string[];
  facets?: {
    types: Record<string, number>;
    categories: Record<string, number>;
  };
}