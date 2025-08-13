import { UserRole } from '@/shared/lib/auth/roles'
import type { ArticleStatus } from './types'

// Allowed transitions per role
// author (user): draft -> submitted
// curator/editor: submitted -> approved | changes_requested
// admin: approved -> published; can also approve/request
export function canTransition(role: UserRole, from: ArticleStatus, to: ArticleStatus): boolean {
  switch (role) {
    case UserRole.USER:
      return from === 'draft' && to === 'submitted'
    case UserRole.CURATOR:
    case UserRole.EDITOR:
      return from === 'submitted' && (to === 'approved' || to === 'changes_requested')
    case UserRole.ADMIN:
      if (from === 'approved' && to === 'published') return true
      if (from === 'submitted' && (to === 'approved' || to === 'changes_requested')) return true
      return false
    default:
      return false
  }
}
