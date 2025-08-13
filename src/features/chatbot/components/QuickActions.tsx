import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { QuickAction } from '../types'
import { cn } from '@/shared/lib/utils'

interface QuickActionsProps {
  actions: QuickAction[]
  onActionClick: (action: QuickAction) => void
  isRTL: boolean
}

export function QuickActions({ actions, onActionClick, isRTL }: QuickActionsProps) {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  return (
    <div className="p-4 border-t">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => onActionClick(action)}
            className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}
          >
            <span className="text-lg">{action.icon}</span>
            <span>{isArabic ? action.labelAr : action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}