export interface TrafficData {
  id: string
  road: string
  roadAr: string
  area: string
  areaAr: string
  status: 'smooth' | 'moderate' | 'heavy' | 'blocked'
  description?: string
  descriptionAr?: string
  updatedAt: string
  incidents?: TrafficIncident[]
}

export interface TrafficIncident {
  id: string
  type: 'accident' | 'construction' | 'event' | 'weather'
  severity: 'low' | 'medium' | 'high'
  description: string
  descriptionAr: string
  estimatedClearTime?: string
}

export interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: string
  condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'dusty'
  description: string
  descriptionAr: string
  uvIndex: number
  visibility: number
  pressure: number
  sunrise: string
  sunset: string
  forecast: WeatherForecast[]
}

export interface WeatherForecast {
  date: string
  tempMin: number
  tempMax: number
  condition: string
  precipitation: number
}

export interface TransitRoute {
  id: string
  type: 'metro' | 'bus' | 'tram' | 'ferry'
  line: string
  name: string
  nameAr: string
  color: string
  status: 'operational' | 'delayed' | 'suspended'
  frequency: string
  operatingHours: {
    weekday: { start: string; end: string }
    weekend: { start: string; end: string }
  }
  stops: TransitStop[]
}

export interface TransitStop {
  id: string
  name: string
  nameAr: string
  location: {
    lat: number
    lng: number
  }
  facilities: string[]
  connections: string[]
}

export interface EmergencyContact {
  id: string
  name: string
  nameAr: string
  number: string
  category: 'police' | 'medical' | 'fire' | 'utility' | 'embassy' | 'helpline'
  description: string
  descriptionAr: string
  available24Hours: boolean
  languages: string[]
}

export interface PublicService {
  id: string
  name: string
  nameAr: string
  category: 'hospital' | 'police-station' | 'post-office' | 'government-office' | 'bank' | 'pharmacy'
  location: {
    lat: number
    lng: number
    address: string
    addressAr: string
  }
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  openingHours?: {
    [key: string]: {
      open: string
      close: string
      isClosed?: boolean
    }
  }
  services: string[]
}