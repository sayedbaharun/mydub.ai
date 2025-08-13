import { useEffect, useState } from 'react'
import { 
  Cloud, 
  CloudRain, 
   
  Sun, 
  Wind, 
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { WeatherData } from '../types'
import { PracticalService } from '../services/practical.service'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  useEffect(() => {
    loadWeather()
    const interval = setInterval(loadWeather, 600000) // Update every 10 minutes
    return () => clearInterval(interval)
  }, [])

  const loadWeather = async () => {
    try {
      const data = await PracticalService.getCurrentWeather()
      setWeather(data)
    } catch (error) {
      console.error('Error loading weather:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-12 w-12 text-yellow-500" />
      case 'partly-cloudy':
        return <Cloud className="h-12 w-12 text-gray-400" />
      case 'cloudy':
        return <Cloud className="h-12 w-12 text-gray-600" />
      case 'rainy':
        return <CloudRain className="h-12 w-12 text-blue-500" />
      case 'stormy':
        return <CloudRain className="h-12 w-12 text-purple-600" />
      case 'foggy':
        return <Cloud className="h-12 w-12 text-gray-300" />
      case 'dusty':
        return <Wind className="h-12 w-12 text-orange-400" />
      default:
        return <Sun className="h-12 w-12 text-yellow-500" />
    }
  }

  const getUVIndexLevel = (index: number) => {
    if (index <= 2) return { level: t('practical.weather.uvLow'), color: 'text-green-600' }
    if (index <= 5) return { level: t('practical.weather.uvModerate'), color: 'text-yellow-600' }
    if (index <= 7) return { level: t('practical.weather.uvHigh'), color: 'text-orange-600' }
    if (index <= 10) return { level: t('practical.weather.uvVeryHigh'), color: 'text-red-600' }
    return { level: t('practical.weather.uvExtreme'), color: 'text-purple-600' }
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

  if (!weather) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">{t('practical.weather.unavailable')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(
          "flex items-center gap-2",
          isRTL && "flex-row-reverse"
        )}>
          <Thermometer className="h-5 w-5" />
          {t('practical.weather.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className={cn(
            "grid w-full grid-cols-2",
            isRTL && "flex-row-reverse"
          )}>
            <TabsTrigger value="current">{t('practical.weather.current')}</TabsTrigger>
            <TabsTrigger value="forecast">{t('practical.weather.forecast')}</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {/* Main Weather Display */}
            <div className={cn(
              "flex items-center justify-between",
              isRTL && "flex-row-reverse"
            )}>
              <div className={cn(
                "flex items-center gap-4",
                isRTL && "flex-row-reverse"
              )}>
                {getWeatherIcon(weather.condition)}
                <div>
                  <p className={cn(
                    "text-4xl font-bold",
                    isRTL && "text-right"
                  )}>
                    {weather.temperature}°C
                  </p>
                  <p className={cn(
                    "text-sm text-muted-foreground",
                    isRTL && "text-right"
                  )}>
                    {t('practical.weather.feelsLike', { temp: weather.feelsLike })}
                  </p>
                </div>
              </div>
              <div className={cn(
                "text-right",
                isRTL && "text-left"
              )}>
                <p className="font-medium">
                  {isRTL ? weather.descriptionAr : weather.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), 'EEEE, MMM d')}
                </p>
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <Droplets className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('practical.weather.humidity')}
                  </p>
                  <p className="font-medium">{weather.humidity}%</p>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <Wind className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('practical.weather.wind')}
                  </p>
                  <p className="font-medium">
                    {weather.windSpeed} km/h {weather.windDirection}
                  </p>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <Eye className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('practical.weather.visibility')}
                  </p>
                  <p className="font-medium">{weather.visibility} km</p>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <Gauge className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('practical.weather.pressure')}
                  </p>
                  <p className="font-medium">{weather.pressure} hPa</p>
                </div>
              </div>
            </div>

            {/* UV Index */}
            <div className="rounded-lg bg-muted p-3">
              <div className={cn(
                "flex items-center justify-between",
                isRTL && "flex-row-reverse"
              )}>
                <div className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse"
                )}>
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">
                    {t('practical.weather.uvIndex')}
                  </span>
                </div>
                <div className={cn(
                  "text-right",
                  isRTL && "text-left"
                )}>
                  <span className="font-bold text-lg">{weather.uvIndex}</span>
                  <span className={cn(
                    "ml-2 text-sm",
                    getUVIndexLevel(weather.uvIndex).color,
                    isRTL && "ml-0 mr-2"
                  )}>
                    {getUVIndexLevel(weather.uvIndex).level}
                  </span>
                </div>
              </div>
            </div>

            {/* Sunrise/Sunset */}
            <div className={cn(
              "flex justify-around",
              isRTL && "flex-row-reverse"
            )}>
              <div className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <Sunrise className="h-4 w-4 text-orange-400" />
                <div className={cn(
                  "text-center",
                  isRTL && "text-right"
                )}>
                  <p className="text-sm text-muted-foreground">
                    {t('practical.weather.sunrise')}
                  </p>
                  <p className="font-medium">{weather.sunrise}</p>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <Sunset className="h-4 w-4 text-orange-600" />
                <div className={cn(
                  "text-center",
                  isRTL && "text-right"
                )}>
                  <p className="text-sm text-muted-foreground">
                    {t('practical.weather.sunset')}
                  </p>
                  <p className="font-medium">{weather.sunset}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-3">
            {weather.forecast.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg bg-muted",
                  isRTL && "flex-row-reverse"
                )}
              >
                <div className={cn(
                  "flex items-center gap-3",
                  isRTL && "flex-row-reverse"
                )}>
                  <div className="scale-75">
                    {getWeatherIcon(day.condition)}
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      isRTL && "text-right"
                    )}>
                      {format(new Date(day.date), 'EEEE')}
                    </p>
                    <p className={cn(
                      "text-sm text-muted-foreground",
                      isRTL && "text-right"
                    )}>
                      {format(new Date(day.date), 'MMM d')}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "text-right",
                  isRTL && "text-left"
                )}>
                  <p className="font-medium">
                    {day.tempMax}° / {day.tempMin}°
                  </p>
                  {day.precipitation > 0 && (
                    <p className="text-sm text-blue-600">
                      {day.precipitation}% {t('practical.weather.rain')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}