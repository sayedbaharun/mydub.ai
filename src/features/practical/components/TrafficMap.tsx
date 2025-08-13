import { useEffect, useState } from 'react'
import { AlertTriangle, Car, Construction, MapPin, Navigation } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { TrafficData } from '../types'
import { PracticalService } from '../services/practical.service'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'

interface TrafficMapProps {
  className?: string
}

export function TrafficMap({ className }: TrafficMapProps) {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoad, setSelectedRoad] = useState<TrafficData | null>(null)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  useEffect(() => {
    loadTrafficData()
    const interval = setInterval(loadTrafficData, 60000) // Update every minute

    // Subscribe to real-time updates
    let unsubscribe: (() => void) | null = null
    const setupSubscription = async () => {
      unsubscribe = await PracticalService.subscribeToTrafficUpdates((update) => {
        setTrafficData(prev => {
          const index = prev.findIndex(item => item.id === update.id)
          if (index >= 0) {
            const newData = [...prev]
            newData[index] = update
            return newData
          }
          return [update, ...prev]
        })
      })
    }
    setupSubscription()

    return () => {
      clearInterval(interval)
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadTrafficData = async () => {
    try {
      const data = await PracticalService.getTrafficData()
      setTrafficData(data)
    } catch (error) {
      console.error('Error loading traffic data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'smooth':
        return 'bg-green-500'
      case 'moderate':
        return 'bg-yellow-500'
      case 'heavy':
        return 'bg-orange-500'
      case 'blocked':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    return t(`practical.traffic.status.${status}`)
  }

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'accident':
        return <AlertTriangle className="h-4 w-4" />
      case 'construction':
        return <Construction className="h-4 w-4" />
      case 'event':
        return <MapPin className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Navigation className="h-5 w-5" />
            {t('practical.traffic.liveMap')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {/* Placeholder map background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              
              {/* Sample traffic visualization */}
              <svg className="absolute inset-0 w-full h-full">
                {/* Sheikh Zayed Road */}
                <line
                  x1="10%"
                  y1="50%"
                  x2="90%"
                  y2="50%"
                  stroke={trafficData.find(d => d.road.includes('Sheikh Zayed')) ? 
                    getStatusColor(trafficData.find(d => d.road.includes('Sheikh Zayed'))!.status).replace('bg-', '#').replace('500', '600') : 
                    '#10b981'
                  }
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Al Khail Road */}
                <line
                  x1="15%"
                  y1="30%"
                  x2="85%"
                  y2="30%"
                  stroke={trafficData.find(d => d.road.includes('Al Khail')) ? 
                    getStatusColor(trafficData.find(d => d.road.includes('Al Khail'))!.status).replace('bg-', '#').replace('500', '600') : 
                    '#10b981'
                  }
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Emirates Road */}
                <line
                  x1="20%"
                  y1="70%"
                  x2="80%"
                  y2="70%"
                  stroke={trafficData.find(d => d.road.includes('Emirates')) ? 
                    getStatusColor(trafficData.find(d => d.road.includes('Emirates'))!.status).replace('bg-', '#').replace('500', '600') : 
                    '#10b981'
                  }
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>

              {/* Legend */}
              <div className={cn(
                "absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg",
                isRTL && "left-auto right-4"
              )}>
                <p className={cn(
                  "text-sm font-medium mb-2",
                  isRTL && "text-right"
                )}>
                  {t('practical.traffic.legend')}
                </p>
                <div className="space-y-1">
                  {['smooth', 'moderate', 'heavy', 'blocked'].map((status) => (
                    <div 
                      key={status}
                      className={cn(
                        "flex items-center gap-2 text-xs",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      <div className={cn("w-3 h-3 rounded", getStatusColor(status))} />
                      <span>{getStatusText(status)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Updates List */}
      <Card>
        <CardHeader>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Car className="h-5 w-5" />
            {t('practical.traffic.updates')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : trafficData.length === 0 ? (
              <p className={cn(
                "text-center text-muted-foreground py-8",
                isRTL && "text-right"
              )}>
                {t('practical.traffic.noUpdates')}
              </p>
            ) : (
              <div className="space-y-3">
                {trafficData.map((traffic) => (
                  <Card
                    key={traffic.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedRoad?.id === traffic.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedRoad(traffic)}
                  >
                    <CardContent className="p-3">
                      <div className={cn(
                        "flex items-start gap-3",
                        isRTL && "flex-row-reverse"
                      )}>
                        <div className={cn(
                          "w-2 h-full rounded-full shrink-0 mt-1",
                          getStatusColor(traffic.status)
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "flex items-start justify-between gap-2 mb-1",
                            isRTL && "flex-row-reverse"
                          )}>
                            <div>
                              <h4 className={cn(
                                "font-medium text-sm",
                                isRTL && "text-right"
                              )}>
                                {isRTL ? traffic.roadAr : traffic.road}
                              </h4>
                              <p className={cn(
                                "text-xs text-muted-foreground",
                                isRTL && "text-right"
                              )}>
                                {isRTL ? traffic.areaAr : traffic.area}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {getStatusText(traffic.status)}
                            </Badge>
                          </div>
                          
                          {traffic.description && (
                            <p className={cn(
                              "text-xs text-muted-foreground mb-2",
                              isRTL && "text-right"
                            )}>
                              {isRTL ? traffic.descriptionAr : traffic.description}
                            </p>
                          )}

                          {traffic.incidents && traffic.incidents.length > 0 && (
                            <div className="space-y-1">
                              {traffic.incidents.map((incident) => (
                                <div 
                                  key={incident.id}
                                  className={cn(
                                    "flex items-center gap-2 text-xs",
                                    isRTL && "flex-row-reverse"
                                  )}
                                >
                                  {getIncidentIcon(incident.type)}
                                  <span className={cn(
                                    incident.severity === 'high' && "text-red-600",
                                    incident.severity === 'medium' && "text-orange-600"
                                  )}>
                                    {isRTL ? incident.descriptionAr : incident.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <p className={cn(
                            "text-xs text-muted-foreground mt-2",
                            isRTL && "text-right"
                          )}>
                            {t('practical.traffic.updated')} {formatDistanceToNow(new Date(traffic.updatedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedRoad && (
            <div className="mt-4 pt-4 border-t">
              <Button
                className={cn(
                  "w-full gap-2",
                  isRTL && "flex-row-reverse"
                )}
                onClick={() => {
                  // Open navigation app with selected road
                  const url = `https://www.google.com/maps/search/${encodeURIComponent(selectedRoad.road + ', Dubai')}`
                  window.open(url, '_blank')
                }}
              >
                <Navigation className="h-4 w-4" />
                {t('practical.traffic.navigate')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}