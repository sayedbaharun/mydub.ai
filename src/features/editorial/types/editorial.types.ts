/**
 * Editorial Types for MyDub.ai News Platform
 * Defines TypeScript types for editorial workflow
 */

export type UserRole = 'reader' | 'subscriber' | 'journalist' | 'editor' | 'admin' | 'publisher' | 'curator';

export type ArticleStatus = 
  | 'draft' 
  | 'assigned' 
  | 'in_progress' 
  | 'submitted' 
  | 'in_review' 
  | 'approved' 
  | 'published' 
  | 'archived';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

export interface StoryAssignment {
  id: string;
  title: string;
  description?: string;
  brief?: string;
  deadline?: string;
  priority: PriorityLevel;
  category: string;
  assigned_to: string;
  assigned_by: string;
  estimated_word_count?: number;
  source_leads?: string[];
  research_notes?: string;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Joined data
  journalist?: UserProfile;
  editor?: UserProfile;
  article?: EditorialArticle;
}

export interface EditorialArticle {
  id: string;
  title: string;
  title_ar?: string;
  summary: string;
  summary_ar?: string;
  content: string;
  content_ar?: string;
  source_id?: string;
  category: string;
  author?: string;
  published_at?: string;
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
  created_by?: string;
  updated_by?: string;
  
  // Editorial workflow fields
  status: ArticleStatus;
  assignment_id?: string;
  author_id?: string;
  editor_id?: string;
  publisher_id?: string;
  scheduled_for?: string;
  breaking_news: boolean;
  featured: boolean;
  word_count?: number;
  editorial_notes?: string;
  seo_title?: string;
  seo_description?: string;
  social_media_text?: string;
  
  // Joined data
  assignment?: StoryAssignment;
  author_profile?: UserProfile;
  editor_profile?: UserProfile;
  publisher_profile?: UserProfile;
  versions?: ArticleVersion[];
  approvals?: ContentApproval[];
  metrics?: EditorialMetrics;
}

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  role: UserRole;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  
  // Editorial fields
  specialization?: string;
  hire_date?: string;
  department?: string;
  editor_level?: 'junior' | 'senior' | 'chief' | 'managing';
  byline_name?: string;
  bio_short?: string;
}

export interface EditorialCalendarEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  event_type: 'story_deadline' | 'publication_date' | 'meeting' | 'event_coverage' | 'embargo_lift';
  priority: PriorityLevel;
  assigned_to?: string;
  related_assignment_id?: string;
  related_article_id?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  assignee?: UserProfile;
  assignment?: StoryAssignment;
  article?: EditorialArticle;
}

export interface ArticleVersion {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  content: string;
  summary?: string;
  change_summary?: string;
  changed_by: string;
  created_at: string;
  
  // Joined data
  changed_by_profile?: UserProfile;
}

export interface BreakingNewsAlert {
  id: string;
  title: string;
  content: string;
  alert_level: AlertLevel;
  article_id?: string;
  created_by: string;
  sent_at: string;
  expires_at?: string;
  is_active: boolean;
  recipient_count: number;
  click_count: number;
  
  // Joined data
  article?: EditorialArticle;
  created_by_profile?: UserProfile;
}

export interface ContentApproval {
  id: string;
  article_id: string;
  reviewer_id: string;
  approval_status: ApprovalStatus;
  review_notes?: string;
  reviewed_at: string;
  approval_level?: 'editor' | 'senior_editor' | 'managing_editor' | 'publisher';
  
  // Joined data
  article?: EditorialArticle;
  reviewer?: UserProfile;
}

export interface EditorialMetrics {
  id: string;
  article_id: string;
  metric_date: string;
  page_views: number;
  unique_visitors: number;
  time_on_page: number;
  social_shares: number;
  comments_count: number;
  bounce_rate?: number;
  conversion_rate?: number;
  created_at: string;
}

export interface EditorialDashboardStats {
  total_articles: number;
  articles_today: number;
  drafts_pending: number;
  articles_in_review: number;
  published_today: number;
  breaking_news_active: number;
  assignments_overdue: number;
  assignments_due_today: number;
}

export interface JournalistWorkload {
  journalist_id: string;
  journalist_name: string;
  active_assignments: number;
  articles_in_progress: number;
  avg_days_to_deadline: number;
}

// API Response types
export interface EditorialDashboardData {
  stats: EditorialDashboardStats;
  recent_articles: EditorialArticle[];
  urgent_assignments: StoryAssignment[];
  breaking_news: BreakingNewsAlert[];
  pending_approvals: ContentApproval[];
  calendar_today: EditorialCalendarEvent[];
  journalist_workload: JournalistWorkload[];
}

// Form types
export interface CreateAssignmentForm {
  title: string;
  description?: string;
  brief?: string;
  deadline?: string;
  priority: PriorityLevel;
  category: string;
  assigned_to: string;
  estimated_word_count?: number;
  source_leads?: string[];
  research_notes?: string;
}

export interface CreateBreakingNewsForm {
  title: string;
  content: string;
  alert_level: AlertLevel;
  article_id?: string;
  expires_at?: string;
}

export interface ApprovalForm {
  approval_status: ApprovalStatus;
  review_notes?: string;
  approval_level?: 'editor' | 'senior_editor' | 'managing_editor' | 'publisher';
}

export interface ArticleUpdateForm {
  title?: string;
  content?: string;
  summary?: string;
  status?: ArticleStatus;
  category?: string;
  tags?: string[];
  scheduled_for?: string;
  breaking_news?: boolean;
  featured?: boolean;
  editorial_notes?: string;
  seo_title?: string;
  seo_description?: string;
  social_media_text?: string;
}

// Filter types
export interface ArticleFilters {
  status?: ArticleStatus[];
  category?: string[];
  author_id?: string;
  editor_id?: string;
  date_from?: string;
  date_to?: string;
  breaking_news?: boolean;
  featured?: boolean;
}

export interface AssignmentFilters {
  status?: string[];
  priority?: PriorityLevel[];
  assigned_to?: string;
  assigned_by?: string;
  category?: string[];
  overdue?: boolean;
  due_date_from?: string;
  due_date_to?: string;
}

// Sort options
export type ArticleSortField = 'created_at' | 'updated_at' | 'published_at' | 'title' | 'status' | 'word_count';
export type AssignmentSortField = 'created_at' | 'deadline' | 'priority' | 'title' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions<T extends string> {
  field: T;
  direction: SortDirection;
}