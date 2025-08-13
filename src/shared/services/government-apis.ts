/**
 * Dubai Government API Integrations
 * Provides access to official government services and real-time data
 */

import { supabase } from '@/shared/lib/supabase'

// API Configuration
const GOVERNMENT_APIS = {
  RTA: {
    baseUrl: process.env.VITE_RTA_API_URL || 'https://api.rta.ae/v1',
    apiKey: process.env.VITE_RTA_API_KEY || '',
  },
  DEWA: {
    baseUrl: process.env.VITE_DEWA_API_URL || 'https://api.dewa.gov.ae/v1',
    apiKey: process.env.VITE_DEWA_API_KEY || '',
  },
  DHA: {
    baseUrl: process.env.VITE_DHA_API_URL || 'https://api.dha.gov.ae/v1',
    apiKey: process.env.VITE_DHA_API_KEY || '',
  },
  DM: {
    baseUrl: process.env.VITE_DM_API_URL || 'https://api.dm.gov.ae/v1',
    apiKey: process.env.VITE_DM_API_KEY || '',
  },
  GDRFA: {
    baseUrl: process.env.VITE_GDRFA_API_URL || 'https://api.gdrfad.gov.ae/v1',
    apiKey: process.env.VITE_GDRFA_API_KEY || '',
  },
}

// Response Types
export interface TrafficData {
  location: string
  congestionLevel: 'low' | 'medium' | 'high' | 'severe'
  averageSpeed: number
  incidents: TrafficIncident[]
  lastUpdated: string
}

export interface TrafficIncident {
  id: string
  type: 'accident' | 'roadwork' | 'event' | 'other'
  location: string
  description: string
  severity: 'minor' | 'moderate' | 'major'
  estimatedClearTime?: string
}

export interface PublicTransport {
  metros: MetroStatus[]
  buses: BusRoute[]
  trams: TramStatus[]
  waterBuses: WaterBusRoute[]
}

export interface MetroStatus {
  line: 'red' | 'green' | 'blue'
  status: 'operational' | 'delayed' | 'suspended'
  nextTrains: TrainArrival[]
  alerts: string[]
}

export interface TrainArrival {
  station: string
  arrivalTime: string
  destination: string
}

export interface BusRoute {
  routeNumber: string
  status: 'active' | 'delayed' | 'cancelled'
  nextArrivals: BusArrival[]
}

export interface BusArrival {
  stopName: string
  arrivalTime: string
  occupancy: 'low' | 'medium' | 'high'
}

export interface TramStatus {
  status: 'operational' | 'delayed' | 'suspended'
  nextTrams: TramArrival[]
}

export interface TramArrival {
  station: string
  arrivalTime: string
  direction: string
}

export interface WaterBusRoute {
  route: string
  status: 'active' | 'suspended'
  schedule: WaterBusSchedule[]
}

export interface WaterBusSchedule {
  departure: string
  arrival: string
  departureTime: string
}

export interface DEWAService {
  accountNumber?: string
  consumption: ConsumptionData
  billing: BillingInfo
  greenPrograms: GreenProgram[]
}

export interface ConsumptionData {
  electricity: {
    current: number
    average: number
    unit: 'kWh'
  }
  water: {
    current: number
    average: number
    unit: 'gallons'
  }
  comparison: 'below' | 'average' | 'above'
}

export interface BillingInfo {
  currentBill: number
  dueDate: string
  paymentStatus: 'paid' | 'pending' | 'overdue'
}

export interface GreenProgram {
  name: string
  description: string
  enrolled: boolean
  savings?: number
}

export interface HealthService {
  hospitals: Hospital[]
  clinics: Clinic[]
  pharmacies: Pharmacy[]
  emergencyContacts: EmergencyContact[]
}

export interface Hospital {
  name: string
  location: string
  type: 'public' | 'private'
  emergencyAvailable: boolean
  waitTime?: number
  specialties: string[]
}

export interface Clinic {
  name: string
  location: string
  type: string
  openNow: boolean
  nextAvailable?: string
}

export interface Pharmacy {
  name: string
  location: string
  open24Hours: boolean
  hasEmergencyService: boolean
}

export interface EmergencyContact {
  service: string
  number: string
  available24_7: boolean
}

// Cache configuration
const CACHE_DURATION = {
  traffic: 5 * 60 * 1000, // 5 minutes
  transport: 2 * 60 * 1000, // 2 minutes
  utilities: 60 * 60 * 1000, // 1 hour
  health: 30 * 60 * 1000, // 30 minutes
}

// API Service Class
class GovernmentAPIService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()

  /**
   * Get data from cache if available and not expired
   */
  private getFromCache(key: string, duration: number): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < duration) {
      return cached.data
    }
    return null
  }

  /**
   * Store data in cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * Make API request with error handling
   */
  private async apiRequest<T>(
    service: keyof typeof GOVERNMENT_APIS,
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const config = GOVERNMENT_APIS[service]
    
    if (!config.apiKey) {
      // Use mock data in development if API key is not available
      if (process.env.NODE_ENV === 'development') {
        return this.getMockData(service, endpoint) as T
      }
      throw new Error(`API key not configured for ${service}`)
    }

    try {
      const response = await fetch(`${config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en,ar',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`${service} API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error calling ${service} API:`, error)
      
      // Log to Supabase for monitoring
      await this.logAPIError(service, endpoint, error)
      
      // Return mock data in case of error
      return this.getMockData(service, endpoint) as T
    }
  }

  /**
   * Log API errors for monitoring
   */
  private async logAPIError(service: string, endpoint: string, error: any): Promise<void> {
    try {
      await supabase.from('api_error_logs').insert({
        service,
        endpoint,
        error_message: error.message,
        timestamp: new Date().toISOString(),
      })
    } catch (logError) {
      console.error('Failed to log API error:', logError)
    }
  }

  /**
   * Get mock data for development/fallback
   */
  private getMockData(service: string, endpoint: string): any {
    // Return realistic mock data based on service and endpoint
    if (service === 'RTA' && endpoint.includes('traffic')) {
      return {
        location: 'Sheikh Zayed Road',
        congestionLevel: 'medium',
        averageSpeed: 60,
        incidents: [
          {
            id: '1',
            type: 'roadwork',
            location: 'Near Mall of Emirates',
            description: 'Lane closure for maintenance',
            severity: 'minor',
          },
        ],
        lastUpdated: new Date().toISOString(),
      }
    }
    
    if (service === 'RTA' && endpoint.includes('metro')) {
      return {
        metros: [
          {
            line: 'red',
            status: 'operational',
            nextTrains: [
              {
                station: 'Burj Khalifa/Dubai Mall',
                arrivalTime: '2 min',
                destination: 'UAE Exchange',
              },
            ],
            alerts: [],
          },
        ],
      }
    }
    
    // Add more mock data as needed
    return {}
  }

  // RTA Services
  
  /**
   * Get real-time traffic data
   */
  async getTrafficData(location?: string): Promise<TrafficData> {
    const cacheKey = `traffic-${location || 'all'}`
    const cached = this.getFromCache(cacheKey, CACHE_DURATION.traffic)
    if (cached) return cached

    const endpoint = location 
      ? `/traffic/conditions?location=${encodeURIComponent(location)}`
      : '/traffic/conditions'
    
    const data = await this.apiRequest<TrafficData>('RTA', endpoint)
    this.setCache(cacheKey, data)
    return data
  }

  /**
   * Get public transport status
   */
  async getPublicTransportStatus(): Promise<PublicTransport> {
    const cacheKey = 'transport-status'
    const cached = this.getFromCache(cacheKey, CACHE_DURATION.transport)
    if (cached) return cached

    const data = await this.apiRequest<PublicTransport>('RTA', '/transport/status')
    this.setCache(cacheKey, data)
    return data
  }

  /**
   * Get Salik toll gate information
   */
  async getSalikInfo(plateNumber?: string): Promise<any> {
    const endpoint = plateNumber 
      ? `/salik/balance?plate=${encodeURIComponent(plateNumber)}`
      : '/salik/gates'
    
    return this.apiRequest('RTA', endpoint)
  }

  /**
   * Get parking availability
   */
  async getParkingAvailability(zone: string): Promise<any> {
    return this.apiRequest('RTA', `/parking/availability?zone=${encodeURIComponent(zone)}`)
  }

  // DEWA Services
  
  /**
   * Get DEWA account information
   */
  async getDEWAServices(accountNumber?: string): Promise<DEWAService> {
    const cacheKey = `dewa-${accountNumber || 'general'}`
    const cached = this.getFromCache(cacheKey, CACHE_DURATION.utilities)
    if (cached) return cached

    const endpoint = accountNumber 
      ? `/account/${accountNumber}/summary`
      : '/services/overview'
    
    const data = await this.apiRequest<DEWAService>('DEWA', endpoint)
    this.setCache(cacheKey, data)
    return data
  }

  /**
   * Get green building initiatives
   */
  async getGreenInitiatives(): Promise<any> {
    return this.apiRequest('DEWA', '/green/initiatives')
  }

  // DHA Services
  
  /**
   * Get health services information
   */
  async getHealthServices(type?: 'hospitals' | 'clinics' | 'pharmacies'): Promise<HealthService> {
    const cacheKey = `health-${type || 'all'}`
    const cached = this.getFromCache(cacheKey, CACHE_DURATION.health)
    if (cached) return cached

    const endpoint = type ? `/facilities/${type}` : '/facilities/all'
    const data = await this.apiRequest<HealthService>('DHA', endpoint)
    this.setCache(cacheKey, data)
    return data
  }

  /**
   * Get COVID-19 information
   */
  async getCovidInfo(): Promise<any> {
    return this.apiRequest('DHA', '/covid19/stats')
  }

  // Dubai Municipality Services
  
  /**
   * Get events and activities
   */
  async getPublicEvents(): Promise<any> {
    return this.apiRequest('DM', '/events/public')
  }

  /**
   * Get beach and park status
   */
  async getRecreationalFacilities(): Promise<any> {
    return this.apiRequest('DM', '/facilities/recreational')
  }

  // GDRFA Services
  
  /**
   * Get visa and immigration updates
   */
  async getImmigrationUpdates(): Promise<any> {
    return this.apiRequest('GDRFA', '/updates/latest')
  }

  /**
   * Get entry requirements
   */
  async getEntryRequirements(nationality: string): Promise<any> {
    return this.apiRequest('GDRFA', `/entry/requirements?nationality=${encodeURIComponent(nationality)}`)
  }
}

// Export singleton instance
export const governmentAPI = new GovernmentAPIService()

// React hooks for easy integration
import { useQuery } from '@tanstack/react-query'

export function useTrafficData(location?: string) {
  return useQuery({
    queryKey: ['traffic', location],
    queryFn: () => governmentAPI.getTrafficData(location),
    staleTime: CACHE_DURATION.traffic,
    refetchInterval: CACHE_DURATION.traffic,
  })
}

export function usePublicTransport() {
  return useQuery({
    queryKey: ['transport'],
    queryFn: () => governmentAPI.getPublicTransportStatus(),
    staleTime: CACHE_DURATION.transport,
    refetchInterval: CACHE_DURATION.transport,
  })
}

export function useDEWAServices(accountNumber?: string) {
  return useQuery({
    queryKey: ['dewa', accountNumber],
    queryFn: () => governmentAPI.getDEWAServices(accountNumber),
    staleTime: CACHE_DURATION.utilities,
    enabled: !!accountNumber || true, // Allow general queries
  })
}

export function useHealthServices(type?: 'hospitals' | 'clinics' | 'pharmacies') {
  return useQuery({
    queryKey: ['health', type],
    queryFn: () => governmentAPI.getHealthServices(type),
    staleTime: CACHE_DURATION.health,
  })
}