import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Tag } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Event } from '../types'
import { useTranslation } from 'react-i18next'

interface EventCalendarProps {
  events: Event[]
  onEventSelect?: (event: Event) => void
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
}

export function EventCalendar({
  events,
  onEventSelect,
  selectedDate = new Date(),
  onDateSelect
}: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      return date >= eventStart && date <= eventEnd
    })
  }

  // Get events for the selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      festival: 'bg-purple-500',
      concert: 'bg-pink-500',
      sports: 'bg-green-500',
      exhibition: 'bg-blue-500',
      conference: 'bg-orange-500',
      family: 'bg-yellow-500',
      cultural: 'bg-red-500'
    }
    return colors[category] || 'bg-gray-500'
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      festival: '🎉',
      concert: '🎵',
      sports: '⚽',
      exhibition: '🎨',
      conference: '📊',
      family: '👨‍👩‍👧‍👦',
      cultural: '🏛️'
    }
    return icons[category] || '📅'
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1))
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className={cn(
            "flex items-center justify-between",
            isRTL && "flex-row-reverse"
          )}>
            <CardTitle className={cn(
              "text-lg",
              isRTL && "text-right"
            )}>
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className={cn(
              "flex gap-1",
              isRTL && "flex-row-reverse"
            )}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className={cn(
                  "h-4 w-4",
                  isRTL && "rotate-180"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className={cn(
                  "h-4 w-4",
                  isRTL && "rotate-180"
                )} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-xs font-medium text-muted-foreground p-2">
                {t(`common.${day.toLowerCase()}`)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="p-2" />
            ))}
            
            {/* Month days */}
            {monthDays.map((day) => {
              const dayEvents = getEventsForDate(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              
              return (
                <Button
                  key={day.toISOString()}
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "h-auto p-2 flex flex-col items-center justify-center relative",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground",
                    isToday && !isSelected && "ring-2 ring-primary"
                  )}
                  onClick={() => onDateSelect?.(day)}
                >
                  <span className="text-sm">{format(day, 'd')}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((event, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-1 h-1 rounded-full",
                            getCategoryColor(event.category)
                          )}
                        />
                      ))}
                    </div>
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      <Card>
        <CardHeader>
          <CardTitle className={cn(
            "text-lg flex items-center gap-2",
            isRTL && "flex-row-reverse text-right"
          )}>
            <CalendarIcon className="h-5 w-5" />
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : t('selectDate')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {selectedDateEvents.length === 0 ? (
              <p className={cn(
                "text-center text-muted-foreground py-8",
                isRTL && "text-right"
              )}>
                {t('noEventsOnDate')}
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onEventSelect?.(event)}
                  >
                    <CardContent className="p-4">
                      <div className={cn(
                        "flex items-start gap-3",
                        isRTL && "flex-row-reverse"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          getCategoryColor(event.category)
                        )}>
                          <span className="text-lg">{getCategoryIcon(event.category)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "font-semibold text-sm mb-1",
                            isRTL && "text-right"
                          )}>
                            {isRTL ? event.titleAr : event.title}
                          </h4>
                          <div className={cn(
                            "flex flex-col gap-1 text-xs text-muted-foreground",
                            isRTL && "items-end"
                          )}>
                            <div className={cn(
                              "flex items-center gap-1",
                              isRTL && "flex-row-reverse"
                            )}>
                              <MapPin className="h-3 w-3" />
                              <span>{isRTL ? event.venue.nameAr : event.venue.name}</span>
                            </div>
                            <div className={cn(
                              "flex items-center gap-1",
                              isRTL && "flex-row-reverse"
                            )}>
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(event.startDate), 'h:mm a')}
                                {event.endDate !== event.startDate && 
                                  ` - ${format(new Date(event.endDate), 'h:mm a')}`
                                }
                              </span>
                            </div>
                            {event.price && (
                              <div className={cn(
                                "flex items-center gap-1",
                                isRTL && "flex-row-reverse"
                              )}>
                                <Tag className="h-3 w-3" />
                                <span>
                                  {event.price.isFree 
                                    ? t('free')
                                    : `${event.price.currency} ${event.price.min}${
                                        event.price.max ? `-${event.price.max}` : ''
                                      }`
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={cn(
                            "flex gap-1 mt-2",
                            isRTL && "flex-row-reverse"
                          )}>
                            <Badge variant="outline" className="text-xs">
                              {t(`tourism.eventCategory.${event.category}`)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}