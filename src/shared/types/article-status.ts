// Auto-generated article status constants
// Generated from database ENUM: article_status

export const ARTICLE_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted', 
  PENDING_REVIEW: 'pending_review', // Alias for submitted (backward compatibility)
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  NEEDS_REVISION: 'needs_revision',
  REJECTED: 'rejected',
  SCHEDULED: 'scheduled'
} as const

export type ArticleStatus = typeof ARTICLE_STATUSES[keyof typeof ARTICLE_STATUSES]

// Article status display names
export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  [ARTICLE_STATUSES.DRAFT]: 'Draft',
  [ARTICLE_STATUSES.SUBMITTED]: 'Submitted',
  [ARTICLE_STATUSES.PENDING_REVIEW]: 'Pending Review',
  [ARTICLE_STATUSES.IN_REVIEW]: 'In Review',
  [ARTICLE_STATUSES.APPROVED]: 'Approved',
  [ARTICLE_STATUSES.PUBLISHED]: 'Published',
  [ARTICLE_STATUSES.ARCHIVED]: 'Archived',
  [ARTICLE_STATUSES.NEEDS_REVISION]: 'Needs Revision',
  [ARTICLE_STATUSES.REJECTED]: 'Rejected',
  [ARTICLE_STATUSES.SCHEDULED]: 'Scheduled'
}

// Status transition rules
export const ARTICLE_STATUS_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  [ARTICLE_STATUSES.DRAFT]: [ARTICLE_STATUSES.SUBMITTED, ARTICLE_STATUSES.PENDING_REVIEW, ARTICLE_STATUSES.ARCHIVED],
  [ARTICLE_STATUSES.SUBMITTED]: [ARTICLE_STATUSES.IN_REVIEW, ARTICLE_STATUSES.DRAFT, ARTICLE_STATUSES.ARCHIVED],
  [ARTICLE_STATUSES.PENDING_REVIEW]: [ARTICLE_STATUSES.IN_REVIEW, ARTICLE_STATUSES.DRAFT, ARTICLE_STATUSES.ARCHIVED], // Same as submitted
  [ARTICLE_STATUSES.IN_REVIEW]: [ARTICLE_STATUSES.APPROVED, ARTICLE_STATUSES.REJECTED, ARTICLE_STATUSES.NEEDS_REVISION],
  [ARTICLE_STATUSES.APPROVED]: [ARTICLE_STATUSES.PUBLISHED, ARTICLE_STATUSES.SCHEDULED],
  [ARTICLE_STATUSES.PUBLISHED]: [ARTICLE_STATUSES.ARCHIVED],
  [ARTICLE_STATUSES.ARCHIVED]: [],
  [ARTICLE_STATUSES.NEEDS_REVISION]: [ARTICLE_STATUSES.SUBMITTED, ARTICLE_STATUSES.DRAFT],
  [ARTICLE_STATUSES.REJECTED]: [ARTICLE_STATUSES.DRAFT],
  [ARTICLE_STATUSES.SCHEDULED]: [ARTICLE_STATUSES.PUBLISHED, ARTICLE_STATUSES.APPROVED]
}

// Check if status transition is valid
export function canTransitionTo(from: ArticleStatus, to: ArticleStatus): boolean {
  return ARTICLE_STATUS_TRANSITIONS[from]?.includes(to) || false
}

// Get next possible statuses
export function getNextStatuses(currentStatus: ArticleStatus): ArticleStatus[] {
  return ARTICLE_STATUS_TRANSITIONS[currentStatus] || []
}

// Status colors for UI
export const ARTICLE_STATUS_COLORS: Record<ArticleStatus, string> = {
  [ARTICLE_STATUSES.DRAFT]: 'bg-gray-100 text-gray-800',
  [ARTICLE_STATUSES.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [ARTICLE_STATUSES.PENDING_REVIEW]: 'bg-blue-100 text-blue-800', // Same as submitted
  [ARTICLE_STATUSES.IN_REVIEW]: 'bg-yellow-100 text-yellow-800',
  [ARTICLE_STATUSES.APPROVED]: 'bg-green-100 text-green-800',
  [ARTICLE_STATUSES.PUBLISHED]: 'bg-purple-100 text-purple-800',
  [ARTICLE_STATUSES.ARCHIVED]: 'bg-gray-100 text-gray-600',
  [ARTICLE_STATUSES.NEEDS_REVISION]: 'bg-orange-100 text-orange-800',
  [ARTICLE_STATUSES.REJECTED]: 'bg-red-100 text-red-800',
  [ARTICLE_STATUSES.SCHEDULED]: 'bg-indigo-100 text-indigo-800'
}

// Status icons for UI
export const ARTICLE_STATUS_ICONS: Record<ArticleStatus, string> = {
  [ARTICLE_STATUSES.DRAFT]: 'EditIcon',
  [ARTICLE_STATUSES.SUBMITTED]: 'SendIcon', 
  [ARTICLE_STATUSES.PENDING_REVIEW]: 'SendIcon', // Same as submitted
  [ARTICLE_STATUSES.IN_REVIEW]: 'EyeIcon',
  [ARTICLE_STATUSES.APPROVED]: 'CheckCircleIcon',
  [ARTICLE_STATUSES.PUBLISHED]: 'GlobeIcon',
  [ARTICLE_STATUSES.ARCHIVED]: 'ArchiveIcon',
  [ARTICLE_STATUSES.NEEDS_REVISION]: 'AlertCircleIcon',
  [ARTICLE_STATUSES.REJECTED]: 'XCircleIcon',
  [ARTICLE_STATUSES.SCHEDULED]: 'ClockIcon'
}