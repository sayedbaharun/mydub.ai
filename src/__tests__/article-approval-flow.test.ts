/**
 * Article Approval Flow Tests
 * Tests the complete article approval workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ARTICLE_STATUSES, canTransitionTo, getNextStatuses } from '@/shared/types/article-status'
import { UserRole, roleChecks } from '@/shared/lib/auth/roles'

describe('Article Status Flow', () => {
  it('should allow valid status transitions', () => {
    // Draft to submitted
    expect(canTransitionTo(ARTICLE_STATUSES.DRAFT, ARTICLE_STATUSES.SUBMITTED)).toBe(true)
    
    // Submitted to in review
    expect(canTransitionTo(ARTICLE_STATUSES.SUBMITTED, ARTICLE_STATUSES.IN_REVIEW)).toBe(true)
    
    // In review to approved
    expect(canTransitionTo(ARTICLE_STATUSES.IN_REVIEW, ARTICLE_STATUSES.APPROVED)).toBe(true)
    
    // Approved to published
    expect(canTransitionTo(ARTICLE_STATUSES.APPROVED, ARTICLE_STATUSES.PUBLISHED)).toBe(true)
  })

  it('should reject invalid status transitions', () => {
    // Can't go from draft to published directly
    expect(canTransitionTo(ARTICLE_STATUSES.DRAFT, ARTICLE_STATUSES.PUBLISHED)).toBe(false)
    
    // Can't go back from published to draft
    expect(canTransitionTo(ARTICLE_STATUSES.PUBLISHED, ARTICLE_STATUSES.DRAFT)).toBe(false)
    
    // Can't go from archived to anything
    expect(canTransitionTo(ARTICLE_STATUSES.ARCHIVED, ARTICLE_STATUSES.DRAFT)).toBe(false)
  })

  it('should get correct next statuses', () => {
    const draftNextStatuses = getNextStatuses(ARTICLE_STATUSES.DRAFT)
    expect(draftNextStatuses).toContain(ARTICLE_STATUSES.SUBMITTED)
    expect(draftNextStatuses).toContain(ARTICLE_STATUSES.ARCHIVED)
    expect(draftNextStatuses).not.toContain(ARTICLE_STATUSES.PUBLISHED)

    const inReviewNextStatuses = getNextStatuses(ARTICLE_STATUSES.IN_REVIEW)
    expect(inReviewNextStatuses).toContain(ARTICLE_STATUSES.APPROVED)
    expect(inReviewNextStatuses).toContain(ARTICLE_STATUSES.REJECTED)
    expect(inReviewNextStatuses).toContain(ARTICLE_STATUSES.NEEDS_REVISION)
  })
})

describe('Role Permissions', () => {
  it('should correctly identify user roles', () => {
    expect(roleChecks.isAdmin(UserRole.ADMIN)).toBe(true)
    expect(roleChecks.isAdmin(UserRole.USER)).toBe(false)
    
    expect(roleChecks.isEditor(UserRole.EDITOR)).toBe(true)
    expect(roleChecks.isEditor(UserRole.CURATOR)).toBe(false)
    
    expect(roleChecks.isCurator(UserRole.CURATOR)).toBe(true)
    expect(roleChecks.isCurator(UserRole.USER)).toBe(false)
  })

  it('should correctly identify staff members', () => {
    expect(roleChecks.isStaff(UserRole.ADMIN)).toBe(true)
    expect(roleChecks.isStaff(UserRole.EDITOR)).toBe(true)
    expect(roleChecks.isStaff(UserRole.CURATOR)).toBe(true)
    expect(roleChecks.isStaff(UserRole.USER)).toBe(false)
  })

  it('should correctly identify approval permissions', () => {
    expect(roleChecks.canApprove(UserRole.ADMIN)).toBe(true)
    expect(roleChecks.canApprove(UserRole.EDITOR)).toBe(true)
    expect(roleChecks.canApprove(UserRole.CURATOR)).toBe(true)
    expect(roleChecks.canApprove(UserRole.USER)).toBe(false)
  })

  it('should correctly identify publish permissions', () => {
    expect(roleChecks.canPublish(UserRole.ADMIN)).toBe(true)
    expect(roleChecks.canPublish(UserRole.EDITOR)).toBe(true)
    expect(roleChecks.canPublish(UserRole.CURATOR)).toBe(false)
    expect(roleChecks.canPublish(UserRole.USER)).toBe(false)
  })
})

describe('Article Status Constants', () => {
  it('should have all required status values', () => {
    const expectedStatuses = [
      'draft',
      'submitted',
      'in_review', 
      'approved',
      'published',
      'archived',
      'needs_revision',
      'rejected',
      'scheduled'
    ]

    const actualStatuses = Object.values(ARTICLE_STATUSES)
    
    expectedStatuses.forEach(status => {
      expect(actualStatuses).toContain(status)
    })
  })

  it('should have consistent status constants', () => {
    expect(ARTICLE_STATUSES.DRAFT).toBe('draft')
    expect(ARTICLE_STATUSES.SUBMITTED).toBe('submitted')
    expect(ARTICLE_STATUSES.IN_REVIEW).toBe('in_review')
    expect(ARTICLE_STATUSES.APPROVED).toBe('approved')
    expect(ARTICLE_STATUSES.PUBLISHED).toBe('published')
    expect(ARTICLE_STATUSES.ARCHIVED).toBe('archived')
    expect(ARTICLE_STATUSES.NEEDS_REVISION).toBe('needs_revision')
    expect(ARTICLE_STATUSES.REJECTED).toBe('rejected')
    expect(ARTICLE_STATUSES.SCHEDULED).toBe('scheduled')
  })
})