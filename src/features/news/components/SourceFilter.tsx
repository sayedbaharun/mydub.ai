import { useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/shared/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { NEWS_SOURCES } from '../data/sources'
import { NewsSource } from '../types'
import { useTranslation } from 'react-i18next'

interface SourceFilterProps {
  selectedSources: string[]
  onSourcesChange: (sources: string[]) => void
}

export function SourceFilter({
  selectedSources,
  onSourcesChange,
}: SourceFilterProps) {
  const [open, setOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onSourcesChange(selectedSources.filter(id => id !== sourceId))
    } else {
      onSourcesChange([...selectedSources, sourceId])
    }
  }

  const clearAll = () => {
    onSourcesChange([])
    setOpen(false)
  }

  const selectAll = () => {
    onSourcesChange(NEWS_SOURCES.map(source => source.id))
    setOpen(false)
  }

  const getSelectedSources = (): NewsSource[] => {
    return NEWS_SOURCES.filter(source => 
      selectedSources.includes(source.id)
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedSources.length === 0
              ? t('filters.allSources')
              : selectedSources.length === 1
              ? getSelectedSources()[0][isRTL ? 'nameAr' : 'name']
              : t('filters.sourcesSelected', { count: selectedSources.length })}
          </span>
          <ChevronDown className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50",
            isRTL && "ml-0 mr-2"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align={isRTL ? "end" : "start"}>
        <Command>
          <CommandInput 
            placeholder={t('filters.searchSources')}
            className={isRTL ? "text-right" : ""}
          />
          <CommandEmpty>{t('filters.noSourcesFound')}</CommandEmpty>
          <CommandGroup>
            <div className="flex justify-between p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="h-8 text-xs"
              >
                {t('common.selectAll')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-xs"
              >
                {t('common.clearAll')}
              </Button>
            </div>
            {NEWS_SOURCES.map((source) => (
              <CommandItem
                key={source.id}
                value={source.name}
                onSelect={() => toggleSource(source.id)}
                className="cursor-pointer"
              >
                <div className={cn(
                  "flex items-center gap-3 w-full",
                  isRTL && "flex-row-reverse"
                )}>
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    {source.logo ? (
                      <img 
                        src={source.logo} 
                        alt={source.name}
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium",
                      isRTL ? "text-right" : "text-left"
                    )}>
                      {isRTL ? source.nameAr : source.name}
                    </p>
                    <div className={cn(
                      "flex items-center gap-2 mt-1",
                      isRTL && "flex-row-reverse"
                    )}>
                      <span className="text-xs text-muted-foreground">
                        {t('credibility')}:
                      </span>
                      <div className="flex items-center gap-1">
                        <Progress 
                          value={source.credibility} 
                          className="h-1.5 w-16"
                        />
                        <span className="text-xs font-medium">
                          {source.credibility}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedSources.includes(source.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function SourceBadges({
  selectedSources,
  onRemove,
}: {
  selectedSources: string[]
  onRemove: (sourceId: string) => void
}) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  if (selectedSources.length === 0) return null

  const sources = NEWS_SOURCES.filter(source =>
    selectedSources.includes(source.id)
  )

  return (
    <div className={cn(
      "flex flex-wrap gap-2",
      isRTL && "flex-row-reverse"
    )}>
      {sources.map((source) => (
        <Badge
          key={source.id}
          variant="secondary"
          className="cursor-pointer"
          onClick={() => onRemove(source.id)}
        >
          <span>
            {isRTL ? source.nameAr : source.name}
          </span>
          <span className={cn(
            "ml-1 hover:text-destructive",
            isRTL && "ml-0 mr-1"
          )}>
            ×
          </span>
        </Badge>
      ))}
    </div>
  )
}