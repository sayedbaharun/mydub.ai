import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { useTranslation } from 'react-i18next'

interface DateRangePickerProps {
  dateRange: {
    start: Date | null
    end: Date | null
  }
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      onDateRangeChange({
        start: range.from || null,
        end: range.to || null,
      })
    } else {
      onDateRangeChange({ start: null, end: null })
    }
  }

  const clearDateRange = () => {
    onDateRangeChange({ start: null, end: null })
    setOpen(false)
  }

  const formatDateRange = () => {
    if (!dateRange.start && !dateRange.end) {
      return t('filters.allDates')
    }

    if (dateRange.start && !dateRange.end) {
      return format(dateRange.start, 'PPP')
    }

    if (dateRange.start && dateRange.end) {
      return `${format(dateRange.start, 'PP')} - ${format(dateRange.end, 'PP')}`
    }

    return t('filters.selectDateRange')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange.start && !dateRange.end && "text-muted-foreground",
            isRTL && "text-right"
          )}
        >
          <CalendarIcon className={cn(
            "mr-2 h-4 w-4",
            isRTL && "mr-0 ml-2"
          )} />
          <span className="truncate">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align={isRTL ? "end" : "start"}
      >
        <div className="p-3 border-b">
          <div className={cn(
            "flex items-center justify-between",
            isRTL && "flex-row-reverse"
          )}>
            <h4 className="font-medium text-sm">
              {t('filters.selectDateRange')}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateRange}
              className="h-8 text-xs"
            >
              {t('common.clear')}
            </Button>
          </div>
        </div>
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange.start || new Date()}
          selected={{
            from: dateRange.start || undefined,
            to: dateRange.end || undefined,
          }}
          onSelect={handleSelect}
          numberOfMonths={2}
          dir={isRTL ? "rtl" : "ltr"}
        />
        <div className="p-3 border-t">
          <div className={cn(
            "flex gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const lastWeek = new Date(today)
                lastWeek.setDate(today.getDate() - 7)
                onDateRangeChange({ start: lastWeek, end: today })
              }}
              className="flex-1"
            >
              {t('filters.lastWeek')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today)
                lastMonth.setMonth(today.getMonth() - 1)
                onDateRangeChange({ start: lastMonth, end: today })
              }}
              className="flex-1"
            >
              {t('filters.lastMonth')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const lastYear = new Date(today)
                lastYear.setFullYear(today.getFullYear() - 1)
                onDateRangeChange({ start: lastYear, end: today })
              }}
              className="flex-1"
            >
              {t('filters.lastYear')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}