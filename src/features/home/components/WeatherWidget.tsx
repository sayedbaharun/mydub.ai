import { useState } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Sun, Cloud, CloudRain, Wind, Thermometer, Droplets } from 'lucide-react'

interface WeatherData {
  temperature: number
  condition: string
  icon: 'sun' | 'cloud' | 'rain'
  humidity: number
  windSpeed: number
  feelsLike: number
  alerts?: string[]
}

export function WeatherWidget() {
  const [weather] = useState<WeatherData>({
    temperature: 28,
    feelsLike: 32,
    condition: 'Partly Cloudy',
    icon: 'sun',
    humidity: 68,
    windSpeed: 12,
    alerts: ['UV Index High - Use sunscreen when outdoors']
  })

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sun':
        return <Sun className="h-8 w-8 text-yellow-500" />
      case 'cloud':
        return <Cloud className="h-8 w-8 text-gray-500" />
      case 'rain':
        return <CloudRain className="h-8 w-8 text-blue-500" />
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-desert-gold/10 to-ai-blue/10 border border-desert-gold/20 shadow-lg">
      <h3 className="text-lg font-semibold text-midnight-black mb-4">Current Weather</h3>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.icon)}
          <div>
            <div className="text-3xl font-bold text-midnight-black">
              {weather.temperature}°C
            </div>
            <div className="text-sm text-quartz-gray">
              {weather.condition}
            </div>
          </div>
        </div>
      </div>
      
      {/* Weather details */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <Thermometer className="h-4 w-4 text-desert-gold mx-auto mb-1" />
          <div className="text-xs text-quartz-gray">Feels like</div>
          <div className="text-sm font-medium text-midnight-black">{weather.feelsLike}°C</div>
        </div>
        <div className="text-center">
          <Droplets className="h-4 w-4 text-ai-blue mx-auto mb-1" />
          <div className="text-xs text-quartz-gray">Humidity</div>
          <div className="text-sm font-medium text-midnight-black">{weather.humidity}%</div>
        </div>
        <div className="text-center">
          <Wind className="h-4 w-4 text-quartz-gray mx-auto mb-1" />
          <div className="text-xs text-quartz-gray">Wind</div>
          <div className="text-sm font-medium text-midnight-black">{weather.windSpeed} km/h</div>
        </div>
      </div>
      
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <Sun className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              {weather.alerts[0]}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
} 