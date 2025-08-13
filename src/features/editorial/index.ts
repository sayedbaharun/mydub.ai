/**
 * Editorial Feature Exports
 * Central export file for editorial functionality
 */

// Components
export { EditorialDashboard } from './components/EditorialDashboard';
export { BreakingNewsPanel } from './components/BreakingNewsPanel';
export { StoryAssignmentPanel } from './components/StoryAssignmentPanel';
export { ArticleWorkflow } from './components/ArticleWorkflow';
export { EditorialCalendar } from './components/EditorialCalendar';

// Hooks
export {
  useEditorialDashboard,
  useArticles,
  useArticle,
  useUpdateArticle,
  useAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useBreakingNews,
  useCreateBreakingNews,
  useDeactivateBreakingNews,
  useJournalists,
  useEditors,
  useArticleVersions,
  useContentApprovals,
  useEditorialRealtime,
  useEditorialWorkflow
} from './hooks/useEditorialWorkflow';

// Services
export { editorialService } from './services/editorial.service';

// Types
export type {
  UserRole,
  ArticleStatus,
  PriorityLevel,
  ApprovalStatus,
  AlertLevel,
  StoryAssignment,
  EditorialArticle,
  UserProfile,
  EditorialCalendarEvent,
  ArticleVersion,
  BreakingNewsAlert,
  ContentApproval,
  EditorialMetrics,
  EditorialDashboardStats,
  JournalistWorkload,
  EditorialDashboardData,
  CreateAssignmentForm,
  CreateBreakingNewsForm,
  ApprovalForm,
  ArticleUpdateForm,
  ArticleFilters,
  AssignmentFilters,
  ArticleSortField,
  AssignmentSortField,
  SortDirection,
  SortOptions
} from './types/editorial.types';