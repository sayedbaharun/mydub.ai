#!/usr/bin/env ts-node

/**
 * Script to regenerate TypeScript types from Supabase database
 * Run after database schema changes
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

const TYPES_FILE = 'src/shared/types/database.types.ts'

async function regenerateTypes() {
  console.log('🔄 Regenerating TypeScript types from Supabase schema...')
  
  try {
    // Check if supabase CLI is available
    execSync('supabase --version', { stdio: 'ignore' })
  } catch (error) {
    console.error('❌ Supabase CLI not found. Please install it first:')
    console.error('npm i supabase@latest')
    process.exit(1)
  }

  try {
    // Generate types
    const command = `supabase gen types typescript --linked > ${TYPES_FILE}`
    console.log(`Running: ${command}`)
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    console.log(`✅ Types regenerated successfully at ${TYPES_FILE}`)
    
    // Also create article status constants
    await createStatusConstants()
    
  } catch (error) {
    console.error('❌ Failed to regenerate types:', error)
    process.exit(1)
  }
}

async function createStatusConstants() {
  const statusConstants = `// Auto-generated article status constants
// Generated from database ENUM: article_status

export const ARTICLE_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted', 
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
  [ARTICLE_STATUSES.DRAFT]: [ARTICLE_STATUSES.SUBMITTED, ARTICLE_STATUSES.ARCHIVED],
  [ARTICLE_STATUSES.SUBMITTED]: [ARTICLE_STATUSES.IN_REVIEW, ARTICLE_STATUSES.DRAFT, ARTICLE_STATUSES.ARCHIVED],
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
`

  const statusFile = 'src/shared/types/article-status.ts'
  
  try {
    const fs = await import('fs/promises')
    await fs.writeFile(statusFile, statusConstants)
    console.log(`✅ Article status constants created at ${statusFile}`)
  } catch (error) {
    console.error('❌ Failed to create status constants:', error)
  }
}

if (require.main === module) {
  regenerateTypes()
}