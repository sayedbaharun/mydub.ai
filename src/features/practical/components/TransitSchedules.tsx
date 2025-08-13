import { useEffect, useState } from 'react'
import { 
  Train, 
  Bus, 
  Ship, 
  Clock, 
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { TransitRoute } from '../types'
import { PracticalService } from '../services/practical.service'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useTranslation } from 'react-i18next'

export function TransitSchedules() {
  const [routes, setRoutes] = useState<TransitRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  useEffect(() => {
    loadTransitRoutes()
    
    // Subscribe to transit alerts
    let unsubscribe: (() => void) | null = null
    const setupSubscription = async () => {
      unsubscribe = await PracticalService.subscribeToTransitAlerts((alert) => {
        // Update route status based on alerts
        setRoutes(prev => prev.map(route => 
          route.line === alert.line 
            ? { ...route, status: alert.status }
            : route
        ))
      })
    }
    setupSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadTransitRoutes = async () => {
    try {
      const data = await PracticalService.getTransitRoutes()
      setRoutes(data)
    } catch (error) {
      console.error('Error loading transit routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransitIcon = (type: string) => {
    switch (type) {
      case 'metro':
        return <Train className="h-5 w-5" />
      case 'bus':
        return <Bus className="h-5 w-5" />
      case 'tram':
        return <Train className="h-5 w-5" />
      case 'ferry':
        return <Ship className="h-5 w-5" />
      default:
        return <Train className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'delayed':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600'
      case 'delayed':
        return 'text-yellow-600'
      case 'suspended':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const RouteCard = ({ route }: { route: TransitRoute }) => (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        selectedRoute?.id === route.id && "ring-2 ring-primary"
      )}
      onClick={() => setSelectedRoute(route)}
    >
      <CardContent className="p-4">
        <div className={cn(
          "flex items-start gap-3",
          isRTL && "flex-row-reverse"
        )}>
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: route.color + '20' }}
          >
            <div style={{ color: route.color }}>
              {getTransitIcon(route.type)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn(
              "flex items-start justify-between gap-2 mb-1",
              isRTL && "flex-row-reverse"
            )}>
              <h4 className={cn(
                "font-semibold",
                isRTL && "text-right"
              )}>
                {route.line}
              </h4>
              <div className={cn(
                "flex items-center gap-1",
                isRTL && "flex-row-reverse"
              )}>
                {getStatusIcon(route.status)}
                <span className={cn(
                  "text-xs font-medium",
                  getStatusColor(route.status)
                )}>
                  {t(`practical.transit.status.${route.status}`)}
                </span>
              </div>
            </div>
            <p className={cn(
              "text-sm text-muted-foreground mb-2",
              isRTL && "text-right"
            )}>
              {isRTL ? route.nameAr : route.name}
            </p>
            <div className={cn(
              "flex items-center gap-4 text-xs text-muted-foreground",
              isRTL && "flex-row-reverse"
            )}>
              <div className={cn(
                "flex items-center gap-1",
                isRTL && "flex-row-reverse"
              )}>
                <Clock className="h-3 w-3" />
                <span>{route.frequency}</span>
              </div>
              <div className={cn(
                "flex items-center gap-1",
                isRTL && "flex-row-reverse"
              )}>
                <MapPin className="h-3 w-3" />
                <span>{route.stops.length} {t('practical.transit.stops')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const getCurrentTime = () => {
    const now = new Date()
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const isOperatingNow = (route: TransitRoute) => {
    const now = new Date()
    const day = now.getDay()
    const isWeekend = day === 5 || day === 6 // Friday or Saturday
    const hours = isWeekend ? route.operatingHours.weekend : route.operatingHours.weekday
    
    const currentTime = getCurrentTime()
    return currentTime >= hours.start && currentTime <= hours.end
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Train className="h-5 w-5" />
            {t('practical.transit.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="metro" className="w-full">
            <TabsList className={cn(
              "grid w-full grid-cols-4",
              isRTL && "flex-row-reverse"
            )}>
              <TabsTrigger value="metro">{t('practical.transit.metro')}</TabsTrigger>
              <TabsTrigger value="bus">{t('practical.transit.bus')}</TabsTrigger>
              <TabsTrigger value="tram">{t('practical.transit.tram')}</TabsTrigger>
              <TabsTrigger value="ferry">{t('practical.transit.ferry')}</TabsTrigger>
            </TabsList>

            {['metro', 'bus', 'tram', 'ferry'].map((type) => (
              <TabsContent key={type} value={type} className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className={cn(
                      "font-medium mb-3",
                      isRTL && "text-right"
                    )}>
                      {t('practical.transit.routes')}
                    </h3>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {routes
                          .filter(route => route.type === type)
                          .map((route) => (
                            <RouteCard key={route.id} route={route} />
                          ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {selectedRoute && selectedRoute.type === type && (
                    <div>
                      <h3 className={cn(
                        "font-medium mb-3",
                        isRTL && "text-right"
                      )}>
                        {t('practical.transit.routeDetails')}
                      </h3>
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className={cn(
                                "font-semibold text-lg mb-1",
                                isRTL && "text-right"
                              )}>
                                {selectedRoute.line}
                              </h4>
                              <p className={cn(
                                "text-sm text-muted-foreground",
                                isRTL && "text-right"
                              )}>
                                {isRTL ? selectedRoute.nameAr : selectedRoute.name}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <h5 className={cn(
                                "font-medium text-sm",
                                isRTL && "text-right"
                              )}>
                                {t('practical.transit.operatingHours')}
                              </h5>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className={cn(
                                  "p-2 rounded bg-muted",
                                  isRTL && "text-right"
                                )}>
                                  <p className="font-medium">{t('practical.transit.weekdays')}</p>
                                  <p className="text-muted-foreground">
                                    {selectedRoute.operatingHours.weekday.start} - {selectedRoute.operatingHours.weekday.end}
                                  </p>
                                </div>
                                <div className={cn(
                                  "p-2 rounded bg-muted",
                                  isRTL && "text-right"
                                )}>
                                  <p className="font-medium">{t('practical.transit.weekends')}</p>
                                  <p className="text-muted-foreground">
                                    {selectedRoute.operatingHours.weekend.start} - {selectedRoute.operatingHours.weekend.end}
                                  </p>
                                </div>
                              </div>
                              {isOperatingNow(selectedRoute) ? (
                                <Badge variant="default" className="w-fit">
                                  {t('practical.transit.operatingNow')}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="w-fit">
                                  {t('practical.transit.notOperating')}
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2">
                              <h5 className={cn(
                                "font-medium text-sm",
                                isRTL && "text-right"
                              )}>
                                {t('practical.transit.frequency')}
                              </h5>
                              <p className={cn(
                                "text-sm text-muted-foreground",
                                isRTL && "text-right"
                              )}>
                                {selectedRoute.frequency}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <h5 className={cn(
                                "font-medium text-sm",
                                isRTL && "text-right"
                              )}>
                                {t('practical.transit.majorStops')}
                              </h5>
                              <ScrollArea className="h-[150px]">
                                <div className="space-y-1">
                                  {selectedRoute.stops.slice(0, 10).map((stop) => (
                                    <div 
                                      key={stop.id}
                                      className={cn(
                                        "flex items-center gap-2 text-sm",
                                        isRTL && "flex-row-reverse"
                                      )}
                                    >
                                      <div className="w-2 h-2 rounded-full bg-primary" />
                                      <span className={cn(
                                        "flex-1",
                                        isRTL && "text-right"
                                      )}>
                                        {isRTL ? stop.nameAr : stop.name}
                                      </span>
                                      {stop.connections.length > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          {stop.connections.length} {t('practical.transit.connections')}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                  {selectedRoute.stops.length > 10 && (
                                    <p className={cn(
                                      "text-xs text-muted-foreground pt-2",
                                      isRTL && "text-right"
                                    )}>
                                      {t('practical.transit.moreStops', { count: selectedRoute.stops.length - 10 })}
                                    </p>
                                  )}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}