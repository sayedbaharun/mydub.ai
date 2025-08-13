/**
 * Editorial Service for MyDub.ai News Platform
 * Handles all editorial workflow API calls
 */

import { supabase } from '@/shared/lib/supabase'
import { ARTICLE_STATUSES, type ArticleStatus } from '@/shared/types/article-status';
import type {
  EditorialDashboardData,
  EditorialArticle,
  StoryAssignment,
  EditorialCalendarEvent,
  BreakingNewsAlert,
  ContentApproval,
  ArticleVersion,
  EditorialMetrics,
  CreateAssignmentForm,
  CreateBreakingNewsForm,
  ApprovalForm,
  ArticleUpdateForm,
  ArticleFilters,
  AssignmentFilters,
  SortOptions,
  ArticleSortField,
  AssignmentSortField,
  UserProfile
} from '../types/editorial.types';

class EditorialService {
  /**
   * Dashboard Data
   */
  async getDashboardData(): Promise<EditorialDashboardData> {
    try {
      // Get dashboard stats
      const { data: stats } = await supabase.rpc('get_editorial_dashboard_stats');
      
      // Get recent articles
      const { data: recentArticles } = await supabase
        .from('editorial_dashboard_view')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

      // Get urgent assignments
      const { data: urgentAssignments } = await supabase
        .from('story_assignments')
        .select(`
          *,
          journalist:assigned_to(full_name, avatar_url),
          editor:assigned_by(full_name, avatar_url)
        `)
        .in('priority', ['high', 'urgent'])
        .in('status', ['assigned', 'in_progress'])
        .order('deadline', { ascending: true })
        .limit(5);

      // Get active breaking news
      const { data: breakingNews } = await supabase
        .from('breaking_news_alerts')
        .select(`
          *,
          article:article_id(title, url),
          created_by_profile:created_by(full_name, avatar_url)
        `)
        .eq('is_active', true)
        .order('sent_at', { ascending: false })
        .limit(3);

      // Get pending approvals
      const { data: pendingApprovals } = await supabase
        .from('content_approvals')
        .select(`
          *,
          article:article_id(title, author_id),
          reviewer:reviewer_id(full_name, avatar_url)
        `)
        .eq('approval_status', 'pending')
        .order('reviewed_at', { ascending: true })
        .limit(5);

      // Get today's calendar events
      const today = new Date().toISOString().split('T')[0];
      const { data: calendarToday } = await supabase
        .from('editorial_calendar')
        .select(`
          *,
          assignee:assigned_to(full_name, avatar_url),
          assignment:related_assignment_id(title),
          article:related_article_id(title)
        `)
        .eq('date', today)
        .order('date', { ascending: true });

      // Get journalist workload
      const { data: journalistWorkload } = await supabase
        .from('journalist_workload_view')
        .select('*')
        .order('active_assignments', { ascending: false });

      return {
        stats: stats || {
          total_articles: 0,
          articles_today: 0,
          drafts_pending: 0,
          articles_in_review: 0,
          published_today: 0,
          breaking_news_active: 0,
          assignments_overdue: 0,
          assignments_due_today: 0
        },
        recent_articles: recentArticles || [],
        urgent_assignments: urgentAssignments || [],
        breaking_news: breakingNews || [],
        pending_approvals: pendingApprovals || [],
        calendar_today: calendarToday || [],
        journalist_workload: journalistWorkload || []
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Articles Management
   */
  async getArticles(
    filters?: ArticleFilters,
    sort?: SortOptions<ArticleSortField>,
    page = 1,
    limit = 25
  ): Promise<{ articles: EditorialArticle[]; total: number }> {
    try {
      let query = supabase
        .from('news_articles')
        .select(`
          *,
          assignment:assignment_id(title, deadline, priority),
          author_profile:author_id(full_name, byline_name, avatar_url),
          editor_profile:editor_id(full_name, avatar_url),
          publisher_profile:publisher_id(full_name, avatar_url)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.category?.length) {
        query = query.in('category', filters.category);
      }
      if (filters?.author_id) {
        query = query.eq('author_id', filters.author_id);
      }
      if (filters?.editor_id) {
        query = query.eq('editor_id', filters.editor_id);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.breaking_news !== undefined) {
        query = query.eq('breaking_news', filters.breaking_news);
      }
      if (filters?.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        articles: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  }

  async getArticleById(id: string): Promise<EditorialArticle | null> {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select(`
          *,
          assignment:assignment_id(*),
          author_profile:author_id(full_name, byline_name, avatar_url, bio_short),
          editor_profile:editor_id(full_name, avatar_url),
          publisher_profile:publisher_id(full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  }

  async updateArticle(id: string, updates: ArticleUpdateForm): Promise<EditorialArticle> {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  }

  async getArticleVersions(articleId: string): Promise<ArticleVersion[]> {
    try {
      const { data, error } = await supabase
        .from('article_versions')
        .select(`
          *,
          changed_by_profile:changed_by(full_name, avatar_url)
        `)
        .eq('article_id', articleId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching article versions:', error);
      throw error;
    }
  }

  /**
   * Story Assignments
   */
  async getAssignments(
    filters?: AssignmentFilters,
    sort?: SortOptions<AssignmentSortField>,
    page = 1,
    limit = 25
  ): Promise<{ assignments: StoryAssignment[]; total: number }> {
    try {
      let query = supabase
        .from('story_assignments')
        .select(`
          *,
          journalist:assigned_to(full_name, avatar_url, specialization),
          editor:assigned_by(full_name, avatar_url),
          article:news_articles(title, status, word_count)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.assigned_by) {
        query = query.eq('assigned_by', filters.assigned_by);
      }
      if (filters?.category?.length) {
        query = query.in('category', filters.category);
      }
      if (filters?.overdue) {
        query = query.lt('deadline', new Date().toISOString());
      }
      if (filters?.due_date_from) {
        query = query.gte('deadline', filters.due_date_from);
      }
      if (filters?.due_date_to) {
        query = query.lte('deadline', filters.due_date_to);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('deadline', { ascending: true });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        assignments: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  async createAssignment(assignment: CreateAssignmentForm): Promise<StoryAssignment> {
    try {
      const { data, error } = await supabase
        .from('story_assignments')
        .insert(assignment)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  async updateAssignment(id: string, updates: Partial<StoryAssignment>): Promise<StoryAssignment> {
    try {
      const { data, error } = await supabase
        .from('story_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }

  /**
   * Breaking News
   */
  async getBreakingNewsAlerts(): Promise<BreakingNewsAlert[]> {
    try {
      const { data, error } = await supabase
        .from('breaking_news_alerts')
        .select(`
          *,
          article:article_id(title, url),
          created_by_profile:created_by(full_name, avatar_url)
        `)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching breaking news alerts:', error);
      throw error;
    }
  }

  async createBreakingNewsAlert(alert: CreateBreakingNewsForm): Promise<BreakingNewsAlert> {
    try {
      const { data, error } = await supabase
        .from('breaking_news_alerts')
        .insert(alert)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating breaking news alert:', error);
      throw error;
    }
  }

  async deactivateBreakingNewsAlert(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('breaking_news_alerts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating breaking news alert:', error);
      throw error;
    }
  }

  /**
   * Content Approvals
   */
  async getContentApprovals(articleId?: string): Promise<ContentApproval[]> {
    try {
      let query = supabase
        .from('content_approvals')
        .select(`
          *,
          article:article_id(title, author_id),
          reviewer:reviewer_id(full_name, avatar_url)
        `);

      if (articleId) {
        query = query.eq('article_id', articleId);
      }

      query = query.order('reviewed_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching content approvals:', error);
      throw error;
    }
  }

  async createApproval(articleId: string, approval: ApprovalForm): Promise<ContentApproval> {
    try {
      const { data, error } = await supabase
        .from('content_approvals')
        .insert({
          article_id: articleId,
          ...approval
        })
        .select()
        .single();

      if (error) throw error;

      // Update article status based on approval
      if (approval.approval_status === 'approved') {
        await this.updateArticle(articleId, { status: ARTICLE_STATUSES.APPROVED });
      } else if (approval.approval_status === 'rejected') {
        await this.updateArticle(articleId, { status: ARTICLE_STATUSES.DRAFT });
      } else if (approval.approval_status === 'needs_revision') {
        await this.updateArticle(articleId, { status: ARTICLE_STATUSES.NEEDS_REVISION });
      }

      return data;
    } catch (error) {
      console.error('Error creating approval:', error);
      throw error;
    }
  }

  /**
   * Editorial Calendar
   */
  async getCalendarEvents(
    startDate: string,
    endDate: string
  ): Promise<EditorialCalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('editorial_calendar')
        .select(`
          *,
          assignee:assigned_to(full_name, avatar_url),
          assignment:related_assignment_id(title, priority),
          article:related_article_id(title, status)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  async createCalendarEvent(event: Omit<EditorialCalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<EditorialCalendarEvent> {
    try {
      const { data, error } = await supabase
        .from('editorial_calendar')
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Editorial Metrics
   */
  async getArticleMetrics(articleId: string): Promise<EditorialMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('editorial_metrics')
        .select('*')
        .eq('article_id', articleId)
        .order('metric_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching article metrics:', error);
      throw error;
    }
  }

  /**
   * User Management
   */
  async getJournalists(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'journalist')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching journalists:', error);
      throw error;
    }
  }

  async getEditors(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['editor', 'admin', 'publisher'])
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching editors:', error);
      throw error;
    }
  }

  /**
   * Real-time subscriptions
   */
  subscribeToBreakingNews(callback: (alert: BreakingNewsAlert) => void) {
    return supabase
      .channel('breaking_news')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'breaking_news_alerts'
      }, callback)
      .subscribe();
  }

  subscribeToArticleUpdates(callback: (article: EditorialArticle) => void) {
    return supabase
      .channel('article_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'news_articles'
      }, callback)
      .subscribe();
  }

  subscribeToAssignmentUpdates(callback: (assignment: StoryAssignment) => void) {
    return supabase
      .channel('assignment_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'story_assignments'
      }, callback)
      .subscribe();
  }
}

export const editorialService = new EditorialService();
export default editorialService;