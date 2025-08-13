import { supabase } from '@/shared/lib/supabase'
import { TrafficData, WeatherData, TransitRoute, PublicService } from '../types'

export class PracticalService {
  // Traffic Services
  static async getTrafficData(): Promise<TrafficData[]> {
    const { data, error } = await supabase
      .from('traffic_data')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getTrafficByArea(area: string): Promise<TrafficData[]> {
    const { data, error } = await supabase
      .from('traffic_data')
      .select('*')
      .eq('area', area)
      .order('status', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Weather Services
  static async getCurrentWeather(): Promise<WeatherData | null> {
    // In production, this would call a weather API
    // For demo, returning mock data
    return {
      temperature: 32,
      feelsLike: 36,
      humidity: 65,
      windSpeed: 15,
      windDirection: 'NW',
      condition: 'sunny',
      description: 'Clear skies',
      descriptionAr: 'سماء صافية',
      uvIndex: 8,
      visibility: 10,
      pressure: 1013,
      sunrise: '06:15',
      sunset: '18:45',
      forecast: [
        {
          date: new Date().toISOString(),
          tempMin: 28,
          tempMax: 35,
          condition: 'sunny',
          precipitation: 0
        },
        {
          date: new Date(Date.now() + 86400000).toISOString(),
          tempMin: 29,
          tempMax: 36,
          condition: 'partly-cloudy',
          precipitation: 10
        },
        {
          date: new Date(Date.now() + 172800000).toISOString(),
          tempMin: 30,
          tempMax: 37,
          condition: 'sunny',
          precipitation: 0
        }
      ]
    }
  }

  // Transit Services
  static async getTransitRoutes(type?: string): Promise<TransitRoute[]> {
    let query = supabase
      .from('transit_routes')
      .select('*, stops:transit_stops(*)')

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.order('line', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getTransitStatus(): Promise<{ [key: string]: string }> {
    const { data, error } = await supabase
      .from('transit_routes')
      .select('line, status')

    if (error) throw error

    const status: { [key: string]: string } = {}
    data?.forEach(route => {
      status[route.line] = route.status
    })

    return status
  }

  static async getNearbyTransitStops(
    lat: number,
    lng: number,
    radiusKm = 1
  ): Promise<TransitRoute[]> {
    // In production, use PostGIS for geographic queries
    const { data, error } = await supabase
      .from('transit_routes')
      .select('*, stops:transit_stops(*)')

    if (error) throw error

    // Filter stops within radius (simplified calculation)
    const nearbyRoutes = data?.filter(route => 
      route.stops.some((stop: any) => {
        const distance = Math.sqrt(
          Math.pow(stop.location.lat - lat, 2) + 
          Math.pow(stop.location.lng - lng, 2)
        ) * 111 // Rough conversion to km
        return distance <= radiusKm
      })
    )

    return nearbyRoutes || []
  }

  // Public Services
  static async getPublicServices(category?: string): Promise<PublicService[]> {
    let query = supabase
      .from('public_services')
      .select('*')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getNearbyServices(
    lat: number,
    lng: number,
    category: string,
    radiusKm = 5
  ): Promise<PublicService[]> {
    const { data, error } = await supabase
      .from('public_services')
      .select('*')
      .eq('category', category)

    if (error) throw error

    // Filter services within radius
    const nearbyServices = data?.filter(service => {
      const distance = Math.sqrt(
        Math.pow(service.location.lat - lat, 2) + 
        Math.pow(service.location.lng - lng, 2)
      ) * 111 // Rough conversion to km
      return distance <= radiusKm
    }).sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.location.lat - lat, 2) + 
        Math.pow(a.location.lng - lng, 2)
      )
      const distB = Math.sqrt(
        Math.pow(b.location.lat - lat, 2) + 
        Math.pow(b.location.lng - lng, 2)
      )
      return distA - distB
    })

    return nearbyServices || []
  }

  // Real-time subscriptions
  static async subscribeToTrafficUpdates(
    callback: (update: TrafficData) => void
  ) {
    const channel = supabase
      .channel('traffic-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'traffic_data'
        },
        (payload) => {
          callback(payload.new as TrafficData)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  static async subscribeToTransitAlerts(
    callback: (alert: any) => void
  ) {
    const channel = supabase
      .channel('transit-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transit_alerts'
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}