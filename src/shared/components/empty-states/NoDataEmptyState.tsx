import { FileText, Plus, Upload } from 'lucide-react'
import { EmptyState } from '../EmptyState'
import { LucideIcon } from 'lucide-react'

interface NoDataEmptyStateProps {
  entity: string // e.g., 'articles', 'bookmarks', 'events'
  icon?: LucideIcon
  onAdd?: () => void
  onImport?: () => void
  customMessage?: string
}

export function NoDataEmptyState({
  entity,
  icon = FileText,
  onAdd,
  onImport,
  customMessage
}: NoDataEmptyStateProps) {
  return (
    <EmptyState
      icon={icon}
      title={`No ${entity} yet`}
      description={customMessage || `Get started by adding your first ${entity.slice(0, -1)}`}
      action={
        onAdd
          ? {
              label: `Add ${entity.slice(0, -1)}`,
              onClick: onAdd,
              variant: 'default'
            }
          : undefined
      }
      secondaryAction={
        onImport
          ? {
              label: `Import ${entity}`,
              onClick: onImport,
              variant: 'outline'
            }
          : undefined
      }
    />
  )
}