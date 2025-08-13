import { useState } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Droplets, 
  Eye,
  Gauge,
  Calendar,
  MapPin,
  RefreshCw
} from 'lucide-react'

interface WeatherData {
  temperature: number
  feelsLike: number
  condition: string
  icon: 'sun' | 'cloud' | 'rain'
  humidity: number
  windSpeed: number
  pressure: number
  visibility: number
  uvIndex: number
  alerts?: string[]
}

interface ForecastDay {
  date: string
  high: number
  low: number
  condition: string
  icon: 'sun' | 'cloud' | 'rain'
  precipitation: number
}

export default function WeatherPage() {
  const [currentWeather] = useState<WeatherData>({
    temperature: 28,
    feelsLike: 32,
    condition: 'Partly Cloudy',
    icon: 'sun',
    humidity: 68,
    windSpeed: 12,
    pressure: 1013,
    visibility: 10,
    uvIndex: 8,
    alerts: ['UV Index High - Use sunscreen when outdoors', 'Light sandstorm possible this evening']
  })

  const [forecast] = useState<ForecastDay[]>([
    {
      date: 'Today',
      high: 30,
      low: 22,
      condition: 'Partly Cloudy',
      icon: 'sun',
      precipitation: 0
    },
    {
      date: 'Tomorrow',
      high: 32,
      low: 24,
      condition: 'Sunny',
      icon: 'sun',
      precipitation: 0
    },
    {
      date: 'Wednesday',
      high: 29,
      low: 21,
      condition: 'Cloudy',
      icon: 'cloud',
      precipitation: 10
    },
    {
      date: 'Thursday',
      high: 31,
      low: 23,
      condition: 'Sunny',
      icon: 'sun',
      precipitation: 0
    },
    {
      date: 'Friday',
      high: 33,
      low: 25,
      condition: 'Partly Cloudy',
      icon: 'sun',
      precipitation: 5
    }
  ])

  const getWeatherIcon = (icon: string, size: string = "h-8 w-8") => {
    const iconClass = `${size} text-${icon === 'sun' ? 'yellow-500' : icon === 'cloud' ? 'gray-500' : 'blue-500'}`
    
    switch (icon) {
      case 'sun':
        return <Sun className={iconClass} />
      case 'cloud':
        return <Cloud className={iconClass} />
      case 'rain':
        return <CloudRain className={iconClass} />
      default:
        return <Sun className={iconClass} />
    }
  }

  const getUVLevel = (uvIndex: number) => {
    if (uvIndex <= 2) return { level: 'Low', color: 'text-green-600' }
    if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-600' }
    if (uvIndex <= 7) return { level: 'High', color: 'text-orange-600' }
    if (uvIndex <= 10) return { level: 'Very High', color: 'text-red-600' }
    return { level: 'Extreme', color: 'text-purple-600' }
  }

  const uvLevel = getUVLevel(currentWeather.uvIndex)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-midnight-black">Dubai Weather</h1>
          <div className="flex items-center gap-2 mt-2 text-quartz-gray">
            <MapPin className="h-4 w-4" />
            <span>Dubai, United Arab Emirates</span>
            <Calendar className="h-4 w-4 ml-4" />
            <span>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Current Weather */}
      <Card className="p-8 bg-gradient-to-br from-desert-gold/10 to-ai-blue/10 border border-desert-gold/20">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {getWeatherIcon(currentWeather.icon, "h-16 w-16")}
              <div>
                <div className="text-6xl font-bold text-midnight-black">
                  {currentWeather.temperature}°C
                </div>
                <div className="text-xl text-quartz-gray">
                  {currentWeather.condition}
                </div>
                <div className="text-sm text-quartz-gray">
                  Feels like {currentWeather.feelsLike}°C
                </div>
              </div>
            </div>
          </div>
          
          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Wind className="h-5 w-5 text-ai-blue" />
                <div>
                  <div className="text-sm text-quartz-gray">Wind Speed</div>
                  <div className="font-semibold text-midnight-black">{currentWeather.windSpeed} km/h</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Droplets className="h-5 w-5 text-ai-blue" />
                <div>
                  <div className="text-sm text-quartz-gray">Humidity</div>
                  <div className="font-semibold text-midnight-black">{currentWeather.humidity}%</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-ai-blue" />
                <div>
                  <div className="text-sm text-quartz-gray">Pressure</div>
                  <div className="font-semibold text-midnight-black">{currentWeather.pressure} hPa</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-ai-blue" />
                <div>
                  <div className="text-sm text-quartz-gray">Visibility</div>
                  <div className="font-semibold text-midnight-black">{currentWeather.visibility} km</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Sun className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-sm text-quartz-gray">UV Index</div>
                  <div className={`font-semibold ${uvLevel.color}`}>
                    {currentWeather.uvIndex} - {uvLevel.level}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Thermometer className="h-5 w-5 text-desert-gold" />
                <div>
                  <div className="text-sm text-quartz-gray">Heat Index</div>
                  <div className="font-semibold text-midnight-black">{currentWeather.feelsLike}°C</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Weather Alerts */}
      {currentWeather.alerts && currentWeather.alerts.length > 0 && (
        <Card className="p-6 bg-amber-50 border border-amber-200">
          <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Weather Alerts
          </h3>
          <div className="space-y-3">
            {currentWeather.alerts.map((alert, index) => (
              <div key={index} className="p-3 bg-amber-100 rounded-lg">
                <p className="text-sm text-amber-800">{alert}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5-Day Forecast */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-midnight-black mb-6">5-Day Forecast</h3>
        <div className="grid md:grid-cols-5 gap-4">
          {forecast.map((day, index) => (
            <div key={index} className="text-center p-4 rounded-lg bg-gradient-to-b from-pearl-white to-gray-50 border border-gray-200">
              <div className="font-medium text-midnight-black mb-2">{day.date}</div>
              <div className="flex justify-center mb-3">
                {getWeatherIcon(day.icon, "h-10 w-10")}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-midnight-black">{day.high}°</div>
                <div className="text-sm text-quartz-gray">{day.low}°</div>
                <div className="text-xs text-quartz-gray">{day.condition}</div>
                {day.precipitation > 0 && (
                  <div className="text-xs text-ai-blue">{day.precipitation}% rain</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Today's Weather Tips */}
      <Card className="p-6 bg-gradient-to-r from-ai-blue/5 to-desert-gold/5 border border-ai-blue/20">
        <h3 className="text-xl font-semibold text-midnight-black mb-4">Today's Weather Tips</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Sun className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <div className="font-medium text-midnight-black">Sun Protection</div>
                <div className="text-sm text-quartz-gray">UV index is high. Apply SPF 30+ sunscreen and wear sunglasses.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Droplets className="h-5 w-5 text-ai-blue mt-0.5" />
              <div>
                <div className="font-medium text-midnight-black">Stay Hydrated</div>
                <div className="text-sm text-quartz-gray">Drink plenty of water throughout the day.</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Wind className="h-5 w-5 text-quartz-gray mt-0.5" />
              <div>
                <div className="font-medium text-midnight-black">Light Winds</div>
                <div className="text-sm text-quartz-gray">Gentle breeze expected. Good conditions for outdoor activities.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Thermometer className="h-5 w-5 text-desert-gold mt-0.5" />
              <div>
                <div className="font-medium text-midnight-black">Comfortable Evening</div>
                <div className="text-sm text-quartz-gray">Perfect weather for outdoor dining and evening walks.</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 