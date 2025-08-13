import { EventbriteService } from './eventbrite.service'
import { TourismService } from '@/features/tourism/services/tourism.service'
import { Event } from '@/features/tourism/types'
import { supabase } from '@/shared/lib/supabase'

interface EventSource {
  name: string
  fetchFunction: () => Promise<Event[]>
  enabled: boolean
}

interface SyncResult {
  source: string
  success: boolean
  eventCount: number
  error?: string
}

export class EventAggregatorService {
  private static readonly CACHE_DURATION_HOURS = 24
  private static readonly SYNC_KEY = 'last_event_sync'
  
  private static eventSources: EventSource[] = [
    {
      name: 'eventbrite',
      fetchFunction: () => EventbriteService.fetchDubaiEvents(50),
      enabled: true
    }
    // TODO: Add more sources like Ticketmaster, Dubai Calendar, etc.
  ]

  static async needsSync(): Promise<boolean> {
    try {
      const lastSync = localStorage.getItem(this.SYNC_KEY)
      if (!lastSync) return true

      const lastSyncTime = new Date(lastSync)
      const now = new Date()
      const hoursSinceSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60)

      return hoursSinceSync >= this.CACHE_DURATION_HOURS
    } catch {
      return true
    }
  }

  static async syncAllEvents(): Promise<SyncResult[]> {
    const results: SyncResult[] = []
    
    for (const source of this.eventSources) {
      if (!source.enabled) {
        continue
      }

      try {
        // Fetch events from the source
        const events = await source.fetchFunction()
        
        // Store in database with source tracking
        const storedCount = await this.storeEventsInDatabase(events, source.name)
        
        results.push({
          source: source.name,
          success: true,
          eventCount: storedCount,
        })
        
        } catch (error) {
        console.error(`❌ Failed to sync events from ${source.name}:`, error)
        results.push({
          source: source.name,
          success: false,
          eventCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Update last sync timestamp
    localStorage.setItem(this.SYNC_KEY, new Date().toISOString())
    
    const totalSynced = results.reduce((sum, result) => sum + result.eventCount, 0)
    return results
  }

  private static async storeEventsInDatabase(events: Event[], source: string): Promise<number> {
    try {
      // First, mark old events from this source as inactive
      await supabase
        .from('tourism_events')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('source', source)

      let storedCount = 0

      // Insert new events
      for (const event of events) {
        try {
          const eventData = {
            id: event.id,
            title: event.title,
            title_ar: event.titleAr,
            description: event.description,
            description_ar: event.descriptionAr,
            category: event.category,
            start_date: event.startDate,
            end_date: event.endDate,
            location: event.venue?.location.address || 'Dubai, UAE',
            location_ar: event.venue?.location.addressAr || 'دبي، الإمارات العربية المتحدة',
            venue: event.venue?.name,
            venue_ar: event.venue?.nameAr,
            organizer: event.organizer,
            organizer_ar: event.organizer, // TODO: Add translation
            ticket_price: event.price?.min || 0,
            ticket_url: event.bookingUrl,
            image_url: event.imageUrl,
            is_featured: false,
            is_active: true,
            source: source,
            external_id: event.id.replace(`${source}-`, ''),
            tags: event.tags,
            metadata: {
              currency: event.price?.currency,
              is_free: event.price?.isFree,
              coordinates: {
                lat: event.venue?.location.lat,
                lng: event.venue?.location.lng
              }
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error } = await supabase
            .from('tourism_events')
            .upsert(eventData, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })

          if (error) {
            console.error('Failed to insert event:', error);
          } else {
            storedCount++
          }
        } catch (eventError) {
          console.error('Failed to store event:', eventError);
        }
      }

      return storedCount
    } catch (error) {
      console.error('Failed to store events in database:', error)
      throw error
    }
  }

  static async getAggregatedEvents(limit = 50): Promise<Event[]> {
    try {
      // Check if we need to sync
      if (await this.needsSync()) {
        await this.syncAllEvents()
      }

      // Get events from database (now includes API data)
      return await TourismService.getUpcomingEvents(limit)
    } catch (error) {
      console.error('Failed to get aggregated events:', error)
      // Fallback to tourism service only
      return await TourismService.getUpcomingEvents(limit)
    }
  }

  static async forceSyncEvents(): Promise<SyncResult[]> {
    localStorage.removeItem(this.SYNC_KEY)
    return await this.syncAllEvents()
  }

  static async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    for (const source of this.eventSources) {
      if (!source.enabled) continue
      
      try {
        if (source.name === 'eventbrite') {
          results[source.name] = await EventbriteService.testConnection()
        } else {
          // Test by trying to fetch a small amount of data
          const events = await source.fetchFunction()
          results[source.name] = events.length >= 0 // Even 0 events is a successful connection
        }
      } catch {
        results[source.name] = false
      }
    }
    
    return results
  }

  static getLastSyncTime(): Date | null {
    try {
      const lastSync = localStorage.getItem(this.SYNC_KEY)
      return lastSync ? new Date(lastSync) : null
    } catch {
      return null
    }
  }

  static getSyncStatus(): { needsSync: boolean; lastSync: Date | null; hoursUntilNext: number } {
    const lastSync = this.getLastSyncTime()
    const needsSync = !lastSync || (lastSync && ((new Date().getTime() - lastSync.getTime()) / (1000 * 60 * 60)) >= this.CACHE_DURATION_HOURS)
    
    let hoursUntilNext = 0
    if (lastSync) {
      const hoursSinceSync = (new Date().getTime() - lastSync.getTime()) / (1000 * 60 * 60)
      hoursUntilNext = Math.max(0, this.CACHE_DURATION_HOURS - hoursSinceSync)
    }

    return {
      needsSync,
      lastSync,
      hoursUntilNext
    }
  }
} 